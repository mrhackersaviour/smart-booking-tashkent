const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authenticateToken);

router.post(
  '/',
  [
    body('venue_id').isUUID().withMessage('Valid venue ID required'),
    body('booking_date').isDate().withMessage('Valid date required'),
    body('start_time').matches(/^\d{2}:\d{2}$/).withMessage('Valid start time required (HH:MM)'),
    body('end_time').matches(/^\d{2}:\d{2}$/).withMessage('Valid end time required (HH:MM)'),
    body('guests_count').isInt({ min: 1, max: 50 }).withMessage('Guests count must be 1-50'),
    body('table_id').optional().isUUID(),
    body('special_requests').optional().trim(),
  ],
  validate,
  bookingController.createBooking
);

router.get('/', bookingController.getUserBookings);
router.get('/:id', bookingController.getBookingById);
router.put('/:id', bookingController.updateBooking);
router.post('/:id/cancel', bookingController.cancelBooking);
router.post('/:id/invite', bookingController.inviteFriends);
router.get('/:id/split', bookingController.splitPayment);

module.exports = router;
