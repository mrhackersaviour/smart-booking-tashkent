import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X, XCircle } from 'lucide-react';

/**
 * Toast notification system.
 *
 * Usage:
 *   1. Wrap app with <ToastProvider>
 *   2. const toast = useToast();
 *   3. toast.success('Booking confirmed!');
 *      toast.error('Something went wrong');
 *      toast.info('Checking availability...');
 *      toast.warning('Only 2 tables left');
 *
 * Follows DESIGN.md:
 *  - Glass-morphism background
 *  - No 1px borders — tonal layering
 *  - Primary gradient on success accent
 */

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-emerald-500/10 text-emerald-700',
  error: 'bg-error/10 text-error',
  warning: 'bg-amber-500/10 text-amber-700',
  info: 'bg-primary/10 text-primary',
};

const ICON_STYLES = {
  success: 'text-emerald-500',
  error: 'text-error',
  warning: 'text-amber-500',
  info: 'text-primary',
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast('success', msg, dur),
    error: (msg, dur) => addToast('error', msg, dur ?? 6000),
    warning: (msg, dur) => addToast('warning', msg, dur),
    info: (msg, dur) => addToast('info', msg, dur),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container — fixed top-right */}
      <div className="fixed top-20 right-4 z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="pointer-events-auto"
              >
                <div className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-container-lowest/95 backdrop-blur-glass shadow-ambient ${STYLES[t.type]}`}>
                  <div className={`shrink-0 mt-0.5 ${ICON_STYLES[t.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="flex-1 text-sm font-medium text-on-surface">{t.message}</p>
                  <button
                    type="button"
                    onClick={() => removeToast(t.id)}
                    className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
