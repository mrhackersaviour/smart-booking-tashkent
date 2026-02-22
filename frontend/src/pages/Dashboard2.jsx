import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown, BookOpen, Heart, Star, MessageSquare, Loader2,
  ChevronLeft, ChevronRight, ArrowRight, Calendar, Clock, Users,
  Utensils, Coffee, Building2, Dumbbell, Scissors, Car,
} from 'lucide-react';
import { Button, Card, Badge, Avatar } from '../components/ui';
import { getVenueImage } from '../components/venues/VenueCard';
import { priceTier } from '../utils/price';
import { api } from '../services/api';

/**
 * Dashboard2 — alternative bento layout for the user dashboard.
 *
 * Reference: design-reference/user_dashboard_2/
 *
 * Differences from Dashboard.jsx:
 *  - Welcome banner uses `bg-primary-container` (electric) instead of deep navy
 *    and shares its row with a vertical "Membership Overview" stats panel
 *    (12-col grid: 8 + 4).
 *  - Upcoming bookings are horizontal cards (1/3 image · 2/3 details) with a
 *    3-col Date/Time/Guests grid and Modify/Cancel buttons. Pending bookings
 *    show a progress bar "awaiting host confirmation".
 *  - Recommended row is a horizontal scroller of standalone "Pick" cards with
 *    a heart toggle overlay and price-per-person display.
 *
 * Design rules:
 *  - DESIGN.md "No-Line Rule": no border-t/divider; surface tier separation.
 *  - Material Symbols → lucide-react.
 *  - Primary CTA gradient. Tonal button on the secondary CTA.
 *
 * Business logic:
 *  - api.getMyBookings → upcoming filtered by status + future date
 *  - api.getVenues → recommendations
 *  - api.cancelBooking → refresh list
 *  - user prop drives loyalty tier + greeting
 */

const TYPE_ICON = {
  restaurant: Utensils,
  cafe: Coffee,
  stadium: Building2,
  fitness: Dumbbell,
  barbershop: Scissors,
  carwash: Car,
};

function tierFromPoints(points = 0) {
  if (points >= 5000) return { name: 'Platinum', icon: 'text-slate-100' };
  if (points >= 2500) return { name: 'Gold',     icon: 'text-amber-300' };
  if (points >= 1000) return { name: 'Silver',   icon: 'text-slate-300' };
  return { name: 'Bronze', icon: 'text-orange-300' };
}

