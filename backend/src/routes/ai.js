const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.post('/recommendations', optionalAuth, aiController.getRecommendations);
router.post('/chat', optionalAuth, aiController.chat);
router.post('/select-table', authenticateToken, aiController.selectTable);

module.exports = router;
