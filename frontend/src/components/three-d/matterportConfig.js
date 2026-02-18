/**
 * Matterport 3D tour configuration.
 *
 * Maps venue types and names to real Matterport showcase IDs.
 * This runs entirely on the frontend — no backend/DB dependency.
 *
 * To add a new tour:
 *  1. Get the Matterport showcase ID (the `m=` param from the URL)
 *  2. Add it to VENUE_TOURS below
 *
 * Priority: exact name match → type match → null (falls back to 3D floor plan)
 */

// Exact venue name → Matterport ID
const NAME_TOURS = {
  'plov center yunusabad': '3gSxqJWRfG3',
  'the silk road lounge': 'wStbQsn2Tab',
  'afsona restaurant': 'oCaM5CSX6hT',
};

// Venue type → array of Matterport IDs (rotated by venue name hash)
const TYPE_TOURS = {
  restaurant: ['3gSxqJWRfG3', 'oCaM5CSX6hT'],
  cafe: ['wStbQsn2Tab'],
};

function hashName(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Get Matterport tour ID for a venue.
 * @param {object} venue - { name, type, three_d_model_url }
 * @returns {string|null} Matterport showcase ID or null
 */
export function getMatterportId(venue) {
  if (!venue) return null;

  // 1. DB field (if backend provides it)
  if (venue.three_d_model_url) return venue.three_d_model_url;

  // 2. Exact name match
  const key = (venue.name || '').toLowerCase().trim();
  if (NAME_TOURS[key]) return NAME_TOURS[key];

  // 3. Type-based rotation
  const typeTours = TYPE_TOURS[(venue.type || '').toLowerCase()];
  if (typeTours && typeTours.length > 0) {
    return typeTours[hashName(venue.name) % typeTours.length];
  }

  return null;
}
