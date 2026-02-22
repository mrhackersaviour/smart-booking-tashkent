import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, MapPin, Phone, Clock, Wifi, Car, Music, Trees, Users,
  CalendarDays, Plus, Minus, ChevronRight, Map as MapIcon, Heart, Share2,
  View, ZoomIn, Maximize, BadgeCheck, Sparkles,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Button, Card, Avatar, Badge } from '../components/ui';
import { api } from '../services/api';
import {
  getVenueImage, VENUE_IMAGE_MAP, hashCode, DEFAULT_FALLBACK_IMAGE,
} from '../components/venues/VenueCard';
import { priceTier } from '../utils/price';
import VirtualTourModal from '../components/three-d/VirtualTourModal';
import VenueViewer3D from '../components/three-d/VenueViewer3D';
import { getMatterportId } from '../components/three-d/matterportConfig';

/**
 * VenueDetails — premium venue detail page.
 *
 * Reference: design-reference/venue_details/
 *
 * Layout (per DESIGN.md):
 *  - Hero gallery: full-bleed image carousel on `bg-on-secondary-fixed` ground
 *    with a "View in 3D" glassmorphic CTA centered.
 *  - Two-column body: left = Overview / Tabs / Amenities / 3D placeholder /
 *    Reviews; right = sticky Booking widget + Map hint card.
 *  - No 1px solid borders. No <hr>. Tabs use a 2px primary underline only
 *    on the active item, never a divider line under the row.
 *  - All interactive surfaces use the design-system Button, Card, Avatar,
 *    Badge primitives.
 *  - Material Symbols → lucide-react.
 *
 * Business logic preserved:
 *  - api.getVenue(id) → { venue, tables, recentReviews }
 *  - Gallery built from venue.images + type pool fallback
 *  - Tab navigation state
 *  - Guests/slot booking widget state
 *  - Total price = pricePerGuest * guests
 *  - Book CTA navigates to /venues/:id/book (auth-gated)
 */

const AMENITY_ICONS = {
  wifi: Wifi,
  'free wifi': Wifi,
  'high-speed wifi': Wifi,
  parking: Car,
  'valet parking': Car,
  'live music': Music,
  music: Music,
  'outdoor seating': Trees,
  terrace: Trees,
  'group friendly': Users,
};
function getAmenityIcon(name) {
  const key = String(name || '').toLowerCase();
  for (const k of Object.keys(AMENITY_ICONS)) {
    if (key.includes(k)) return AMENITY_ICONS[k];
  }
  return Sparkles;
}

