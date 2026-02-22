import { useState } from 'react';
import { MapPin, Plus, Minus, Locate, Utensils, Coffee, Dumbbell, Car, Scissors, Building2 } from 'lucide-react';

/**
 * VenueMapPanel — right-side map column for the discovery page.
 *
 * No real map provider is wired yet — this is a tonal placeholder built from
 * a CSS grid texture and absolutely-positioned venue pins. When a real map
 * (Mapbox / Leaflet / Google) is added, replace the placeholder layer while
 * keeping the same prop shape.
 *
 * Follows DESIGN.md:
 *  - Sits on `bg-surface-container` (Layer 2-3 ground).
 *  - No 1px solid borders. Map controls use `shadow-ambient` floating cards.
 *  - Pins are colored using primary + status palette tones, never #000.
 *
 * @param {object} props
 * @param {Array<{id, name, type, lat?, lng?}>} [props.venues]
 * @param {(venue:object) => void} [props.onVenueClick]
 */

const TYPE_PIN_COLORS = {
  restaurant: { bg: 'bg-primary', icon: Utensils },
  cafe: { bg: 'bg-amber-500', icon: Coffee },
  fitness: { bg: 'bg-indigo-600', icon: Dumbbell },
  carwash: { bg: 'bg-emerald-600', icon: Car },
  barbershop: { bg: 'bg-tertiary', icon: Scissors },
  stadium: { bg: 'bg-rose-500', icon: Building2 },
};

// Deterministic pseudo-positions for placeholder mode (until real coordinates).
function pseudoPosition(id, idx) {
  const seed = String(id || idx).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const top = 15 + ((seed * 7) % 70);
  const left = 12 + ((seed * 13) % 76);
  return { top: `${top}%`, left: `${left}%` };
}

export default function VenueMapPanel({ venues = [], onVenueClick }) {
  const [zoom, setZoom] = useState(1);

  return (
    <section className="relative w-full h-full bg-surface-container overflow-hidden">
      {/* Tonal grid texture — stands in for the map tiles */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(116,118,134,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(116,118,134,0.08) 1px, transparent 1px)',
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
        }}
      />

      {/* Soft "river / road" sweeps */}
      <div className="absolute -top-20 -left-20 w-[60%] h-[40%] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-secondary-container/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Pins */}
      <div className="absolute inset-0">
        {venues.slice(0, 12).map((v, idx) => {
          const tone = TYPE_PIN_COLORS[v.type] || TYPE_PIN_COLORS.restaurant;
          const PinIcon = tone.icon;
          const pos = pseudoPosition(v.id, idx);
          return (
            <button
              key={v.id || idx}
              type="button"
              onClick={() => onVenueClick?.(v)}
              style={pos}
              className="absolute -translate-x-1/2 -translate-y-full group cursor-pointer focus:outline-none"
              aria-label={v.name}
            >
              <div
                className={`${tone.bg} text-white w-10 h-10 rounded-full rounded-bl-none rotate-45 flex items-center justify-center shadow-ambient transition-transform group-hover:scale-110 group-focus:scale-110`}
              >
                <PinIcon className="h-4 w-4 -rotate-45" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-on-secondary-fixed text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none">
                {v.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {venues.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant">
          <MapPin className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">No venues to display on map.</p>
        </div>
      )}

      {/* Map controls — floating ambient cards, no border */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <MapControl label="Zoom in" onClick={() => setZoom((z) => Math.min(z + 0.25, 2))}>
          <Plus className="h-4 w-4" />
        </MapControl>
        <MapControl label="Zoom out" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}>
          <Minus className="h-4 w-4" />
        </MapControl>
        <MapControl label="My location" onClick={() => setZoom(1)} className="mt-3">
          <Locate className="h-4 w-4" />
        </MapControl>
      </div>

      {/* Bottom-left brand mark */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-surface-container-lowest/80 backdrop-blur-glass rounded-lg shadow-ambient">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          Tashkent · Map preview
        </p>
      </div>
    </section>
  );
}

function MapControl({ children, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`w-10 h-10 bg-surface-container-lowest text-on-surface rounded-lg shadow-ambient flex items-center justify-center hover:bg-surface-container transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
