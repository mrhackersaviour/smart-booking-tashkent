import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown, BookOpen, Star, MessageSquare, ChevronLeft, ChevronRight,
  Calendar, Users, MapPin, ArrowRight, Sparkles,
} from 'lucide-react';
import { Button, Card, Badge, Avatar } from '../components/ui';
import VenueCard, { getVenueImage } from '../components/venues/VenueCard';
import { api } from '../services/api';

/**
 * Dashboard — personalized "welcome back" home for signed-in users.
 *
 * Reference: design-reference/user_dashboard_1/
 *
 * Sections:
 *  1. Welcome Banner — `bg-on-secondary-fixed` deep navy bento with tier badge
 *     and a personalized greeting.
 *  2. Quick Stats — 3 KPI cards (Total Bookings / Loyalty Points / Reviews).
 *  3. Upcoming Bookings — 2-col grid of horizontal `BookingMiniCard`s.
 *  4. Recommended for You — horizontal scroller of `VenueCard`s with carousel
 *     prev/next buttons.
 *
 * Design rules followed:
 *  - DESIGN.md "No-Line Rule": no border-t separators. Stats cards live on
 *    `surface-container-lowest` over the page surface.
 *  - Tonal layering, ambient shadows for elevated cards.
 *  - Material Symbols → lucide-react.
 *  - Welcome banner uses gradient ground (no broken stock photo refs).
 *
 * Business logic:
 *  - api.getMyBookings({ status: 'confirmed' }) → upcoming list
 *  - api.getVenues({ sort: '', page: 1 }) → recommendations
 *  - user prop provides loyalty_points / full_name / role / total_bookings
 *  - Falls back gracefully when API fails.
 */

