/**
 * Real-time table availability broadcast.
 *
 * When a booking is created, updated, or cancelled the booking router
 * invokes `broadcastAvailability(venueId)` from this module. Any client
 * subscribed to the `venue:<id>:availability` channel receives the
 * updated table map so the UI can reflect the change without a refresh.
 *
 * This closes the last gap from the MMP booking flow — before this,
 * clients had to poll the availability endpoint every few seconds.
 */

const db = require('../config/database');

const subscribers = new Map(); // venueId -> Set<WebSocket>

function subscribe(venueId, ws) {
    if (!subscribers.has(venueId)) subscribers.set(venueId, new Set());
    subscribers.get(venueId).add(ws);
    ws.on('close', () => {
        const set = subscribers.get(venueId);
        if (set) {
            set.delete(ws);
            if (set.size === 0) subscribers.delete(venueId);
        }
    });
}

function snapshot(venueId) {
    return db.prepare(`
        SELECT t.id, t.capacity,
               CASE WHEN EXISTS (
                   SELECT 1 FROM bookings b
                   WHERE b.table_id = t.id
                     AND b.status IN ('confirmed','pending')
                     AND datetime('now') BETWEEN b.start_at AND b.end_at
               ) THEN 'taken' ELSE 'free' END AS status
          FROM tables t
         WHERE t.venue_id = ?
    `).all(venueId);
}

function broadcastAvailability(venueId) {
    const set = subscribers.get(venueId);
    if (!set || set.size === 0) return;
    const payload = JSON.stringify({
        type: 'availability',
        venueId,
        tables: snapshot(venueId),
        at: new Date().toISOString(),
    });
    for (const ws of set) {
        if (ws.readyState === 1 /* OPEN */) ws.send(payload);
    }
}

module.exports = { subscribe, broadcastAvailability, snapshot };
