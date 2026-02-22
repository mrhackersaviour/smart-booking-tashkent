import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, ArrowLeft, MapPin, Calendar, Users,
  Utensils, Coffee, Building2, Dumbbell, Scissors, Car,
  Brain, View, UserPlus, Quote, Mail, Star, TrendingUp,
  CheckCircle, Clock, Sparkles, ChevronRight, Play,
} from 'lucide-react';
import { Button, Card, Avatar, Badge } from '../components/ui';
import { Footer } from '../components/layout';
import { api } from '../services/api';

/**
 * Home — premium booking platform landing page.
 *
 * Fully animated with framer-motion:
 *  - Hero: staggered text reveal + floating search bar
 *  - Sections: scroll-triggered reveal animations
 *  - Categories: staggered card entrance
 *  - Stats: counting number animation
 *  - Popular venues: live data from API
 *  - Testimonials: auto-sliding carousel
 *  - CTA: parallax gradient section
 */

const CATEGORIES = [
  { type: 'restaurant', label: 'Dining', sublabel: '482 Spots', icon: Utensils, color: 'from-orange-500 to-red-500' },
  { type: 'cafe', label: 'Cafe', sublabel: '124 Spots', icon: Coffee, color: 'from-amber-500 to-orange-400' },
  { type: 'stadium', label: 'Stadium', sublabel: '12 Venues', icon: Building2, color: 'from-blue-500 to-indigo-500' },
  { type: 'fitness', label: 'Fitness', sublabel: '88 Studios', icon: Dumbbell, color: 'from-emerald-500 to-teal-500' },
  { type: 'barbershop', label: 'Barber', sublabel: '65 Chairs', icon: Scissors, color: 'from-violet-500 to-purple-500' },
  { type: 'carwash', label: 'Auto', sublabel: '32 Detailers', icon: Car, color: 'from-cyan-500 to-blue-400' },
];

const FEATURES = [
  {
    icon: Brain, title: 'AI-Powered Recommendations',
    description: 'Our neural engine learns your preferences to suggest the perfect table or training slot before you even ask.',
  },
  {
    icon: View, title: '3D Venue Preview',
    description: 'Walk through any venue virtually. See the exact lighting, atmosphere, and table placement from your device.',
  },
  {
    icon: UserPlus, title: 'Social Booking',
    description: 'Split bills, invite friends, and coordinate arrivals seamlessly through our integrated social hub.',
  },
];

const STATS = [
  { value: 500, suffix: '+', label: 'Venues', icon: MapPin },
  { value: 10000, suffix: '+', label: 'Bookings', icon: CheckCircle },
  { value: 4.8, suffix: '', label: 'Avg Rating', icon: Star, decimals: 1 },
  { value: 24, suffix: '/7', label: 'Support', icon: Clock },
];

