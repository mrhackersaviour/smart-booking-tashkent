import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { X, MapPin, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import VenueMapPanel from './VenueMapPanel';

/**
 * VenueMapModal — lazy-loaded Google Map inside a responsive modal/drawer.
 *
 * - Desktop (≥md): centered modal (max-w-5xl), scale + fade enter.
 * - Mobile  (<md): full-screen drawer that slides up from the bottom.
 * - Google Maps JS SDK is loaded only when the modal opens (lazy).
 * - If VITE_GOOGLE_MAPS_API_KEY is missing, falls back to the tonal
 *   VenueMapPanel placeholder so the page never breaks.
 *
 * Follows DESIGN.md:
 *  - Glass surface (`bg-surface-container-lowest/70 backdrop-blur-glass`).
 *  - No 1px borders. Tonal layering.
 *  - Close button = ghost circular button on tonal layer.
 */

const TASHKENT_CENTER = { lat: 41.3111, lng: 69.2797 };

const containerStyle = { width: '100%', height: '100%' };

// Curator-friendly map style: muted tones, no POIs, soft contrast.
const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f5f4f2' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#747686' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f1efe9' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfe3e8' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e8eadf' }] },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const desktopVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 28, stiffness: 280 } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } },
};

const mobileVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', damping: 32, stiffness: 320 } },
  exit: { y: '100%', transition: { duration: 0.22 } },
};

function pickCenter(venues) {
  const withCoords = venues.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng));
  if (!withCoords.length) return TASHKENT_CENTER;
  const avgLat = withCoords.reduce((s, v) => s + v.lat, 0) / withCoords.length;
  const avgLng = withCoords.reduce((s, v) => s + v.lng, 0) / withCoords.length;
  return { lat: avgLat, lng: avgLng };
}

export default function VenueMapModal({ open, onClose, venues = [] }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasKey = Boolean(apiKey);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex md:items-center md:justify-center"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.22 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close map"
            onClick={onClose}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-glass cursor-default"
          />

          {/* Mobile drawer */}
          <motion.div
            className="md:hidden absolute inset-x-0 bottom-0 top-12 bg-surface-container-lowest rounded-t-3xl overflow-hidden flex flex-col"
            variants={mobileVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ModalHeader onClose={onClose} count={venues.length} />
            <div className="flex-1 relative">
              <MapBody hasKey={hasKey} apiKey={apiKey} venues={venues} />
            </div>
          </motion.div>

          {/* Desktop centered modal */}
          <motion.div
            className="hidden md:flex relative w-[92vw] max-w-5xl h-[82vh] bg-surface-container-lowest/95 backdrop-blur-glass rounded-3xl overflow-hidden flex-col shadow-ambient"
            variants={desktopVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ModalHeader onClose={onClose} count={venues.length} />
            <div className="flex-1 relative">
              <MapBody hasKey={hasKey} apiKey={apiKey} venues={venues} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ModalHeader({ onClose, count }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-surface-container-lowest">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Discover · Tashkent
        </p>
        <h2 className="text-xl font-extrabold tracking-tightest text-on-surface">
          Venues on Map <span className="text-on-surface-variant font-medium text-base">({count})</span>
        </h2>
      </div>
      <motion.button
        type="button"
        onClick={onClose}
        whileTap={{ scale: 0.92 }}
        whileHover={{ rotate: 90 }}
        className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
        aria-label="Close map"
      >
        <X className="h-5 w-5" />
      </motion.button>
    </div>
  );
}

function MapBody({ hasKey, apiKey, venues }) {
  if (!hasKey) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <div className="px-6 py-3 bg-amber-500/10 text-on-surface text-xs">
          <strong>Note:</strong> Google Maps API key topilmadi. Tonal placeholder ko'rsatilmoqda.
          <code className="ml-2 px-2 py-0.5 rounded bg-surface-container text-[10px]">
            VITE_GOOGLE_MAPS_API_KEY
          </code> ni <code className="px-1">.env</code> faylga qo'shing.
        </div>
        <div className="flex-1">
          <VenueMapPanel venues={venues} />
        </div>
      </div>
    );
  }
  return <GoogleMapBody apiKey={apiKey} venues={venues} />;
}

function GoogleMapBody({ apiKey, venues }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [active, setActive] = useState(null);
  const center = useMemo(() => pickCenter(venues), [venues]);
  const markerVenues = useMemo(
    () => venues.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng)),
    [venues]
  );

  const onLoad = useCallback((map) => {
    if (markerVenues.length > 1 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      markerVenues.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
      map.fitBounds(bounds, 60);
    }
  }, [markerVenues]);

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant text-sm">
        Xaritani yuklab bo'lmadi. API key yoki tarmoqni tekshiring.
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs uppercase tracking-widest font-bold">Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      onLoad={onLoad}
      options={{
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        backgroundColor: '#f5f4f2',
      }}
    >
      {markerVenues.map((v) => (
        <MarkerF
          key={v.id}
          position={{ lat: v.lat, lng: v.lng }}
          onClick={() => setActive(v)}
        />
      ))}
      {active && (
        <InfoWindowF
          position={{ lat: active.lat, lng: active.lng }}
          onCloseClick={() => setActive(null)}
        >
          <div className="min-w-[180px] p-1">
            <p className="font-bold text-sm text-on-surface mb-1">{active.name}</p>
            {active.rating && (
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                {active.rating}
              </p>
            )}
            {active.district && (
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3" /> {active.district}
              </p>
            )}
            <Link
              to={`/venues/${active.id}`}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Batafsil <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
