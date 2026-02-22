import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MapPin, Mail, Lock, HelpCircle, ArrowRight } from 'lucide-react';
import { Button, Input, Card, useToast } from '../components/ui';
import { api } from '../services/api';

/**
 * Login — split-screen sign-in page.
 *
 * Reference: design-reference/login_page/screen.png + code.html
 *
 * Layout (per DESIGN.md):
 *  - Left "Visual Anchor": full-bleed photo on `bg-on-secondary-fixed` ground
 *    with a gradient overlay. Hosts brand wordmark + editorial headline.
 *  - Right "Interaction Canvas": clean `bg-surface` canvas with the form.
 *  - No 1px solid borders. No <hr>. The "or continue with" divider is built
 *    from a tonal background pill, not a border line.
 *  - Floating-label Inputs (from src/components/ui/Input.jsx).
 *  - Primary CTA uses Button variant="primary" (gradient).
 *  - Concierge Help FAB sits bottom-right on the on-secondary-fixed ground.
 *
 * Business logic preserved from previous Login.jsx:
 *  - api.login → onLogin(user, tokens) → role-based redirect.
 */
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      onLogin(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      toast.success(`Welcome back, ${data.user.full_name}!`);
      if (data.user.role === 'owner') navigate('/owner');
      else if (data.user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
      toast.error('Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 bg-surface">
      {/* ============================================================
          LEFT — VISUAL ANCHOR
          ============================================================ */}
      <section className="relative w-full md:w-1/2 lg:w-3/5 h-72 md:h-auto md:min-h-screen overflow-hidden bg-on-secondary-fixed">
        <img
          src="/images/hero/login-hero.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 scale-105"
        />
        {/* Gradient overlay — anchors text legibility, no borders */}
        <div className="absolute inset-0 bg-gradient-to-tr from-on-secondary-fixed via-on-secondary-fixed/50 to-transparent" />

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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Welcome back to your favorite venues
            </h2>
            <div className="w-16 h-1 bg-primary-container rounded-full" />
          </div>

          {/* Footer caption */}
          <p className="hidden md:block text-on-primary-container/60 text-xs font-medium tracking-widest uppercase">
            Curator · © {new Date().getFullYear()}
          </p>
        </div>
      </section>

      {/* ============================================================
          RIGHT — INTERACTION CANVAS
          ============================================================ */}
      <section className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-surface">
        <div className="w-full max-w-sm">
          {/* Header */}
          <header className="mb-10">
            <h3 className="text-3xl font-bold tracking-tight text-on-surface mb-2">
              Sign In
            </h3>
            <p className="text-on-surface-variant">
              Enter your credentials to access your concierge dashboard.
            </p>
          </header>

          {/* Inline error — no border, surface-tier callout */}
          {error && (
            <Card tier="low" padding="sm" className="mb-6 bg-error/5">
              <p className="text-sm font-semibold text-error">{error}</p>
            </Card>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              floating
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              autoComplete="email"
              required
            />

            <Input
              floating
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              iconRight={showPassword ? EyeOff : Eye}
              autoComplete="current-password"
              required
            />

            {/* (Show/hide password — overlay click target on the right icon area) */}
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="-mt-3 ml-auto block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>

            {/* Remember + forgot row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <span className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer h-5 w-5 rounded-md bg-surface-container-low text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-primary transition-colors"
                  />
                  <svg
                    className="absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                    viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3"
                  >
                    <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Remember me
                </span>
              </label>
              <Link
                to="/help"
                className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              iconRight={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          {/* "or continue with" — built from a tonal pill, NO border line */}
          <div className="my-10 flex items-center justify-center">
            <span className="px-4 py-1.5 bg-surface-container-low rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Or continue with
            </span>
          </div>

          {/* Social logins (placeholder — no backend OAuth wired yet) */}
          <div className="grid grid-cols-2 gap-3">
            <SocialButton label="Google" disabled />
            <SocialButton label="Apple" disabled />
          </div>

          {/* Demo credentials — surface-tier callout, no divider */}
          <Card tier="low" padding="sm" className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Demo Credentials
            </p>
            <p className="text-xs text-on-surface-variant font-mono">demo@smartbooking.uz</p>
            <p className="text-xs text-on-surface-variant font-mono">demo123456</p>
          </Card>

          {/* Footer link */}
          <footer className="mt-10 text-center">
            <p className="text-on-surface-variant text-sm">
              New to Curator?{' '}
              <Link
                to="/register"
                className="text-primary font-bold hover:underline underline-offset-4 decoration-2 ml-1"
              >
                Create account
              </Link>
            </p>
          </footer>
        </div>
      </section>

      {/* ============================================================
          CONCIERGE HELP FAB
          ============================================================ */}
      <Link
        to="/help"
        className="fixed bottom-8 right-8 z-50 group flex items-center justify-center w-14 h-14 bg-on-secondary-fixed text-white rounded-full shadow-ambient hover:scale-110 active:scale-95 transition-all"
        aria-label="Concierge Help"
      >
        <HelpCircle className="h-6 w-6" />
        <span className="absolute right-16 bg-on-secondary-fixed text-white px-4 py-2 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Concierge Help
        </span>
      </Link>
    </main>
  );
}

/**
 * SocialButton — placeholder for OAuth providers.
 * Backend OAuth not yet wired; renders disabled until then.
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
