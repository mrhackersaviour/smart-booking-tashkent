import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ArrowRight, MapPin, Star, Clock,
  Utensils, Coffee, Building2, Dumbbell, Scissors, Car,
  Home, CalendarDays, Settings, HelpCircle, Sparkles, Command,
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * CommandPalette — global Cmd+K / Ctrl+K search modal.
 *
 * Features:
 *  - Debounced venue search (300ms)
 *  - Quick navigation links (pages)
 *  - Recent searches (localStorage)
 *  - Keyboard navigation (arrow keys + enter)
 *  - Venue type icons
 *
 * Follows DESIGN.md:
 *  - Glass-morphism overlay
 *  - No 1px borders — tonal layering
 *  - Primary gradient on selected item
 */

const TYPE_ICONS = {
  restaurant: Utensils, cafe: Coffee, stadium: Building2,
  fitness: Dumbbell, barbershop: Scissors, carwash: Car,
};

const QUICK_LINKS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Explore Venues', to: '/venues', icon: Search },
  { label: 'My Bookings', to: '/my-bookings', icon: CalendarDays },
  { label: 'AI Assistant', to: '/assistant', icon: Sparkles },
  { label: 'Pricing & Plans', to: '/subscriptions', icon: Star },
  { label: 'Help Center', to: '/help', icon: HelpCircle },
  { label: 'Profile Settings', to: '/profile', icon: Settings },
];

const STORAGE_KEY = 'curator_recent_searches';
const MAX_RECENT = 5;

function getRecent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveRecent(term) {
  const list = getRecent().filter((t) => t !== term);
  list.unshift(term);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent] = useState(getRecent);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api.getVenues({ search: query.trim(), limit: 6 })
        .then((data) => setResults(data.venues || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Build item list for keyboard nav
  const items = [];
  if (query.trim()) {
    results.forEach((v) => items.push({ type: 'venue', data: v }));
    items.push({ type: 'action', label: `Search "${query}" in venues`, to: `/venues?search=${encodeURIComponent(query)}` });
  } else {
    recent.forEach((term) => items.push({ type: 'recent', label: term }));
    QUICK_LINKS.forEach((link) => items.push({ type: 'link', ...link }));
  }

  const go = useCallback((item) => {
    onClose();
    if (item.type === 'venue') {
      saveRecent(item.data.name);
      navigate(`/venues/${item.data.id}`);
    } else if (item.type === 'action') {
      saveRecent(query);
      navigate(item.to);
    } else if (item.type === 'recent') {
      navigate(`/venues?search=${encodeURIComponent(item.label)}`);
    } else if (item.type === 'link') {
      navigate(item.to);
    }
  }, [navigate, onClose, query]);

  // Keyboard
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && items[activeIdx]) { e.preventDefault(); go(items[activeIdx]); }
    else if (e.key === 'Escape') { onClose(); }
  };

  useEffect(() => { setActiveIdx(0); }, [query]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button type="button" onClick={onClose} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm cursor-default" aria-label="Close" />

          <motion.div
            className="relative w-full max-w-xl bg-surface-container-lowest/95 backdrop-blur-glass rounded-2xl shadow-ambient overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onKeyDown={onKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4">
              <Search className="h-5 w-5 text-on-surface-variant shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search venues, pages, actions..."
                className="flex-1 bg-transparent border-none text-on-surface text-base font-medium placeholder:text-outline focus:outline-none focus:ring-0"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-on-surface-variant hover:text-on-surface">
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-[10px] font-bold text-on-surface-variant">
                ESC
              </kbd>
            </div>

            {/* Divider — tonal, not border */}
            <div className="h-px bg-surface-container" />

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {loading && (
                <div className="px-5 py-6 text-center">
                  <div className="w-6 h-6 mx-auto rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              )}

              {!loading && items.length === 0 && query.trim() && (
                <p className="px-5 py-6 text-center text-on-surface-variant text-sm">No results for "{query}"</p>
              )}

              {!loading && !query.trim() && recent.length > 0 && (
                <div className="px-4 pt-2 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline px-1 mb-2">Recent</p>
                </div>
              )}

              {!loading && !query.trim() && recent.length === 0 && (
                <div className="px-4 pt-2 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline px-1 mb-2">Quick Links</p>
                </div>
              )}

              {!loading && items.map((item, i) => {
                const isActive = i === activeIdx;

                if (item.type === 'venue') {
                  const Icon = TYPE_ICONS[item.data.type] || MapPin;
                  return (
                    <button
                      key={`v-${item.data.id}`}
                      type="button"
                      onClick={() => go(item)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${isActive ? 'bg-primary/8' : 'hover:bg-surface-container-low'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-gradient-to-br from-primary to-primary-container text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-on-surface truncate">{item.data.name}</p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {item.data.district || 'Tashkent'}
                          {item.data.rating && <><Star className="h-3 w-3 text-amber-500 fill-amber-500 ml-2" /> {item.data.rating}</>}
                        </p>
                      </div>
                      {isActive && <ArrowRight className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                }

                if (item.type === 'action') {
                  return (
                    <button
                      key="action"
                      type="button"
                      onClick={() => go(item)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${isActive ? 'bg-primary/8' : 'hover:bg-surface-container-low'}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                        <Search className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-on-surface-variant">{item.label}</span>
                      {isActive && <ArrowRight className="h-4 w-4 text-primary ml-auto shrink-0" />}
                    </button>
                  );
                }

                if (item.type === 'recent') {
                  return (
                    <button
                      key={`r-${item.label}`}
                      type="button"
                      onClick={() => go(item)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${isActive ? 'bg-primary/8' : 'hover:bg-surface-container-low'}`}
                    >
                      <Clock className="h-4 w-4 text-outline shrink-0" />
                      <span className="text-sm text-on-surface-variant">{item.label}</span>
                    </button>
                  );
                }

                if (item.type === 'link') {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => go(item)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${isActive ? 'bg-primary/8' : 'hover:bg-surface-container-low'}`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <span className={`text-sm ${isActive ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{item.label}</span>
                      {isActive && <ArrowRight className="h-4 w-4 text-primary ml-auto shrink-0" />}
                    </button>
                  );
                }

                return null;
              })}
            </div>

            {/* Footer hint */}
            <div className="h-px bg-surface-container" />
            <div className="px-5 py-2.5 flex items-center justify-between text-[10px] text-outline font-medium">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface-container font-bold">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface-container font-bold">↵</kbd> select</span>
              </div>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface-container font-bold">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
