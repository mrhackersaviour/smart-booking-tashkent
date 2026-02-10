const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.post('/create-intent', authenticateToken, paymentController.createPaymentIntent);
router.post('/confirm', authenticateToken, paymentController.confirmPayment);
router.post('/refund', authenticateToken, paymentController.processRefund);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
