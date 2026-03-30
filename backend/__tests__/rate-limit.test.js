const express = require('express');
const request = require('supertest');
const { rateLimit } = require('../src/middleware/rate-limit');

describe('rate-limit middleware', () => {
    function buildApp(opts) {
        const app = express();
        app.use(rateLimit(opts));
        app.get('/', (_req, res) => res.json({ ok: true }));
        return app;
    }

    test('allows requests under the limit', async () => {
        const app = buildApp({ windowMs: 10_000, max: 3 });
        for (let i = 0; i < 3; i++) {
            const res = await request(app).get('/');
            expect(res.status).toBe(200);
        }
    });

    test('returns 429 once the limit is exceeded', async () => {
        const app = buildApp({ windowMs: 10_000, max: 2 });
        await request(app).get('/');
        await request(app).get('/');
        const res = await request(app).get('/');
        expect(res.status).toBe(429);
        expect(res.body.error).toMatch(/too many/i);
        expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
    });

    test('sets informational headers', async () => {
        const app = buildApp({ windowMs: 10_000, max: 5 });
        const res = await request(app).get('/');
        expect(res.headers['x-ratelimit-limit']).toBe('5');
        expect(res.headers['x-ratelimit-remaining']).toBe('4');
        expect(Number(res.headers['x-ratelimit-reset'])).toBeGreaterThan(0);
    });
});
