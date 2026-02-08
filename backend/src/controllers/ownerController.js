const { query } = require('../config/database');
const logger = require('../utils/logger');

// Dashboard stats for owner's venues
exports.getDashboardStats = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const totalVenues = await query(
      "SELECT COUNT(*) as count FROM venues WHERE owner_id = $1 AND is_active = 1",
      [ownerId]
    );

    const totalBookings = await query(
      `SELECT COUNT(*) as count FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.owner_id = $1`,
      [ownerId]
    );

    const totalRevenue = await query(
      `SELECT COALESCE(SUM(b.total_price), 0) as total FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.owner_id = $1 AND b.payment_status = 'paid'`,
      [ownerId]
    );

    const bookingsToday = await query(
      `SELECT COUNT(*) as count FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.owner_id = $1 AND b.booking_date = date('now')`,
      [ownerId]
    );

    const pendingBookings = await query(
      `SELECT COUNT(*) as count FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.owner_id = $1 AND b.status = 'pending'`,
      [ownerId]
    );

    const avgRating = await query(
      `SELECT COALESCE(AVG(v.rating), 0) as average FROM venues v
       WHERE v.owner_id = $1 AND v.is_active = 1 AND v.total_reviews > 0`,
      [ownerId]
    );

    const totalReviews = await query(
      `SELECT COUNT(*) as count FROM reviews r
       JOIN venues v ON r.venue_id = v.id
       WHERE v.owner_id = $1`,
      [ownerId]
    );

    const recentBookings = await query(
      `SELECT b.*, u.full_name as user_name, u.email as user_email, v.name as venue_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN venues v ON b.venue_id = v.id
       WHERE v.owner_id = $1
       ORDER BY b.created_at DESC LIMIT 5`,
      [ownerId]
    );

    res.json({
      stats: {
        totalVenues: totalVenues.rows[0].count,
        totalBookings: totalBookings.rows[0].count,
        totalRevenue: totalRevenue.rows[0].total,
        bookingsToday: bookingsToday.rows[0].count,
        pendingBookings: pendingBookings.rows[0].count,
        averageRating: Math.round(avgRating.rows[0].average * 100) / 100,
        totalReviews: totalReviews.rows[0].count,
      },
      recentBookings: recentBookings.rows,
    });
  } catch (err) {
    logger.error('Owner dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get owner's venues
exports.getMyVenues = async (req, res) => {
  try {
    const result = await query(
      `SELECT v.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.venue_id = v.id) as total_bookings,
        (SELECT COUNT(*) FROM venue_tables vt WHERE vt.venue_id = v.id) as total_tables
       FROM venues v
       WHERE v.owner_id = $1
       ORDER BY v.created_at DESC`,
      [req.user.id]
    );

    res.json({ venues: result.rows });
  } catch (err) {
    logger.error('Get owner venues error:', err);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
};

// Register a new venue
exports.registerVenue = async (req, res) => {
  try {
    const {
      name, type, address, city, district, latitude, longitude,
      description, cuisine_type, price_range, amenities, opening_hours,
      images, three_d_model_url, phone, website,
    } = req.body;

    if (!name || !type || !address || !district) {
      return res.status(400).json({ error: 'Name, type, address, and district are required' });
    }

    const validTypes = ['cafe', 'restaurant', 'stadium', 'fitness', 'barbershop', 'carwash'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid venue type. Must be one of: ${validTypes.join(', ')}` });
    }

    const result = await query(
      `INSERT INTO venues (name, type, address, city, district, latitude, longitude,
        description, cuisine_type, price_range, amenities, opening_hours,
        images, three_d_model_url, phone, website, owner_id, approval_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending')
       RETURNING *`,
      [
        name, type, address, city || 'Tashkent', district, latitude || null, longitude || null,
        description || null, cuisine_type || null, price_range || null,
        JSON.stringify(amenities || []), JSON.stringify(opening_hours || {}),
        JSON.stringify(images || []), three_d_model_url || null, phone || null, website || null,
        req.user.id,
      ]
    );

    logger.info(`New venue registered by owner ${req.user.id}: ${name}`);
    res.status(201).json({ venue: result.rows[0] });
  } catch (err) {
    logger.error('Register venue error:', err);
    res.status(500).json({ error: 'Failed to register venue' });
  }
};

// Update own venue
exports.updateVenue = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const venue = await query('SELECT id FROM venues WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
    if (venue.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found or access denied' });
    }

    const {
      name, type, address, city, district, latitude, longitude,
      description, cuisine_type, price_range, amenities, opening_hours,
      images, three_d_model_url, phone, website,
    } = req.body;

    const fields = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      name, type, address, city, district, latitude, longitude,
      description, cuisine_type, price_range, three_d_model_url, phone, website,
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }

    if (amenities !== undefined) {
      fields.push(`amenities = $${paramIndex++}`);
      params.push(JSON.stringify(amenities));
    }
    if (opening_hours !== undefined) {
      fields.push(`opening_hours = $${paramIndex++}`);
      params.push(JSON.stringify(opening_hours));
    }
    if (images !== undefined) {
      fields.push(`images = $${paramIndex++}`);
      params.push(JSON.stringify(images));
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push(`updated_at = datetime('now')`);

    const result = await query(
      `UPDATE venues SET ${fields.join(', ')} WHERE id = $${paramIndex} AND owner_id = $${paramIndex + 1} RETURNING *`,
      [...params, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({ venue: result.rows[0] });
  } catch (err) {
    logger.error('Update venue error:', err);
    res.status(500).json({ error: 'Failed to update venue' });
  }
};

// Get venue tables/seats
exports.getVenueTables = async (req, res) => {
  try {
    const { venueId } = req.params;

    // Verify ownership
    const venue = await query('SELECT id FROM venues WHERE id = $1 AND owner_id = $2', [venueId, req.user.id]);
    if (venue.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found or access denied' });
    }

    const result = await query(
      'SELECT * FROM venue_tables WHERE venue_id = $1 ORDER BY table_number',
      [venueId]
    );

    res.json({ tables: result.rows });
  } catch (err) {
    logger.error('Get venue tables error:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
};

// Add a table/seat
exports.addTable = async (req, res) => {
  try {
    const { venueId } = req.params;

    const venue = await query('SELECT id FROM venues WHERE id = $1 AND owner_id = $2', [venueId, req.user.id]);
    if (venue.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found or access denied' });
    }

    const { table_number, label, capacity, shape, position_x, position_y, position_z, is_vip, price_multiplier, features } = req.body;

    if (!table_number || !capacity) {
      return res.status(400).json({ error: 'Table number and capacity are required' });
    }

    const result = await query(
      `INSERT INTO venue_tables (venue_id, table_number, label, capacity, shape, position_x, position_y, position_z, is_vip, price_multiplier, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        venueId, table_number, label || null, capacity, shape || 'round',
        position_x || 0, position_y || 0, position_z || 0,
        is_vip ? 1 : 0, price_multiplier || 1.0, JSON.stringify(features || []),
      ]
    );

    res.status(201).json({ table: result.rows[0] });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Table number already exists for this venue' });
    }
    logger.error('Add table error:', err);
    res.status(500).json({ error: 'Failed to add table' });
  }
};

// Update a table
exports.updateTable = async (req, res) => {
  try {
    const { venueId, tableId } = req.params;

    const venue = await query('SELECT id FROM venues WHERE id = $1 AND owner_id = $2', [venueId, req.user.id]);
    if (venue.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found or access denied' });
    }

    const { label, capacity, shape, position_x, position_y, position_z, is_available, is_vip, price_multiplier, features } = req.body;

    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (label !== undefined) { fields.push(`label = $${paramIndex++}`); params.push(label); }
    if (capacity !== undefined) { fields.push(`capacity = $${paramIndex++}`); params.push(capacity); }
    if (shape !== undefined) { fields.push(`shape = $${paramIndex++}`); params.push(shape); }
    if (position_x !== undefined) { fields.push(`position_x = $${paramIndex++}`); params.push(position_x); }
    if (position_y !== undefined) { fields.push(`position_y = $${paramIndex++}`); params.push(position_y); }
    if (position_z !== undefined) { fields.push(`position_z = $${paramIndex++}`); params.push(position_z); }
    if (is_available !== undefined) { fields.push(`is_available = $${paramIndex++}`); params.push(is_available ? 1 : 0); }
    if (is_vip !== undefined) { fields.push(`is_vip = $${paramIndex++}`); params.push(is_vip ? 1 : 0); }
    if (price_multiplier !== undefined) { fields.push(`price_multiplier = $${paramIndex++}`); params.push(price_multiplier); }
    if (features !== undefined) { fields.push(`features = $${paramIndex++}`); params.push(JSON.stringify(features)); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await query(
      `UPDATE venue_tables SET ${fields.join(', ')} WHERE id = $${paramIndex} AND venue_id = $${paramIndex + 1} RETURNING *`,
      [...params, tableId, venueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ table: result.rows[0] });
  } catch (err) {
    logger.error('Update table error:', err);
    res.status(500).json({ error: 'Failed to update table' });
  }
};

// Delete a table
exports.deleteTable = async (req, res) => {
  try {
    const { venueId, tableId } = req.params;

    const venue = await query('SELECT id FROM venues WHERE id = $1 AND owner_id = $2', [venueId, req.user.id]);
    if (venue.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found or access denied' });
    }

    const result = await query(
      'DELETE FROM venue_tables WHERE id = $1 AND venue_id = $2 RETURNING id',
      [tableId, venueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (err) {
    logger.error('Delete table error:', err);
    res.status(500).json({ error: 'Failed to delete table' });
  }
};

// Get bookings for owner's venues
exports.getBookings = async (req, res) => {
  try {
    const { venue_id, status, date_from, date_to, page = 1, limit = 20 } = req.query;
    const conditions = ['v.owner_id = $1'];
    const params = [req.user.id];
    let paramIndex = 2;

    if (venue_id) {
      conditions.push(`b.venue_id = $${paramIndex++}`);
      params.push(venue_id);
    }
    if (status) {
      conditions.push(`b.status = $${paramIndex++}`);
      params.push(status);
    }
    if (date_from) {
      conditions.push(`b.booking_date >= $${paramIndex++}`);
      params.push(date_from);
    }
    if (date_to) {
      conditions.push(`b.booking_date <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await query(
      `SELECT COUNT(*) as count FROM bookings b JOIN venues v ON b.venue_id = v.id ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT b.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone, v.name as venue_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN venues v ON b.venue_id = v.id
       ${whereClause}
       ORDER BY b.booking_date DESC, b.start_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      bookings: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].count,
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('Owner get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Update booking status (confirm/cancel/complete)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Verify ownership through venue
    const booking = await query(
      `SELECT b.id FROM bookings b JOIN venues v ON b.venue_id = v.id
       WHERE b.id = $1 AND v.owner_id = $2`,
      [id, req.user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or access denied' });
    }

    const result = await query(
      "UPDATE bookings SET status = $1, updated_at = datetime('now') WHERE id = $2 RETURNING *",
      [status, id]
    );

    res.json({ booking: result.rows[0] });
  } catch (err) {
    logger.error('Owner update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

// Get reviews for owner's venues
exports.getReviews = async (req, res) => {
  try {
    const { venue_id, page = 1, limit = 20 } = req.query;
    const conditions = ['v.owner_id = $1'];
    const params = [req.user.id];
    let paramIndex = 2;

    if (venue_id) {
      conditions.push(`r.venue_id = $${paramIndex++}`);
      params.push(venue_id);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await query(
      `SELECT COUNT(*) as count FROM reviews r JOIN venues v ON r.venue_id = v.id ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT r.*, u.full_name as user_name, v.name as venue_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN venues v ON r.venue_id = v.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].count,
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('Owner get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Respond to a review
exports.respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    // Verify ownership through venue
    const review = await query(
      `SELECT r.id FROM reviews r JOIN venues v ON r.venue_id = v.id
       WHERE r.id = $1 AND v.owner_id = $2`,
      [id, req.user.id]
    );

    if (review.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or access denied' });
    }

    const result = await query(
      `UPDATE reviews SET owner_response = $1, owner_response_at = datetime('now'), updated_at = datetime('now')
       WHERE id = $2 RETURNING *`,
      [response.trim(), id]
    );

    res.json({ review: result.rows[0] });
  } catch (err) {
    logger.error('Respond to review error:', err);
    res.status(500).json({ error: 'Failed to respond to review' });
  }
};

// Revenue analytics for owner
exports.getRevenueStats = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const monthlyRevenue = await query(
      `SELECT strftime('%Y-%m', b.booking_date) as month,
              COALESCE(SUM(b.total_price), 0) as revenue,
              COUNT(*) as booking_count
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.owner_id = $1
         AND b.booking_date >= date('now', '-12 months')
         AND b.payment_status = 'paid'
       GROUP BY strftime('%Y-%m', b.booking_date)
       ORDER BY month ASC`,
      [ownerId]
    );

    const revenueByVenue = await query(
      `SELECT v.id, v.name, v.type,
              COALESCE(SUM(b.total_price), 0) as total_revenue,
              COUNT(b.id) as booking_count
       FROM venues v
       LEFT JOIN bookings b ON v.id = b.venue_id AND b.payment_status = 'paid'
       WHERE v.owner_id = $1 AND v.is_active = 1
       GROUP BY v.id, v.name, v.type
       ORDER BY total_revenue DESC`,
      [ownerId]
    );

    const bookingsByStatus = await query(
      `SELECT b.status, COUNT(*) as count
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE v.owner_id = $1
       GROUP BY b.status`,
      [ownerId]
    );

    res.json({
      monthlyRevenue: monthlyRevenue.rows,
      revenueByVenue: revenueByVenue.rows,
      bookingsByStatus: bookingsByStatus.rows,
    });
  } catch (err) {
    logger.error('Owner revenue stats error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue stats' });
  }
};
