import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, MapPin, Mail, Lock, HelpCircle, ArrowRight } from 'lucide-react';
import { Button, Input, Card, useToast } from '../components/ui';
import { api } from '../services/api';

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
      {/* LEFT — VISUAL ANCHOR */}
      <section className="relative w-full md:w-1/2 lg:w-3/5 h-72 md:h-auto md:min-h-screen overflow-hidden bg-on-secondary-fixed">
        <motion.img
          src="/images/hero/login-hero.jpg"
          alt=""
          aria-hidden="true"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-on-secondary-fixed via-on-secondary-fixed/50 to-transparent" />

        <div className="relative h-full flex flex-col justify-between p-8 sm:p-12 lg:p-20">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link to="/" className="inline-flex items-center gap-2 group w-fit">
              <MapPin className="h-7 w-7 text-primary-fixed-dim group-hover:scale-110 transition-transform" />
              <span className="text-2xl md:text-3xl font-black tracking-tightest text-white">Curator</span>
            </Link>
          </motion.div>

          <motion.div
            className="max-w-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Welcome back to your favorite venues
            </h2>
            <motion.div
              className="w-16 h-1 bg-primary-container rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 64 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            />
          </motion.div>

          <p className="hidden md:block text-on-primary-container/60 text-xs font-medium tracking-widest uppercase">
            Curator · © {new Date().getFullYear()}
          </p>
        </div>
      </section>

      {/* RIGHT — FORM */}
      <section className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-surface">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <header className="mb-10">
            <motion.h3
              className="text-3xl font-bold tracking-tight text-on-surface mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Sign In
            </motion.h3>
            <motion.p
              className="text-on-surface-variant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Enter your credentials to access your concierge dashboard.
            </motion.p>
          </header>

          {/* Error with shake */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ x: { duration: 0.4 }, opacity: { duration: 0.2 } }}
              >
                <Card tier="low" padding="sm" className="mb-6 bg-error/5">
                  <p className="text-sm font-semibold text-error">{error}</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Input floating label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} autoComplete="email" required />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Input floating label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} icon={Lock} iconRight={showPassword ? EyeOff : Eye} autoComplete="current-password" required />
            </motion.div>

            <button type="button" onClick={() => setShowPassword((s) => !s)} className="-mt-3 ml-auto block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
              {showPassword ? 'Hide password' : 'Show password'}
            </button>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <span className="relative inline-flex items-center">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer h-5 w-5 rounded-md bg-surface-container-low text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-primary transition-colors" />
                  <svg className="absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
              </label>
              <Link to="/help" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                Forgot password?
              </Link>
            </div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} iconRight={ArrowRight}>
                Sign In
              </Button>
            </motion.div>
          </form>

          <div className="my-10 flex items-center justify-center">
            <span className="px-4 py-1.5 bg-surface-container-low rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SocialButton label="Google" disabled />
            <SocialButton label="Apple" disabled />
          </div>

          <Card tier="low" padding="sm" className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Demo Credentials</p>
            <p className="text-xs text-on-surface-variant font-mono">demo@smartbooking.uz</p>
            <p className="text-xs text-on-surface-variant font-mono">demo123456</p>
          </Card>

          <footer className="mt-10 text-center">
            <p className="text-on-surface-variant text-sm">
              New to Curator?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline underline-offset-4 decoration-2 ml-1">
                Create account
              </Link>
            </p>
          </footer>
        </motion.div>
      </section>

      <Link to="/help" className="fixed bottom-20 md:bottom-8 right-8 z-40 group flex items-center justify-center w-14 h-14 bg-on-secondary-fixed text-white rounded-full shadow-ambient hover:scale-110 active:scale-95 transition-all" aria-label="Concierge Help">
        <HelpCircle className="h-6 w-6" />
      </Link>
    </main>
  );
}

function SocialButton({ label, disabled }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileHover={disabled ? {} : { y: -2 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-container-lowest hover:bg-surface-container-low rounded-xl text-sm font-semibold text-on-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary-container/20" />
      {label}
    </motion.button>
  );
}
