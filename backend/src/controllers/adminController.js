const { query } = require('../config/database');
const logger = require('../utils/logger');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await query("SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND role = 'user'");
    const totalOwners = await query("SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND role = 'owner'");
    const totalBookings = await query('SELECT COUNT(*) as count FROM bookings');
    const totalVenues = await query('SELECT COUNT(*) as count FROM venues WHERE is_active = 1');
    const pendingVenues = await query("SELECT COUNT(*) as count FROM venues WHERE approval_status = 'pending'");
    const totalRevenue = await query(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE payment_status = 'paid'"
    );
    const activeSubscriptions = await query(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'"
    );
    const bookingsToday = await query(
      "SELECT COUNT(*) as count FROM bookings WHERE booking_date = date('now')"
    );
    const newUsersThisMonth = await query(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= date('now', 'start of month')"
    );
    const avgRating = await query(
      'SELECT COALESCE(AVG(rating), 0) as average FROM venues WHERE is_active = 1 AND total_reviews > 0'
    );

    res.json({
      stats: {
        totalUsers: totalUsers.rows[0].count,
        totalOwners: totalOwners.rows[0].count,
        totalBookings: totalBookings.rows[0].count,
        totalVenues: totalVenues.rows[0].count,
        pendingVenues: pendingVenues.rows[0].count,
        totalRevenue: totalRevenue.rows[0].total,
        activeSubscriptions: activeSubscriptions.rows[0].count,
        bookingsToday: bookingsToday.rows[0].count,
        newUsersThisMonth: newUsersThisMonth.rows[0].count,
        averageVenueRating: Math.round(avgRating.rows[0].average * 100) / 100,
      },
    });
  } catch (err) {
    logger.error('Get dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { search, role, subscription_tier, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(u.email LIKE $${paramIndex} OR u.full_name LIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (role) {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(role);
    }
    if (subscription_tier) {
      conditions.push(`u.subscription_tier = $${paramIndex++}`);
      params.push(subscription_tier);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await query(
      `SELECT COUNT(*) as count FROM users u ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.loyalty_points,
              u.subscription_tier, u.preferred_language, u.role, u.is_active,
              u.created_at, u.updated_at
       FROM users u ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].count,
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active, subscription_tier, loyalty_points } = req.body;

    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      params.push(role);
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }
    if (subscription_tier !== undefined) {
      fields.push(`subscription_tier = $${paramIndex++}`);
      params.push(subscription_tier);
    }
    if (loyalty_points !== undefined) {
      fields.push(`loyalty_points = $${paramIndex++}`);
      params.push(loyalty_points);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push(`updated_at = datetime('now')`);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      [...params, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, ...user } = result.rows[0];
    res.json({ user });
  } catch (err) {
    logger.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = $1 RETURNING id, email, full_name",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully', user: result.rows[0] });
  } catch (err) {
    logger.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

exports.getVenues = async (req, res) => {
  try {
    const { search, type, district, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(v.name LIKE $${paramIndex} OR v.description LIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (type) {
      conditions.push(`v.type = $${paramIndex++}`);
      params.push(type);
    }
    if (district) {
      conditions.push(`v.district = $${paramIndex++}`);
      params.push(district);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await query(
      `SELECT COUNT(*) as count FROM venues v ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT v.* FROM venues v ${whereClause}
       ORDER BY v.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      venues: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].count,
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('Admin get venues error:', err);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
};

exports.createVenue = async (req, res) => {
  try {
    const {
      name, type, address, city, district, latitude, longitude,
      description, cuisine_type, price_range, amenities, opening_hours,
      images, three_d_model_url, phone, website,
    } = req.body;

    if (!name || !type || !address || !district) {
      return res.status(400).json({ error: 'Name, type, address, and district are required' });
    }

    const result = await query(
      `INSERT INTO venues (name, type, address, city, district, latitude, longitude,
        description, cuisine_type, price_range, amenities, opening_hours,
        images, three_d_model_url, phone, website)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        name, type, address, city || 'Tashkent', district, latitude || null, longitude || null,
        description || null, cuisine_type || null, price_range || null,
        JSON.stringify(amenities || []), JSON.stringify(opening_hours || {}),
        JSON.stringify(images || []), three_d_model_url || null, phone || null, website || null,
      ]
    );

    res.status(201).json({ venue: result.rows[0] });
  } catch (err) {
    logger.error('Create venue error:', err);
    res.status(500).json({ error: 'Failed to create venue' });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, address, city, district, latitude, longitude,
      description, cuisine_type, price_range, amenities, opening_hours,
      images, three_d_model_url, phone, website, is_active,
    } = req.body;

    const fields = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      name, type, address, city, district, latitude, longitude,
      description, cuisine_type, price_range, three_d_model_url, phone, website, is_active,
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }

    // JSON fields need stringification
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
      `UPDATE venues SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      [...params, id]
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

exports.deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE venues SET is_active = 0, updated_at = datetime('now') WHERE id = $1 RETURNING id, name",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({ message: 'Venue deactivated successfully', venue: result.rows[0] });
  } catch (err) {
    logger.error('Delete venue error:', err);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
};

exports.getPendingVenues = async (req, res) => {
  try {
    const result = await query(
      `SELECT v.*, u.full_name as owner_name, u.email as owner_email
       FROM venues v
       LEFT JOIN users u ON v.owner_id = u.id
       WHERE v.approval_status = 'pending'
       ORDER BY v.created_at ASC`
    );

    res.json({ venues: result.rows });
  } catch (err) {
    logger.error('Get pending venues error:', err);
    res.status(500).json({ error: 'Failed to fetch pending venues' });
  }
};

exports.approveVenue = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE venues SET approval_status = 'approved', is_active = 1, updated_at = datetime('now') WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Notify the owner
    if (result.rows[0].owner_id) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, 'venue_approved', 'Venue Approved', $2, $3)`,
        [
          result.rows[0].owner_id,
          `Your venue "${result.rows[0].name}" has been approved and is now live!`,
          JSON.stringify({ venue_id: id }),
        ]
      );
    }

    res.json({ venue: result.rows[0], message: 'Venue approved successfully' });
  } catch (err) {
    logger.error('Approve venue error:', err);
    res.status(500).json({ error: 'Failed to approve venue' });
  }
};

exports.rejectVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await query(
      "UPDATE venues SET approval_status = 'rejected', is_active = 0, updated_at = datetime('now') WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Notify the owner
    if (result.rows[0].owner_id) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, 'venue_rejected', 'Venue Rejected', $2, $3)`,
        [
          result.rows[0].owner_id,
          `Your venue "${result.rows[0].name}" was not approved. ${reason || 'Please contact support for details.'}`,
          JSON.stringify({ venue_id: id, reason }),
        ]
      );
    }

    res.json({ venue: result.rows[0], message: 'Venue rejected' });
  } catch (err) {
    logger.error('Reject venue error:', err);
    res.status(500).json({ error: 'Failed to reject venue' });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { status, date_from, date_to, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await query(
      `SELECT COUNT(*) as count FROM bookings b ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT b.*, u.email as user_email, u.full_name as user_name, v.name as venue_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN venues v ON b.venue_id = v.id
       ${whereClause}
       ORDER BY b.created_at DESC
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
    logger.error('Admin get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await query(
      "UPDATE bookings SET status = $1, updated_at = datetime('now') WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking: result.rows[0] });
  } catch (err) {
    logger.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    // Revenue by month (last 12 months)
    const monthlyRevenue = await query(
      `SELECT strftime('%Y-%m', booking_date) as month,
              COALESCE(SUM(total_price), 0) as revenue,
              COUNT(*) as booking_count
       FROM bookings
       WHERE booking_date >= date('now', '-12 months')
         AND payment_status = 'paid'
       GROUP BY strftime('%Y-%m', booking_date)
       ORDER BY month ASC`
    );

    // Booking count by status
    const bookingsByStatus = await query(
      `SELECT status, COUNT(*) as count
       FROM bookings
       GROUP BY status
       ORDER BY count DESC`
    );

    // Top venues by revenue
    const topVenues = await query(
      `SELECT v.id, v.name, v.type,
              COALESCE(SUM(b.total_price), 0) as total_revenue,
              COUNT(b.id) as booking_count
       FROM venues v
       LEFT JOIN bookings b ON v.id = b.venue_id AND b.payment_status = 'paid'
       WHERE v.is_active = 1
       GROUP BY v.id, v.name, v.type
       ORDER BY total_revenue DESC
       LIMIT 10`
    );

    res.json({
      monthlyRevenue: monthlyRevenue.rows,
      bookingsByStatus: bookingsByStatus.rows,
      topVenues: topVenues.rows,
    });
  } catch (err) {
    logger.error('Get revenue stats error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue stats' });
  }
};
