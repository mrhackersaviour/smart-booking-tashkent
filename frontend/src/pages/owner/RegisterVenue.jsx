import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Image as ImageIcon, FileCheck, Check, User,
  Mail, Phone, ShieldCheck, Lightbulb, ArrowRight, Box, Globe,
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui';
import { api } from '../../services/api';

/**
 * RegisterVenue — 4-step venue onboarding wizard.
 *
 * Reference: design-reference/venue_registration_step_1/
 *
 * Step 1 (Business Info) is the fully-designed editorial step:
 *  - 4-step horizontal Stepper.
 *  - Bento: 8-col main form Card + 4-col side stack
 *    (Bank-Grade Security trust card on `bg-on-secondary-fixed`,
 *     Pro Tip card, Coming Next visual card).
 *  - Footer stats row (12k+ / 98% / 15m / 24/7).
 *
 * Steps 2–4 reuse the existing venue fields condensed into the same
 * bento canvas. Submit (final step) calls `api.ownerRegisterVenue`.
 *
 * Business info fields (legal_name, registration_number, owner_contact,
 * professional_email, business_phone) are NOT yet on the backend payload —
 * they are stored in local state only. TODO: extend POST /owner/venues to
 * persist them when backend ships.
 *
 * Sidebar / topbar already provided by `OwnerLayout` — this page renders
 * only the canvas content.
 */

const STEPS = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'Venue Details', icon: MapPin },
  { id: 3, label: 'Upload Media', icon: ImageIcon },
  { id: 4, label: 'Review', icon: FileCheck },
];

const VENUE_TYPES = [
  { value: 'cafe', label: 'Cafe' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'stadium', label: 'Stadium' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'carwash', label: 'Car Wash' },
];

const DISTRICTS = [
  'Bektemir', 'Chilanzar', 'Yakkasaray', 'Yunusabad', 'Mirzo Ulugbek',
  'Mirabad', 'Sergeli', 'Shaykhontohur', 'Olmazar', 'Uchtepa', 'Yashnobod',
];

const EMPTY = {
  // Step 1 — Business
  legal_name: '',
  registration_number: '',
  owner_contact: '',
  professional_email: '',
  business_phone: '',
  // Step 2 — Venue
  name: '', type: '', address: '', district: '',
  description: '', cuisine_type: '', price_range: 2,
  phone: '', website: '', latitude: '', longitude: '',
  // Step 3 — Media
  three_d_model_url: '',
};

