const Database = require('better-sqlite3');
const path = require('path');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'smart_booking.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

logger.info(`SQLite database connected: ${DB_PATH}`);

// Helper: convert PostgreSQL-style $1, $2 params to SQLite ? params
const convertParams = (text, params) => {
  if (!params || params.length === 0) return { sql: text, values: [] };

  let sql = text;
  // Replace $N with ? but we need to reorder params correctly
  // First collect all $N references and their positions
  const refs = [];
  sql = sql.replace(/\$(\d+)/g, (match, num) => {
    refs.push(parseInt(num) - 1); // 0-indexed
    return '?';
  });

  const values = refs.map((i) => {
    const val = params[i];
    // SQLite doesn't have native boolean - convert
    if (val === true) return 1;
    if (val === false) return 0;
    if (val === undefined) return null;
    return val;
  });

  return { sql, values };
};

// Strip PostgreSQL-specific type casts like ::time, ::date, ::text
const stripPgCasts = (sql) => {
  return sql.replace(/::(time|date|text|integer|boolean|jsonb|uuid|varchar|numeric|decimal)\b/gi, '');
};

// pg-compatible query interface: returns { rows: [...] }
const query = async (text, params) => {
  const start = Date.now();
  let cleaned = stripPgCasts(text.trim());
  const { sql, values } = convertParams(cleaned, params || []);

  const duration = Date.now() - start;
  const isSelect = /^\s*(SELECT|WITH)\b/i.test(sql);

  try {
    let rows;
    if (isSelect) {
      rows = db.prepare(sql).all(...values);
    } else {
      const info = db.prepare(sql).run(...values);
      // For INSERT ... RETURNING *, simulate by fetching the inserted row
      const returningMatch = cleaned.match(/RETURNING\s+(.+)$/i);
      if (returningMatch) {
        // Try to figure out the table and fetch by rowid
        const tableMatch = cleaned.match(/(?:INSERT\s+INTO|UPDATE)\s+(\w+)/i);
        if (tableMatch && info.changes > 0) {
          const table = tableMatch[1];
          if (/INSERT/i.test(cleaned)) {
            rows = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).all(info.lastInsertRowid);
          } else {
            // For UPDATE RETURNING, re-run a SELECT with same WHERE
            const whereMatch = cleaned.match(/WHERE\s+(.+?)\s+RETURNING/i);
            if (whereMatch) {
              const { sql: wSql, values: wValues } = convertParams(stripPgCasts(whereMatch[1]), params || []);
              rows = db.prepare(`SELECT * FROM ${tableMatch[1]} WHERE ${wSql}`).all(...wValues);
            } else {
              rows = [];
            }
          }
        } else {
          rows = [];
        }
      } else {
        rows = [];
      }
    }

    logger.debug(`Query (${Date.now() - start}ms): ${sql.substring(0, 80)}...`);
    return { rows, rowCount: rows.length };
  } catch (err) {
    logger.error(`Query error: ${err.message}\nSQL: ${sql}\nValues: ${JSON.stringify(values)}`);
    throw err;
  }
};

// Transaction client interface (pg-compatible)
const getClient = async () => {
  const client = {
    query: async (text, params) => query(text, params),
    release: () => {},
  };
  return client;
};

// Direct db access for migrations
const getDb = () => db;

module.exports = { query, getClient, getDb };
