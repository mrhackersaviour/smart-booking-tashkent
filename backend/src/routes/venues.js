const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const venueController = require('../controllers/venueController');

const router = express.Router();

router.get('/', optionalAuth, venueController.getVenues);
router.get('/districts', venueController.getDistricts);
router.get('/:id', optionalAuth, venueController.getVenueById);
router.get('/:id/availability', venueController.getVenueAvailability);
router.get('/:id/3d-model', venueController.getVenue3DModel);

module.exports = router;
