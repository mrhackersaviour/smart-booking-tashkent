const { query } = require('../config/database');
const logger = require('../utils/logger');

exports.getVenues = async (req, res) => {
  try {
    const { type, district, price_range, cuisine, search, sort, page = 1, limit = 12 } = req.query;
    const conditions = ['v.is_active = 1'];
    const params = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`v.type = $${paramIndex++}`);
      params.push(type);
    }
    if (district) {
      conditions.push(`v.district = $${paramIndex++}`);
      params.push(district);
    }
    if (price_range) {
      conditions.push(`v.price_range = $${paramIndex++}`);
      params.push(parseInt(price_range));
    }
    if (cuisine) {
      conditions.push(`v.cuisine_type ILIKE $${paramIndex++}`);
      params.push(`%${cuisine}%`);
    }
    if (search) {
      conditions.push(`(v.name ILIKE $${paramIndex} OR v.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    let orderBy = 'v.rating DESC, v.total_reviews DESC';
    if (sort === 'price_low') orderBy = 'v.price_range ASC';
    else if (sort === 'price_high') orderBy = 'v.price_range DESC';
    else if (sort === 'newest') orderBy = 'v.created_at DESC';
    else if (sort === 'name') orderBy = 'v.name ASC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await query(
      `SELECT COUNT(*) as count FROM venues v WHERE ${conditions.join(' AND ')}`,
      params
    );

    const result = await query(
      `SELECT v.* FROM venues v
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      venues: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('Get venues error:', err);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
};

exports.getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM venues WHERE id = $1 AND is_active = 1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const tables = await query(
      'SELECT * FROM venue_tables WHERE venue_id = $1 ORDER BY table_number',
      [id]
    );

    const reviewsResult = await query(
      `SELECT r.*, u.full_name, u.avatar_url
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.venue_id = $1 ORDER BY r.created_at DESC LIMIT 5`,
      [id]
    );

    res.json({
      venue: result.rows[0],
      tables: tables.rows,
      recentReviews: reviewsResult.rows,
    });
  } catch (err) {
    logger.error('Get venue error:', err);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
};

exports.getVenueAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const tables = await query(
      `SELECT vt.*,
        CASE WHEN b.id IS NOT NULL THEN false ELSE true END as is_available_for_date,
        b.start_time as booked_start,
        b.end_time as booked_end
       FROM venue_tables vt
       LEFT JOIN bookings b ON vt.id = b.table_id
         AND b.booking_date = $2
         AND b.status IN ('confirmed', 'pending')
       WHERE vt.venue_id = $1
       ORDER BY vt.table_number`,
      [id, date]
    );

    // Group bookings by table to show all time slots
    const tableMap = new Map();
    for (const row of tables.rows) {
      if (!tableMap.has(row.id)) {
        tableMap.set(row.id, {
          ...row,
          booked_slots: [],
        });
      }
      if (row.booked_start) {
        tableMap.get(row.id).booked_slots.push({
          start: row.booked_start,
          end: row.booked_end,
        });
      }
    }

    res.json({ tables: Array.from(tableMap.values()), date });
  } catch (err) {
    logger.error('Get availability error:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

exports.getVenue3DModel = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await query(
      'SELECT id, name, three_d_model_url FROM venues WHERE id = $1',
      [id]
    );

    if (venue.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const tables = await query(
      `SELECT id, table_number, label, capacity, shape,
              position_x, position_y, position_z,
              is_available, is_vip, price_multiplier, features
       FROM venue_tables WHERE venue_id = $1 ORDER BY table_number`,
      [id]
    );

    res.json({
      venue: venue.rows[0],
      tables: tables.rows,
      scene: {
        width: 20,
        depth: 15,
        height: 4,
        floorTexture: 'wood',
        wallTexture: 'plaster',
        ambientLight: 0.4,
        pointLights: [
          { x: 0, y: 3.5, z: 0, intensity: 0.8, color: '#FFF5E1' },
          { x: -6, y: 3.5, z: -4, intensity: 0.5, color: '#FFF5E1' },
          { x: 6, y: 3.5, z: 4, intensity: 0.5, color: '#FFF5E1' },
        ],
      },
    });
  } catch (err) {
    logger.error('Get 3D model error:', err);
    res.status(500).json({ error: 'Failed to fetch 3D model data' });
  }
};

exports.getDistricts = async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT district, COUNT(*) as venue_count FROM venues WHERE is_active = 1 GROUP BY district ORDER BY district'
    );
    res.json({ districts: result.rows });
  } catch (err) {
    logger.error('Get districts error:', err);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
};
