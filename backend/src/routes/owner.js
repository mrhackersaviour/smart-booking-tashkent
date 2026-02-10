const express = require('express');
const { authenticateToken, requireOwner } = require('../middleware/auth');
const ownerController = require('../controllers/ownerController');

const router = express.Router();

// All owner routes require authentication and owner role
router.use(authenticateToken, requireOwner);

// Dashboard
router.get('/dashboard', ownerController.getDashboardStats);

// Venue management
router.get('/venues', ownerController.getMyVenues);
router.post('/venues', ownerController.registerVenue);
router.put('/venues/:id', ownerController.updateVenue);

// Table/seat management
router.get('/venues/:venueId/tables', ownerController.getVenueTables);
router.post('/venues/:venueId/tables', ownerController.addTable);
router.put('/venues/:venueId/tables/:tableId', ownerController.updateTable);
router.delete('/venues/:venueId/tables/:tableId', ownerController.deleteTable);

// Booking management
router.get('/bookings', ownerController.getBookings);
router.put('/bookings/:id/status', ownerController.updateBookingStatus);

// Reviews
router.get('/reviews', ownerController.getReviews);
router.post('/reviews/:id/respond', ownerController.respondToReview);

// Revenue analytics
router.get('/revenue', ownerController.getRevenueStats);

module.exports = router;
