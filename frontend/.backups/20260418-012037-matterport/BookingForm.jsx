import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, Clock, Users, MessageSquare, CheckCircle, Box, Grid3X3,
  ArrowLeft, ArrowRight, ShieldCheck, Crown, Sparkles, MapPin,
  Plus, Minus, BadgeCheck, Armchair,
} from 'lucide-react';
import { Button, Card, Badge, Avatar } from '../components/ui';
import { api } from '../services/api';
import VenueViewer3D from '../components/three-d/VenueViewer3D';
import { getVenueImage } from '../components/venues/VenueCard';

/**
 * BookingForm — "Select Seat" booking page.
 *
 * Reference: design-reference/booking_select_seat/
 *
 * Layout (per DESIGN.md):
 *  - Left 60%: interactive floor-plan / table grid viewport with stage + legend.
 *  - Right 40%: sticky booking summary Card (venue, selection, guest stepper,
 *    service fee, special requests, total, CTA) + Vibe+ upsell card.
 *  - Top: lightweight step indicator (Select → Details → Payment → Confirm).
 *  - No 1px solid borders. Tonal layering for sectioning. No <hr>.
 *  - Primary CTA = gradient `Button variant="primary"`.
 *  - All icons via lucide-react.
 *
 * Business logic preserved from previous BookingForm.jsx:
 *  - api.getVenue, api.getVenueAvailability, api.getVenue3DModel, api.createBooking
 *  - form: booking_date, start_time, end_time, guests_count, table_id, special_requests
 *  - 3D toggle for table picker
 *  - Filter available tables by capacity + booked slots
 *  - Success view with loyalty points
 */

