import { Link } from 'react-router-dom';
import { MapPin, Globe, Share2, AtSign } from 'lucide-react';

/**
 * Footer — site-wide footer for "The Kinetic Curator".
 *
 * Follows DESIGN.md "No-Line Rule":
 *  - No `<hr>` or `border-t` between sections.
 *  - Separation comes from a tonal shift: footer sits on `bg-surface-container-low`
 *    (Layer 1) while the page content above is on `bg-surface` (Layer 0).
 *  - Bottom legal row uses extra vertical whitespace + smaller `surface-container`
 *    tier instead of a divider line.
 *
 * @param {object} props
 * @param {Array<{title:string, links:Array<{to:string,label:string}>}>} [props.columns]
 */
const DEFAULT_COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/venues', label: 'Browse Venues' },
      { to: '/subscriptions', label: 'Pricing' },
      { to: '/loyalty', label: 'Loyalty Rewards' },
      { to: '/design-system', label: 'Design System' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '#', label: 'About Us' },
      { to: '#', label: 'Careers' },
      { to: '#', label: 'Press' },
      { to: '#', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '#', label: 'Privacy Policy' },
      { to: '#', label: 'Terms of Service' },
      { to: '#', label: 'Cookie Policy' },
      { to: '#', label: 'Refund Policy' },
    ],
  },
];

export default function Footer({ columns = DEFAULT_COLUMNS }) {
  return (
    <footer className="bg-surface-container-low w-full">
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <MapPin className="h-7 w-7 text-primary" />
              <span className="text-2xl font-extrabold tracking-tightest text-on-surface">
                Curator
              </span>
            </Link>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-sm">
              Elevating the art of the booking experience through precision engineering
              and a kinetic, curated design language.
            </p>
            <div className="flex items-center gap-3">
              <SocialIcon icon={Globe} label="Website" />
              <SocialIcon icon={Share2} label="Share" />
              <SocialIcon icon={AtSign} label="Contact" />
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-5">
              <h6 className="font-bold text-on-surface uppercase tracking-wider text-[10px]">
                {col.title}
              </h6>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Legal strip — separated by tonal shift, not a divider line */}
      <div className="bg-surface-container">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-on-surface-variant text-xs">
            © {new Date().getFullYear()} Curator. All rights reserved.
          </p>
          <p className="text-on-surface-variant text-xs uppercase tracking-wider">
            Crafted in Tashkent
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon: Icon, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="h-10 w-10 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-secondary-container flex items-center justify-center transition-colors"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
