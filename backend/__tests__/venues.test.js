const request = require('supertest');
const { app } = require('../src/index');

describe('Venues API', () => {
  describe('GET /api/venues', () => {
    it('should return list of venues', async () => {
      const res = await request(app)
        .get('/api/venues')
        .expect(200);

      expect(res.body).toHaveProperty('venues');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.venues)).toBe(true);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/venues?type=restaurant')
        .expect(200);

      expect(res.body.venues.every(v => v.type === 'restaurant')).toBe(true);
    });

    it('should filter by district', async () => {
      const res = await request(app)
        .get('/api/venues?district=Yunusabad')
        .expect(200);

      expect(res.body.venues.every(v => v.district === 'Yunusabad')).toBe(true);
    });

    it('should search by name', async () => {
      const res = await request(app)
        .get('/api/venues?search=cafe')
        .expect(200);

      expect(res.body).toHaveProperty('venues');
    });

    it('should sort by rating', async () => {
      const res = await request(app)
        .get('/api/venues?sort=rating')
        .expect(200);

      const ratings = res.body.venues.map(v => v.rating);
      expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/venues?limit=5&offset=0')
        .expect(200);

      expect(res.body.venues.length).toBeLessThanOrEqual(5);
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('limit', 5);
      expect(res.body.pagination).toHaveProperty('offset', 0);
    });
  });

  describe('GET /api/venues/districts', () => {
    it('should return list of districts', async () => {
      const res = await request(app)
        .get('/api/venues/districts')
        .expect(200);

      expect(res.body).toHaveProperty('districts');
      expect(Array.isArray(res.body.districts)).toBe(true);
      res.body.districts.forEach(district => {
        expect(district).toHaveProperty('name');
        expect(district).toHaveProperty('count');
      });
    });
  });

  describe('GET /api/venues/:id', () => {
    let venueId;

    beforeAll(async () => {
      const res = await request(app).get('/api/venues?limit=1');
      venueId = res.body.venues[0]?.id;
    });

    it('should return venue details', async () => {
      if (!venueId) return;

      const res = await request(app)
        .get(`/api/venues/${venueId}`)
        .expect(200);

      expect(res.body).toHaveProperty('venue');
      expect(res.body).toHaveProperty('tables');
      expect(res.body).toHaveProperty('reviews');
      expect(res.body.venue.id).toBe(venueId);
    });

    it('should return 404 for non-existent venue', async () => {
      const res = await request(app)
        .get('/api/venues/non-existent-id')
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/venues/:id/availability', () => {
    let venueId;

    beforeAll(async () => {
      const res = await request(app).get('/api/venues?limit=1');
      venueId = res.body.venues[0]?.id;
    });

    it('should return table availability', async () => {
      if (!venueId) return;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/venues/${venueId}/availability?date=${dateStr}`)
        .expect(200);

      expect(res.body).toHaveProperty('tables');
      expect(Array.isArray(res.body.tables)).toBe(true);
    });

    it('should require date parameter', async () => {
      if (!venueId) return;

      const res = await request(app)
        .get(`/api/venues/${venueId}/availability`)
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/venues/:id/3d-model', () => {
    let venueId;

    beforeAll(async () => {
      const res = await request(app).get('/api/venues?limit=1');
      venueId = res.body.venues[0]?.id;
    });

    it('should return 3D model data', async () => {
      if (!venueId) return;

      const res = await request(app)
        .get(`/api/venues/${venueId}/3d-model`)
        .expect(200);

      expect(res.body).toHaveProperty('venue');
      expect(res.body).toHaveProperty('tables');
      expect(res.body).toHaveProperty('scene_config');
    });
  });
});