const STEPS = [
  { id: 'seat', label: 'Select Seat', icon: Armchair },
  { id: 'details', label: 'Details', icon: BadgeCheck },
  { id: 'payment', label: 'Payment', icon: ShieldCheck },
  { id: 'confirmation', label: 'Confirmation', icon: CheckCircle },
];

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    guests_count: 2,
    table_id: '',
    special_requests: '',
  });

  const [availability, setAvailability] = useState(null);
  const [view3D, setView3D] = useState(false);
  const [model3D, setModel3D] = useState(null);

  useEffect(() => {
    api.getVenue(id)
      .then((data) => {
        setVenue(data.venue);
        setTables(data.tables || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (form.booking_date) {
      api.getVenueAvailability(id, form.booking_date)
        .then((data) => setAvailability(data.tables))
        .catch(() => setAvailability(null));
    }
  }, [id, form.booking_date]);

  useEffect(() => {
    api.getVenue3DModel(id)
      .then((data) => setModel3D(data))
      .catch(() => setModel3D(null));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'guests_count' ? parseInt(value) : value }));
  };

  const setGuests = (n) => setForm((p) => ({ ...p, guests_count: Math.max(1, Math.min(20, n)) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        venue_id: id,
        booking_date: form.booking_date,
        start_time: form.start_time,
        end_time: form.end_time,
        guests_count: form.guests_count,
        special_requests: form.special_requests || undefined,
        table_id: form.table_id || undefined,
      };
      const data = await api.createBooking(payload);
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Time slots
  const timeSlots = useMemo(() => {
    const out = [];
    for (let h = 7; h <= 23; h++) {
      out.push(`${h.toString().padStart(2, '0')}:00`);
      out.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return out;
  }, []);

  // Tomorrow as min date
  const minDate = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  }, []);

  // Categorized tables (full list with availability state for grid render)
  const tableStates = useMemo(() => {
    const source = availability || tables;
    return source.map((t) => {
      const booked = availability ? t.booked_slots?.length > 0 : !t.is_available;
      const tooSmall = t.capacity < form.guests_count;
      const status = booked ? 'booked' : tooSmall ? 'small' : 'available';
      return { ...t, status };
    });
  }, [tables, availability, form.guests_count]);

  const selectedTable = tableStates.find((t) => t.id === form.table_id);

  // Total
  const pricePerGuest = useMemo(() => {
    if (selectedTable?.price_per_hour) return selectedTable.price_per_hour;
    if (tables.length > 0) {
      const min = Math.min(...tables.map((t) => t.price_per_hour || 0).filter(Boolean));
      if (min) return min;
    }
    return (venue?.price_range || 1) * 30;
  }, [selectedTable, tables, venue]);
  const total = pricePerGuest * form.guests_count;

  if (loading) return <BookingSkeleton />;

  if (success) {
    return (
      <SuccessView
        venue={venue}
        form={form}
        success={success}
        onMyBookings={() => navigate('/my-bookings')}
        onBrowse={() => navigate('/venues')}
      />
    );
  }

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen">
      {/* ============================================================
          STEP INDICATOR
          ============================================================ */}
      <div className="bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 flex items-center justify-between gap-6">
          <Link
            to={`/venues/${id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to venue
          </Link>
          <StepIndicator currentStep="seat" />
        </div>
      </div>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-10 grid grid-cols-12 gap-8">
        {/* ============================================================
            LEFT — Floor Plan / Table Picker (60%)
            ============================================================ */}
        <section className="col-span-12 lg:col-span-7 space-y-6">
          <Card tier="low" padding="lg" className="relative min-h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Step 1 · Select your spot
                </p>
                <h3 className="text-2xl font-extrabold tracking-tightest text-on-surface">
                  {venue?.name || 'Main Hall'}
                </h3>
                <p className="text-on-surface-variant text-sm">
                  {tables.length} tables · Pick the one that suits you
                </p>
              </div>
              <ViewToggle view3D={view3D} onChange={setView3D} />
            </div>

            {/* Date / Time bar — must be set before picking */}
            <Card tier="lowest" padding="md" className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DateTimeField
                  icon={Calendar}
                  label="Date"
                  type="date"
                  name="booking_date"
                  value={form.booking_date}
                  onChange={handleChange}
                  min={minDate}
                />
                <DateTimeField
                  icon={Clock}
                  label="Start Time"
                  as="select"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                </DateTimeField>
                <DateTimeField
                  icon={Clock}
                  label="End Time"
                  as="select"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {timeSlots.filter((t) => t > form.start_time).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </DateTimeField>
              </div>
            </Card>

            {/* Floor plan viewport */}
            <Card tier="lowest" padding="lg" className="flex-1 flex flex-col items-center justify-center">
              {view3D ? (
                <VenueViewer3D
                  tables={tableStates}
                  sceneConfig={model3D?.scene || {}}
                  selectedTableId={form.table_id}
                  unavailableTableIds={tableStates.filter((t) => t.status !== 'available').map((t) => t.id)}
                  onTableSelect={(table) => setForm((p) => ({ ...p, table_id: table.id }))}
                  className="h-80 w-full"
                />
              ) : (
                <FloorPlan
                  tables={tableStates}
                  selectedId={form.table_id}
                  onSelect={(t) => setForm((p) => ({ ...p, table_id: t.id }))}
                />
              )}
            </Card>

            {/* Legend */}
            <SeatLegend />
          </Card>
        </section>

        {/* ============================================================
            RIGHT — Booking Summary (40%)
            ============================================================ */}
        <aside className="col-span-12 lg:col-span-5 space-y-6">
          <form onSubmit={handleSubmit}>
            <Card padding="lg" className="rounded-[2rem] shadow-ambient flex flex-col gap-7">
              {/* Venue header */}
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl bg-surface-container overflow-hidden shrink-0">
                  {venue && (
                    <img
                      src={getVenueImage(venue)}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <Badge variant="primary" size="sm">Premium Booking</Badge>
                  <h4 className="text-xl font-bold text-on-surface mt-1.5 truncate">
                    {venue?.name || 'Loading…'}
                  </h4>
                  <div className="flex items-center gap-2 text-on-surface-variant text-sm mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{venue?.district || venue?.address}</span>
                  </div>
                </div>
              </div>

              {/* Selected seat / table */}
              <div>
                <FieldLabel>Selected Table</FieldLabel>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <Armchair className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface truncate">
                        {selectedTable
                          ? selectedTable.label || `Table #${selectedTable.table_number}`
                          : 'Auto-assign best table'}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {selectedTable
                          ? `${selectedTable.capacity} seats${selectedTable.is_vip ? ' · VIP' : ''}`
                          : 'We pick one for you'}
                      </p>
                    </div>
                  </div>
                  <span className="text-primary font-bold whitespace-nowrap">
                    ${pricePerGuest.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Guests + Service fee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Guest Count</FieldLabel>
                  <div className="flex items-center justify-between p-1.5 bg-surface-container-low rounded-xl">
                    <StepperBtn onClick={() => setGuests(form.guests_count - 1)} aria-label="Decrease">
                      <Minus className="h-4 w-4" />
                    </StepperBtn>
                    <span className="font-bold text-on-surface">
                      {String(form.guests_count).padStart(2, '0')}
                    </span>
                    <StepperBtn onClick={() => setGuests(form.guests_count + 1)} aria-label="Increase">
                      <Plus className="h-4 w-4" />
                    </StepperBtn>
                  </div>
                </div>
                <div>
                  <FieldLabel>Service Fee</FieldLabel>
                  <div className="h-[44px] flex items-center px-4 bg-surface-container-low rounded-xl text-on-surface-variant text-sm italic">
                    Included
                  </div>
                </div>
              </div>

              {/* Special requests */}
              <div>
                <FieldLabel>Special Requests</FieldLabel>
                <textarea
                  name="special_requests"
                  value={form.special_requests}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Dietary needs, accessibility, or birthday requests…"
                  className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <Card tier="low" padding="sm" className="bg-error/5">
                  <p className="text-sm font-semibold text-error">{error}</p>
                </Card>
              )}

              {/* Total + CTA */}
              <div className="pt-2">
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <p className="text-xs text-on-surface-variant">Total Amount</p>
                    <p className="text-3xl font-extrabold text-on-surface tracking-tightest">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="success" size="md">
                    <ShieldCheck className="h-3 w-3" /> Secure Booking
                  </Badge>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  iconRight={ArrowRight}
                  disabled={!form.booking_date || !form.start_time || !form.end_time}
                >
                  {submitting ? 'Creating Booking…' : 'Confirm Booking'}
                </Button>
                <p className="text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mt-4">
                  By continuing you agree to our Terms &amp; Privacy
                </p>
              </div>
            </Card>
          </form>

          {/* Vibe+ Upsell */}
          <UpsellCard />
        </aside>
      </main>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function StepIndicator({ currentStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className="hidden md:flex items-center gap-2">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const active = idx === currentIdx;
        const done = idx < currentIdx;
        return (
          <div key={s.id} className="flex items-center">
            <div
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
                active
                  ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient'
                  : done
                    ? 'bg-secondary-container text-primary'
                    : 'text-on-surface-variant',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <span className="mx-1 w-6 h-px bg-outline-variant/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ViewToggle({ view3D, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
          !view3D ? 'bg-surface-container-lowest text-on-surface shadow-ambient' : 'text-on-surface-variant',
        ].join(' ')}
      >
        <Grid3X3 className="h-3.5 w-3.5" /> Grid
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
          view3D ? 'bg-surface-container-lowest text-on-surface shadow-ambient' : 'text-on-surface-variant',
        ].join(' ')}
      >
        <Box className="h-3.5 w-3.5" /> 3D
      </button>
    </div>
  );
}