function tierFromPoints(points = 0) {
  if (points >= 5000) return { name: 'Platinum', color: 'text-slate-200' };
  if (points >= 2500) return { name: 'Gold', color: 'text-amber-300' };
  if (points >= 1000) return { name: 'Silver', color: 'text-slate-300' };
  return { name: 'Bronze', color: 'text-orange-300' };
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [stats, setStats] = useState({ total: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [recIndex, setRecIndex] = useState(0);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [bookingsData, venuesData] = await Promise.all([
          api.getMyBookings({ status: '' }).catch(() => ({ bookings: [] })),
          api.getVenues({ sort: '', page: 1 }).catch(() => ({ venues: [] })),
        ]);
        const all = bookingsData.bookings || [];
        const today = new Date().toISOString().split('T')[0];
        setUpcoming(
          all
            .filter((b) => ['confirmed', 'pending'].includes(b.status) && b.booking_date >= today)
            .slice(0, 4)
        );
        setStats({
          total: all.length,
          reviews: all.filter((b) => b.review_id).length,
        });
        setRecommended((venuesData.venues || []).slice(0, 8));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const tier = useMemo(() => tierFromPoints(user?.loyalty_points), [user?.loyalty_points]);
  const firstName = (user?.full_name || 'Friend').split(' ')[0];

  // Recommendation pagination — show 4 at a time on desktop, scroll on mobile
  const visibleRecs = recommended.slice(recIndex, recIndex + 4);
  const canPrev = recIndex > 0;
  const canNext = recIndex + 4 < recommended.length;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen">
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-12">
        {/* ============================================================
            1. WELCOME BANNER
            ============================================================ */}
        <section className="relative rounded-[2rem] overflow-hidden min-h-[240px] flex items-center p-8 md:p-12 bg-on-secondary-fixed text-white">
          {/* Gradient ground (no broken image refs) */}
          <div className="absolute inset-0 bg-gradient-to-br from-on-secondary-fixed via-on-secondary-fixed to-primary-container/40" />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-tertiary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-glass rounded-full text-xs font-bold uppercase tracking-widest">
                <Crown className={`h-3.5 w-3.5 ${tier.color} fill-current`} />
                <span className={tier.color}>{tier.name} Tier Member</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tightest leading-tight">
                Welcome back, {firstName}!
              </h2>
              <p className="text-white/70 max-w-lg">
                Your bespoke evening awaits. We&rsquo;ve curated{' '}
                <span className="font-bold text-white">{recommended.length || 14}</span> venues
                in Tashkent that match your recent tastes.
              </p>
            </div>
            <div className="flex md:flex-col gap-3 shrink-0">
              <Link
                to="/venues"
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-ambient hover:shadow-ambient transition-all active:scale-[0.98]"
              >
                Explore <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/loyalty"
                className="px-6 py-3 bg-white/10 backdrop-blur-glass text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
              >
                <Sparkles className="h-4 w-4" /> Rewards
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            2. QUICK STATS
            ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Bookings"
            value={stats.total}
            icon={BookOpen}
            tone="primary"
          />
          <StatCard
            label="Loyalty Points"
            value={(user?.loyalty_points || 0).toLocaleString()}
            icon={Star}
            tone="secondary"
          />
          <StatCard
            label="Reviews Given"
            value={stats.reviews}
            icon={MessageSquare}
            tone="tertiary"
          />
        </section>

        {/* ============================================================
            3. UPCOMING BOOKINGS
            ============================================================ */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                On Your Calendar
              </p>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tightest text-on-surface">
                Upcoming Bookings
              </h3>
            </div>
            <Link
              to="/my-bookings"
              className="text-primary text-sm font-bold hover:underline underline-offset-4 flex items-center gap-1.5"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-surface-container rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <Card padding="lg" className="text-center py-16">
              <Calendar className="h-12 w-12 text-outline-variant mx-auto mb-4" />
              <p className="text-on-surface-variant text-lg mb-3">No upcoming bookings yet.</p>
              <Link
                to="/venues"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline underline-offset-4"
              >
                Browse venues <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcoming.map((b) => (
                <BookingMiniCard
                  key={b.id}
                  booking={b}
                  onManage={() => navigate(`/checkout/${b.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ============================================================
            4. RECOMMENDED FOR YOU
            ============================================================ */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                Curated Picks
              </p>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tightest text-on-surface">
                Recommended for You
              </h3>
              <p className="text-on-surface-variant text-sm mt-1">
                Based on your recent activity and tier
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <CarouselButton
                disabled={!canPrev}
                onClick={() => setRecIndex((i) => Math.max(0, i - 4))}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </CarouselButton>
              <CarouselButton
                disabled={!canNext}
                onClick={() => setRecIndex((i) => Math.min(recommended.length - 4, i + 4))}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </CarouselButton>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-surface-container rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No recommendations yet — explore some venues to get started.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleRecs.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   Sub-components (page-local)
   ============================================================ */

const TONE_STYLES = {
  primary: { bg: 'bg-secondary-container', icon: 'text-primary' },
  secondary: { bg: 'bg-tertiary-fixed', icon: 'text-tertiary' },
  tertiary: { bg: 'bg-primary-fixed', icon: 'text-primary' },
};

function StatCard({ label, value, icon: Icon, tone = 'primary' }) {
  const t = TONE_STYLES[tone];
  return (
    <Card padding="lg" className="flex items-center justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
          {label}
        </p>
        <h3 className="text-3xl md:text-4xl font-black tracking-tightest text-on-surface mt-1">
          {value}
        </h3>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.bg}`}>
        <Icon className={`h-6 w-6 ${t.icon}`} />
      </div>
    </Card>
  );
}

function CarouselButton({ children, disabled, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      {...rest}
      className="w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/30 hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white hover:ring-transparent transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-surface-container-lowest disabled:hover:text-on-surface-variant"
    >
      {children}
    </button>
  );
}

const STATUS_BADGE = {
  confirmed: 'success',
  pending: 'warning',
  completed: 'neutral',
  cancelled: 'error',
  no_show: 'error',
};

function BookingMiniCard({ booking, onManage }) {
  const venue = { id: booking.venue_id, name: booking.venue_name, type: booking.venue_type };
  const date = new Date(booking.booking_date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
  const time = booking.start_time?.slice(0, 5);

  return (
    <Card padding="none" className="flex flex-col sm:flex-row overflow-hidden hover:shadow-ambient transition-all duration-300">
      <Link
        to={`/venues/${booking.venue_id}`}
        className="w-full sm:w-44 h-40 sm:h-auto bg-surface-container-high overflow-hidden shrink-0 group"
      >
        <ThumbnailFromVenue venue={venue} />
      </Link>
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-3">
            <Link
              to={`/venues/${booking.venue_id}`}
              className="text-lg font-bold text-on-surface hover:text-primary transition-colors line-clamp-1"
            >
              {booking.venue_name}
            </Link>
            <Badge variant={STATUS_BADGE[booking.status] || 'neutral'}>
              {booking.status}
            </Badge>
          </div>
          <p className="text-on-surface-variant text-sm">
            {date} · {time}
          </p>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {booking.guests_count} guest{booking.guests_count > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {booking.table_label || 'Auto'}
            </span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={onManage}
            iconRight={ArrowRight}
            className="flex-1"
          >
            Manage
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Tiny wrapper that reuses VenueCard's image fallback chain without duplicating logic.
 */
function ThumbnailFromVenue({ venue }) {
  const src = getVenueImage(venue);
  return src ? (
    <img
      src={src}
      alt={venue.name}
      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
      <span className="text-3xl font-bold text-white/40">{venue.name?.charAt(0)}</span>
    </div>
  );
}
