const request = require('supertest');
const { app } = require('../src/index');

describe('Bookings API', () => {
  let accessToken;
  let venueId;
  let bookingId;

  beforeAll(async () => {
    // Register and login a test user
    const email = `booking_test_${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'testpassword123',
        full_name: 'Booking Test User',
        phone_number: '+998901234567',
      });

    accessToken = registerRes.body.accessToken;

    // Get a venue for booking
    const venuesRes = await request(app).get('/api/venues?limit=1');
    venueId = venuesRes.body.venues[0]?.id;
  });

  describe('POST /api/bookings', () => {
    it('should create a booking', async () => {
      if (!venueId) return;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          venue_id: venueId,
          booking_date: dateStr,
          start_time: '12:00',
          end_time: '14:00',
          guests_count: 4,
          special_requests: 'Window seat please',
        })
        .expect(201);

      expect(res.body).toHaveProperty('booking');
      expect(res.body).toHaveProperty('loyaltyPointsEarned');
      expect(res.body.booking.venue_id).toBe(venueId);
      expect(res.body.booking.status).toBe('confirmed');

      bookingId = res.body.booking.id;
    });

    it('should reject booking without auth', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          venue_id: venueId,
          booking_date: '2025-01-15',
          start_time: '12:00',
          end_time: '14:00',
          guests_count: 4,
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('should reject booking with missing fields', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          venue_id: venueId,
        })
        .expect(400);

      expect(res.body).toHaveProperty('errors');
    });

    it('should reject booking for non-existent venue', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          venue_id: 'non-existent-venue',
          booking_date: '2025-01-15',
          start_time: '12:00',
          end_time: '14:00',
          guests_count: 4,
        })
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/bookings', () => {
    it('should return user bookings', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('bookings');
      expect(Array.isArray(res.body.bookings)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/bookings?status=confirmed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.bookings.every(b => b.status === 'confirmed')).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should return booking details', async () => {
      if (!bookingId) return;

      const res = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('booking');
      expect(res.body.booking.id).toBe(bookingId);
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await request(app)
        .get('/api/bookings/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/bookings/:id', () => {
    it('should update booking', async () => {
      if (!bookingId) return;

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          guests_count: 6,
          special_requests: 'Updated request',
        })
        .expect(200);

      expect(res.body).toHaveProperty('booking');
      expect(res.body.booking.guests_count).toBe(6);
    });
  });

  describe('POST /api/bookings/:id/cancel', () => {
    it('should cancel booking', async () => {
      if (!bookingId) return;

      const res = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('booking');
      expect(res.body.booking.status).toBe('cancelled');
    });

    it('should not cancel already cancelled booking', async () => {
      if (!bookingId) return;

      const res = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });
});
