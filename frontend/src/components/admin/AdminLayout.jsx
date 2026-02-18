import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Menu,
  X,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  UserCheck,
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/owners', label: 'Owners', icon: UserCheck },
  { path: '/admin/venues', label: 'Venues', icon: Building2 },
  { path: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { path: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
];

export default function AdminLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 pt-7 pb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Central</h1>
        <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-[0.2em] font-semibold">
          Platform Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-150 ${
              isActive(path)
                ? 'bg-ds-primary text-white shadow-cta'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto px-2 pb-3 space-y-1">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 w-full"
        >
          <HelpCircle className="h-5 w-5" />
          <span>Support</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all duration-150 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* User info */}
      <div className="px-6 py-5 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ds-primary flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-500/40">
            {getInitials(user?.full_name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.full_name || 'Admin'}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold">
              Super Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-ds-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-ds-on-secondary-fixed flex flex-col shadow-2xl">{sidebar}</div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-ds-on-secondary-fixed z-50 shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-16 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 border-b border-slate-100 z-30">
          {/* Left: hamburger + search */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden sm:flex items-center flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search platform data..."
                  className="w-full bg-ds-surface-low border-none rounded-full pl-10 pr-4 py-2 text-sm text-ds-on-surface-variant placeholder:text-slate-400 focus:ring-2 focus:ring-ds-primary/20 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-ds-primary rounded-full border-2 border-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <HelpCircle className="h-5 w-5 text-slate-500" />
            </button>
            <span className="hidden sm:inline-block text-sm font-semibold text-ds-primary px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
              Support
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
