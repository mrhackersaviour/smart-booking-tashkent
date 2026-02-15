// Friendly price-tier labels — replaces the cryptic $/$$/$$$/$$$$ markers.
// Each tier maps to a short, intuitive word + a longer description + a dot indicator.

export const PRICE_TIERS = {
  1: {
    value: 1,
    label: 'Budget',
    description: 'Affordable',
    range: 'Under 80,000 UZS / guest',
    dots: '●○○○',
    color: 'emerald',
  },
  2: {
    value: 2,
    label: 'Moderate',
    description: 'Mid-range',
    range: '80,000 – 200,000 UZS / guest',
    dots: '●●○○',
    color: 'sky',
  },
  3: {
    value: 3,
    label: 'Upscale',
    description: 'Premium',
    range: '200,000 – 500,000 UZS / guest',
    dots: '●●●○',
    color: 'violet',
  },
  4: {
    value: 4,
    label: 'Luxury',
    description: 'Fine dining',
    range: '500,000+ UZS / guest',
    dots: '●●●●',
    color: 'amber',
  },
};

export function priceTier(n) {
  return PRICE_TIERS[n] || PRICE_TIERS[1];
}

export function priceLabel(n) {
  return priceTier(n).label;
}

export function priceDots(n) {
  return priceTier(n).dots;
}

export const PRICE_TIER_LIST = [PRICE_TIERS[1], PRICE_TIERS[2], PRICE_TIERS[3], PRICE_TIERS[4]];
