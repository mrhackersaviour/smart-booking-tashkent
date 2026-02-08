const { query } = require('../config/database');

// Note: In production, you would use the actual Stripe SDK
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const bookingResult = await query(
      `SELECT b.*, v.name as venue_name
       FROM bookings b
       JOIN venues v ON b.venue_id = v.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [booking_id, userId]
    );

    if (!bookingResult.rows[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'Booking is already paid' });
    }

    // For demo purposes, simulate a payment intent
    const paymentIntentId = 'pi_demo_' + Date.now();

    await query(
      'UPDATE bookings SET payment_intent_id = $1 WHERE id = $2',
      [paymentIntentId, booking_id]
    );

    res.json({
      clientSecret: paymentIntentId + '_secret_demo',
      paymentIntentId,
      amount: booking.total_price,
      currency: 'UZS',
      booking: {
        id: booking.id,
        venue: booking.venue_name,
        date: booking.booking_date,
        time: `${booking.start_time} - ${booking.end_time}`,
        guests: booking.guests_count,
      },
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { booking_id, payment_intent_id } = req.body;

    const bookingResult = await query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [booking_id, userId]
    );

    if (!bookingResult.rows[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking payment status
    await query(
      `UPDATE bookings SET payment_status = 'paid', updated_at = datetime('now') WHERE id = $1`,
      [booking_id]
    );

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data, created_at)
       VALUES ($1, 'payment_confirmed', 'Payment Confirmed', $2, $3, datetime('now'))`,
      [userId, `Your payment for booking #${booking_id} has been confirmed.`, JSON.stringify({ booking_id })]
    );

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { booking_id } = req.body;

    const bookingResult = await query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [booking_id, userId]
    );

    if (!bookingResult.rows[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (booking.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Booking is not paid' });
    }

    await query(
      `UPDATE bookings SET payment_status = 'refunded', updated_at = datetime('now') WHERE id = $1`,
      [booking_id]
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundAmount: booking.total_price,
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
};

// Stripe webhook handler (for production)
exports.handleWebhook = async (req, res) => {
  const { type, data } = req.body;

  switch (type) {
    case 'payment_intent.succeeded':
      break;
    case 'payment_intent.payment_failed':
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      break;
  }

  res.json({ received: true });
};
