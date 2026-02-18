import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, CalendarDays, User, Sparkles } from 'lucide-react';

/**
 * BottomNav — mobile-only fixed bottom navigation bar.
 *
 * Visible only below `md` breakpoint. Provides thumb-friendly access to
 * the 5 core destinations. Active item shows a gradient pill + label.
 *
 * Follows DESIGN.md:
 *  - Glass-morphism: `bg-surface-container-lowest/80 backdrop-blur-glass`
 *  - No 1px solid border-t — uses subtle shadow-ambient instead
 *  - Active state: primary gradient pill
 *  - Safe area padding for notched phones (pb-safe)
 */

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/venues', icon: Search, label: 'Explore', end: false },
  { to: '/my-bookings', icon: CalendarDays, label: 'Bookings', end: false },
  { to: '/assistant', icon: Sparkles, label: 'AI', end: false },
  { to: '/profile', icon: User, label: 'Profile', end: false },
];

export default function BottomNav({ user }) {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/85 backdrop-blur-glass shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          // Profile redirects to login if not authenticated
          const href = item.to === '/profile' && !user ? '/login' : item.to;
          const profileLabel = item.to === '/profile' && !user ? 'Sign In' : item.label;

          return (
            <NavLink
              key={item.to}
              to={href}
              end={item.end}
              className="relative flex flex-col items-center gap-0.5 min-w-[3.5rem] py-1"
            >
              {({ isActive }) => (
                <>
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavPill"
                      className="absolute -top-0.5 w-12 h-8 rounded-full bg-gradient-to-r from-primary/15 to-primary-container/15"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`relative h-5 w-5 transition-colors ${
                      isActive ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`relative text-[10px] font-bold transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {profileLabel}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
