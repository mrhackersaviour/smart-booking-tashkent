import { Link } from 'react-router-dom';
import { Star, Heart, MapPin } from 'lucide-react';
import { useState } from 'react';
import { priceTier } from '../../utils/price';

const DEFAULT_FALLBACK_IMAGE = '/images/venues/restaurant-modern.jpg';

const VENUE_IMAGE_MAP = {
  restaurant: ['/images/venues/Novikov.jpg', '/images/venues/restaurant-modern.jpg', '/images/venues/restaurant-terrace.jpg', '/images/venues/Mahalla.jpg', '/images/venues/Tandiriy.jpg', '/images/venues/restaurant-plov.jpg', '/images/venues/Giotto.png'],
  cafe: ['/images/venues/cafe-cozy.jpg', '/images/venues/cafe-modern.jpg', '/images/venues/Bon.jpg', '/images/venues/Kamolon.jpg', '/images/venues/Bazar.jpg'],
  stadium: ['/images/venues/stadium-night.jpg', '/images/venues/pakhtakor.jpg', '/images/venues/bunyodkor.jpg', '/images/venues/dinamo.jpg', '/images/venues/300-maktab.jpeg'],
  fitness: ['/images/venues/gym-modern.jpg', '/images/venues/gym-crossfit.jpg', '/images/venues/tribe-crossfit.webp', '/images/venues/air-gym.webp', '/images/venues/medion-sport.jpg', '/images/venues/profit.jpeg'],
  barbershop: ['/images/venues/barber-premium.jpg', '/images/venues/barbershop.jpg', '/images/venues/pro-master-barber.jpeg'],
  carwash: ['/images/venues/carwash-premium.jpg', '/images/venues/moyka.jpg', '/images/venues/elegance_moyka.jpg', '/images/venues/moyka2.jpg'],
};

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTypeImage(venue) {
  const typeKey = (venue.type || '').toLowerCase();
  const images = VENUE_IMAGE_MAP[typeKey];
  if (images && images.length > 0) {
    const index = hashCode(String(venue.id || venue.name)) % images.length;
    return images[index];
  }
  return DEFAULT_FALLBACK_IMAGE;
}

function getVenueImage(venue) {
  if (venue.images) {
    try {
      const parsed = typeof venue.images === 'string' ? JSON.parse(venue.images) : venue.images;
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
        return parsed[0];
      }
    } catch {
      // fall through
    }
  }
  return getTypeImage(venue);
}

const TYPE_LABELS = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  stadium: 'Stadium',
  fitness: 'Fitness',
  barbershop: 'Barbershop',
  carwash: 'Car Wash',
};

const PLACEHOLDER_GRADIENTS = [
  'from-indigo-500 to-blue-600',
  'from-orange-400 to-rose-500',
  'from-emerald-400 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-cyan-400 to-blue-500',
  'from-amber-400 to-orange-500',
];

export default function VenueCard({ venue }) {
  const [favorited, setFavorited] = useState(false);
  const [imgStage, setImgStage] = useState(0); // 0=primary, 1=type fallback, 2=default, 3=gradient
  const primary = getVenueImage(venue);
  const typeImg = getTypeImage(venue);
  const imageUrl = imgStage === 0 ? primary : imgStage === 1 ? typeImg : imgStage === 2 ? DEFAULT_FALLBACK_IMAGE : null;
  const gradient = PLACEHOLDER_GRADIENTS[hashCode(venue.name) % PLACEHOLDER_GRADIENTS.length];
  const tier = priceTier(venue.price_range);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorited((prev) => !prev);
  };

  return (
    <Link
      to={`/venues/${venue.id}`}
      className="group bg-surface-container-lowest rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block"
    >
      {/* Image Area */}
      <div className="relative h-56 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImgStage((s) => s + 1)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-5xl font-bold text-white/60">{venue.name.charAt(0)}</span>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all"
        >
          <Heart className={`h-5 w-5 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Category badge */}
        <div className="absolute bottom-4 left-4 bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
          {TYPE_LABELS[venue.type] || venue.type}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-on-surface text-lg leading-snug line-clamp-1">
            {venue.name}
          </h3>
          <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-xs font-bold text-on-surface shrink-0 ml-2">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            {venue.rating || '---'}
          </div>
        </div>

        <p className="text-sm text-on-surface-variant line-clamp-2 min-h-[2.5rem]">
          {venue.description || 'Discover this amazing venue in Tashkent.'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3">
          <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
            <span className="text-primary tracking-tighter">{tier.dots}</span>
            <span>{tier.label}</span>
            {venue.cuisine_type ? <span className="text-outline">• {venue.cuisine_type}</span> : null}
          </span>
          <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {venue.district || 'Tashkent'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export { VENUE_IMAGE_MAP, hashCode, getVenueImage, getTypeImage, DEFAULT_FALLBACK_IMAGE };
