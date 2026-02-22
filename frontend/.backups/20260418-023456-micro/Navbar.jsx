import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sun, Moon } from 'lucide-react';
import { Button, Avatar } from '../ui';
import useTheme from '../../hooks/useTheme';

const DEFAULT_LINKS = [
  { to: '/venues', label: 'Explore' },
  { to: '/venues?type=restaurant', label: 'Venues' },
  { to: '/subscriptions', label: 'For Partners' },
  { to: '/help', label: 'Help' },
];

export default function Navbar({ user, onLogout, links = DEFAULT_LINKS }) {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const handleSignIn = () => navigate('/login');

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/70 backdrop-blur-glass shadow-ambient">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Curator" className="h-9 w-9 rounded-lg group-hover:scale-105 transition-transform" />
            <span className="text-xl font-extrabold tracking-tightest text-on-surface">
              Curator
            </span>
          </Link>

          {/* Center: Nav links */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  [
                    'text-sm tracking-wide transition-colors',
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant font-medium hover:text-primary',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <motion.button
              type="button"
              onClick={toggle}
              whileTap={{ scale: 0.85, rotate: 180 }}
              className="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? 'moon' : 'sun'}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            <button
              type="button"
              onClick={() => navigate('/venues')}
              className="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {user ? (
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar name={user.full_name} size="sm" />
              </Link>
            ) : (
              <Button size="sm" onClick={handleSignIn}>
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile: theme toggle + avatar */}
          <div className="md:hidden flex items-center gap-2">
            <motion.button
              type="button"
              onClick={toggle}
              whileTap={{ scale: 0.85, rotate: 180 }}
              className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </motion.button>
            {user ? (
              <Link to="/profile" className="hover:opacity-80 transition-opacity">
                <Avatar name={user.full_name} size="sm" />
              </Link>
            ) : (
              <Button size="sm" onClick={handleSignIn}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
