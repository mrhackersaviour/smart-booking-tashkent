const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { authenticateToken } = require('../middleware/auth');

router.get('/transactions', authenticateToken, loyaltyController.getTransactions);
router.get('/summary', authenticateToken, loyaltyController.getSummary);
router.post('/redeem', authenticateToken, loyaltyController.redeemPoints);

module.exports = router;
