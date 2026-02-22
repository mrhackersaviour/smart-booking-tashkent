import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, TrendingUp, ShoppingBag, Wallet, Filter, Check, X,
  Gem, ArrowRight, Sparkles,
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import { api } from '../services/api';

/**
 * LoyaltyDashboard — points balance, tier progress, benefits, history & rewards.
 *
 * Reference: design-reference/loyalty_dashboard/
 *
 * Sections:
 *  1. Hero — deep navy gradient with tier badge, balance, progress bar.
 *  2. Stats — Earned / Redeemed / Available (3 surface-lowest cards).
 *  3. Bento — Tier Benefits comparison table (col-span 2) + History (col-span 1).
 *  4. Redeem Your Points — 4-col reward catalog grid.
 *
 * Business logic preserved:
 *  - api.getLoyaltySummary() → balance, totalEarned, totalRedeemed, tier, earnMultiplier
 *  - api.getLoyaltyTransactions() → history rows
 *  - Reward catalog is currently a static placeholder (no /loyalty/rewards endpoint).
 *    TODO: wire api.getLoyaltyRewards() + api.redeemReward(rewardId) when backend ships.
 */

const TIERS = ['bronze', 'silver', 'gold', 'platinum'];
const TIER_THRESHOLDS = { bronze: 0, silver: 1000, gold: 2500, platinum: 5000 };
const TIER_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

const BENEFITS = [
  { label: 'Priority Booking', values: [false, true, true, true] },
  { label: 'Points Multiplier', values: ['1.0x', '1.2x', '1.5x', '2.0x'] },
  { label: 'Free Upgrades', values: [false, false, true, true] },
  { label: 'Exclusive Events', values: [false, false, true, true] },
];

const REWARDS = [
  {
    id: 'voucher-100',
    badge: 'Voucher',
    title: 'Boutique 100K Voucher',
    description: 'Redeem at any participating partner boutique across Tashkent.',
    cost: 5000,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
  },
  {
    id: 'suite-upgrade',
    badge: 'Upgrade',
    title: 'Premium Table Upgrade',
    description: 'Elevate your next booking to a VIP table with priority service.',
    cost: 12500,
    image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
  },
  {
    id: 'vvip-gala',
    badge: 'Event',
    title: 'VVIP Cocktail Gala',
    description: 'Exclusive entry to the Curator Annual Gala evening.',
    cost: 20000,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
  },
  {
    id: 'spa-day',
    badge: 'Wellness',
    title: 'Signature Spa Day',
    description: 'A full day of rejuvenation including a 90-minute massage and facial.',
    cost: 8500,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
  },
];

function computeTierProgress(balance = 0) {
  // Find current tier and next threshold
  let current = 'bronze';
  for (const t of TIERS) if (balance >= TIER_THRESHOLDS[t]) current = t;
  const idx = TIERS.indexOf(current);
  const next = TIERS[idx + 1];
  if (!next) {
    return { current, next: null, pct: 100, toGo: 0 };
  }
  const span = TIER_THRESHOLDS[next] - TIER_THRESHOLDS[current];
  const filled = balance - TIER_THRESHOLDS[current];
  return {
    current,
    next,
    pct: Math.round((filled / span) * 100),
    toGo: TIER_THRESHOLDS[next] - balance,
  };
}

