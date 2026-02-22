import { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, View, Compass } from 'lucide-react';
import MatterportEmbed from './MatterportEmbed';

const VenueViewer3D = lazy(() => import('./VenueViewer3D'));

/**
 * VirtualTourModal — full-screen immersive 3D tour overlay.
 *
 * Two tabs:
 *  1. "Virtual Tour" — Matterport iframe (if matterport_id exists) or fallback
 *  2. "Floor Plan"   — interactive 3D table layout (VenueViewer3D)
 *
 * Follows DESIGN.md:
 *  - Glass overlay, no borders, tonal layering
 *  - Gradient CTA on active tab
 */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 260 },
  },
  exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2 } },
};

const TABS = [
  { id: 'tour', label: 'Virtual Tour', icon: Compass },
  { id: 'floor', label: 'Floor Plan', icon: View },
];

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-on-surface-variant bg-surface-container/80">
      <div className="w-12 h-12 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
      <p className="text-xs uppercase tracking-widest font-bold">Loading 3D scene…</p>
    </div>
  );
}

export default function VirtualTourModal({
  open,
  onClose,
  venue = {},
  tables = [],
  sceneConfig = {},
  selectedTableId,
  unavailableTableIds = [],
  onTableSelect,
}) {
  const [tab, setTab] = useState('tour');
  const hasMatterport = Boolean(venue.matterport_id);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-on-surface/50 backdrop-blur-glass cursor-default"
          />

          <motion.div
            className="relative w-full max-w-7xl h-[90vh] bg-surface-container-lowest/95 backdrop-blur-glass rounded-3xl overflow-hidden flex flex-col shadow-ambient"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    3D Experience
                  </p>
                  <h2 className="text-lg font-extrabold tracking-tightest text-on-surface">
                    {venue.name || 'Venue'}
                  </h2>
                </div>
                <div className="flex items-center bg-surface-container-high p-1 rounded-xl ml-4">
                  {TABS.map((t) => {
                    const active = tab === t.id;
                    const Icon = t.icon;
                    return (
                      <motion.button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        whileTap={{ scale: 0.96 }}
                        className={[
                          'flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all',
                          active
                            ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient'
                            : 'text-on-surface-variant hover:text-primary',
                        ].join(' ')}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.92 }}
                whileHover={{ rotate: 90 }}
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {tab === 'tour' ? (
                  <motion.div
                    key="tour"
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {hasMatterport ? (
                      <MatterportEmbed
                        matterportId={venue.matterport_id}
                        venueName={venue.name}
                        className="w-full h-full"
                      />
                    ) : (
                      <Suspense fallback={<LoadingSpinner />}>
                        <VenueViewer3D
                          tables={tables}
                          sceneConfig={sceneConfig}
                          selectedTableId={selectedTableId}
                          unavailableTableIds={unavailableTableIds}
                          onTableSelect={onTableSelect}
                          venueName={venue.name || ''}
                          className="w-full h-full rounded-none"
                        />
                      </Suspense>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="floor"
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Suspense fallback={<LoadingSpinner />}>
                      <VenueViewer3D
                        tables={tables}
                        sceneConfig={sceneConfig}
                        selectedTableId={selectedTableId}
                        unavailableTableIds={unavailableTableIds}
                        onTableSelect={onTableSelect}
                        className="w-full h-full rounded-none"
                      />
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
