const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');

exports.createBooking = async (req, res) => {
  try {
    const { venue_id, table_id, booking_date, start_time, end_time, guests_count, special_requests, is_group_booking } = req.body;

    // Check venue exists
    const venue = await query('SELECT * FROM venues WHERE id = $1 AND is_active = 1', [venue_id]);
    if (venue.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check table availability if table specified
    if (table_id) {
      const conflicting = await query(
        `SELECT id FROM bookings
         WHERE table_id = $1 AND booking_date = $2 AND status IN ('confirmed', 'pending')
         AND $3 < end_time AND $4 > start_time`,
        [table_id, booking_date, start_time, end_time]
      );
      if (conflicting.rows.length > 0) {
        return res.status(409).json({ error: 'Table is already booked for this time' });
      }

      // Check capacity
      const table = await query('SELECT capacity FROM venue_tables WHERE id = $1', [table_id]);
      if (table.rows.length > 0 && guests_count > table.rows[0].capacity) {
        return res.status(400).json({ error: `Table capacity is ${table.rows[0].capacity} guests` });
      }
    }

    // Calculate price (simplified)
    const basePrice = venue.rows[0].price_range * 75000;
    const totalPrice = basePrice * guests_count;
    const loyaltyPoints = Math.floor(totalPrice / 10000);

    const booking = await query(
      `INSERT INTO bookings (user_id, venue_id, table_id, booking_date, start_time, end_time, guests_count, status, total_price, loyalty_points_earned, special_requests, is_group_booking)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8, $9, $10, $11)
       RETURNING *`,
      [req.user.id, venue_id, table_id, booking_date, start_time, end_time, guests_count, totalPrice, loyaltyPoints, special_requests, is_group_booking || false]
    );

    // Award loyalty points
    await query(
      `UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2`,
      [loyaltyPoints, req.user.id]
    );
    await query(
      `INSERT INTO loyalty_transactions (user_id, booking_id, points, transaction_type, description)
       VALUES ($1, $2, $3, 'earned', $4)`,
      [req.user.id, booking.rows[0].id, loyaltyPoints, `Booking at ${venue.rows[0].name}`]
    );

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'booking_confirmed', 'Booking Confirmed', $2, $3)`,
      [
        req.user.id,
        `Your booking at ${venue.rows[0].name} on ${booking_date} at ${start_time} has been confirmed.`,
        JSON.stringify({ booking_id: booking.rows[0].id, venue_id }),
      ]
    );

    logger.info(`Booking created: ${booking.rows[0].id} by user ${req.user.id}`);
    res.status(201).json({ booking: booking.rows[0], loyaltyPointsEarned: loyaltyPoints });
  } catch (err) {
    logger.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const conditions = ['b.user_id = $1'];
    const params = [req.user.id];
    let paramIndex = 2;

    if (status) {
      conditions.push(`b.status = $${paramIndex++}`);
      params.push(status);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(
      `SELECT b.*, v.name as venue_name, v.type as venue_type, v.address as venue_address, v.images as venue_images,
              vt.table_number, vt.label as table_label
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       LEFT JOIN venue_tables vt ON b.table_id = vt.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.booking_date DESC, b.start_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as count FROM bookings b WHERE ${conditions.join(' AND ')}`,
      params
    );

    res.json({
      bookings: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (err) {
    logger.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, v.name as venue_name, v.type as venue_type, v.address as venue_address, v.phone as venue_phone,
              vt.table_number, vt.label as table_label, vt.capacity as table_capacity
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       LEFT JOIN venue_tables vt ON b.table_id = vt.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    let groupBooking = null;
    if (result.rows[0].is_group_booking) {
      const gb = await query(
        'SELECT * FROM group_bookings WHERE booking_id = $1',
        [req.params.id]
      );
      if (gb.rows.length > 0) groupBooking = gb.rows[0];
    }

    res.json({ booking: result.rows[0], groupBooking });
  } catch (err) {
    logger.error('Get booking error:', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_date, start_time, end_time, guests_count, special_requests } = req.body;

    const existing = await query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (['cancelled', 'completed'].includes(existing.rows[0].status)) {
      return res.status(400).json({ error: 'Cannot update a cancelled or completed booking' });
    }

    const result = await query(
      `UPDATE bookings SET
        booking_date = COALESCE($3, booking_date),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        guests_count = COALESCE($6, guests_count),
        special_requests = COALESCE($7, special_requests)
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.user.id, booking_date, start_time, end_time, guests_count, special_requests]
    );

    res.json({ booking: result.rows[0] });
  } catch (err) {
    logger.error('Update booking error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (existing.rows[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Remove loyalty points earned from this booking
    const pointsToRemove = existing.rows[0].loyalty_points_earned;
    if (pointsToRemove > 0) {
      await query(
        'UPDATE users SET loyalty_points = MAX(0, loyalty_points - $1) WHERE id = $2',
        [pointsToRemove, req.user.id]
      );
      await query(
        `INSERT INTO loyalty_transactions (user_id, booking_id, points, transaction_type, description)
         VALUES ($1, $2, $3, 'redeemed', 'Points reversed due to booking cancellation')`,
        [req.user.id, id, -pointsToRemove]
      );
    }

    await query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1",
      [id]
    );

    const updated = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    res.json({ booking: updated.rows[0], message: 'Booking cancelled successfully' });
  } catch (err) {
    logger.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

exports.inviteFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const { invited_emails, split_type } = req.body;

    const booking = await query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Find invited users - SQLite doesn't have ANY(), use IN with placeholders
    const placeholders = invited_emails.map((_, i) => `$${i + 1}`).join(', ');
    const invitedUsers = await query(
      `SELECT id, email, full_name FROM users WHERE email IN (${placeholders})`,
      invited_emails
    );

    const invitedUserIds = invitedUsers.rows.map(u => ({ id: u.id, email: u.email, name: u.full_name, status: 'pending' }));

    await query("UPDATE bookings SET is_group_booking = 1 WHERE id = $1", [id]);

    const groupBooking = await query(
      `INSERT INTO group_bookings (booking_id, inviter_user_id, invited_users, split_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, req.user.id, JSON.stringify(invitedUserIds), split_type || 'equal']
    );

    for (const user of invitedUsers.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, 'group_invite', 'Group Booking Invitation', $2, $3)`,
        [
          user.id,
          `${req.user.full_name} invited you to a group booking!`,
          JSON.stringify({ booking_id: id, inviter: req.user.full_name }),
        ]
      );
    }

    res.json({ groupBooking: groupBooking.rows[0], invitedUsers: invitedUsers.rows });
  } catch (err) {
    logger.error('Invite friends error:', err);
    res.status(500).json({ error: 'Failed to invite friends' });
  }
};