const TIME_SLOTS = ['6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];

function buildGallery(venue) {
  const result = [];
  if (venue?.images) {
    try {
      const parsed = typeof venue.images === 'string' ? JSON.parse(venue.images) : venue.images;
      if (Array.isArray(parsed)) parsed.filter(Boolean).forEach((src) => result.push(src));
    } catch { /* ignore */ }
  }
  const pool = VENUE_IMAGE_MAP[(venue?.type || '').toLowerCase()] || [];
  if (pool.length > 0) {
    const start = hashCode(String(venue?.id || venue?.name || '')) % pool.length;
    const ordered = [...pool.slice(start), ...pool.slice(0, start)];
    ordered.forEach((src) => { if (!result.includes(src)) result.push(src); });
  }
  if (result.length === 0) result.push(DEFAULT_FALLBACK_IMAGE);
  return result.slice(0, 5);
}

function formatHours(hours) {
  if (!hours || hours.event_based) return [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days
    .map((d) => {
      const h = hours[d];
      if (!h) return null;
      return {
        day: d.charAt(0).toUpperCase() + d.slice(1),
        value: h.open === 'closed' ? 'Closed' : `${h.open} - ${h.close}`,
        weekend: d === 'saturday' || d === 'sunday',
      };
    })
    .filter(Boolean);
}

export default function VenueDetails({ user }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [imgError, setImgError] = useState({});
  const [guests, setGuests] = useState(2);
  const [slot, setSlot] = useState('7:00 PM');
  const [tab, setTab] = useState('overview');
  const [showMap, setShowMap] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getVenue(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const venue = data?.venue;
  const tables = data?.tables || [];
  const recentReviews = data?.recentReviews || [];

  const gallery = useMemo(() => (venue ? buildGallery(venue) : []), [venue]);
  const amenities = useMemo(() => {
    if (!venue?.amenities) return [];
    try {
      return typeof venue.amenities === 'string' ? JSON.parse(venue.amenities) : venue.amenities;
    } catch { return []; }
  }, [venue]);
  const hours = useMemo(() => formatHours(venue?.opening_hours), [venue]);

  if (loading) return <DetailsSkeleton />;

  if (error || !venue) {
    return <div className="text-center py-16 text-error">{error || 'Venue not found'}</div>;
  }

  const heroIdx = imgError[activeImg]
    ? gallery.findIndex((_, i) => !imgError[i])
    : activeImg;
  const heroImg = heroIdx >= 0 ? gallery[heroIdx] : null;

  const priceRange = venue.price_range || 1;
  const tier = priceTier(priceRange);
  const basePrice = priceRange * 30000;
  const prices = tables.map((t) => t.price_per_hour || (basePrice * (t.price_multiplier || 1))).filter(Boolean);
  const pricePerGuest = prices.length > 0 ? Math.min(...prices) : basePrice;
  const total = pricePerGuest * guests;
  const availableCount = tables.filter((t) => t.is_available).length;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface">
      {/* ============================================================
          1. HERO GALLERY
          ============================================================ */}
      <motion.section
        className="relative w-full h-[480px] md:h-[600px] overflow-hidden bg-on-secondary-fixed group"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {heroImg ? (
          <motion.img
            key={heroIdx}
            src={heroImg}
            alt={venue.name}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="w-full h-full object-cover"
            onError={() => setImgError((p) => ({ ...p, [heroIdx]: true }))}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-on-secondary-fixed via-primary to-primary-container flex items-center justify-center">
            <span className="text-9xl font-serif text-white/20">{venue.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top actions */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
          <GlassIconButton aria-label="Save"><Heart className="h-5 w-5" /></GlassIconButton>
          <GlassIconButton aria-label="Share"><Share2 className="h-5 w-5" /></GlassIconButton>
        </div>

        {/* Centered "View in 3D" CTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.button
            type="button"
            onClick={() => setShow3D(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="pointer-events-auto bg-surface-container-lowest/20 backdrop-blur-glass text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-ambient hover:bg-surface-container-lowest hover:text-on-surface transition-all duration-500"
          >
            <View className="h-5 w-5" />
            <span className="font-bold tracking-widest uppercase text-xs">View in 3D</span>
          </motion.button>
        </div>

        {/* Gallery indicators */}
        {gallery.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {gallery.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImg(i)}
                aria-label={`Image ${i + 1}`}
                className={`h-1 rounded-full transition-all ${i === heroIdx ? 'w-12 bg-white' : 'w-12 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* ============================================================
          2. MAIN CONTENT
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 flex flex-col lg:flex-row gap-12">
        {/* ===== LEFT COLUMN ===== */}
        <div className="flex-1 min-w-0 space-y-12">
          {/* Header */}
          <motion.header
            className="space-y-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="primary">{venue.type}</Badge>
              {venue.cuisine_type && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {venue.cuisine_type}
                </span>
              )}
              <div className="flex items-center text-primary font-bold gap-1">
                <Star className="h-4 w-4 fill-primary" />
                <span>{venue.rating || '—'}</span>
                <span className="text-on-surface-variant font-normal text-sm">
                  ({venue.total_reviews || 0} reviews)
                </span>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-serif font-bold text-on-surface leading-tight">
              {venue.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-on-surface-variant font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{venue.address}</span>
              </div>
              {venue.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{venue.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container rounded-full">
                <span className="text-primary text-sm tracking-tighter">{tier.dots}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  {tier.label}
                </span>
              </div>
            </div>
          </motion.header>

          {/* Tabs — active item gets a 2px underline (NOT a divider line under the row) */}
          <nav className="flex gap-10 text-sm font-bold tracking-wider uppercase overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'reviews', label: `Reviews (${recentReviews.length})` },
              { id: 'hours', label: 'Hours' },
              { id: 'location', label: 'Location' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  'pb-4 whitespace-nowrap border-b-2 transition-colors',
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Overview */}
          {tab === 'overview' && (
            <section className="space-y-10">
              <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant font-light">
                {venue.description || 'Experience an unforgettable visit at this venue.'}
              </p>

              {amenities.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {amenities.slice(0, 8).map((a) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <Card key={a} tier="low" padding="md" className="flex flex-col items-center text-center gap-3">
                        <Icon className="h-7 w-7 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                          {a}
                        </span>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Interactive 3D Floor Plan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-on-surface">Interactive 3D View</h3>
                  <motion.button
                    type="button"
                    onClick={() => setShow3D(true)}
                    whileTap={{ scale: 0.96 }}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <Maximize className="h-3.5 w-3.5" /> Fullscreen
                  </motion.button>
                </div>
                <VenueViewer3D
                  tables={tables}
                  sceneConfig={venue.scene_config || {}}
                  selectedTableId={selectedTable?.id}
                  unavailableTableIds={tables.filter((t) => !t.is_available).map((t) => t.id)}
                  onTableSelect={setSelectedTable}
                  venueName={venue.name}
                  className="w-full aspect-video"
                  compact
                />
                {selectedTable && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-ambient"
                  >
                    <div>
                      <p className="font-bold text-on-surface">
                        {selectedTable.label || `Table #${selectedTable.table_number}`}
                        {selectedTable.is_vip && <Badge variant="primary" className="ml-2">VIP</Badge>}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {selectedTable.capacity} seats · {((selectedTable.price_per_hour || basePrice * (selectedTable.price_multiplier || 1))).toLocaleString()} UZS
                      </p>
                    </div>
                    <Button size="sm" onClick={() => {}}>Select</Button>
                  </motion.div>
                )}
              </div>

              {/* Gallery thumbnails */}
              {gallery.length > 1 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-on-surface">Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {gallery.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImg(i)}
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden ring-2 transition-all ${
                          i === heroIdx ? 'ring-primary' : 'ring-transparent hover:ring-outline-variant'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`${venue.name} ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Hours */}
          {tab === 'hours' && (
            <section>
              <Card padding="lg">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <Clock className="h-5 w-5 text-primary" /> Operating Hours
                </h3>
                {hours.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">Hours not available — contact venue.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                    {hours.map((h) => (
                      <div key={h.day} className="flex justify-between items-center py-2">
                        <span className={`font-medium ${h.weekend ? 'text-primary' : 'text-on-surface'}`}>
                          {h.day}
                        </span>
                        <span className="text-on-surface-variant">{h.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* Reviews */}
          {tab === 'reviews' && (
            <section className="space-y-6">
              <div className="flex justify-between items-end">
                <h3 className="text-2xl font-bold tracking-tightest text-on-surface">Verified Reviews</h3>
                <button className="text-primary font-bold text-sm uppercase tracking-widest hover:underline underline-offset-4 transition-all">
                  Write a Review
                </button>
              </div>
              {recentReviews.length === 0 ? (
                <p className="text-on-surface-variant">No reviews yet. Be the first to share your experience.</p>
              ) : (
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <Card key={review.id} padding="lg">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <Avatar name={review.full_name} size="md" />
                          <div>
                            <h5 className="font-bold text-on-surface flex items-center gap-1.5">
                              {review.full_name}
                              <BadgeCheck className="h-4 w-4 text-primary" />
                            </h5>
                            <p className="text-xs text-on-surface-variant">
                              {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-outline-variant'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed">{review.comment}</p>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Location */}
          {tab === 'location' && (
            <Card padding="lg">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" /> Find us
              </h3>
              <p className="text-on-surface-variant mb-2">{venue.address}</p>
              {venue.district && (
                <p className="text-sm text-outline">District: {venue.district}</p>
              )}
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-primary-container text-white text-sm font-bold shadow-ambient hover:opacity-95 transition-all"
              >
                <MapIcon className="h-4 w-4" /> Show on the map
              </button>
            </Card>
          )}
        </div>

        {/* ===== RIGHT COLUMN — STICKY BOOKING WIDGET ===== */}
        <motion.aside
          className="w-full lg:w-[400px] shrink-0"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="sticky top-24 space-y-6">
            <Card padding="lg" className="rounded-[2rem] shadow-ambient">
              <div className="flex justify-between items-center mb-7">
                <div>
                  <span className="text-3xl font-bold text-on-surface">{pricePerGuest.toLocaleString()}</span>
                  <span className="text-on-surface-variant text-sm font-medium"> UZS / guest</span>
                </div>
                <Badge variant="primary">{availableCount} avail</Badge>
              </div>

              {/* Date */}
              <FieldGroup label="Select Date">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                  <span className="font-medium text-on-surface">
                    {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
              </FieldGroup>

              {/* Guests stepper */}
              <FieldGroup label="Guests">
                <div className="flex items-center justify-between p-2 bg-surface-container-low rounded-xl">
                  <StepperButton onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Decrease">
                    <Minus className="h-4 w-4" />
                  </StepperButton>
                  <span className="font-bold text-lg text-on-surface">{guests}</span>
                  <StepperButton onClick={() => setGuests((g) => Math.min(20, g + 1))} aria-label="Increase">
                    <Plus className="h-4 w-4" />
                  </StepperButton>
                </div>
              </FieldGroup>

              {/* Time slots */}
              <FieldGroup label="Time Slot">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {TIME_SLOTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={[
                        'px-4 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all',
                        slot === s
                          ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container',
                      ].join(' ')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </FieldGroup>

              {/* CTA */}
              <div className="pt-2 space-y-3">
                {user ? (
                  <Link
                    to={`/venues/${id}/book`}
                    className="w-full py-5 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold text-base shadow-ambient hover:shadow-ambient flex justify-between items-center px-6 transition-all active:scale-[0.98]"
                  >
                    <span>Book Now</span>
                    <span>{total.toLocaleString()} UZS</span>
                  </Link>
                ) : (
                  <Button as="link" variant="primary" size="lg" fullWidth iconRight={ChevronRight}>
                    <Link to="/login" className="contents">Sign in to Book</Link>
                  </Button>
                )}
                <p className="text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
                  No payment required yet
                </p>
              </div>
            </Card>

            {/* Show on the map (Booking.com-style) */}
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="w-full group flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest hover:bg-surface-container transition-colors text-left"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <MapIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h6 className="font-bold text-sm text-on-surface">Show on the map</h6>
                <p className="text-xs text-on-surface-variant truncate">
                  {venue.district || venue.address}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-on-surface-variant" />
            </button>
          </div>
        </motion.aside>
      </div>

      {showMap && (
        <MapModal venue={venue} onClose={() => setShowMap(false)} />
      )}

      <VirtualTourModal
        open={show3D}
        onClose={() => setShow3D(false)}
        venue={{ ...venue, matterport_id: getMatterportId(venue) }}
        tables={tables}
        sceneConfig={venue.scene_config || {}}
        selectedTableId={selectedTable?.id}
        unavailableTableIds={tables.filter((t) => !t.is_available).map((t) => t.id)}
        onTableSelect={setSelectedTable}
      />
    </div>
  );
}

function MapModal({ venue, onClose }) {
  const lat = venue.latitude;
  const lng = venue.longitude;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  const delta = 0.005;
  const bbox = hasCoords
    ? `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
    : null;
  const src = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=69.20,41.28,69.30,41.34&layer=mapnik`;
  const fullLink = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(venue.address || venue.name)}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-secondary-fixed/60 backdrop-blur-glass p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-3xl shadow-ambient w-full max-w-5xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="min-w-0">
            <h3 className="font-bold text-on-surface truncate">{venue.name}</h3>
            <p className="text-xs text-on-surface-variant truncate">{venue.address}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
            aria-label="Close map"
          >
            ✕
          </button>
        </div>
        <iframe
          title={`Map of ${venue.name}`}
          src={src}
          className="w-full h-[70vh] block bg-surface-container"
          loading="lazy"
        />
        <div className="px-6 py-4 flex justify-end">
          <a
            href={fullLink}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-bold text-primary hover:opacity-80"
          >
            Open in larger map ↗
          </a>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function GlassIconButton({ children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className="w-10 h-10 rounded-full bg-surface-container-lowest/15 backdrop-blur-glass text-white hover:bg-surface-container-lowest hover:text-on-surface transition-all flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="space-y-2 mb-5 last:mb-0">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}

function StepperButton({ children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className="w-10 h-10 flex items-center justify-center bg-surface-container-lowest rounded-lg shadow-ambient text-primary hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white transition-all"
    >
      {children}
    </button>
  );
}

function DetailsSkeleton() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      <div className="w-full h-[480px] bg-surface-container animate-pulse" />
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-12 bg-surface-container rounded-lg w-2/3 animate-pulse" />
          <div className="h-4 bg-surface-container rounded w-1/2 animate-pulse" />
          <div className="h-32 bg-surface-container rounded-2xl animate-pulse" />
        </div>
        <div className="h-96 bg-surface-container rounded-[2rem] animate-pulse" />
      </div>
    </div>
  );
}
