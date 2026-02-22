import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Crown, Zap, Star, ArrowRight, ChevronDown, X, Sparkles, ShieldCheck,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { Footer } from '../components/layout';
import { api } from '../services/api';

/**
 * SubscriptionPlans — pricing & plans page.
 *
 * Reference: design-reference/pricing_plans/
 *
 * Sections:
 *  1. Header — title, lead, Monthly/Annual billing toggle + "Save 20%" badge.
 *  2. Plan Grid — 3 columns; the "popular" plan is visually elevated
 *     (scale-105 + gradient ring + ambient shadow + "Most Popular" pin).
 *  3. FAQ — collapsible items inside `Card tier="low"` rows.
 *  4. CTA Anchor — `bg-on-secondary-fixed` deep navy hero with "Still
 *     undecided?" + Schedule a Demo button.
 *  5. Footer.
 *
 * Design rules followed:
 *  - DESIGN.md "No-Line Rule": no border-t between FAQ rows; cards use
 *    surface-tier separation, not 1px borders.
 *  - Material Symbols → lucide-react.
 *  - Primary CTA gradient on the popular plan; tonal CTA on the others.
 *
 * Business logic preserved from previous SubscriptionPlans.jsx:
 *  - api.getSubscriptionPlans → { plans, currentPlan }
 *  - api.subscribeToPlan(planType) → optimistic update + bonus points message
 *  - api.cancelSubscription() → reset to 'free'
 *  - Login redirect if !user
 */

const PLAN_ICONS = {
  free: Zap,
  basic: Zap,
  premium: Star,
  vip: Crown,
};

const FAQS = [
  {
    q: 'Can I change plans at any time?',
    a: 'Yes — you can upgrade or downgrade your plan whenever you like. Upgrades unlock the new features immediately. Downgrades take effect at the end of your current billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit & debit cards, Payme, Click, and bank transfer for annual enterprise plans. Your details are encrypted end-to-end.',
  },
  {
    q: 'How does the 20% annual discount work?',
    a: "When you switch to annual billing the displayed monthly price drops by 20% — you're charged once for the full year up-front. You can switch back to monthly anytime.",
  },
  {
    q: 'How do loyalty points work?',
    a: 'You earn points on every booking based on the total amount. Higher tier members earn more points per UZS spent and unlock priority booking windows.',
  },
  {
    q: 'Is there a cancellation fee?',
    a: 'Never. Cancel anytime without penalty. You retain access until the end of your billing period and your loyalty points stay in your account.',
  },
];