exports.splitPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const groupBooking = await query(
      `SELECT gb.*, b.total_price, b.guests_count
       FROM group_bookings gb
       JOIN bookings b ON gb.booking_id = b.id
       WHERE gb.booking_id = $1 AND gb.inviter_user_id = $2`,
      [id, req.user.id]
    );

    if (groupBooking.rows.length === 0) {
      return res.status(404).json({ error: 'Group booking not found' });
    }

    const gb = groupBooking.rows[0];
    const invited = typeof gb.invited_users === 'string' ? JSON.parse(gb.invited_users) : gb.invited_users;
    const totalParticipants = invited.length + 1;
    const splitAmount = Math.ceil(gb.total_price / totalParticipants);

    const splitStatus = {
      inviter: { user_id: req.user.id, amount: splitAmount, status: 'pending' },
      invited: invited.map(u => ({ ...u, amount: splitAmount, payment_status: 'pending' })),
    };

    await query(
      'UPDATE group_bookings SET split_payment_status = $1 WHERE id = $2',
      [JSON.stringify(splitStatus), gb.id]
    );

    res.json({ splitDetails: splitStatus, perPerson: splitAmount, currency: 'UZS' });
  } catch (err) {
    logger.error('Split payment error:', err);
    res.status(500).json({ error: 'Failed to calculate split payment' });
  }
};
