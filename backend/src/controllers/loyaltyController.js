const { query } = require('../config/database');

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit = 20, offset = 0 } = req.query;

    let sql = `
      SELECT lt.*,
             b.booking_date, b.start_time,
             v.name as venue_name
      FROM loyalty_transactions lt
      LEFT JOIN bookings b ON lt.booking_id = b.id
      LEFT JOIN venues v ON b.venue_id = v.id
      WHERE lt.user_id = $1
    `;
    const params = [userId];

    if (type) {
      sql += ' AND lt.transaction_type = $2';
      params.push(type);
    }

    sql += ' ORDER BY lt.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const transactions = await query(sql, params);

    const totalResult = await query(
      'SELECT COUNT(*) as count FROM loyalty_transactions WHERE user_id = $1' + (type ? ' AND transaction_type = $2' : ''),
      type ? [userId, type] : [userId]
    );

    const userResult = await query('SELECT loyalty_points FROM users WHERE id = $1', [userId]);

    res.json({
      transactions: transactions.rows,
      total: parseInt(totalResult.rows[0]?.count || 0),
      currentBalance: userResult.rows[0]?.loyalty_points || 0,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get loyalty transactions' });
  }
};

exports.redeemPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { points, booking_id } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }

    const userResult = await query('SELECT loyalty_points FROM users WHERE id = $1', [userId]);
    const currentPoints = userResult.rows[0]?.loyalty_points || 0;

    if (currentPoints < points) {
      return res.status(400).json({ error: 'Insufficient loyalty points' });
    }

    // Deduct points from user
    await query(
      'UPDATE users SET loyalty_points = loyalty_points - $1 WHERE id = $2',
      [points, userId]
    );

    // Record redemption transaction
    await query(
      `INSERT INTO loyalty_transactions (user_id, transaction_type, points, booking_id, description, created_at)
       VALUES ($1, 'redeemed', $2, $3, $4, datetime('now'))`,
      [userId, -points, booking_id || null, `Redeemed ${points} points`]
    );

    // If booking_id provided, apply discount
    if (booking_id) {
      const discountAmount = points * 1000; // 1 point = 1000 UZS discount
      await query(
        `UPDATE bookings SET
         total_price = total_price - $1,
         loyalty_points_redeemed = $2
         WHERE id = $3 AND user_id = $4`,
        [discountAmount, points, booking_id, userId]
      );
    }

    const newBalance = await query('SELECT loyalty_points FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      pointsRedeemed: points,
      newBalance: newBalance.rows[0]?.loyalty_points || 0,
      discountApplied: points * 1000,
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({ error: 'Failed to redeem points' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query('SELECT loyalty_points, subscription_tier FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Get stats
    const earnedResult = await query(
      `SELECT COALESCE(SUM(points), 0) as total
       FROM loyalty_transactions
       WHERE user_id = $1 AND transaction_type = 'earned'`,
      [userId]
    );

    const redeemedResult = await query(
      `SELECT COALESCE(SUM(ABS(points)), 0) as total
       FROM loyalty_transactions
       WHERE user_id = $1 AND transaction_type = 'redeemed'`,
      [userId]
    );

    const bonusResult = await query(
      `SELECT COALESCE(SUM(points), 0) as total
       FROM loyalty_transactions
       WHERE user_id = $1 AND transaction_type = 'bonus'`,
      [userId]
    );

    // Calculate tier benefits
    const tierMultipliers = { free: 1, basic: 1.25, premium: 1.5, vip: 2 };
    const tier = user?.subscription_tier || 'free';

    res.json({
      currentBalance: user?.loyalty_points || 0,
      tier,
      totalEarned: parseInt(earnedResult.rows[0]?.total || 0),
      totalRedeemed: parseInt(redeemedResult.rows[0]?.total || 0),
      totalBonus: parseInt(bonusResult.rows[0]?.total || 0),
      earnMultiplier: tierMultipliers[tier] || 1,
      pointValue: 1000, // 1 point = 1000 UZS
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to get loyalty summary' });
  }
};
