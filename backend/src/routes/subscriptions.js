const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/plans', optionalAuth, subscriptionController.getPlans);
router.get('/current', authenticateToken, subscriptionController.getCurrentSubscription);
router.post('/subscribe', authenticateToken, subscriptionController.subscribe);
router.post('/cancel', authenticateToken, subscriptionController.cancel);

module.exports = router;
