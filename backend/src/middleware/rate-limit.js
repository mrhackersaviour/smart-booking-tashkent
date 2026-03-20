/**
 * In-memory rate limiter for public API endpoints.
 *
 * Addresses Sprint 2 risk R07 (AI abuse / prompt-injection) and general
 * abuse protection for /api/auth/login brute-force attempts.
 *
 * For production with >1 backend instance this should be replaced with a
 * Redis-backed limiter.
 */

const buckets = new Map();

function rateLimit({ windowMs = 60_000, max = 30, keyFn = null } = {}) {
    return (req, res, next) => {
        const key = keyFn
            ? keyFn(req)
            : `${req.ip}:${req.baseUrl}${req.path}`;
        const now = Date.now();
        const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

        if (now > bucket.resetAt) {
            bucket.count = 0;
            bucket.resetAt = now + windowMs;
        }

        bucket.count += 1;
        buckets.set(key, bucket);

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
        res.setHeader('X-RateLimit-Reset', Math.floor(bucket.resetAt / 1000));

        if (bucket.count > max) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
            });
        }

        next();
    };
}

// Presets for common use cases
const authLimit = rateLimit({ windowMs: 15 * 60_000, max: 10 });
const aiLimit = rateLimit({ windowMs: 60_000, max: 20 });
const defaultLimit = rateLimit({ windowMs: 60_000, max: 60 });

module.exports = { rateLimit, authLimit, aiLimit, defaultLimit };
