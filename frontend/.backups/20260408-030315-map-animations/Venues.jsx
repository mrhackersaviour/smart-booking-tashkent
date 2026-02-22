import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, X, ChevronLeft, ChevronRight, Star,
} from 'lucide-react';
import VenueCard from '../components/venues/VenueCard';
import { Input } from '../components/ui';
import { PRICE_TIER_LIST } from '../utils/price';
import { api } from '../services/api';

/**
 * Venues — venue discovery page (split-screen list + map).
 *
 * Reference: design-reference/venue_discovery_page/
 *
 * Layout:
 *  - Left 60%: scrollable column with sticky filters (category pills + price /
 *    rating / sort row), 2-col venue grid, pagination footer.
 *  - Right 40%: VenueMapPanel with tonal placeholder + colored pins.
 *  - Mobile: list takes full width, a floating "Show Map" toggle swaps to map.
 *
 * Design rules followed:
 *  - DESIGN.md "No-Line Rule": filter row groups inside tonal `bg-surface-low`
 *    pill, no border-t separators.
 *  - Friendly price labels (Budget / Moderate / Upscale / Luxury) instead of $.
 *  - All inputs/buttons compose existing design-system primitives.
 *
 * Business logic preserved from previous Venues.jsx:
 *  - URL-driven filters (type, district, sort, search, price_range, page)
 *  - api.getVenues + api.getDistricts
 *  - Pagination with ellipsis range
 *  - Reset to page 1 when filters (other than page itself) change
 */

const VENUE_TYPES = [
  { value: '', label: 'All' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'cafe', label: 'Cafes' },
  { value: 'stadium', label: 'Stadiums' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'barbershop', label: 'Barbershops' },
  { value: 'carwash', label: 'Car Wash' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Top Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'newest', label: 'Newest' },
];

const RATING_THRESHOLDS = [0, 3, 4, 4.5];

