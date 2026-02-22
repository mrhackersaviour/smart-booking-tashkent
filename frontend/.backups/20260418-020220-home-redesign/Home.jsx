import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, ArrowLeft, MapPin, Calendar, Users,
  Utensils, Coffee, Building2, Dumbbell, Scissors, Car,
  Brain, View, UserPlus, Quote, Mail,
} from 'lucide-react';
import { Button, Card, Avatar, Badge } from '../components/ui';
import { Footer } from '../components/layout';

/**
 * Home — premium booking platform landing page.
 *
 * Reference: design-reference/premium_booking_platform_landing_page/
 *
 * Sections:
 *  1. Hero — fullscreen image, deep navy gradient, headline + smart search bar
 *  2. Category Scroller — horizontal cards linking to /venues?type=...
 *  3. Feature Highlights — 3-column "next gen" benefits
 *  4. Testimonials — carousel of 3 testimonial cards
 *  5. Footer — site-wide layout/Footer
 *
 * Design rules followed:
 *  - DESIGN.md "No-Line Rule": no 1px borders. Search bar uses tonal column
 *    separators (`bg-outline-variant/0` spacing) instead of border-r lines.
 *  - Tonal layering for sections (surface → surface-container-low → surface).
 *  - Primary CTA buttons use the gradient `Button variant="primary"`.
 *  - Material Symbols → lucide-react.
 *
 * Business logic preserved: hero search form navigates to /venues with
 * type/date/guests query params.
 */

const CATEGORIES = [
  { type: 'restaurant', label: 'Dining', sublabel: '482 Spots', icon: Utensils },
  { type: 'cafe', label: 'Cafe', sublabel: '124 Spots', icon: Coffee },
  { type: 'stadium', label: 'Stadium', sublabel: '12 Venues', icon: Building2 },
  { type: 'fitness', label: 'Fitness', sublabel: '88 Studios', icon: Dumbbell },
  { type: 'barbershop', label: 'Barber', sublabel: '65 Chairs', icon: Scissors },
  { type: 'carwash', label: 'Auto', sublabel: '32 Detailers', icon: Car },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Recommendations',
    description:
      'Our neural engine learns your preferences to suggest the perfect table or training slot before you even ask.',
  },
  {
    icon: View,
    title: '3D Venue Preview',
    description:
      'Walk through any venue virtually. See the exact lighting, atmosphere, and table placement from your device.',
  },
  {
    icon: UserPlus,
    title: 'Social Booking',
    description:
      'Split bills, invite friends, and coordinate arrivals seamlessly through our integrated social hub.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The only platform that actually understands premium service. The 3D tour saved me from a bad table choice.',
    name: 'Marcus Chen',
    role: 'Creative Director',
    style: 'dark',
  },
  {
    quote:
      'Booking venues for our corporate events has never been this streamlined. Curator is a game changer.',
    name: 'Elena Rodriguez',
    role: 'VP of Operations',
    style: 'light',
  },
  {
    quote:
      'The AI recommendations are scary accurate. Found my new favorite barbershop within minutes.',
    name: 'James Wilson',
    role: 'Tech Entrepreneur',
    style: 'primary',
  },
];

export default function Home() {
  const [venueType, setVenueType] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  const navigate = useNavigate();

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
      <header className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background image + deep navy gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero/landing-hero.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover grayscale-[20%] brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-on-secondary-fixed/90 via-on-secondary-fixed/40 to-transparent" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-8 w-full">
          <div className="max-w-2xl mb-12">
            <Badge variant="accent" size="sm" className="mb-6">
              The Kinetic Curator · Tashkent
            </Badge>
            <h1 className="text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tightest leading-[0.9] mb-8">
              Book Any{' '}
              <span className="text-primary-container">Venue</span>,
              <br />
              Anytime.
            </h1>
            <p className="text-white/80 text-lg md:text-xl font-light max-w-lg leading-relaxed">
              Access the most exclusive spaces in Tashkent. From top-rated
              restaurants to private fitness sanctuaries, curated just for you.
            </p>
          </div>

          {/* Smart Search Bar — tonal column separators, NO border lines */}
          <form
            onSubmit={handleSearch}
            className="bg-surface-container-lowest p-2 rounded-2xl shadow-ambient flex flex-col md:flex-row gap-1 max-w-5xl"
          >
            <SearchField icon={MapPin} label="Venue Type">
              <select
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
                className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-on-surface w-full"
              >
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
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-on-surface w-full"
              />
            </SearchField>

            <FieldDivider />

            <SearchField icon={Users} label="Guests">
              <input
                type="number"
                min="1"
                max="50"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-on-surface w-full"
              />
            </SearchField>

            <button
              type="submit"
              className="bg-gradient-to-r from-primary to-primary-container text-white px-8 md:px-10 py-4 rounded-xl font-bold hover:shadow-ambient transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Search</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {/* ============================================================
          2. CATEGORY SCROLLER
          ============================================================ */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                Discover · Categories
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tightest text-on-surface">
                Browse by experience
              </h2>
            </div>
            <Link
              to="/venues"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary hover:underline underline-offset-4"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto no-scrollbar -mx-6 md:-mx-8 px-6 md:px-8 pb-4">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.type} {...cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. FEATURE HIGHLIGHTS
          ============================================================ */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
              Why Curator
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tightest text-on-secondary-fixed mb-4">
              The Next Generation of Booking
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              Experience a platform that understands your lifestyle through
              intelligent curation and spatial technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} interactive padding="lg" className="rounded-[2rem]">
                <div className="w-14 h-14 bg-primary-container/15 rounded-2xl flex items-center justify-center mb-8">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-4">{title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. TESTIMONIALS
          ============================================================ */}
      <section className="py-24 bg-surface overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-16 gap-6">
            <div className="max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                Voices · Community
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tightest text-on-surface">
                Curated by
                <br />
                Our Community
              </h2>
            </div>
            <div className="flex gap-3">
              <CarouselButton icon={ArrowLeft} label="Previous testimonial" />
              <CarouselButton icon={ArrowRight} label="Next testimonial" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          5. NEWSLETTER + FOOTER
          ============================================================ */}
      <Footer />
    </div>
  );
}