export default function RegisterVenue() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const change = (e) => update(e.target.name, e.target.value);

  const validateStep = () => {
    if (step === 1) {
      if (!form.legal_name || !form.professional_email) {
        setError('Business name and professional email are required.');
        return false;
      }
    }
    if (step === 2) {
      if (!form.name || !form.type || !form.address || !form.district) {
        setError('Venue name, type, address and district are required.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(4, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.ownerRegisterVenue({
        name: form.name,
        type: form.type,
        address: form.address,
        district: form.district,
        description: form.description,
        cuisine_type: form.cuisine_type,
        price_range: parseInt(form.price_range, 10),
        phone: form.phone || form.business_phone,
        website: form.website,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        three_d_model_url: form.three_d_model_url,
      });
      setSuccess(true);
      setTimeout(() => navigate('/owner/venues'), 1800);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <Card padding="lg" className="text-center rounded-3xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tightest text-on-surface mb-2">
            Venue Submitted!
          </h2>
          <p className="text-on-surface-variant">
            Your venue has been queued for admin review. Redirecting…
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12">
      {/* ============================================================
          STEPPER
          ============================================================ */}
      <Stepper currentStep={step} />

      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="mt-12 mb-10 text-center md:text-left">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
          Step {step} of 4
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tightest text-on-surface mb-3">
          {step === 1 && 'Kickstart your partnership'}
          {step === 2 && 'Tell us about your venue'}
          {step === 3 && 'Add visual storytelling'}
          {step === 4 && 'Review & submit'}
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          {step === 1 && 'Provide your business essentials to begin listing premium venues on Curator.'}
          {step === 2 && 'The details guests will see when discovering your space.'}
          {step === 3 && 'A 3D model link makes your listing stand out (optional).'}
          {step === 4 && 'Confirm everything looks right before submitting for admin approval.'}
        </p>
      </header>

      {error && (
        <Card tier="low" padding="sm" className="bg-error/5 max-w-3xl mb-6">
          <p className="text-sm font-semibold text-error">{error}</p>
        </Card>
      )}

      {/* ============================================================
          BENTO GRID
          ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main form */}
        <Card padding="lg" className="md:col-span-8 rounded-3xl">
          {step === 1 && <BusinessInfoStep form={form} onChange={change} />}
          {step === 2 && <VenueDetailsStep form={form} onChange={change} update={update} />}
          {step === 3 && <MediaStep form={form} onChange={change} />}
          {step === 4 && <ReviewStep form={form} />}

          {/* Action row */}
          <div className="mt-10 pt-2 flex justify-between items-center gap-4">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setForm(EMPTY)}
                className="text-on-surface-variant font-semibold hover:text-on-surface transition-colors text-sm"
              >
                Clear all
              </button>
            ) : (
              <Button variant="ghost" onClick={prev}>
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={next}
              >
                {step === 1 && 'Continue to Venue Details'}
                {step === 2 && 'Continue to Media'}
                {step === 3 && 'Continue to Review'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                loading={loading}
                onClick={submit}
              >
                Submit for Review
              </Button>
            )}
          </div>
        </Card>

        {/* Side stack */}
        <div className="md:col-span-4 space-y-6">
          <TrustCard />
          <ProTipCard />
          <ComingNextCard step={step} />
        </div>
      </div>

      {/* ============================================================
          FOOTER STATS
          ============================================================ */}
      <section className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
        {[
          { v: '12k+', l: 'Venues Managed' },
          { v: '98%', l: 'Safety Score' },
          { v: '15m', l: 'Avg Setup Time' },
          { v: '24/7', l: 'Partner Support' },
        ].map((s) => (
          <div key={s.l} className="text-center p-4">
            <p className="text-3xl md:text-4xl font-extrabold tracking-tightest text-on-surface">
              {s.v}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">
              {s.l}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ============================================================
   Stepper
   ============================================================ */

function Stepper({ currentStep }) {
  const pct = ((currentStep - 1) / (STEPS.length - 1)) * 100;
  return (
    <div className="relative flex justify-between items-start w-full">
      {/* Track */}
      <div className="absolute top-5 left-0 right-0 h-[2px] bg-surface-container-high rounded-full -z-10" />
      <div
        className="absolute top-5 left-0 h-[2px] bg-gradient-to-r from-primary to-primary-container rounded-full -z-10 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
      {STEPS.map((s) => {
        const done = currentStep > s.id;
        const active = currentStep === s.id;
        return (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                done
                  ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-ambient'
                  : active
                  ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-ambient ring-4 ring-primary/15'
                  : 'bg-surface-container-lowest text-on-surface-variant ring-2 ring-surface-container-high',
              ].join(' ')}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : s.id}
            </div>
            <span
              className={[
                'text-xs text-center max-w-[80px]',
                active || done
                  ? 'font-bold text-on-surface'
                  : 'font-medium text-on-surface-variant',
              ].join(' ')}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Step 1 — Business Info
   ============================================================ */

function BusinessInfoStep({ form, onChange }) {
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Business Name" name="legal_name" value={form.legal_name} onChange={onChange} placeholder="Legal entity name" />
        <Field label="Registration Number" name="registration_number" value={form.registration_number} onChange={onChange} placeholder="Tax ID or Business ID" />
      </div>
      <Field
        label="Owner / Point of Contact"
        name="owner_contact"
        value={form.owner_contact}
        onChange={onChange}
        placeholder="Full legal name"
        icon={User}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Professional Email"
          name="professional_email"
          type="email"
          value={form.professional_email}
          onChange={onChange}
          placeholder="contact@business.com"
          icon={Mail}
        />
        <Field
          label="Phone Number"
          name="business_phone"
          type="tel"
          value={form.business_phone}
          onChange={onChange}
          placeholder="+998 90 000 00 00"
          icon={Phone}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Step 2 — Venue Details
   ============================================================ */

function VenueDetailsStep({ form, onChange }) {
  return (
    <div className="space-y-7">
      <Field label="Venue Name" name="name" value={form.name} onChange={onChange} placeholder="e.g. Afsona Restaurant" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField label="Venue Type" name="type" value={form.type} onChange={onChange}>
          <option value="">Select type…</option>
          {VENUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </SelectField>
        <SelectField label="Price Range" name="price_range" value={form.price_range} onChange={onChange}>
          <option value="1">Budget</option>
          <option value="2">Moderate</option>
          <option value="3">Upscale</option>
          <option value="4">Luxury</option>
        </SelectField>
      </div>
      <Field label="Address" name="address" value={form.address} onChange={onChange} placeholder="Full street address" icon={MapPin} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField label="District" name="district" value={form.district} onChange={onChange}>
          <option value="">Select district…</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </SelectField>
        {(form.type === 'restaurant' || form.type === 'cafe') && (
          <Field label="Cuisine Type" name="cuisine_type" value={form.cuisine_type} onChange={onChange} placeholder="Uzbek, Italian…" />
        )}
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={4}
          placeholder="Tell guests what makes your venue distinctive…"
          className="mt-2 w-full bg-surface-container-low rounded-xl p-4 text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border-none transition-all resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude" name="latitude" value={form.latitude} onChange={onChange} placeholder="41.2995" />
        <Field label="Longitude" name="longitude" value={form.longitude} onChange={onChange} placeholder="69.2401" />
      </div>
    </div>
  );
}

/* ============================================================
   Step 3 — Media
   ============================================================ */

function MediaStep({ form, onChange }) {
  return (
    <div className="space-y-7">
      <div className="rounded-2xl bg-surface-container-low p-10 text-center">
        <ImageIcon className="h-12 w-12 text-on-surface-variant/50 mx-auto mb-4" />
        <p className="text-on-surface font-bold mb-1">Photo upload coming soon</p>
        <p className="text-on-surface-variant text-sm">
          For now, you can paste a 3D model URL below. Photo uploads will activate once your venue is approved.
        </p>
      </div>
      <Field
        label="3D Model URL (optional)"
        name="three_d_model_url"
        type="url"
        value={form.three_d_model_url}
        onChange={onChange}
        placeholder="https://… .glb or .gltf"
        icon={Box}
      />
      <Field
        label="Website (optional)"
        name="website"
        type="url"
        value={form.website}
        onChange={onChange}
        placeholder="https://…"
        icon={Globe}
      />
    </div>
  );
}

/* ============================================================
   Step 4 — Review
   ============================================================ */

function ReviewStep({ form }) {
  const rows = [
    ['Business Name', form.legal_name],
    ['Registration #', form.registration_number],
    ['Contact', form.owner_contact],
    ['Email', form.professional_email],
    ['Venue Name', form.name],
    ['Type', form.type],
    ['District', form.district],
    ['Address', form.address],
    ['Price Range', ['Budget', 'Moderate', 'Upscale', 'Luxury'][parseInt(form.price_range, 10) - 1]],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between items-start gap-4 p-4 rounded-xl bg-surface-container-low/60">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{k}</span>
          <span className="text-sm font-semibold text-on-surface text-right">{v || '—'}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Reusable form atoms (page-local)
   ============================================================ */

function FieldLabel({ children }) {
  return (
    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
      {children}
    </label>
  );
}

function Field({ label, name, value, onChange, placeholder, type = 'text', icon: Icon }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/60" />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={[
            'w-full bg-surface-container-low rounded-xl p-4 text-on-surface placeholder:text-on-surface-variant/50',
            'focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border-none transition-all',
            Icon ? 'pl-11' : '',
          ].join(' ')}
        />
      </div>
    </div>
  );
}

function SelectField({ label, name, value, onChange, children }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-surface-container-low rounded-xl p-4 text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border-none transition-all"
      >
        {children}
      </select>
    </div>
  );
}

/* ============================================================
   Side cards
   ============================================================ */

function TrustCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-on-secondary-fixed text-white p-8">
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <ShieldCheck className="h-9 w-9 text-tertiary-fixed-dim mb-4" />
        <h3 className="text-xl font-extrabold tracking-tightest mb-2">Bank-Grade Security</h3>
        <p className="text-white/70 text-sm leading-relaxed">
          Your business registration data is encrypted and handled with the highest security standards. We only use this for verification purposes.
        </p>
      </div>
    </div>
  );
}

function ProTipCard() {
  return (
    <Card tier="low" padding="lg" className="rounded-3xl">
      <div className="flex items-center gap-3 mb-3">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h4 className="font-extrabold tracking-tightest text-on-surface">Pro Tip</h4>
      </div>
      <p className="text-on-surface-variant text-sm italic leading-relaxed">
        “High-quality media and precise registration details increase your venue&rsquo;s trust score, leading to 3x more corporate bookings.”
      </p>
    </Card>
  );
}

function ComingNextCard({ step }) {
  const next = STEPS[Math.min(step, STEPS.length - 1)];
  return (
    <div className="relative h-48 rounded-3xl overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-on-secondary-fixed via-on-secondary-fixed to-primary-container/40" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/25 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-tertiary/20 rounded-full blur-3xl" />
      <div className="relative z-10 h-full p-6 flex flex-col justify-end">
        <Badge variant="primary" className="self-start mb-2">Coming Next</Badge>
        <p className="text-white font-extrabold tracking-tightest text-lg">{next.label}</p>
      </div>
    </div>
  );
}
