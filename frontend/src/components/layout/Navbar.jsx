import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion';
import { Search, Sun, Moon, Command } from 'lucide-react';
import { Button, Avatar } from '../ui';
import CommandPalette from '../ui/CommandPalette';
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
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { scrollY } = useScroll();

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious();
    // Hide when scrolling down past 100px, show when scrolling up
    if (latest > 100 && latest > prev) setHidden(true);
    else setHidden(false);
  });

  const handleSignIn = () => navigate('/login');

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/70 backdrop-blur-glass shadow-ambient"
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
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
              onClick={() => setSearchOpen(true)}
              className="h-10 flex items-center gap-2 px-3 text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs text-outline hidden lg:inline">Search...</span>
              <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-bold text-outline">
                <Command className="h-3 w-3" />K
              </kbd>
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
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.nav>
  );
}
