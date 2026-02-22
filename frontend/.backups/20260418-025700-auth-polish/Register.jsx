import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, MapPin, ArrowRight, Calendar, Building2 } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { api } from '../services/api';

/**
 * Register — split-screen sign-up page.
 *
 * Reference: design-reference/registration_page/screen.png + code.html
 *
 * Layout (per DESIGN.md):
 *  - Left "Visual Anchor": full-bleed photo on `bg-on-secondary-fixed` with
 *    a deep navy gradient overlay. Brand wordmark + editorial headline.
 *  - Right "Form Canvas": clean `bg-surface` canvas with the form.
 *  - Role toggle is a tonal pill (no border) with a `peer-checked` lifted slot.
 *  - All inputs use the `Input` primitive (borderless, focus surface lift).
 *  - "Or sign up with" divider is a centered tonal pill, NOT border lines.
 *  - Primary CTA = `Button variant="primary"` (gradient).
 *
 * Business logic preserved:
 *  - Role toggle (user / owner)
 *  - api.register → onLogin → role-based redirect
 *  - 6+ char password validation
 *  - Phone required for owner role
 */
export default function Register({ onLogin }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const setRole = (role) => setForm((f) => ({ ...f, role }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      const data = await api.register(payload);
      onLogin(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      if (data.user.role === 'owner') navigate('/owner');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 bg-surface">
      {/* ============================================================
          LEFT — VISUAL ANCHOR
          ============================================================ */}
      <section className="relative w-full md:w-1/2 lg:w-[55%] h-72 md:h-auto md:min-h-screen overflow-hidden bg-on-secondary-fixed">
        <img
          src="/images/hero/register-hero.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-secondary-fixed via-on-secondary-fixed/50 to-transparent" />

        <div className="relative h-full flex flex-col justify-between p-8 sm:p-12 lg:p-20">
          {/* Brand wordmark */}
          <Link to="/" className="inline-flex items-center gap-2 group w-fit">
            <MapPin className="h-7 w-7 text-primary-fixed-dim group-hover:scale-110 transition-transform" />
            <span className="text-2xl md:text-3xl font-black tracking-tightest text-white">
              Curator
            </span>
          </Link>

          {/* Editorial headline */}
          <div className="max-w-md">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
              Access Tashkent&rsquo;s most exclusive spaces.
            </h2>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-6">
              Join an elite community of venue owners and connoisseurs seeking
              extraordinary experiences.
            </p>
            <div className="w-16 h-1 bg-primary-container rounded-full" />
          </div>

          {/* Footer caption */}
          <p className="hidden md:block text-on-primary-container/60 text-xs font-medium tracking-widest uppercase">
            Curator · © {new Date().getFullYear()}
          </p>
        </div>
      </section>

      {/* ============================================================
          RIGHT — FORM CANVAS
          ============================================================ */}
      <section className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-surface">
        <div className="w-full max-w-md">
          {/* Header */}
          <header className="mb-8">
            <h3 className="text-3xl font-bold tracking-tight text-on-surface mb-2">
              Create your account
            </h3>
            <p className="text-on-surface-variant">
              Enter your details to begin your curated journey.
            </p>
          </header>

          {/* Inline error — Card callout, no border */}
          {error && (
            <Card tier="low" padding="sm" className="mb-6 bg-error/5">
              <p className="text-sm font-semibold text-error">{error}</p>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Toggle — tonal pill, no border */}
            <RoleToggle value={form.role} onChange={setRole} />

            {/* Full Name */}
            <Input
              label="Full Name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              icon={User}
              placeholder="Aziz Karimov"
              autoComplete="name"
              required
            />

            {/* Email */}
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              icon={Mail}
              placeholder="you@smartbook.uz"
              autoComplete="email"
              required
            />

            {/* Phone */}
            <Input
              label={`Phone Number${form.role === 'owner' ? ' *' : ''}`}
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              icon={Phone}
              placeholder="+998 90 123 45 67"
              autoComplete="tel"
              required={form.role === 'owner'}
              hint={form.role === 'owner' ? 'Required for venue owners — used for booking notifications.' : undefined}
            />

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                icon={Lock}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <Input
                label="Confirm"
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                value={form.confirm_password}
                onChange={handleChange}
                icon={Lock}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="-mt-2 ml-auto block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              {showPassword ? 'Hide passwords' : 'Show passwords'}
            </button>

            {/* T&C */}
            <label className="flex items-start gap-3 cursor-pointer group pt-1">
              <span className="relative inline-flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="peer h-5 w-5 rounded-md bg-surface-container-low text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-primary transition-colors"
                />
                <svg
                  className="absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3"
                >
                  <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm text-on-surface-variant leading-snug group-hover:text-on-surface transition-colors">
                I agree to the{' '}
                <Link to="/help" className="text-primary font-medium hover:underline underline-offset-4">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/help" className="text-primary font-medium hover:underline underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              iconRight={ArrowRight}
            >
              {form.role === 'owner' ? 'Register as Venue Owner' : 'Create Account'}
            </Button>
          </form>

          {/* "or sign up with" — tonal pill, NO border line */}
          <div className="my-8 flex items-center justify-center">
            <span className="px-4 py-1.5 bg-surface-container-low rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Or sign up with
            </span>
          </div>

          {/* Social signup placeholders (OAuth not wired) */}
          <div className="grid grid-cols-2 gap-3">
            <SocialButton label="Google" disabled />
            <SocialButton label="Apple" disabled />
          </div>

          {/* Footer link */}
          <footer className="mt-8 text-center">
            <p className="text-on-surface-variant text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary font-bold hover:underline underline-offset-4 decoration-2 ml-1"
              >
                Sign in
              </Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

/**
 * RoleToggle — segmented pill switch for the user/owner selection.
 * Tonal pill (`bg-surface-container-low`) with a `bg-surface-container-lowest`
 * lifted slot for the active option. No borders.
 */
function RoleToggle({ value, onChange }) {
  const opts = [
    { value: 'user', label: 'I want to book', icon: Calendar },
    { value: 'owner', label: 'I own a venue', icon: Building2 },
  ];
  return (
    <div className="flex p-1 bg-surface-container-low rounded-xl mb-2">
      {opts.map(({ value: v, label, icon: Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all',
              active
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * SocialButton — placeholder OAuth provider button (backend not wired).
 */
function SocialButton({ label, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-container-lowest hover:bg-surface-container-low rounded-xl text-sm font-semibold text-on-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary-container/20" />
      {label}
    </button>
  );
}
