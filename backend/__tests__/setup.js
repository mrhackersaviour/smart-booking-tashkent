const db = require('../src/config/database');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Clean up after all tests
afterAll(() => {
  // Close database connection
  if (db.close) {
    db.close();
  }
});
