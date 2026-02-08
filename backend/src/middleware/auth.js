const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, email, full_name, phone, avatar_url, loyalty_points, subscription_tier, preferred_language, role FROM users WHERE id = $1 AND is_active = 1', [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    logger.error('Auth middleware error:', err);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, email, full_name, loyalty_points, subscription_tier FROM users WHERE id = $1 AND is_active = 1', [decoded.userId]);
    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }
  } catch (err) {
    // Optional auth - silently continue
  }
  next();
};

const requireSubscription = (minTier) => {
  const tiers = { free: 0, basic: 1, premium: 2, vip: 3 };
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userTier = tiers[req.user.subscription_tier] || 0;
    const requiredTier = tiers[minTier] || 0;
    if (userTier < requiredTier) {
      return res.status(403).json({ error: `Requires ${minTier} subscription or higher` });
    }
    next();
  };
};

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const result = await query('SELECT role FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    logger.error('Admin middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const requireOwner = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const result = await query('SELECT role FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0 || result.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    next();
  } catch (err) {
    logger.error('Owner middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access restricted to: ${roles.join(', ')}` });
    }
    next();
  };
};

module.exports = { authenticateToken, optionalAuth, requireSubscription, requireAdmin, requireOwner, requireRole };
