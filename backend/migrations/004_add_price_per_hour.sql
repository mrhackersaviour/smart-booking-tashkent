-- 004: Add price_per_hour column to venues
-- Replaces the ad-hoc `price_multiplier * basePrice` calculation with a
-- first-class column. Backfills from existing multiplier so legacy rows
-- retain their effective price. See Sprint 2 risk register (R10).

ALTER TABLE venues
    ADD COLUMN price_per_hour INTEGER;

-- Backfill existing rows: price_per_hour = round(price_multiplier * 50000)
-- 50,000 UZS is the reference base price used in seed data.
UPDATE venues
   SET price_per_hour = CAST(price_multiplier * 50000 AS INTEGER)
 WHERE price_per_hour IS NULL
   AND price_multiplier IS NOT NULL;

-- Sensible default for any rows where both columns were NULL.
UPDATE venues
   SET price_per_hour = 50000
 WHERE price_per_hour IS NULL;

CREATE INDEX IF NOT EXISTS idx_venues_price_per_hour ON venues(price_per_hour);
