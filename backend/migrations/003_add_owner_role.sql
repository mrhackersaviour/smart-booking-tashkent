-- Add 'owner' role support
-- Recreate users table with owner role in CHECK constraint
-- SQLite doesn't support ALTER CHECK, so we use table recreation

CREATE TABLE IF NOT EXISTS users_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    loyalty_points INTEGER DEFAULT 0,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'vip')),
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ru', 'uz')),
    preferences TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin'))
);

INSERT OR IGNORE INTO users_new SELECT id, email, password_hash, full_name, phone, avatar_url, loyalty_points, subscription_tier, preferred_language, preferences, is_active, created_at, updated_at, role FROM users;
DROP TABLE IF EXISTS users;
ALTER TABLE users_new RENAME TO users;

-- Add owner_id column to venues (nullable - admin-created venues won't have an owner)
ALTER TABLE venues ADD COLUMN owner_id TEXT REFERENCES users(id) ON DELETE SET NULL;

-- Add status column for venue approval workflow
ALTER TABLE venues ADD COLUMN approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add owner_response column to reviews for owner replies
ALTER TABLE reviews ADD COLUMN owner_response TEXT;
ALTER TABLE reviews ADD COLUMN owner_response_at TEXT;

-- Indexes for owner lookups
CREATE INDEX IF NOT EXISTS idx_venues_owner ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_approval ON venues(approval_status);
