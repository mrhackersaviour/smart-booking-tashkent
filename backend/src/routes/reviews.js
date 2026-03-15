const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// POST /api/reviews — create a review for a completed booking
router.post('/', authenticate, async (req, res) => {
    const { booking_id, rating, comment } = req.body;
    const userId = req.user.id;

    if (!booking_id || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({
            error: 'booking_id and rating (1-5) are required',
        });
    }

    const booking = db.prepare(
        'SELECT id, venue_id, user_id, status FROM bookings WHERE id = ?',
    ).get(booking_id);

    if (!booking) return res.status(404).json({ error: 'booking not found' });
    if (booking.user_id !== userId) return res.status(403).json({ error: 'not your booking' });
    if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'can only review completed bookings' });
    }

    const existing = db.prepare(
        'SELECT id FROM reviews WHERE booking_id = ?',
    ).get(booking_id);
    if (existing) return res.status(409).json({ error: 'review already exists' });

    const insert = db.prepare(`
        INSERT INTO reviews (booking_id, venue_id, user_id, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    const result = insert.run(booking_id, booking.venue_id, userId, rating, comment || null);

    // Recalculate venue average rating
    db.prepare(`
        UPDATE venues SET
            rating = (SELECT AVG(rating) FROM reviews WHERE venue_id = ?),
            review_count = (SELECT COUNT(*) FROM reviews WHERE venue_id = ?)
        WHERE id = ?
    `).run(booking.venue_id, booking.venue_id, booking.venue_id);

    res.status(201).json({ id: result.lastInsertRowid, rating, comment });
});

// GET /api/reviews/venue/:venueId — list reviews for a venue
router.get('/venue/:venueId', (req, res) => {
    const reviews = db.prepare(`
        SELECT r.id, r.rating, r.comment, r.created_at,
               u.full_name as author_name
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.venue_id = ?
        ORDER BY r.created_at DESC
        LIMIT 50
    `).all(req.params.venueId);
    res.json({ reviews });
});

module.exports = router;