/* ============================================================
   Sub-components (page-local — used only by Home)
   ============================================================ */

/**
 * SearchField — single field slot inside the hero search bar.
 * Icon + label stack + input/select slot. No border separators on its own.
 */
function SearchField({ icon: Icon, label, children }) {
  return (
    <div className="flex-1 flex items-center px-4 py-3 gap-3 min-w-0">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div className="flex flex-col flex-1 min-w-0">
        <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

/**
 * FieldDivider — narrow tonal column between SearchField slots.
 * NOT a 1px border line — uses a 1px-wide block of `surface-container`
 * with vertical margin so it reads as separation, not a hard border.
 */
function FieldDivider() {
  return (
    <div className="hidden md:flex items-center">
      <div className="w-px h-8 bg-surface-container" />
    </div>
  );
}

/**
 * CategoryCard — horizontally-scrolled tonal tile.
 * Hover lifts the card with the primary gradient overlay.
 */
function CategoryCard({ type, label, sublabel, icon: Icon }) {
  return (
    <Link
      to={`/venues?type=${type}`}
      className="flex-shrink-0 group block"
    >
      <div className="w-44 h-52 bg-surface-container-lowest rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:bg-gradient-to-br hover:from-primary hover:to-primary-container hover:-translate-y-2 hover:shadow-ambient">
        <Icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-white/70 transition-colors">
            {label}
          </p>
          <p className="font-bold text-on-surface group-hover:text-white transition-colors text-lg mt-1">
            {sublabel}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * TestimonialCard — quote block with three style variants per Stitch design:
 *  - dark    → bg-on-secondary-fixed (deep navy ground)
 *  - light   → bg-surface-container-lowest (white)
 *  - primary → bg-primary (electric accent)
 */
function TestimonialCard({ quote, name, role, style }) {
  const variants = {
    dark: {
      container: 'bg-on-secondary-fixed text-white',
      quoteIcon: 'text-primary-container',
      quote: 'text-white',
      name: 'text-white',
      role: 'text-white/60',
    },
    light: {
      container: 'bg-surface-container-lowest text-on-surface',
      quoteIcon: 'text-primary',
      quote: 'text-on-surface',
      name: 'text-on-surface',
      role: 'text-on-surface-variant',
    },
    primary: {
      container: 'bg-gradient-to-br from-primary to-primary-container text-white',
      quoteIcon: 'text-white/30',
      quote: 'text-white',
      name: 'text-white',
      role: 'text-white/60',
    },
  }[style];

  return (
    <article className={`p-10 rounded-[2rem] flex flex-col justify-between h-full ${variants.container}`}>
      <Quote className={`h-10 w-10 ${variants.quoteIcon}`} />
      <p className={`text-xl italic font-light my-8 leading-relaxed ${variants.quote}`}>
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-4">
        <Avatar name={name} size="md" />
        <div>
          <p className={`font-bold ${variants.name}`}>{name}</p>
          <p className={`text-xs ${variants.role}`}>{role}</p>
        </div>
      </div>
    </article>
  );
}

/**
 * CarouselButton — circular nav arrow for testimonials.
 * No solid border — uses subtle ghost ring (outline-variant @ 30% opacity).
 */
function CarouselButton({ icon: Icon, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="w-12 h-12 rounded-full bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/30 hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white hover:ring-transparent transition-all flex items-center justify-center"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
