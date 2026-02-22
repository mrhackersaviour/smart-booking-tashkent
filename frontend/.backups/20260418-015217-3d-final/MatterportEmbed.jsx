import { useState } from 'react';
import { Loader2, Maximize2, Volume2, VolumeX } from 'lucide-react';

/**
 * MatterportEmbed — iframe wrapper for Matterport 3D tours.
 *
 * Loads the Matterport showcase via iframe with proper parameters
 * for a seamless embedded experience.
 *
 * Follows DESIGN.md:
 *  - Loading state uses tonal surface + spinner (no borders)
 *  - Controls overlay: glass-morphism
 */

const DEFAULT_PARAMS = {
  hl: '1',        // highlight reel on start
  play: '1',      // auto-play
  qs: '1',        // quick start
  brand: '0',     // hide Matterport branding
  help: '0',      // hide help button
  dh: '0',        // hide dollhouse button initially
  gt: '0',        // hide guided tour
  hr: '0',        // hide highlight reel UI
  mls: '2',       // MLS compliance level
  mt: '0',        // hide model title
  pin: '0',       // hide pin drops
  portal: '0',    // hide portals
  f: '0',         // hide floor selector initially
  title: '0',     // hide title
  tourcta: '0',   // hide tour CTA
  vr: '0',        // hide VR button
};

function buildSrc(matterportId) {
  const params = new URLSearchParams(DEFAULT_PARAMS);
  // Determine correct base URL
  if (matterportId.startsWith('http')) {
    // Full URL passed — extract and rebuild
    try {
      const url = new URL(matterportId);
      const m = url.searchParams.get('m');
      if (m) {
        params.set('m', m);
        return `https://my.matterport.com/show/?${params}`;
      }
    } catch { /* fall through */ }
    return matterportId;
  }
  params.set('m', matterportId);
  return `https://my.matterport.com/show/?${params}`;
}

export default function MatterportEmbed({
  matterportId,
  venueName = 'Virtual Tour',
  className = '',
}) {
  const [loaded, setLoaded] = useState(false);

  if (!matterportId) return null;

  const src = buildSrc(matterportId);

  return (
    <div className={`relative w-full h-full bg-on-secondary-fixed ${className}`}>
      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs uppercase tracking-widest font-bold text-white/70">
            Loading 3D tour…
          </p>
        </div>
      )}

      <iframe
        src={src}
        title={`${venueName} — 3D Virtual Tour`}
        className="w-full h-full border-0"
        allow="fullscreen; xr-spatial-tracking"
        allowFullScreen
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />

      {/* Venue badge */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-surface-container-lowest/70 backdrop-blur-glass rounded-xl shadow-ambient pointer-events-none">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">3D Tour</p>
        <p className="text-sm font-bold text-on-surface">{venueName}</p>
      </div>
    </div>
  );
}