export default function LoyaltyDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLoyaltySummary().catch(() => null),
      api.getLoyaltyTransactions().catch(() => ({ transactions: [] })),
    ])
      .then(([s, t]) => {
        setSummary(s);
        setTransactions(t.transactions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const balance = summary?.currentBalance || 0;
  const totalEarned = summary?.totalEarned || 0;
  const totalRedeemed = summary?.totalRedeemed || 0;
  const progress = useMemo(() => computeTierProgress(balance), [balance]);
  const tierIdx = TIERS.indexOf(progress.current);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen">
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-12">
        {/* ============================================================
            1. HERO
            ============================================================ */}
        <section className="relative overflow-hidden rounded-[2rem] bg-on-secondary-fixed text-white p-8 md:p-12 min-h-[340px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-on-secondary-fixed via-on-secondary-fixed to-primary-container/40" />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-tertiary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex-1 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-amber-300 to-amber-500 p-3 rounded-2xl shadow-ambient">
                  <Award className="h-9 w-9 text-on-secondary-fixed" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                    Current Status
                  </p>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tightest">
                    {TIER_LABELS[progress.current]} Member
                  </h1>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white/70">Total Loyalty Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-7xl font-black tracking-tightest">
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-xl font-bold text-amber-300">PTS</span>
                </div>
              </div>

              {progress.next ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span>Progress to {TIER_LABELS[progress.next]}</span>
                    <span>{progress.toGo.toLocaleString()} pts to go</span>
                  </div>
                  <div className="h-3 w-full bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full shadow-[0_0_15px_rgba(244,162,97,0.5)] transition-all duration-700"
                      style={{ width: `${progress.pct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <Badge variant="primary">Top Tier Reached</Badge>
              )}
            </div>

            <div className="hidden lg:block opacity-15 shrink-0">
              <Gem className="h-56 w-56" strokeWidth={1} />
            </div>
          </div>
        </section>

        {/* ============================================================
            2. STATS
            ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={TrendingUp}
            label="Points Earned"
            value={totalEarned.toLocaleString()}
            tone="primary"
          />
          <StatCard
            icon={ShoppingBag}
            label="Points Redeemed"
            value={totalRedeemed.toLocaleString()}
            tone="error"
          />
          <StatCard
            icon={Wallet}
            label="Points Available"
            value={balance.toLocaleString()}
            tone="success"
          />
        </section>

        {/* ============================================================
            3. BENEFITS + HISTORY BENTO
            ============================================================ */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Tier Benefits */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Membership
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tightest text-on-surface">
                  Tier Benefits
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/subscriptions')}
                className="text-sm font-bold text-primary hover:underline underline-offset-4"
              >
                Compare all tiers
              </button>
            </div>
            <Card padding="none" className="overflow-hidden rounded-3xl">
              <BenefitsTable activeTier={progress.current} activeIdx={tierIdx} />
            </Card>
          </div>

          {/* History */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Activity
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tightest text-on-surface">
                  History
                </h2>
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
                aria-label="Filter history"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
            <Card padding="sm" className="rounded-3xl">
              {loading ? (
                <div className="space-y-3 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-surface-container rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-on-surface-variant text-sm">No activity yet.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/venues')}
                    className="mt-3 text-primary text-sm font-bold hover:underline underline-offset-4"
                  >
                    Browse venues
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 4).map((tx) => (
                    <HistoryRow key={tx.id} tx={tx} />
                  ))}
                  <button
                    type="button"
                    className="w-full py-3 text-sm font-bold text-primary hover:bg-primary-fixed/40 rounded-xl transition-colors"
                  >
                    View Full Activity
                  </button>
                </div>
              )}
            </Card>
          </div>
        </section>

        {/* ============================================================
            4. REDEEM YOUR POINTS
            ============================================================ */}
        <section className="space-y-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
              Curated Catalog
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tightest text-on-surface">
              Redeem Your Points
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REWARDS.map((r) => (
              <RewardCard
                key={r.id}
                reward={r}
                affordable={balance >= r.cost}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   Sub-components (page-local)
   ============================================================ */

const TONE = {
  primary: { bg: 'bg-primary-fixed', text: 'text-primary' },
  success: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  error: { bg: 'bg-rose-100', text: 'text-rose-600' },
};

function StatCard({ icon: Icon, label, value, tone = 'primary' }) {
  const t = TONE[tone];
  return (
    <Card padding="lg" className="flex items-center gap-6">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${t.bg}`}>
        <Icon className={`h-6 w-6 ${t.text}`} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <p className="text-3xl md:text-4xl font-black tracking-tightest text-on-surface mt-1">
          {value}
        </p>
      </div>
    </Card>
  );
}

function BenefitsTable({ activeIdx }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="bg-surface-container-low">
          <th className="p-5 md:p-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Benefit
          </th>
          {TIERS.map((t, i) => (
            <th
              key={t}
              className={[
                'p-5 md:p-6 text-[10px] font-bold uppercase tracking-widest text-center',
                i === activeIdx
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-on-surface-variant',
              ].join(' ')}
            >
              {TIER_LABELS[t]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {BENEFITS.map((b, rowIdx) => (
          <tr key={b.label} className={rowIdx % 2 === 1 ? 'bg-surface-container-low/40' : ''}>
            <td className="p-5 md:p-6 font-medium text-on-surface text-sm">{b.label}</td>
            {b.values.map((v, i) => (
              <td
                key={i}
                className={[
                  'p-5 md:p-6 text-center text-sm',
                  i === activeIdx ? 'bg-amber-50' : '',
                ].join(' ')}
              >
                <BenefitCell value={v} highlighted={i === activeIdx} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BenefitCell({ value, highlighted }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check
        className={`h-5 w-5 mx-auto ${highlighted ? 'text-amber-600' : 'text-primary'}`}
        strokeWidth={3}
      />
    ) : (
      <X className="h-5 w-5 mx-auto text-error/70" strokeWidth={2.5} />
    );
  }
  return (
    <span
      className={
        highlighted
          ? 'text-amber-600 font-bold'
          : 'text-on-surface-variant'
      }
    >
      {value}
    </span>
  );
}

function HistoryRow({ tx }) {
  const positive = (tx.points || 0) > 0;
  const date = tx.created_at
    ? new Date(tx.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '';
  const title = tx.venue_name || tx.description || 'Account activity';
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low/60 hover:bg-surface-container-low transition-colors">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {date}
        </p>
        <p className="font-bold text-on-surface text-sm truncate">{title}</p>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className={`font-black ${positive ? 'text-emerald-600' : 'text-error'}`}>
          {positive ? '+' : ''}
          {(tx.points || 0).toLocaleString()}
        </p>
        {tx.balance_after != null && (
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
            Bal: {tx.balance_after.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function RewardCard({ reward, affordable }) {
  return (
    <Card padding="none" className="group flex flex-col rounded-3xl overflow-hidden hover:shadow-ambient transition-all duration-300">
      <div className="relative h-48 overflow-hidden bg-surface-container-high">
        <img
          src={reward.image}
          alt={reward.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-container-lowest/85 backdrop-blur-glass text-on-surface shadow-ambient">
          {reward.badge}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-extrabold tracking-tightest text-on-surface mb-2">
          {reward.title}
        </h3>
        <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">
          {reward.description}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Cost
            </p>
            <p className="font-black text-amber-600 text-lg tracking-tightest">
              {reward.cost.toLocaleString()} <span className="text-xs">PTS</span>
            </p>
          </div>
          <Button
            size="sm"
            variant={affordable ? 'primary' : 'secondary'}
            disabled={!affordable}
            iconRight={affordable ? ArrowRight : undefined}
          >
            {affordable ? 'Redeem' : 'Locked'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
