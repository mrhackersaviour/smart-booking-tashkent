# Admin Analytics Dashboard — metric definitions

This note documents the analytics shown on the owner/admin dashboard so
that the definitions stay consistent across the UI, the API and the
investor-facing reporting.

## Primary metrics

| Metric | Definition | Source query |
|---|---|---|
| **GMV** | Gross Merchandise Value — sum of `bookings.total_amount` where `status IN ('confirmed','completed')` | `SUM(total_amount)` |
| **Net Revenue** | GMV × platform commission (default 4%) | `GMV * 0.04` |
| **Active Venues** | Distinct venues with ≥1 confirmed booking in the last 30 days | `COUNT(DISTINCT venue_id)` |
| **Booking Rate** | Confirmed bookings ÷ venue view events | `confirmed / views` |
| **Average Party Size** | Mean `party_size` across completed bookings | `AVG(party_size)` |
| **Top Category** | Venue category with the highest booking share | `GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1` |

## Time windows

All dashboard charts default to a rolling **30-day** window. Drill-downs
support 7d / 30d / 90d / YTD. Comparison arrows are versus the previous
window of equal length.

## Owner-view scoping

The owner role sees only rows where `venues.owner_id = current_user`.
The global `admin` role sees all venues. This is enforced in
`routes/admin.js` and `routes/owner.js` via the `requireRole` middleware.

## Known limitations

- Rating recalculation is eventual — depends on the review-writing API
  triggering the venue update (see `routes/reviews.js`).
- We do not deduplicate view events yet; same-session repeats inflate
  the denominator of `Booking Rate`. Planned fix: session-based dedup
  on the frontend tracker (Sprint 7).
