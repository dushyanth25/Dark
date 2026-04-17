const request = require('supertest');
const app = require('../src/index');

describe('Backend API Tests', () => {
  describe('Health Check', () => {
    test('GET /api/health should return status 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('Gotham server is online');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('404 Handler', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Route not found');
    });
  });

  describe('CORS Configuration', () => {
    test('should allow CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Request Content-Type', () => {
    test('should handle JSON requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});
