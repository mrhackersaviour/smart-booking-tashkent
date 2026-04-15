/**
 * Payme gateway client (local Uzbek payments).
 *
 * Implements the Payme Merchant API (https://developer.help.paycom.uz).
 * Webhook handlers live in `routes/payments.js` and verify the HMAC
 * signature using the shared secret from PAYME_SECRET env var.
 *
 * This is a scaffold — production credentials and certification are
 * tracked under Sprint 3 task "Payme sandbox → live" (see Notion).
 */

const crypto = require('crypto');

const PAYME_ENDPOINT = process.env.PAYME_ENDPOINT || 'https://checkout.paycom.uz/api';
const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID;
const PAYME_SECRET = process.env.PAYME_SECRET;

function encodeAmount(uzsAmount) {
    // Payme expects the amount in tiyin (1 UZS = 100 tiyin)
    return Math.round(uzsAmount * 100);
}

function buildCheckoutUrl({ bookingId, amountUzs, returnUrl }) {
    if (!PAYME_MERCHANT_ID) {
        throw new Error('PAYME_MERCHANT_ID is not configured');
    }
    const params = Buffer.from([
        `m=${PAYME_MERCHANT_ID}`,
        `ac.booking_id=${bookingId}`,
        `a=${encodeAmount(amountUzs)}`,
        returnUrl ? `c=${returnUrl}` : '',
    ].filter(Boolean).join(';')).toString('base64');
    return `${PAYME_ENDPOINT.replace('/api', '')}/${params}`;
}

function verifyWebhookSignature(rawBody, signature) {
    if (!PAYME_SECRET) throw new Error('PAYME_SECRET is not configured');
    const expected = crypto
        .createHmac('sha256', PAYME_SECRET)
        .update(rawBody)
        .digest('hex');
    // constant-time compare
    const a = Buffer.from(expected);
    const b = Buffer.from(signature || '');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
    buildCheckoutUrl,
    verifyWebhookSignature,
    encodeAmount,
};
