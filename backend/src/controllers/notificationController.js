const { query } = require('../config/database');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only, limit = 20, offset = 0 } = req.query;

    let sql = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];

    if (unread_only === 'true') {
      sql += ' AND is_read = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(parseInt(limit), parseInt(offset));

    const notifications = await query(sql, params);

    const unreadCountResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0',
      [userId]
    );

    res.json({
      notifications: notifications.rows,
      unreadCount: parseInt(unreadCountResult.rows[0]?.count || 0),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await query(
      `UPDATE notifications SET is_read = 1
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    const result = await query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      `UPDATE notifications SET is_read = 1
       WHERE user_id = $1 AND is_read = 0`,
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await query('DELETE FROM notifications WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Helper function to create notifications (used by other controllers)
exports.createNotification = async (userId, type, title, message, data = {}) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data, created_at)
       VALUES ($1, $2, $3, $4, $5, datetime('now'))`,
      [userId, type, title, message, JSON.stringify(data)]
    );
    return true;
  } catch (error) {
    console.error('Create notification error:', error);
    return false;
  }
};
