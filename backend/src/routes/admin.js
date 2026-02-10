const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Venue management
router.get('/venues', adminController.getVenues);
router.post('/venues', adminController.createVenue);
router.put('/venues/:id', adminController.updateVenue);
router.delete('/venues/:id', adminController.deleteVenue);

// Venue approval workflow
router.get('/venues/pending', adminController.getPendingVenues);
router.put('/venues/:id/approve', adminController.approveVenue);
router.put('/venues/:id/reject', adminController.rejectVenue);

// Booking management
router.get('/bookings', adminController.getBookings);
router.put('/bookings/:id/status', adminController.updateBookingStatus);

// Revenue & analytics
router.get('/revenue', adminController.getRevenueStats);

module.exports = router;
