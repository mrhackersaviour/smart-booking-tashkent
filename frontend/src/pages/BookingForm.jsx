import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Users, CheckCircle, Box, Grid3X3,
  ArrowLeft, ArrowRight, ShieldCheck, Crown, Sparkles, MapPin,
  Plus, Minus, BadgeCheck, Armchair, CreditCard, Wallet,
  Building2, Phone, Mail, FileText, Gift, Star, Download,
} from 'lucide-react';
import { Button, Card, Badge, useToast } from '../components/ui';
import { api } from '../services/api';
import VenueViewer3D from '../components/three-d/VenueViewer3D';
import { getVenueImage } from '../components/venues/VenueCard';

const STEPS = [
  { id: 'seat', label: 'Select Seat', icon: Armchair },
  { id: 'details', label: 'Details', icon: BadgeCheck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'confirmation', label: 'Confirmed', icon: CheckCircle },
];

const stepTransition = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
};

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [venue, setVenue] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('seat');

  const [form, setForm] = useState({
    booking_date: '', start_time: '', end_time: '',
    guests_count: 2, table_id: '', special_requests: '',
    contact_name: '', contact_phone: '', contact_email: '',
    payment_method: 'card',
  });

  const [availability, setAvailability] = useState(null);
  const [view3D, setView3D] = useState(false);
  const [model3D, setModel3D] = useState(null);

  useEffect(() => {
    api.getVenue(id)
      .then((data) => { setVenue(data.venue); setTables(data.tables || []); })
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
    api.getVenue3DModel(id).then(setModel3D).catch(() => setModel3D(null));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === 'guests_count' ? parseInt(value) : value }));
  };
  const setGuests = (n) => setForm((p) => ({ ...p, guests_count: Math.max(1, Math.min(20, n)) }));

  const timeSlots = useMemo(() => {
    const out = [];
    for (let h = 7; h <= 23; h++) { out.push(`${h.toString().padStart(2, '0')}:00`); out.push(`${h.toString().padStart(2, '0')}:30`); }
    return out;
  }, []);

  const minDate = useMemo(() => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  }, []);

  const tableStates = useMemo(() => {
    const source = availability || tables;
    return source.map((t) => {
      const booked = availability ? t.booked_slots?.length > 0 : !t.is_available;
      const tooSmall = t.capacity < form.guests_count;
      return { ...t, status: booked ? 'booked' : tooSmall ? 'small' : 'available' };
    });
  }, [tables, availability, form.guests_count]);

  const selectedTable = tableStates.find((t) => t.id === form.table_id);
  const basePrice = (venue?.price_range || 1) * 30000;
  const pricePerGuest = useMemo(() => {
    if (selectedTable?.price_per_hour) return selectedTable.price_per_hour;
    if (selectedTable?.price_multiplier) return basePrice * selectedTable.price_multiplier;
    if (tables.length > 0) {
      const prices = tables.map((t) => t.price_per_hour || (basePrice * (t.price_multiplier || 1))).filter(Boolean);
      if (prices.length > 0) return Math.min(...prices);
    }
    return basePrice;
  }, [selectedTable, tables, basePrice]);
  const total = pricePerGuest * form.guests_count;

  const canProceedFromSeat = form.booking_date && form.start_time && form.end_time;
  const canProceedFromDetails = form.contact_name && form.contact_phone;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        venue_id: id, booking_date: form.booking_date,
        start_time: form.start_time, end_time: form.end_time,
        guests_count: form.guests_count,
        special_requests: form.special_requests || undefined,
        table_id: form.table_id || undefined,
      };
      const data = await api.createBooking(payload);
      setSuccess(data);
      setStep('confirmation');
      toast.success('Booking confirmed!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (step === 'payment') { handleSubmit(); return; }
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };
  const goBack = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  if (loading) return <BookingSkeleton />;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen">
      {/* Step Indicator */}
      <div className="bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between gap-4">
          {step !== 'confirmation' ? (
            <button onClick={step === 'seat' ? () => navigate(`/venues/${id}`) : goBack}
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> {step === 'seat' ? 'Back to venue' : 'Back'}
            </button>
          ) : <div />}
          <StepIndicator currentStep={step} />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-10">
        <AnimatePresence mode="wait">
          {step === 'seat' && (
            <motion.div key="seat" {...stepTransition} className="grid grid-cols-12 gap-8">
              {/* LEFT — Floor Plan */}
              <section className="col-span-12 lg:col-span-7 space-y-6">
                <Card tier="low" padding="lg" className="relative min-h-[500px] flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Step 1 · Select your spot</p>
                      <h3 className="text-2xl font-extrabold tracking-tightest text-on-surface">{venue?.name || 'Main Hall'}</h3>
                      <p className="text-on-surface-variant text-sm">{tables.length} tables · Pick the one that suits you</p>
                    </div>
                    <ViewToggle view3D={view3D} onChange={setView3D} />
                  </div>

                  <Card tier="lowest" padding="md" className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DateTimeField icon={Calendar} label="Date" type="date" name="booking_date" value={form.booking_date} onChange={handleChange} min={minDate} />
                      <DateTimeField icon={Clock} label="Start Time" as="select" name="start_time" value={form.start_time} onChange={handleChange}>
                        <option value="">Select</option>
                        {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                      </DateTimeField>
                      <DateTimeField icon={Clock} label="End Time" as="select" name="end_time" value={form.end_time} onChange={handleChange}>
                        <option value="">Select</option>
                        {timeSlots.filter((t) => t > form.start_time).map((t) => <option key={t} value={t}>{t}</option>)}
                      </DateTimeField>
                    </div>
                  </Card>

                  <Card tier="lowest" padding="lg" className="flex-1 flex flex-col items-center justify-center">
                    {!canProceedFromSeat ? (
                      <div className="text-center py-16 text-on-surface-variant">
                        <Armchair className="h-12 w-12 mx-auto mb-4 opacity-25" />
                        <p className="text-lg font-bold text-on-surface mb-1">Select date & time first</p>
                        <p className="text-sm">Choose a date, start time, and end time above to see available seats.</p>
                      </div>
                    ) : view3D ? (
                      <VenueViewer3D tables={tableStates} sceneConfig={model3D?.scene || {}} selectedTableId={form.table_id}
                        unavailableTableIds={tableStates.filter((t) => t.status !== 'available').map((t) => t.id)}
                        onTableSelect={(table) => setForm((p) => ({ ...p, table_id: table.id }))} venueName={venue?.name || ''} className="h-80 w-full" />
                    ) : (
                      <FloorPlan tables={tableStates} selectedId={form.table_id} onSelect={(t) => setForm((p) => ({ ...p, table_id: t.id }))} />
                    )}
                  </Card>
                  <SeatLegend />
                </Card>
              </section>

              {/* RIGHT — Summary */}
              <aside className="col-span-12 lg:col-span-5 space-y-6">
                <BookingSummaryCard venue={venue} selectedTable={selectedTable} pricePerGuest={pricePerGuest} total={total}
                  guests={form.guests_count} setGuests={setGuests} form={form} handleChange={handleChange} />
                <Button variant="primary" size="lg" fullWidth iconRight={ArrowRight} disabled={!canProceedFromSeat} onClick={goNext}>
                  Continue to Details
                </Button>
              </aside>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div key="details" {...stepTransition} className="max-w-3xl mx-auto space-y-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Step 2 · Your details</p>
                <h3 className="text-3xl font-extrabold tracking-tightest text-on-surface">Contact Information</h3>
                <p className="text-on-surface-variant mt-1">We'll send your booking confirmation to these details.</p>
              </div>

              <Card padding="lg" className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Full Name *</FieldLabel>
                    <div className="relative">
                      <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <input name="contact_name" value={form.contact_name} onChange={handleChange} required placeholder="Aziz Karimov"
                        className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Phone Number *</FieldLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <input name="contact_phone" value={form.contact_phone} onChange={handleChange} required placeholder="+998 90 123 45 67" type="tel"
                        className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all" />
                    </div>
                  </div>
                </div>
                <div>
                  <FieldLabel>Email (optional)</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <input name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="you@example.com" type="email"
                      className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Special Requests</FieldLabel>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-primary" />
                    <textarea name="special_requests" value={form.special_requests} onChange={handleChange} rows={3}
                      placeholder="Birthday, dietary needs, accessibility..."
                      className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all resize-none" />
                  </div>
                </div>
              </Card>

              {/* Booking recap */}
              <Card tier="low" padding="md" className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Booking Summary</p>
                <DetailRow icon={Building2} label="Venue" value={venue?.name} />
                <DetailRow icon={Calendar} label="Date" value={form.booking_date} />
                <DetailRow icon={Clock} label="Time" value={`${form.start_time} – ${form.end_time}`} />
                <DetailRow icon={Users} label="Guests" value={form.guests_count} />
                <DetailRow icon={Armchair} label="Table" value={selectedTable ? (selectedTable.label || `#${selectedTable.table_number}`) : 'Auto-assign'} />
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold">Total</span>
                  <span className="text-2xl font-black text-on-surface tracking-tightest">{total.toLocaleString()} UZS</span>
                </div>
              </Card>

              <div className="flex gap-4">
                <Button variant="secondary" size="lg" onClick={goBack} className="flex-1">Back</Button>
                <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={goNext} disabled={!canProceedFromDetails} className="flex-[2]">
                  Continue to Payment
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div key="payment" {...stepTransition} className="max-w-3xl mx-auto space-y-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Step 3 · Payment</p>
                <h3 className="text-3xl font-extrabold tracking-tightest text-on-surface">Choose Payment Method</h3>
              </div>

              {/* Payment methods */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'card', label: 'Credit Card', icon: CreditCard, desc: 'Visa, Mastercard' },
                  { id: 'payme', label: 'Payme', icon: Wallet, desc: 'Mobile payment' },
                  { id: 'cash', label: 'Pay at Venue', icon: Building2, desc: 'Cash on arrival' },
                ].map((m) => (
                  <motion.button key={m.id} type="button" onClick={() => setForm((p) => ({ ...p, payment_method: m.id }))}
                    whileTap={{ scale: 0.97 }}
                    className={`p-5 rounded-2xl text-left transition-all ${form.payment_method === m.id
                      ? 'bg-primary/8 ring-2 ring-primary shadow-ambient'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low'}`}
                  >
                    <m.icon className={`h-6 w-6 mb-3 ${form.payment_method === m.id ? 'text-primary' : 'text-on-surface-variant'}`} />
                    <p className="font-bold text-on-surface text-sm">{m.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{m.desc}</p>
                  </motion.button>
                ))}
              </div>

              {/* Card form (shown for card method) */}
              {form.payment_method === 'card' && (
                <Card padding="lg" className="space-y-4">
                  <div>
                    <FieldLabel>Card Number</FieldLabel>
                    <input placeholder="1234 5678 9012 3456" className="w-full py-3 px-4 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono tracking-wider" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><FieldLabel>Expiry</FieldLabel><input placeholder="MM/YY" className="w-full py-3 px-4 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono" /></div>
                    <div><FieldLabel>CVV</FieldLabel><input placeholder="123" type="password" maxLength={4} className="w-full py-3 px-4 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono" /></div>
                  </div>
                </Card>
              )}

              {form.payment_method === 'payme' && (
                <Card padding="lg" className="text-center py-10">
                  <Wallet className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="font-bold text-on-surface mb-1">Payme orqali to'lash</p>
                  <p className="text-sm text-on-surface-variant">Tasdiqlash tugmasini bosgandan keyin Payme ilovasiga yo'naltirilasiz.</p>
                </Card>
              )}

              {form.payment_method === 'cash' && (
                <Card padding="lg" className="text-center py-10">
                  <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="font-bold text-on-surface mb-1">Venue'da naqd to'lash</p>
                  <p className="text-sm text-on-surface-variant">Bron tasdiqlangandan keyin venue'ga kelganingizda to'laysiz.</p>
                </Card>
              )}

              {/* Total */}
              <Card tier="low" padding="md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-on-surface-variant">Total Amount</p>
                    <p className="text-3xl font-extrabold text-on-surface tracking-tightest">{total.toLocaleString()} UZS</p>
                  </div>
                  <Badge variant="success" size="md"><ShieldCheck className="h-3 w-3" /> Secure</Badge>
                </div>
              </Card>

              {error && <Card tier="low" padding="sm" className="bg-error/5"><p className="text-sm font-semibold text-error">{error}</p></Card>}

              <div className="flex gap-4">
                <Button variant="secondary" size="lg" onClick={goBack} className="flex-1">Back</Button>
                <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={goNext} loading={submitting} className="flex-[2]">
                  {submitting ? 'Processing...' : form.payment_method === 'cash' ? 'Confirm Booking' : `Pay ${total.toLocaleString()} UZS`}
                </Button>
              </div>

              <p className="text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
                By continuing you agree to our Terms & Privacy
              </p>
            </motion.div>
          )}

          {step === 'confirmation' && success && (
            <motion.div key="confirmation" {...stepTransition} className="max-w-lg mx-auto text-center py-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto mb-8 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Badge variant="success" className="mb-4">Confirmed</Badge>
                <h2 className="text-4xl font-extrabold text-on-surface tracking-tightest mb-3">Booking Confirmed!</h2>
                <p className="text-on-surface-variant mb-8">
                  Your reservation at <strong className="text-on-surface">{venue?.name}</strong> is locked in.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card padding="lg" className="text-left mb-8 space-y-3 rounded-2xl shadow-ambient">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Reservation Details</p>
                  <DetailRow icon={Building2} label="Venue" value={venue?.name} />
                  <DetailRow icon={Calendar} label="Date" value={form.booking_date} />
                  <DetailRow icon={Clock} label="Time" value={`${form.start_time} – ${form.end_time}`} />
                  <DetailRow icon={Users} label="Guests" value={form.guests_count} />
                  <DetailRow icon={Armchair} label="Table" value={selectedTable ? (selectedTable.label || `#${selectedTable.table_number}`) : 'Auto-assigned'} />
                  <DetailRow icon={CreditCard} label="Payment" value={form.payment_method === 'cash' ? 'At venue' : form.payment_method === 'payme' ? 'Payme' : 'Card'} />
                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-on-surface-variant font-bold">Total Paid</span>
                    <span className="text-2xl font-black text-primary tracking-tightest">{total.toLocaleString()} UZS</span>
                  </div>
                </Card>

                {success.loyaltyPointsEarned > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
                    className="flex items-center justify-center gap-2 text-sm font-bold text-primary mb-8 p-4 bg-primary/5 rounded-xl">
                    <Gift className="h-5 w-5" />
                    +{success.loyaltyPointsEarned} loyalty points earned!
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate('/my-bookings')} variant="primary" iconLeft={CalendarDays}>View My Bookings</Button>
                  <Button onClick={() => navigate('/venues')} variant="secondary" iconLeft={Star}>Browse More</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
    <div className="hidden md:flex items-center gap-1">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const active = idx === currentIdx;
        const done = idx < currentIdx;
        return (
          <div key={s.id} className="flex items-center">
            <motion.div
              animate={active ? { scale: 1 } : done ? { scale: 0.95 } : { scale: 0.95 }}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
                active ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient'
                  : done ? 'bg-emerald-500/15 text-emerald-700' : 'text-on-surface-variant',
              ].join(' ')}
            >
              {done ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
            </motion.div>
            {idx < STEPS.length - 1 && <span className={`mx-1 w-6 h-px ${done ? 'bg-emerald-500' : 'bg-outline-variant/40'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function BookingSummaryCard({ venue, selectedTable, pricePerGuest, total, guests, setGuests, form, handleChange }) {
  return (
    <Card padding="lg" className="rounded-[2rem] shadow-ambient flex flex-col gap-6">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-2xl bg-surface-container overflow-hidden shrink-0">
          {venue && <img src={getVenueImage(venue)} alt={venue.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
        </div>
        <div className="min-w-0">
          <Badge variant="primary" size="sm">Premium</Badge>
          <h4 className="text-lg font-bold text-on-surface mt-1 truncate">{venue?.name}</h4>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{venue?.district}</p>
        </div>
      </div>
      <div>
        <FieldLabel>Selected Table</FieldLabel>
        <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-2 min-w-0">
            <Armchair className="h-4 w-4 text-primary shrink-0" />
            <span className="font-bold text-on-surface text-sm truncate">{selectedTable ? (selectedTable.label || `#${selectedTable.table_number}`) : 'Auto-assign'}</span>
          </div>
          <span className="text-primary font-bold text-sm">{pricePerGuest.toLocaleString()} UZS</span>
        </div>
      </div>
      <div>
        <FieldLabel>Guests</FieldLabel>
        <div className="flex items-center justify-between p-1.5 bg-surface-container-low rounded-xl">
          <StepperBtn onClick={() => setGuests(guests - 1)}><Minus className="h-4 w-4" /></StepperBtn>
          <span className="font-bold text-on-surface">{String(guests).padStart(2, '0')}</span>
          <StepperBtn onClick={() => setGuests(guests + 1)}><Plus className="h-4 w-4" /></StepperBtn>
        </div>
      </div>
      <div className="pt-2 flex justify-between items-end">
        <div><p className="text-xs text-on-surface-variant">Total</p><p className="text-2xl font-extrabold text-on-surface tracking-tightest">{total.toLocaleString()} UZS</p></div>
        <Badge variant="success" size="md"><ShieldCheck className="h-3 w-3" /> Secure</Badge>
      </div>
    </Card>
  );
}

function ViewToggle({ view3D, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
      <button type="button" onClick={() => onChange(false)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!view3D ? 'bg-surface-container-lowest text-on-surface shadow-ambient' : 'text-on-surface-variant'}`}>
        <Grid3X3 className="h-3.5 w-3.5" /> Grid</button>
      <button type="button" onClick={() => onChange(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${view3D ? 'bg-surface-container-lowest text-on-surface shadow-ambient' : 'text-on-surface-variant'}`}>
        <Box className="h-3.5 w-3.5" /> 3D</button>
    </div>
  );
}

function FloorPlan({ tables, selectedId, onSelect }) {
  if (tables.length === 0) return <div className="text-center py-12 text-on-surface-variant"><Armchair className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No tables available.</p></div>;
  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 items-center">
      <div className="w-full max-w-md h-10 bg-gradient-to-b from-on-secondary-fixed to-on-secondary-fixed/70 rounded-t-full flex items-center justify-center">
        <span className="text-white text-[10px] font-bold tracking-[0.3em] uppercase">Front · Entrance</span>
      </div>
      <button type="button" onClick={() => onSelect({ id: '' })} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${!selectedId ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>
        Auto-assign
      </button>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
        {tables.map((t) => {
          const isSelected = t.id === selectedId;
          const disabled = t.status !== 'available';
          const styles = isSelected ? 'bg-gradient-to-br from-primary to-primary-container text-white ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest scale-110 shadow-ambient'
            : t.status === 'available' ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/30 cursor-pointer'
            : t.status === 'booked' ? 'bg-error/15 text-error/60 cursor-not-allowed' : 'bg-surface-container text-outline cursor-not-allowed';
          return (
            <button key={t.id} type="button" disabled={disabled} onClick={() => onSelect(t)}
              title={`${t.label || `#${t.table_number}`} · ${t.capacity} seats${t.is_vip ? ' · VIP' : ''}`}
              className={`relative w-12 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${styles}`}>
              {t.is_vip && <Crown className="absolute -top-1.5 -right-1.5 h-3 w-3 text-amber-500 fill-amber-500" />}
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
      {[['bg-emerald-500', 'Available'], ['bg-error', 'Booked'], ['bg-outline-variant', 'Too Small'], ['bg-gradient-to-r from-primary to-primary-container', 'Selected']].map(([c, l]) => (
        <div key={l} className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${c}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{l}</span></div>
      ))}
    </div>
  );
}

function FieldLabel({ children }) { return <label className="block text-[10px] font-bold text-outline uppercase tracking-[0.15em] mb-2">{children}</label>; }
function StepperBtn({ children, ...rest }) { return <button type="button" {...rest} className="w-9 h-9 flex items-center justify-center bg-surface-container-lowest text-primary rounded-lg shadow-ambient hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white transition-all">{children}</button>; }

function DateTimeField({ icon: Icon, label, as, name, value, onChange, children, ...rest }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
        {as === 'select' ? (
          <select name={name} value={value} onChange={onChange} required className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all" {...rest}>{children}</select>
        ) : (
          <input type="date" name={name} value={value} onChange={onChange} required className="w-full pl-10 pr-3 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all" {...rest} />
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-on-surface-variant"><Icon className="h-4 w-4 text-primary" /> {label}</span><span className="font-bold text-on-surface">{value}</span></div>;
}

function BookingSkeleton() {
  return <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen p-8"><div className="max-w-7xl mx-auto grid grid-cols-12 gap-8"><div className="col-span-12 lg:col-span-7 h-[600px] bg-surface-container rounded-2xl animate-pulse" /><div className="col-span-12 lg:col-span-5 h-[600px] bg-surface-container rounded-[2rem] animate-pulse" /></div></div>;
}

function CalendarDays_() { return CalendarDays; }