export default function Dashboard2({ user }) {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [stats, setStats] = useState({ total: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [scrollIdx, setScrollIdx] = useState(0);
  const [cancelling, setCancelling] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bookingsData, venuesData] = await Promise.all([
        api.getMyBookings({}).catch(() => ({ bookings: [] })),
        api.getVenues({ page: 1 }).catch(() => ({ venues: [] })),
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await api.cancelBooking(id);
      await fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(null);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const tier = useMemo(() => tierFromPoints(user?.loyalty_points), [user?.loyalty_points]);

  const visibleRecs = recommended.slice(scrollIdx, scrollIdx + 4);
  const canPrev = scrollIdx > 0;
  const canNext = scrollIdx + 4 < recommended.length;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen">
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-12">
        {/* ============================================================
            1. WELCOME BENTO (8 + 4)
            ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Welcome Banner */}
          <div className="lg:col-span-8 bg-primary-container rounded-[2rem] p-10 md:p-12 text-on-primary-container relative overflow-hidden shadow-ambient">
            {/* Decorative blobs */}
            <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-white/15 rounded-full blur-3xl" />
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-tertiary-fixed-dim/30 rounded-full blur-3xl" />

            {/* Tier badge top-right */}
            <div className="absolute top-8 right-8 bg-white/15 backdrop-blur-glass px-4 py-2 rounded-full flex items-center gap-2">
              <Crown className={`h-4 w-4 ${tier.icon} fill-current`} />
              <span className="font-bold text-sm tracking-tight text-white">
                {tier.name} Tier
              </span>
            </div>

            <div className="relative z-10 max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container/70 mb-3">
                Welcome back
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tightest mb-3 leading-tight text-white">
                {user?.full_name || 'Friend'}
              </h2>
              <p className="text-on-primary-container/80 text-base md:text-lg max-w-sm">
                Your next curated adventure awaits. Explore our newest collection
                tailored to your tastes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/venues"
                  className="bg-surface-container-lowest text-primary font-bold px-6 py-3 rounded-xl text-sm hover:bg-primary-fixed transition-colors flex items-center gap-2 active:scale-[0.98]"
                >
                  Book New Venue <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/my-bookings"
                  className="bg-white/10 backdrop-blur-glass text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-white/20 transition-colors"
                >
                  View Itinerary
                </Link>
              </div>
            </div>
          </div>

          {/* Membership Overview */}
          <Card padding="lg" className="lg:col-span-4 flex flex-col justify-between rounded-[2rem]">
            <h3 className="text-on-surface font-bold text-lg mb-6">Membership Overview</h3>
            <div className="space-y-5 flex-1">
              <StatRow
                icon={BookOpen}
                label="Total Bookings"
                value={stats.total}
                tone="primary"
              />
              <StatRow
                icon={Star}
                label="Loyalty Points"
                value={(user?.loyalty_points || 0).toLocaleString()}
                tone="tertiary"
              />
              <StatRow
                icon={MessageSquare}
                label="Reviews Given"
                value={stats.reviews}
                tone="secondary"
              />
            </div>
            <Link
              to="/loyalty"
              className="w-full mt-6 py-3 text-primary text-sm font-bold rounded-xl bg-secondary-container hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white transition-all flex items-center justify-center gap-2"
            >
              View Details <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </section>

        {/* ============================================================
            2. UPCOMING BOOKINGS
            ============================================================ */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tightest text-on-surface">
                Upcoming Bookings
              </h3>
              <p className="text-on-surface-variant text-sm mt-1">
                Your confirmed and pending reservations
              </p>
            </div>
            <Link
              to="/my-bookings"
              className="text-primary font-bold text-sm hover:underline underline-offset-4 flex items-center gap-1.5"
            >
              See All Activity <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-52 bg-surface-container rounded-2xl animate-pulse" />
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
                <BookingHorizontalCard
                  key={b.id}
                  booking={b}
                  onModify={() => navigate(`/checkout/${b.id}`)}
                  onCancel={() => handleCancel(b.id)}
                  cancelling={cancelling === b.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* ============================================================
            3. RECOMMENDED FOR YOU
            ============================================================ */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tightest text-on-surface">
                Recommended for You
              </h3>
              <p className="text-on-surface-variant text-sm mt-1">
                Based on your preference for artisanal experiences
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <CarouselButton
                disabled={!canPrev}
                onClick={() => setScrollIdx((i) => Math.max(0, i - 4))}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </CarouselButton>
              <CarouselButton
                disabled={!canNext}
                onClick={() => setScrollIdx((i) => Math.min(recommended.length - 4, i + 4))}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </CarouselButton>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-surface-container rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <p className="text-on-surface-variant text-sm">
              Nothing to recommend yet — explore some venues to seed your picks.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleRecs.map((venue) => (
                <PickCard
                  key={venue.id}
                  venue={venue}
                  favorited={favorites.has(venue.id)}
                  onFavorite={() => toggleFavorite(venue.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

const STAT_TONES = {
  primary:   { bg: 'bg-secondary-container', icon: 'text-primary' },
  tertiary:  { bg: 'bg-tertiary-fixed',     icon: 'text-tertiary' },
  secondary: { bg: 'bg-primary-fixed',      icon: 'text-primary' },
};

function StatRow({ icon: Icon, label, value, tone = 'primary' }) {
  const t = STAT_TONES[tone];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 ${t.bg} ${t.icon} rounded-xl`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-on-surface-variant font-medium text-sm">{label}</span>
      </div>
      <span className="text-2xl font-black text-on-surface tracking-tightest">{value}</span>
    </div>
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
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-500', text: 'text-white' },
  pending:   { label: 'Pending',   bg: 'bg-tertiary',    text: 'text-white' },
  cancelled: { label: 'Cancelled', bg: 'bg-error',       text: 'text-white' },
  completed: { label: 'Completed', bg: 'bg-surface-container-high', text: 'text-on-surface' },
};

function BookingHorizontalCard({ booking, onModify, onCancel, cancelling }) {
  const VenueIcon = TYPE_ICON[booking.venue_type] || Utensils;
  const status = STATUS_BADGE[booking.status] || STATUS_BADGE.confirmed;
  const isPending = booking.status === 'pending';
  const venue = { id: booking.venue_id, name: booking.venue_name, type: booking.venue_type };
  const imageSrc = getVenueImage(venue);

  const date = new Date(booking.booking_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const time = booking.start_time?.slice(0, 5);

  return (
    <Card padding="none" className="group flex items-stretch overflow-hidden hover:shadow-ambient transition-all duration-300">
      {/* Image */}
      <div className="w-1/3 relative overflow-hidden shrink-0">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={booking.venue_name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-container" />
        )}
        <div className={`absolute top-3 left-3 ${status.bg} ${status.text} text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded`}>
          {status.label}
        </div>
      </div>

      {/* Details */}
      <div className="w-2/3 p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2">
            <Link
              to={`/venues/${booking.venue_id}`}
              className="text-xl font-bold text-on-surface hover:text-primary transition-colors line-clamp-1"
            >
              {booking.venue_name}
            </Link>
            <VenueIcon className="h-5 w-5 text-primary shrink-0" />
          </div>
          <p className="text-on-surface-variant text-sm mt-1 capitalize">
            {booking.venue_type}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <DataCell label="Date" value={date} />
          <DataCell label="Time" value={time} />
          <DataCell label="Guests" value={`${booking.guests_count}`} />
        </div>

        {isPending ? (
          <div className="mt-5">
            <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-tertiary rounded-full animate-pulse" />
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium mt-2 italic">
              Awaiting confirmation from venue host…
            </p>
          </div>
        ) : (
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onModify}
              className="flex-1 py-2 bg-surface-container-low text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container-high transition-colors"
            >
              Modify
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-error/10 text-error font-bold text-xs rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {cancelling && <Loader2 className="h-3 w-3 animate-spin" />}
              Cancel
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function DataCell({ label, value }) {
  return (
    <div>
      <span className="block text-[10px] text-outline font-bold uppercase tracking-widest">
        {label}
      </span>
      <span className="text-sm font-bold text-on-surface">{value}</span>
    </div>
  );
}

function PickCard({ venue, favorited, onFavorite }) {
  const tier = priceTier(venue.price_range);
  const imageSrc = getVenueImage(venue);

  return (
    <Card padding="none" className="overflow-hidden hover:shadow-ambient transition-all duration-300 group">
      <div className="h-48 relative overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-container" />
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onFavorite(); }}
          aria-label="Favorite"
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-glass rounded-full flex items-center justify-center text-white hover:bg-white hover:text-rose-500 transition-all"
        >
          <Heart className={`h-5 w-5 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>
      <Link to={`/venues/${venue.id}`} className="p-5 block">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h5 className="font-bold text-on-surface text-lg line-clamp-1">{venue.name}</h5>
          <div className="flex items-center gap-1 bg-primary/5 px-2 py-1 rounded shrink-0">
            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
            <span className="text-xs font-black text-primary">{venue.rating || '—'}</span>
          </div>
        </div>
        <p className="text-on-surface-variant text-sm mb-4 line-clamp-1">
          {venue.cuisine_type || venue.description || 'Curated experience'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-primary tracking-tighter">{tier.dots}</span>
            {tier.label}
          </span>
          <span className="text-xs text-outline font-bold uppercase tracking-tighter">
            {venue.total_reviews || 0} Reviews
          </span>
        </div>
      </Link>
    </Card>
  );
}