/**
 * FloorPlan — visual table picker.
 * Shows a "STAGE / FRONT" bar at the top and the venue's tables as colored
 * tiles arranged in rows. Status colors:
 *  - available  → green tone
 *  - booked     → error/red tone
 *  - small      → outline/grey (capacity below guest count)
 *  - selected   → primary gradient with ring
 */
function FloorPlan({ tables, selectedId, onSelect }) {
  if (tables.length === 0) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        <Armchair className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No tables available for this venue.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 items-center">
      {/* Front / stage bar */}
      <div className="w-full max-w-md h-10 bg-gradient-to-b from-on-secondary-fixed to-on-secondary-fixed/70 rounded-t-full flex items-center justify-center">
        <span className="text-white text-[10px] font-bold tracking-[0.3em] uppercase">
          Front · Entrance
        </span>
      </div>

      {/* Auto-assign chip */}
      <button
        type="button"
        onClick={() => onSelect({ id: '' })}
        className={[
          'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all',
          !selectedId
            ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient'
            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
        ].join(' ')}
      >
        Auto-assign
      </button>

      {/* Table grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
        {tables.map((t) => {
          const isSelected = t.id === selectedId;
          const disabled = t.status !== 'available';
          const styles = isSelected
            ? 'bg-gradient-to-br from-primary to-primary-container text-white ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest scale-110 shadow-ambient'
            : t.status === 'available'
              ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/30 cursor-pointer'
              : t.status === 'booked'
                ? 'bg-error/15 text-error/60 cursor-not-allowed'
                : 'bg-surface-container text-outline cursor-not-allowed';
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(t)}
              title={`${t.label || `#${t.table_number}`} · ${t.capacity} seats${t.is_vip ? ' · VIP' : ''}`}
              className={`relative w-12 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${styles}`}
            >
              {t.is_vip && (
                <Crown className="absolute -top-1.5 -right-1.5 h-3 w-3 text-amber-500 fill-amber-500" />
              )}
              {t.table_number || t.label?.charAt(0) || 'T'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SeatLegend() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
      <LegendItem color="bg-emerald-500" label="Available" />
      <LegendItem color="bg-error" label="Booked" />
      <LegendItem color="bg-outline-variant" label="Too Small" />
      <LegendItem color="bg-gradient-to-r from-primary to-primary-container" label="Selected" />
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-bold text-outline uppercase tracking-[0.15em] mb-2">
      {children}
    </label>
  );
}

function StepperBtn({ children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className="w-9 h-9 flex items-center justify-center bg-surface-container-lowest text-primary rounded-lg shadow-ambient hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white transition-all"
    >
      {children}
    </button>
  );
}

function DateTimeField({ icon: Icon, label, as, name, value, onChange, children, ...rest }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
        {as === 'select' ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            required
            className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all"
            {...rest}
          >
            {children}
          </select>
        ) : (
          <input
            type="date"
            name={name}
            value={value}
            onChange={onChange}
            required
            className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all"
            {...rest}
          />
        )}
      </div>
    </div>
  );
}

function UpsellCard() {
  return (
    <Card padding="md" className="relative overflow-hidden bg-tertiary-fixed text-on-tertiary-fixed">
      <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
        <Sparkles className="h-32 w-32" />
      </div>
      <div className="relative z-10">
        <h5 className="font-bold flex items-center gap-2 text-on-tertiary-fixed">
          <Crown className="h-4 w-4 text-on-tertiary-fixed fill-on-tertiary-fixed" />
          SBT+ Member Perk
        </h5>
        <p className="text-sm mt-2 opacity-80">
          You&rsquo;ve unlocked 15% off pre-show refreshments at the lounge!
        </p>
      </div>
    </Card>
  );
}

function SuccessView({ venue, form, success, onMyBookings, onBrowse }) {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen flex items-center justify-center p-8">
      <Card padding="lg" className="max-w-lg w-full text-center rounded-[2rem] shadow-ambient">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <Badge variant="success" className="mb-4">Confirmed</Badge>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tightest mb-3">
          Booking Confirmed!
        </h2>
        <p className="text-on-surface-variant mb-6">
          Your reservation at <strong className="text-on-surface">{venue?.name}</strong> is locked in.
        </p>

        <Card tier="low" padding="md" className="text-left mb-6 space-y-2">
          <DetailRow icon={Calendar} label="Date" value={form.booking_date} />
          <DetailRow icon={Clock} label="Time" value={`${form.start_time} – ${form.end_time}`} />
          <DetailRow icon={Users} label="Guests" value={form.guests_count} />
        </Card>

        {success.loyaltyPointsEarned > 0 && (
          <p className="text-sm font-bold text-primary mb-6 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            +{success.loyaltyPointsEarned} loyalty points earned!
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={onMyBookings} variant="primary">View My Bookings</Button>
          <Button onClick={onBrowse} variant="secondary">Browse More</Button>
        </div>
      </Card>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-on-surface-variant">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </span>
      <span className="font-bold text-on-surface">{value}</span>
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 h-[600px] bg-surface-container rounded-2xl animate-pulse" />
        <div className="col-span-12 lg:col-span-5 h-[600px] bg-surface-container rounded-[2rem] animate-pulse" />
      </div>
    </div>
  );
}