export default function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const type = searchParams.get('type') || '';
  const district = searchParams.get('district') || '';
  const sort = searchParams.get('sort') || '';
  const priceRange = searchParams.get('price_range') || '';
  const minRating = parseFloat(searchParams.get('min_rating') || '0');
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    api.getDistricts().then((data) => setDistricts(data.districts)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (type) params.type = type;
    if (district) params.district = district;
    if (sort) params.sort = sort;
    if (search) params.search = search;
    if (priceRange) params.price_range = priceRange;
    if (minRating) params.min_rating = minRating;
    params.page = page;

    api.getVenues(params)
      .then((data) => {
        setVenues(data.venues);
        setPagination(data.pagination);
      })
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [type, district, sort, page, search, priceRange, minRating]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value !== '' && value !== null && value !== undefined) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchParams({});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', search);
  };

  const hasFilters = type || district || sort || priceRange || minRating || searchParams.get('search');

  // Pagination range with ellipsis
  const getPaginationRange = () => {
    const totalPages = pagination.pages || 1;
    const current = pagination.page || 1;
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface">
      <main className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* ============================================================
            LEFT — LIST PANEL (60%)
            ============================================================ */}
        <section className="flex flex-col bg-surface overflow-y-auto no-scrollbar w-full">
          {/* Sticky filters header */}
          <div className="sticky top-0 z-30 bg-surface px-6 pt-6 pb-4 space-y-5">
            {/* Title row + search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Discover · Tashkent
                </p>
                <h1 className="text-3xl font-extrabold tracking-tightest text-on-surface">
                  Venues
                </h1>
              </div>
              <form onSubmit={handleSearch} className="w-full sm:w-auto sm:max-w-xs flex-1 sm:flex-initial">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search destinations..."
                    className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low rounded-full text-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all"
                  />
                </div>
              </form>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {VENUE_TYPES.map((t) => {
                const active = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => updateFilter('type', t.value)}
                    className={[
                      'px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      active
                        ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Secondary Filters Bar — tonal pill, no borders */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-5 bg-surface-container-low rounded-2xl">
              <div className="flex flex-wrap items-center gap-7">
                {/* Price Range */}
                <FilterGroup label="Price Range">
                  <div className="flex gap-1.5">
                    {PRICE_TIER_LIST.map((tier) => {
                      const active = priceRange === String(tier.value);
                      return (
                        <button
                          key={tier.value}
                          type="button"
                          onClick={() => updateFilter('price_range', active ? '' : String(tier.value))}
                          title={tier.label}
                          className={[
                            'px-3 h-8 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors',
                            active
                              ? 'bg-primary text-white'
                              : 'bg-surface-container-lowest text-on-surface-variant hover:bg-primary-container hover:text-white',
                          ].join(' ')}
                        >
                          {tier.label}
                        </button>
                      );
                    })}
                  </div>
                </FilterGroup>

                {/* Rating */}
                <FilterGroup label="Minimum Rating">
                  <div className="flex items-center gap-1">
                    {RATING_THRESHOLDS.map((r, i) => {
                      const active = minRating === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateFilter('min_rating', r ? String(r) : '')}
                          className={`px-2 h-8 rounded-md text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-primary text-white'
                              : 'text-on-surface-variant hover:bg-surface-container-lowest'
                          }`}
                        >
                          {r === 0 ? 'Any' : `${r}★`}
                        </button>
                      );
                    })}
                  </div>
                </FilterGroup>

                {/* District */}
                <FilterGroup label="District">
                  <select
                    value={district}
                    onChange={(e) => updateFilter('district', e.target.value)}
                    className="bg-transparent border-none text-sm font-semibold text-on-surface focus:ring-0 p-0 pr-6 cursor-pointer"
                  >
                    <option value="">All Districts</option>
                    {districts.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district} ({d.venue_count})
                      </option>
                    ))}
                  </select>
                </FilterGroup>
              </div>

              <div className="flex items-center gap-4">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-error hover:opacity-80 flex items-center gap-1 font-medium transition-opacity"
                  >
                    <X className="h-3 w-3" /> Clear All
                  </button>
                )}
                <FilterGroup label="Sort By">
                  <select
                    value={sort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="bg-transparent border-none text-sm font-semibold text-on-surface focus:ring-0 p-0 pr-6 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </FilterGroup>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 px-6 pt-2 pb-8">
            {loading ? (
              <SkeletonGrid />
            ) : venues.length === 0 ? (
              <EmptyState onClear={clearFilters} hasFilters={hasFilters} />
            ) : (
              <>
                <p className="text-xs text-on-surface-variant mb-4">
                  Showing <span className="font-bold text-on-surface">{venues.length}</span> of{' '}
                  <span className="font-bold text-on-surface">{pagination.total}</span> venues
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {venues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <Pagination
                    pages={getPaginationRange()}
                    current={pagination.page}
                    total={pagination.pages}
                    onChange={(p) => updateFilter('page', String(p))}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   Sub-components (page-local)
   ============================================================ */

function FilterGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest font-bold text-outline">
        {label}
      </span>
      {children}
    </div>
  );
}

function Pagination({ pages, current, total, onChange }) {
  return (
    <div className="mt-12 pt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => current > 1 && onChange(current - 1)}
        disabled={current <= 1}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-outline">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={[
              'w-10 h-10 flex items-center justify-center rounded-lg text-sm transition-colors',
              p === current
                ? 'bg-gradient-to-r from-primary to-primary-container text-white font-bold shadow-ambient'
                : 'text-on-surface-variant hover:bg-surface-container font-medium',
            ].join(' ')}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => current < total && onChange(current + 1)}
        disabled={current >= total}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface-container-lowest rounded-xl overflow-hidden animate-pulse">
          <div className="h-56 bg-surface-container" />
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 bg-surface-container rounded w-3/4" />
              <div className="h-5 bg-surface-container rounded w-10" />
            </div>
            <div className="h-4 bg-surface-container rounded w-full" />
            <div className="h-4 bg-surface-container rounded w-2/3" />
            <div className="flex justify-between pt-2">
              <div className="h-3 bg-surface-container rounded w-24" />
              <div className="h-3 bg-surface-container rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClear, hasFilters }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-container-low flex items-center justify-center">
        <Search className="h-7 w-7 text-outline" />
      </div>
      <p className="text-on-surface-variant text-lg font-medium">
        No venues found matching your criteria.
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-primary font-semibold hover:opacity-80 transition-opacity text-sm"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
