import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, MapPin } from 'lucide-react';
import { Button, Avatar } from '../ui';

/**
 * Navbar — top navigation for "The Kinetic Curator".
 *
 * Follows DESIGN.md:
 *  - Glassmorphism: `bg-surface-container-lowest/70 backdrop-blur-glass`.
 *  - No 1px solid borders. Subtle ambient shadow only.
 *  - Primary CTA uses gradient (Button variant="primary").
 *
 * @param {object} props
 * @param {object|null} [props.user]
 * @param {() => void} [props.onLogout]
 * @param {Array<{to:string,label:string}>} [props.links]
 */
const DEFAULT_LINKS = [
  { to: '/venues', label: 'Explore' },
  { to: '/venues?type=restaurant', label: 'Venues' },
  { to: '/subscriptions', label: 'For Partners' },
  { to: '/help', label: 'Help' },
];

export default function Navbar({ user, onLogout, links = DEFAULT_LINKS }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
          <div className="hidden md:flex items-center gap-3">
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

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden h-10 w-10 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-surface-container-lowest/95 backdrop-blur-glass px-6 py-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-3">
            {user ? (
              <Button fullWidth variant="secondary" onClick={() => { setOpen(false); onLogout?.(); }}>
                Sign Out
              </Button>
            ) : (
              <Button fullWidth onClick={() => { setOpen(false); handleSignIn(); }}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
