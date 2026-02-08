const { query } = require('../config/database');

const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 99000,
    priceUSD: 8,
    period: 'month',
    features: [
      '1.25x loyalty points',
      'Priority booking',
      'Early access to new venues',
      'Monthly special offers',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 199000,
    priceUSD: 16,
    period: 'month',
    features: [
      '1.5x loyalty points',
      'Priority booking',
      'Free cancellation',
      'Exclusive VIP tables access',
      'Personalized recommendations',
      'Dedicated support',
    ],
    popular: true,
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    price: 499000,
    priceUSD: 40,
    period: 'month',
    features: [
      '2x loyalty points',
      'Instant booking confirmation',
      'Free cancellation anytime',
      'All VIP tables access',
      'Personal concierge',
      'Exclusive events access',
      'Complimentary upgrades',
      'Partner discounts',
    ],
  },
};

exports.getPlans = async (req, res) => {
  try {
    const userId = req.user?.id;
    let currentPlan = 'free';

    if (userId) {
      const userResult = await query('SELECT subscription_tier FROM users WHERE id = $1', [userId]);
      currentPlan = userResult.rows[0]?.subscription_tier || 'free';
    }

    res.json({
      plans: Object.values(PLANS),
      currentPlan,
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_type, payment_method_id } = req.body;

    if (!PLANS[plan_type]) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const plan = PLANS[plan_type];

    // In a real app, this would integrate with Stripe
    // For now, we'll simulate the subscription

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create subscription record
    const subscriptionResult = await query(
      `INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, price, benefits, created_at)
       VALUES ($1, $2, 'active', $3, $4, $5, $6, datetime('now'))
       RETURNING *`,
      [
        userId,
        plan_type,
        startDate.toISOString(),
        endDate.toISOString(),
        plan.price,
        JSON.stringify(plan.features),
      ]
    );

    // Update user's subscription tier
    await query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2',
      [plan_type, userId]
    );

    // Add bonus points for subscribing
    const bonusPoints = { basic: 100, premium: 250, vip: 500 }[plan_type] || 0;
    if (bonusPoints > 0) {
      await query(
        'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
        [bonusPoints, userId]
      );

      await query(
        `INSERT INTO loyalty_transactions (user_id, transaction_type, points, description, created_at)
         VALUES ($1, 'bonus', $2, $3, datetime('now'))`,
        [userId, bonusPoints, `Subscription bonus for ${plan.name} plan`]
      );
    }

    res.json({
      success: true,
      subscription: subscriptionResult.rows[0],
      bonusPoints,
      message: `Successfully subscribed to ${plan.name} plan!`,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

exports.cancel = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptionResult = await query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (!subscriptionResult.rows[0]) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription
    await query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = $1`,
      [subscriptionResult.rows[0].id]
    );

    // Update user tier to free (effective at end of billing period in real app)
    await query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2',
      ['free', userId]
    );

    res.json({
      success: true,
      message: 'Subscription cancelled. You will retain access until the end of your billing period.',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptionResult = await query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const userResult = await query('SELECT subscription_tier FROM users WHERE id = $1', [userId]);

    if (!subscriptionResult.rows[0]) {
      return res.json({
        subscription: null,
        tier: userResult.rows[0]?.subscription_tier || 'free',
      });
    }

    const subscription = subscriptionResult.rows[0];
    const plan = PLANS[subscription.plan_type];

    res.json({
      subscription: {
        ...subscription,
        plan,
      },
      tier: userResult.rows[0]?.subscription_tier || 'free',
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
};
