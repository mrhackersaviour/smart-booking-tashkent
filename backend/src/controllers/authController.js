const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    // Validate role - only 'user' and 'owner' can self-register
    const allowedRoles = ['user', 'owner'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, phone, loyalty_points, role)
       VALUES ($1, $2, $3, $4, 500, $5) RETURNING id, email, full_name, phone, loyalty_points, subscription_tier, role`,
      [email, passwordHash, full_name, phone, userRole]
    );

    const { password_hash: _, ...user } = result.rows[0];

    // Welcome bonus
    await query(
      `INSERT INTO loyalty_transactions (user_id, points, transaction_type, description)
       VALUES ($1, 500, 'bonus', 'Welcome bonus for new registration')`,
      [user.id]
    );

    const tokens = generateTokens(user.id);

    logger.info(`New ${userRole} registered: ${email}`);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, email, password_hash, full_name, phone, avatar_url, loyalty_points, subscription_tier, role FROM users WHERE email = $1 AND is_active = 1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    const tokens = generateTokens(user.id);

    logger.info(`User logged in: ${email}`);
    res.json({ user: userWithoutPassword, ...tokens });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const result = await query('SELECT id FROM users WHERE id = $1 AND is_active = 1', [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokens = generateTokens(decoded.userId);
    res.json(tokens);
  } catch (err) {
    logger.error('Token refresh error:', err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};