const TESTIMONIALS = [
  { quote: 'The only platform that actually understands premium service. The 3D tour saved me from a bad table choice.', name: 'Marcus Chen', role: 'Creative Director', style: 'dark' },
  { quote: 'Booking venues for our corporate events has never been this streamlined. Curator is a game changer.', name: 'Elena Rodriguez', role: 'VP of Operations', style: 'light' },
  { quote: 'The AI recommendations are scary accurate. Found my new favorite barbershop within minutes.', name: 'James Wilson', role: 'Tech Entrepreneur', style: 'primary' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search', description: 'Browse venues by type, location, or let AI suggest the best match.', icon: Search },
  { step: '02', title: 'Preview in 3D', description: 'Walk through venues virtually. Check ambiance, layout, and table positions.', icon: View },
  { step: '03', title: 'Book Instantly', description: 'Select your table, time, and confirm. Get instant confirmation.', icon: CheckCircle },
];

/* ---------- Scroll-reveal wrapper ---------- */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const dirs = { up: [30, 0], down: [-30, 0], left: [0, -30], right: [0, 30] };
  const [y, x] = dirs[direction] || dirs.up;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Animated counter ---------- */
function Counter({ value, suffix = '', decimals = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    const duration = 2000;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(decimals > 0 ? parseFloat((start + (end - start) * eased).toFixed(decimals)) : Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value, decimals]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const [venueType, setVenueType] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [popularVenues, setPopularVenues] = useState([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api.getVenues({ sort: 'rating', limit: 6 })
      .then((data) => setPopularVenues((data.venues || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (venueType) params.set('type', venueType);
    if (date) params.set('date', date);
    if (guests) params.set('guests', guests);
    navigate(`/venues?${params.toString()}`);
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface">
      {/* ============================================================
          1. HERO
          ============================================================ */}
      <header className="relative min-h-[92vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero/landing-hero.jpg" alt="" aria-hidden="true" className="w-full h-full object-cover grayscale-[20%] brightness-75 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-on-secondary-fixed/90 via-on-secondary-fixed/40 to-transparent" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-8 w-full">
          <div className="max-w-2xl mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Badge variant="accent" size="sm" className="mb-6">
                The Kinetic Curator · Tashkent
              </Badge>
            </motion.div>

            <h1 className="text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tightest leading-[0.9] mb-8">
              {['Book Any', <br key="br" />, <span key="venue" className="text-primary-container">Venue</span>, ',', <br key="br2" />, 'Anytime.'].map((word, i) =>
                typeof word === 'string' ? (
                  <motion.span key={i} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}>
                    {word}{' '}
                  </motion.span>
                ) : word
              )}
            </h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-white/80 text-lg md:text-xl font-light max-w-lg leading-relaxed">
              Access the most exclusive spaces in Tashkent. From top-rated restaurants to private fitness sanctuaries, curated just for you.
            </motion.p>
          </div>

          {/* Smart Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, type: 'spring', damping: 20 }}
            className="bg-surface-container-lowest p-2 rounded-2xl shadow-ambient flex flex-col md:flex-row gap-1 max-w-5xl"
          >
            <SearchField icon={MapPin} label="Venue Type">
              <select value={venueType} onChange={(e) => setVenueType(e.target.value)} className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-on-surface w-full">
                <option value="">All Categories</option>
                <option value="restaurant">Restaurants & Cafes</option>
                <option value="stadium">Stadiums & Arena</option>
                <option value="fitness">Fitness & Wellness</option>
                <option value="barbershop">Barbershops</option>
                <option value="carwash">Car Wash Premium</option>
              </select>
            </SearchField>
            <FieldDivider />
            <SearchField icon={Calendar} label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-on-surface w-full" />
            </SearchField>
            <FieldDivider />
            <SearchField icon={Users} label="Guests">
              <input type="number" min="1" max="50" value={guests} onChange={(e) => setGuests(e.target.value)} className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-on-surface w-full" />
            </SearchField>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="bg-gradient-to-r from-primary to-primary-container text-white px-8 md:px-10 py-4 rounded-xl font-bold hover:shadow-ambient transition-all flex items-center justify-center gap-2">
              <span>Search</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.form>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full ring-2 ring-white/30 flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full" />
          </div>
        </motion.div>
      </header>

      {/* ============================================================
          2. STATS BAR
          ============================================================ */}
      <section className="bg-on-secondary-fixed py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <stat.icon className="h-6 w-6 text-primary-container mx-auto mb-3" />
                  <p className="text-3xl md:text-4xl font-black text-white tracking-tightest">
                    <Counter value={stat.value} suffix={stat.suffix} decimals={stat.decimals || 0} />
                  </p>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. CATEGORY SCROLLER
          ============================================================ */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Discover · Categories</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tightest text-on-surface">Browse by experience</h2>
              </div>
              <Link to="/venues" className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary hover:underline underline-offset-4">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.type} delay={i * 0.08}>
                <CategoryCard {...cat} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. HOW IT WORKS
          ============================================================ */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Simple · Seamless</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tightest text-on-surface">How It Works</h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }, i) => (
              <Reveal key={step} delay={i * 0.15}>
                <div className="text-center relative">
                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-ambient">
                    <Icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <p className="text-[10px] font-black text-primary tracking-widest mb-2">STEP {step}</p>
                  <h3 className="text-xl font-bold text-on-surface mb-3">{title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          5. POPULAR VENUES (live data)
          ============================================================ */}
      {popularVenues.length > 0 && (
        <section className="py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <Reveal>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Trending · Tashkent</p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tightest text-on-surface">Popular Venues</h2>
                </div>
                <Link to="/venues" className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary hover:underline underline-offset-4">
                  Explore all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularVenues.map((venue, i) => (
                <Reveal key={venue.id} delay={i * 0.08}>
                  <PopularVenueCard venue={venue} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          6. FEATURE HIGHLIGHTS
          ============================================================ */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <Reveal>
            <div className="text-center mb-20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Why Curator</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tightest text-on-secondary-fixed mb-4">The Next Generation of Booking</h2>
              <p className="text-on-surface-variant max-w-xl mx-auto leading-relaxed">
                Experience a platform that understands your lifestyle through intelligent curation and spatial technology.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <Reveal key={title} delay={i * 0.12}>
                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Card interactive padding="lg" className="rounded-[2rem] h-full">
                    <div className="w-14 h-14 bg-primary-container/15 rounded-2xl flex items-center justify-center mb-8">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface mb-4">{title}</h3>
                    <p className="text-on-surface-variant leading-relaxed">{description}</p>
                  </Card>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          7. TESTIMONIALS
          ============================================================ */}
      <section className="py-24 bg-surface overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <Reveal>
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-16 gap-6">
              <div className="max-w-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Voices · Community</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tightest text-on-surface">
                  Curated by<br />Our Community
                </h2>
              </div>
              <div className="flex gap-3">
                <CarouselButton icon={ArrowLeft} label="Previous" onClick={() => setTestimonialIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} />
                <CarouselButton icon={ArrowRight} label="Next" onClick={() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length)} />
              </div>
            </div>
          </Reveal>

          {/* Desktop: 3 columns, Mobile: single card slider */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <TestimonialCard {...t} />
              </Reveal>
            ))}
          </div>

          {/* Mobile slider */}
          <div className="md:hidden relative">
            <AnimatePresence mode="wait">
              <motion.div key={testimonialIdx} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}>
                <TestimonialCard {...TESTIMONIALS[testimonialIdx]} />
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} type="button" onClick={() => setTestimonialIdx(i)} className={`h-1.5 rounded-full transition-all ${i === testimonialIdx ? 'w-8 bg-primary' : 'w-4 bg-outline-variant/30'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          8. CTA BANNER
          ============================================================ */}
      <Reveal>
        <section className="mx-6 md:mx-8 mb-16">
          <div className="max-w-7xl mx-auto relative rounded-[2rem] overflow-hidden bg-on-secondary-fixed min-h-[320px] flex items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-on-secondary-fixed via-on-secondary-fixed to-primary-container/40" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-tertiary/15 rounded-full blur-3xl" />
            <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-8 px-10 md:px-16 py-14">
              <div>
                <Sparkles className="h-10 w-10 text-primary-fixed-dim mb-4" />
                <h3 className="text-3xl md:text-4xl font-black tracking-tightest text-white mb-3">Ready to get started?</h3>
                <p className="text-white/60 max-w-md">Join thousands of users who book smarter. Create your free account today.</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link to="/register" className="inline-flex items-center gap-2 bg-white text-on-secondary-fixed px-8 py-4 rounded-full font-bold hover:bg-primary-fixed transition-colors shadow-ambient">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </Reveal>

      <Footer />
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function SearchField({ icon: Icon, label, children }) {
  return (
    <div className="flex-1 flex items-center px-4 py-3 gap-3 min-w-0">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div className="flex flex-col flex-1 min-w-0">
        <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{label}</label>
        {children}
      </div>
    </div>
  );
}

function FieldDivider() {
  return <div className="hidden md:flex items-center"><div className="w-px h-8 bg-surface-container" /></div>;
}

function CategoryCard({ type, label, sublabel, icon: Icon, color }) {
  return (
    <Link to={`/venues?type=${type}`} className="group block">
      <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }} className="relative h-44 bg-surface-container-lowest rounded-2xl p-5 flex flex-col justify-between overflow-hidden transition-all">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        <Icon className="h-8 w-8 text-primary group-hover:text-white transition-colors relative z-10" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-white/70 transition-colors">{label}</p>
          <p className="font-bold text-on-surface group-hover:text-white transition-colors text-lg mt-1">{sublabel}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function PopularVenueCard({ venue }) {
  const typeImages = {
    restaurant: ['/images/venues/Novikov.jpg', '/images/venues/Mahalla.jpg', '/images/venues/restaurant-modern.jpg'],
    cafe: ['/images/venues/Bon.jpg', '/images/venues/cafe-modern.jpg'],
  };
  const pool = typeImages[venue.type] || typeImages.restaurant;
  const img = venue.images ? (() => { try { const p = JSON.parse(venue.images); return p[0]; } catch { return null; } })() : null;
  const src = img || pool[Math.abs(venue.name?.charCodeAt(0) || 0) % pool.length];

  return (
    <Link to={`/venues/${venue.id}`} className="group block">
      <motion.div whileHover={{ y: -4 }} className="bg-surface-container-lowest rounded-2xl overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <img src={src} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute top-3 right-3 bg-surface-container-lowest/80 backdrop-blur-glass px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-on-surface">{venue.rating || '—'}</span>
          </div>
          <div className="absolute bottom-3 left-3 bg-primary px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
            {venue.type}
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-bold text-on-surface truncate">{venue.name}</h4>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" /> {venue.district || 'Tashkent'}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

function TestimonialCard({ quote, name, role, style }) {
  const v = {
    dark: { c: 'bg-on-secondary-fixed text-white', qi: 'text-primary-container', q: 'text-white', n: 'text-white', r: 'text-white/60' },
    light: { c: 'bg-surface-container-lowest text-on-surface', qi: 'text-primary', q: 'text-on-surface', n: 'text-on-surface', r: 'text-on-surface-variant' },
    primary: { c: 'bg-gradient-to-br from-primary to-primary-container text-white', qi: 'text-white/30', q: 'text-white', n: 'text-white', r: 'text-white/60' },
  }[style];

  return (
    <article className={`p-10 rounded-[2rem] flex flex-col justify-between h-full ${v.c}`}>
      <Quote className={`h-10 w-10 ${v.qi}`} />
      <p className={`text-xl italic font-light my-8 leading-relaxed ${v.q}`}>&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-4">
        <Avatar name={name} size="md" />
        <div>
          <p className={`font-bold ${v.n}`}>{name}</p>
          <p className={`text-xs ${v.r}`}>{role}</p>
        </div>
      </div>
    </article>
  );
}

function CarouselButton({ icon: Icon, label, onClick }) {
  return (
    <motion.button type="button" aria-label={label} onClick={onClick} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      className="w-12 h-12 rounded-full bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/30 hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white hover:ring-transparent transition-all flex items-center justify-center"
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  );
}
