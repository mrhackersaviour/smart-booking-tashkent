require('dotenv').config();
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'smart_booking.db');
const db = new Database(dbPath);

try {
  const row = db.prepare('SELECT COUNT(*) as count FROM venues').get();
  if (row.count === 0) {
    console.log('No venues found, running seed...');
    db.close();
    require('./seed');
  } else {
    console.log(`Database already has ${row.count} venues, skipping seed.`);
    db.close();
  }
} catch (err) {
  console.error('Seed check error:', err);
  db.close();
  process.exit(1);
}