export default function SubscriptionPlans({ user }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    api.getSubscriptionPlans()
      .then((data) => {
        setPlans(data.plans);
        setCurrentPlan(data.currentPlan || 'free');
      })
      .catch(() => setError('Failed to load subscription plans'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planType) => {
    if (!user) { navigate('/login'); return; }
    setSubscribing(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.subscribeToPlan(planType);
      setCurrentPlan(planType);
      setSuccess(
        result.bonusPoints
          ? `${result.message} You earned ${result.bonusPoints} bonus points!`
          : result.message
      );
    } catch (err) {
      setError(err.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    setSubscribing(true);
    try {
      await api.cancelSubscription();
      setCurrentPlan('free');
      setSuccess('Subscription cancelled successfully');
    } catch (err) {
      setError(err.message || 'Failed to cancel');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen">
      <main className="max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-20">
        {/* ============================================================
            1. HEADER
            ============================================================ */}
        <header className="text-center mb-16">
          <Badge variant="primary" className="mb-5">Pricing · Plans</Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tightest text-on-surface mb-6">
            Choose Your Plan
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Unlock the full potential of Curator with a plan tailored to
            your curation needs — from individual explorers to global event firms.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center bg-surface-container-high p-1 rounded-xl">
              <BillingTab active={billing === 'monthly'} onClick={() => setBilling('monthly')}>
                Monthly
              </BillingTab>
              <BillingTab active={billing === 'annual'} onClick={() => setBilling('annual')}>
                Annual
              </BillingTab>
            </div>
            <Badge variant="primary" size="md">
              <Sparkles className="h-3 w-3" /> Save 20% on annual
            </Badge>
          </div>
        </header>

        {/* Status callouts */}
        {error && (
          <Card tier="low" padding="sm" className="bg-error/5 max-w-2xl mx-auto mb-6">
            <p className="text-sm font-semibold text-error text-center">{error}</p>
          </Card>
        )}
        {success && (
          <Card tier="low" padding="sm" className="bg-emerald-50 max-w-2xl mx-auto mb-6">
            <p className="text-sm font-semibold text-emerald-700 text-center">{success}</p>
          </Card>
        )}

        {/* ============================================================
            2. PLAN GRID
            ============================================================ */}
        {loading ? (
          <PlanGridSkeleton />
        ) : plans.length === 0 ? (
          <p className="text-center text-on-surface-variant">No plans available right now.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch mb-24 pt-8 px-2">
            {plans.map((plan, idx) => {
              const isPopular = plan.popular || idx === Math.floor(plans.length / 2);
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isPopular={isPopular}
                  isCurrent={currentPlan === plan.id}
                  billing={billing}
                  onSubscribe={() => handleSubscribe(plan.id)}
                  loading={subscribing}
                />
              );
            })}
          </div>
        )}

        {/* Cancel subscription option */}
        {currentPlan !== 'free' && (
          <div className="text-center -mt-16 mb-24">
            <button
              type="button"
              onClick={handleCancel}
              disabled={subscribing}
              className="text-sm text-on-surface-variant hover:text-error transition-colors font-medium"
            >
              Cancel current subscription
            </button>
          </div>
        )}

        {/* ============================================================
            3. FAQ
            ============================================================ */}
        <section className="max-w-3xl mx-auto mt-8">
          <div className="text-center mb-10">
            <Badge variant="primary" className="mb-3">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tightest text-on-surface">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <FaqItem
                key={i}
                question={item.q}
                answer={item.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </section>

        {/* ============================================================
            4. VISUAL CTA ANCHOR
            ============================================================ */}
        <section className="mt-24 relative h-[400px] rounded-[2rem] overflow-hidden bg-on-secondary-fixed">
          {/* Background gradient + tonal ground (no broken image refs) */}
          <div className="absolute inset-0 bg-gradient-to-br from-on-secondary-fixed via-on-secondary-fixed to-primary-container/40" />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-tertiary/15 rounded-full blur-3xl" />

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <Sparkles className="h-10 w-10 mb-6 text-primary-fixed-dim" />
            <h3 className="text-4xl md:text-5xl font-black tracking-tightest mb-4">
              Still undecided?
            </h3>
            <p className="text-lg text-white/70 mb-8 max-w-lg">
              Our concierge team is standing by to help you find the perfect
              infrastructure for your events.
            </p>
            <button
              type="button"
              onClick={() => navigate('/help')}
              className="bg-white text-on-secondary-fixed px-8 py-3 rounded-full font-bold hover:bg-primary-fixed transition-colors flex items-center gap-2 active:scale-[0.98]"
            >
              Schedule a Demo <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function BillingTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-8 py-2.5 rounded-lg text-sm font-bold transition-all',
        active
          ? 'bg-surface-container-lowest text-primary shadow-ambient'
          : 'text-on-surface-variant hover:text-primary',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function PlanCard({ plan, isPopular, isCurrent, billing, onSubscribe, loading }) {
  const Icon = PLAN_ICONS[plan.id] || Star;

  // Apply 20% off if annual billing
  const monthlyPrice = plan.price || 0;
  const displayPrice = billing === 'annual' ? Math.round(monthlyPrice * 0.8) : monthlyPrice;
  const isFree = !displayPrice;

  return (
    <Card
      padding="lg"
      className={[
        'relative flex flex-col rounded-3xl transition-all',
        isPopular
          ? 'z-10 shadow-ambient ring-2 ring-primary/30 lg:-my-4'
          : '',
      ].join(' ')}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-container text-white text-[10px] font-black px-5 py-1.5 rounded-full tracking-widest uppercase shadow-ambient">
          Most Popular
        </div>
      )}

      {/* Plan header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={[
              'w-12 h-12 rounded-2xl flex items-center justify-center',
              isPopular
                ? 'bg-gradient-to-br from-primary to-primary-container text-white'
                : 'bg-secondary-container text-primary',
            ].join(' ')}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h3
            className={[
              'text-xs font-bold tracking-widest uppercase',
              isPopular ? 'text-primary' : 'text-on-surface-variant',
            ].join(' ')}
          >
            {plan.name}
          </h3>
        </div>

        <div className="flex items-baseline gap-1.5">
          {isFree ? (
            <span className="text-5xl font-black text-on-surface tracking-tightest">Free</span>
          ) : (
            <>
              <span className="text-5xl font-black text-on-surface tracking-tightest">
                {displayPrice.toLocaleString()}
              </span>
              <span className="text-on-surface-variant font-medium">UZS</span>
            </>
          )}
          <span className="text-on-surface-variant text-sm ml-1">
            /{isFree ? 'forever' : billing === 'annual' ? 'mo · billed yearly' : 'month'}
          </span>
        </div>

        {plan.description && (
          <p className="mt-4 text-on-surface-variant leading-snug">{plan.description}</p>
        )}
      </div>

      {/* Features list */}
      <div className="space-y-4 mb-10 flex-grow">
        {(plan.features || []).map((feature, i) => (
          <FeatureRow key={i} feature={feature} highlighted={isPopular} />
        ))}
      </div>

      {/* CTA */}
      {isCurrent ? (
        <div className="w-full py-4 px-6 rounded-xl bg-surface-container-low text-center text-on-surface-variant font-bold flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Current Plan
        </div>
      ) : isPopular ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          iconRight={ArrowRight}
          onClick={onSubscribe}
        >
          Upgrade Now
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={onSubscribe}
        >
          {isFree ? 'Get Started' : 'Choose Plan'}
        </Button>
      )}
    </Card>
  );
}

function FeatureRow({ feature, highlighted }) {
  // feature can be a string or { label, included }
  const label = typeof feature === 'string' ? feature : feature.label;
  const included = typeof feature === 'string' ? true : feature.included !== false;
  return (
    <div className={`flex items-start gap-3 ${included ? '' : 'opacity-40'}`}>
      <div
        className={[
          'shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
          included
            ? highlighted
              ? 'bg-gradient-to-br from-primary to-primary-container text-white'
              : 'bg-secondary-container text-primary'
            : 'bg-surface-container text-on-surface-variant',
        ].join(' ')}
      >
        {included ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
      </div>
      <span className={`text-sm font-medium ${included ? 'text-on-surface' : 'text-on-surface-variant'}`}>
        {label}
      </span>
    </div>
  );
}

function FaqItem({ question, answer, open, onToggle }) {
  return (
    <Card tier="low" padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-6 flex justify-between items-center text-left hover:bg-surface-container transition-colors"
      >
        <h4 className="font-bold text-on-surface pr-4">{question}</h4>
        <ChevronDown
          className={`h-5 w-5 text-on-surface-variant shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-primary' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-on-surface-variant text-sm leading-relaxed">{answer}</p>
        </div>
      </div>
    </Card>
  );
}

function PlanGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[480px] bg-surface-container rounded-3xl animate-pulse" />
      ))}
    </div>
  );
}
