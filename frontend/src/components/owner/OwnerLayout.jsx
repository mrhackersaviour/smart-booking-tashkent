import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  TrendingUp,
  MessageSquare,
  ArrowLeft,
  Menu,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Bell,
  User,
} from 'lucide-react';

const navItems = [
  { path: '/owner', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/owner/bookings', label: 'Bookings', icon: Calendar },
  { path: '/owner/venues', label: 'Venues', icon: Building2 },
  { path: '/owner/revenue', label: 'Analytics', icon: TrendingUp },
  { path: '/owner/reviews', label: 'Reviews', icon: MessageSquare },
  { path: '/owner/settings', label: 'Settings', icon: Settings },
];

export default function OwnerLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/owner') return location.pathname === '/owner';
    return location.pathname.startsWith(path);
  };

  const initials = (user?.full_name || 'O')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full py-6 px-4 font-headline text-sm antialiased">
      {/* Brand */}
      <div className="mb-10 px-2">
        <h1 className="text-xl font-bold tracking-tight text-white">SmartBook</h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
          Venue Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
              isActive(path)
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                isActive(path) ? 'text-ds-primary-container' : ''
              }`}
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        {/* New Booking CTA */}
        <Link
          to="/owner/venues/new"
          onClick={() => setSidebarOpen(false)}
          className="w-full py-2.5 px-4 bg-ds-primary text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-cta"
        >
          <Plus className="h-4 w-4" />
          New Venue
        </Link>

        {/* Secondary links */}
        <div className="space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors duration-200 hover:bg-slate-800 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Site
          </Link>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors duration-200 hover:bg-slate-800 rounded-xl"
          >
            <HelpCircle className="h-5 w-5" />
            Support
          </a>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-2 pt-4">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user?.full_name || 'Owner'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-ds-surface font-body">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-[#1a1a2e] flex flex-col shadow-2xl">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-[#1a1a2e] z-50 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-5 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 sm:px-8 h-16 font-headline tracking-tight">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-ds-on-surface-variant hover:bg-ds-surface-container rounded-xl transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="h-10 w-10 flex items-center justify-center text-ds-on-surface-variant hover:bg-ds-surface-container rounded-full transition-all relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-ds-error rounded-full ring-2 ring-white" />
            </button>
            {/* User avatar */}
            <button className="h-10 w-10 flex items-center justify-center text-ds-on-surface-variant hover:bg-ds-surface-container rounded-full transition-all">
              <User className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
