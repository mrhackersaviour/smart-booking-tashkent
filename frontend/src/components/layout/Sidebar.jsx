import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Building2, BarChart3, Settings,
  HelpCircle, LogOut, ChevronLeft, ChevronRight, Plus, MapPin,
} from 'lucide-react';
import { Avatar, Button } from '../ui';

/**
 * Sidebar — collapsible vertical navigation for dashboard layouts
 * (owner / admin / analytics).
 *
 * Reference: design-reference/owner_analytics_dashboard/screen.png
 *
 * Follows DESIGN.md:
 *  - Sits on `bg-on-secondary-fixed` (#1a1a2e) — the deep navy "grounding" surface.
 *  - No 1px solid borders. Active item uses `bg-white/10` overlay.
 *  - Active link icon glows with `text-primary`; inactive items use `text-white/60`.
 *  - Collapsing animates width — content shifts via parent layout.
 *
 * @param {object} props
 * @param {boolean} [props.collapsed]
 * @param {(next: boolean) => void} [props.onCollapseChange]
 * @param {Array<{to:string,label:string,icon:React.ComponentType}>} [props.items]
 * @param {{full_name:string, role?:string, email?:string}} [props.user]
 * @param {() => void} [props.onLogout]
 * @param {{to:string,label:string,icon?:React.ComponentType}} [props.primaryAction]
 */
const DEFAULT_ITEMS = [
  { to: '/owner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/owner/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/owner/venues', label: 'Venues', icon: Building2 },
  { to: '/owner/revenue', label: 'Analytics', icon: BarChart3 },
  { to: '/owner/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  collapsed: collapsedProp,
  onCollapseChange,
  items = DEFAULT_ITEMS,
  user,
  onLogout,
  primaryAction,
}) {
  const [internal, setInternal] = useState(false);
  const collapsed = collapsedProp ?? internal;
  const setCollapsed = (next) => {
    if (onCollapseChange) onCollapseChange(next);
    else setInternal(next);
  };

  return (
    <aside
      className={[
        'fixed left-0 top-0 h-screen z-40 flex flex-col py-6 px-3',
        'bg-on-secondary-fixed text-white',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64',
      ].join(' ')}
    >
      {/* Brand */}
      <div className="flex items-center justify-between mb-10 px-2">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
          <img src="/logo.png" alt="Curator" className="h-9 w-9 rounded-lg shrink-0" />
          {!collapsed && (
            <span className="text-lg font-extrabold tracking-tightest text-white whitespace-nowrap">
              Curator
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Primary CTA */}
      {primaryAction && !collapsed && (
        <Link
          to={primaryAction.to}
          className="mb-6 mx-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-semibold text-sm hover:shadow-ambient transition-all active:scale-[0.98]"
        >
          {primaryAction.icon ? <primaryAction.icon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {primaryAction.label}
        </Link>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              ].join(' ')
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={[
                    'h-5 w-5 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary' : '',
                  ].join(' ')}
                />
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: help + user + logout */}
      <div className="mt-6 space-y-1.5">
        <NavLink
          to="/help"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Help' : undefined}
        >
          <HelpCircle className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Help</span>}
        </NavLink>

        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-white/5">
            <Avatar name={user.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              {user.email && (
                <p className="text-[10px] text-white/50 truncate">{user.email}</p>
              )}
            </div>
          </div>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
