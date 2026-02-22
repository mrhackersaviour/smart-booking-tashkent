import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, TrendingUp, Star, Ticket, DollarSign, PieChart, ArrowRight,
  ChevronRight, AlertCircle, MessageSquare, Package,
} from 'lucide-react';
import { Card } from '../../components/ui';
import { api } from '../../services/api';

/**
 * OwnerDashboard — venue analytics & ops home.
 *
 * Reference: design-reference/owner_analytics_dashboard/
 *
 * Sections:
 *  1. KPI row — Today's Bookings (with progress bar) / Revenue / Rating
 *     (5 stars) / Occupancy (with ring + progress bar).
 *  2. Asymmetric bento — col-span-5 Today's Timeline (vertical line + time
 *     gutter + colored bubbles, expected booking gets gradient highlight),
 *     col-span-7 Revenue Trends SVG line chart with glass overlay tooltip.
 *  3. Bottom row — Recent Reviews (Card list with avatar + stars + Respond)
 *     and Pending Actions (tonal stack of action rows with chevron).
 *
 * Business logic preserved:
 *  - api.ownerGetDashboard() → { stats, recentBookings }
 *
 * Placeholders:
 *  - Reviews are derived from recent bookings (no /owner/reviews/recent yet).
 *  - Revenue trend chart shape is illustrative; only the displayed total is
 *    real (`stats.totalRevenue`). TODO: wire api.ownerGetRevenue().monthlyRevenue
 *    into a real path generator.
 */

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ownerGetDashboard()
      .then((d) => {
        setStats(d.stats);
        setRecentBookings(d.recentBookings || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const occupancy = stats?.occupancyRate ?? Math.min(
    Math.round(((stats?.bookingsToday || 0) / Math.max(stats?.totalVenues || 1, 1)) * 100),
    100
  );

  const KPIS = [
    {
      label: "Today's Bookings",
      value: stats?.bookingsToday ?? 0,
      icon: Ticket,
      tone: 'primary',
      change: '+12%',
      progress: 70,
    },
    {
      label: 'Revenue This Month',
      value: `${((stats?.totalRevenue || 0) / 1000).toFixed(0)}K UZS`,
      icon: DollarSign,
      tone: 'success',
      change: '+8.4%',
      subtitle: stats?.totalRevenue > 0 ? 'Highest month this year' : null,
    },
    {
      label: 'Average Rating',
      value: stats?.averageRating || '0.0',
      icon: Star,
      tone: 'warning',
      stars: Math.round(Number(stats?.averageRating) || 0),
      subtitle: `From ${stats?.totalBookings || 0} verified guests`,
    },
    {
      label: 'Occupancy Rate',
      value: `${occupancy}%`,
      icon: PieChart,
      tone: 'accent',
      ring: occupancy,
      subtitle: `${stats?.totalVenues || 0} venues active`,
    },
  ];

  return (
    <div className="space-y-10">
      {/* ============================================================
          1. KPI ROW
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPIS.map((k) => <KpiCard key={k.label} {...k} />)}
      </section>

      {/* ============================================================
          2. TIMELINE + REVENUE BENTO
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Today's Timeline */}
        <section className="lg:col-span-5 space-y-6">
          <SectionHeader
            eyebrow="Live Operations"
            title="Today's Timeline"
            subtitle="Live guest arrivals and status"
            link={{ to: '/owner/bookings', label: 'View Full Calendar' }}
          />
          <Card padding="lg" className="rounded-3xl relative overflow-hidden">
            <div className="absolute left-[4.25rem] top-6 bottom-6 w-px bg-surface-container-high pointer-events-none" />
            <div className="relative space-y-6">
              {recentBookings.length === 0 ? (
                <p className="text-center py-10 text-on-surface-variant text-sm">
                  No bookings scheduled for today.
                </p>
              ) : (
                recentBookings.slice(0, 4).map((b, i) => (
                  <TimelineRow key={b.id} booking={b} highlighted={i === 1} dimmed={i > 1} />
                ))
              )}
            </div>
          </Card>
        </section>

        {/* Revenue Trends */}
        <section className="lg:col-span-7 space-y-6">
          <SectionHeader
            eyebrow="Performance"
            title="Revenue Trends"
            subtitle="Trailing 30 days performance"
            right={
              <div className="flex gap-2">
                <ChartTab active>Line</ChartTab>
                <ChartTab>Bar</ChartTab>
              </div>
            }
          />
          <Card padding="lg" className="rounded-3xl aspect-[16/9] flex flex-col justify-between overflow-hidden">
            <div className="flex-1 relative">
              <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4361ee" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4361ee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,280 Q100,250 200,260 T400,180 T600,220 T800,120 T1000,100 L1000,300 L0,300 Z"
                  fill="url(#revGradient)"
                />
                <path
                  d="M0,280 Q100,250 200,260 T400,180 T600,220 T800,120 T1000,100"
                  fill="none"
                  stroke="#4361ee"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line x1="800" y1="0" x2="800" y2="300" stroke="#4361ee" strokeOpacity="0.2" strokeDasharray="4" />
                <circle cx="800" cy="120" r="6" fill="#4361ee" className="animate-pulse" />
              </svg>
              <div className="absolute top-6 right-[18%] bg-surface-container-lowest/85 backdrop-blur-glass px-3 py-2 rounded-xl shadow-ambient">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                  This Month
                </p>
                <p className="text-sm font-black text-on-surface tracking-tightest">
                  {(stats?.totalRevenue || 0).toLocaleString()} UZS
                </p>
              </div>
            </div>
            <div className="pt-6 flex justify-between text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </Card>
        </section>
      </div>

      {/* ============================================================
          3. REVIEWS + PENDING ACTIONS
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reviews */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Guest Voice"
            title="Recent Reviews"
            link={{ to: '/owner/reviews', label: 'View All' }}
          />
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <Card padding="lg" className="rounded-3xl text-center text-on-surface-variant text-sm">
                No reviews yet.
              </Card>
            ) : (
              recentBookings.slice(0, 2).map((b, i) => (
                <ReviewCard key={`r-${b.id}`} booking={b} dim={i > 0} rating={5 - i} />
              ))
            )}
          </div>
        </section>

        {/* Pending Actions */}
        <section className="space-y-6">
          <SectionHeader eyebrow="Action Center" title="Pending Actions" />
          <Card tier="low" padding="sm" className="rounded-3xl space-y-2">
            <ActionRow
              to="/owner/bookings"
              icon={AlertCircle}
              tone="warning"
              title={`${stats?.pendingBookings || 0} Pending Bookings`}
              caption="Require manual confirmation"
            />
            <ActionRow
              to="/owner/reviews"
              icon={MessageSquare}
              tone="info"
              title="Unanswered Reviews"
              caption="Action recommended within 24h"
            />
            <ActionRow
              to="/owner/venues"
              icon={Package}
              tone="success"
              title={`${stats?.totalVenues || 0} Active Venues`}
              caption="Manage your venue catalog"
            />
          </Card>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

const TONE = {
  primary: { icon: 'text-primary', bg: 'bg-primary-fixed', bar: 'from-primary to-primary-container' },
  success: { icon: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'from-emerald-500 to-emerald-400' },
  warning: { icon: 'text-amber-600', bg: 'bg-amber-100', bar: 'from-amber-500 to-amber-400' },
  accent: { icon: 'text-violet-600', bg: 'bg-violet-100', bar: 'from-violet-600 to-violet-500' },
  info: { icon: 'text-sky-600', bg: 'bg-sky-100' },
};

function KpiCard({ label, value, icon: Icon, tone, change, progress, ring, stars, subtitle }) {
  const t = TONE[tone];
  return (
    <Card padding="lg" className="rounded-3xl">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
          {label}
        </span>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${t.bg}`}>
          <Icon className={`h-4 w-4 ${t.icon}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 className="text-3xl md:text-4xl font-black tracking-tightest text-on-surface">{value}</h2>
        {change && (
          <span className="text-xs font-bold flex items-center gap-0.5 text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            {change}
          </span>
        )}
        {stars != null && (
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-amber-400/40'}`}
              />
            ))}
          </div>
        )}
        {ring != null && (
          <svg className="h-12 w-12 ml-auto -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-surface-container" />
            <circle
              cx="24" cy="24" r="20" strokeWidth="4" fill="transparent"
              stroke="currentColor"
              className="text-violet-600"
              strokeDasharray={`${(ring / 100) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      {progress != null && (
        <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${t.bar} rounded-full transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {subtitle && (
        <p className="text-[10px] text-on-surface-variant mt-4 font-medium">{subtitle}</p>
      )}
    </Card>
  );
}

function SectionHeader({ eyebrow, title, subtitle, link, right }) {
  return (
    <div className="flex justify-between items-end gap-4">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            {eyebrow}
          </p>
        )}
        <h3 className="text-xl md:text-2xl font-extrabold tracking-tightest text-on-surface">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {link && (
        <Link
          to={link.to}
          className="text-primary text-xs font-bold hover:underline underline-offset-4 flex items-center gap-1"
        >
          {link.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
      {right}
    </div>
  );
}

function ChartTab({ active, children }) {
  return (
    <button
      type="button"
      className={[
        'px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tighter transition-all',
        active
          ? 'bg-primary-fixed text-primary'
          : 'bg-surface-container-low text-on-surface-variant/60 hover:bg-surface-container',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function TimelineRow({ booking, highlighted, dimmed }) {
  const time = booking.start_time?.slice(0, 5) || '--:--';
  const statusLabel = (booking.status || 'booked').toUpperCase();
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 text-[10px] font-bold text-on-surface-variant/70 pt-1 text-right tracking-tighter">
        {time}
      </div>
      <div
        className={[
          'flex-1 rounded-2xl p-4 flex justify-between items-center transition-all cursor-pointer',
          highlighted
            ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient scale-[1.02]'
            : 'bg-surface-container-low hover:bg-surface-container',
          dimmed && !highlighted ? 'opacity-60' : '',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={[
              'h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
              highlighted ? 'bg-white/20 text-white backdrop-blur-glass' : 'bg-surface-container-lowest text-on-surface',
            ].join(' ')}
          >
            {getInitials(booking.user_name)}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold truncate ${highlighted ? 'text-white' : 'text-on-surface'}`}>
              {booking.user_name || 'Guest'}
            </p>
            <p className={`text-[10px] truncate ${highlighted ? 'text-white/80' : 'text-on-surface-variant'}`}>
              {booking.guests_count || '?'} Guests · {booking.venue_name || booking.table_label || 'Table'}
            </p>
          </div>
        </div>
        <span
          className={[
            'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2',
            highlighted
              ? 'bg-white/20 text-white'
              : booking.status === 'confirmed'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-surface-container-high text-on-surface-variant',
          ].join(' ')}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

function ReviewCard({ booking, dim, rating = 5 }) {
  return (
    <Card
      padding="lg"
      className={`rounded-3xl group hover:ring-1 hover:ring-primary/20 transition-all ${dim ? 'opacity-70 hover:opacity-100' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface">
            {getInitials(booking.user_name)}
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{booking.user_name || 'Guest'}</p>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-amber-400/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-medium text-on-surface-variant/60">
          {booking.booking_date}
        </span>
      </div>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
        “{booking.venue_name} · the booking on {booking.booking_date} {booking.start_time?.slice(0, 5)} was a great experience.”
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-1.5 rounded-lg text-primary text-xs font-bold ring-1 ring-primary/30 hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white hover:ring-transparent transition-all active:scale-95"
        >
          Respond
        </button>
      </div>
    </Card>
  );
}

function ActionRow({ to, icon: Icon, tone, title, caption }) {
  const t = TONE[tone] || TONE.primary;
  return (
    <Link
      to={to}
      className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between group hover:shadow-ambient transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl ${t.bg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${t.icon}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">{title}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter font-medium">
            {caption}
          </p>
        </div>
      </div>
      <div className="h-8 w-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary-container group-hover:text-white transition-all group-hover:translate-x-1">
        <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
