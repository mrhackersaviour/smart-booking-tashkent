import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Minus, Copy, Check, ArrowRight, Calendar, Clock, Users,
  Sparkles, Info, UserPlus, X, Crown,
} from 'lucide-react';
import { Button, Card, Avatar, Badge, Input } from '../components/ui';

/**
 * GroupBooking — collaborative event creation page.
 *
 * Reference: design-reference/group_booking/
 *
 * Sections:
 *  1. Hero — gradient `bg-primary-container` editorial header.
 *  2. Stepper — 4 step pill progress (Create / Invite / Venue / Split).
 *  3. Left col (col-span-4): Event details form + Find friends + share link.
 *  4. Middle col (col-span-5): Invited friends list + Payment distribution.
 *  5. Right col (col-span-3): Sticky `bg-on-secondary-fixed` summary card +
 *     "estimates only" info note.
 *
 * Design rules followed:
 *  - DESIGN.md "No-Line Rule": no border-t separators. The stepper rail is a
 *    `bg-surface-container-high` strip, not a hairline.
 *  - Tonal layering for sectioning (surface → surface-container-low form
 *    panels → surface-container-lowest content cards).
 *  - All inputs/buttons use design-system primitives.
 *  - Material Symbols → lucide-react.
 *
 * NOTE: Backend has no /group-bookings endpoint yet. State is held locally
 * (component state) — replace with `api.createGroupBooking(...)` once the
 * route is added on the server.
 */

const STEPS = [
  { id: 'create', label: 'Create Group' },
  { id: 'invite', label: 'Invite Friends' },
  { id: 'venue', label: 'Choose Venue' },
  { id: 'split', label: 'Split Bill' },
];

// Placeholder friend directory (replace with `api.searchUsers` once wired).
const SAMPLE_FRIENDS = [
  { id: 'u1', name: 'Marcus Chen', handle: '@mchen' },
  { id: 'u2', name: 'Sasha Sloane', handle: '@sasha_s' },
  { id: 'u3', name: 'David Miller', handle: '@dmiller_99' },
  { id: 'u4', name: 'Jordan Lee', handle: '@jordanlee' },
  { id: 'u5', name: 'Emma Wilson', handle: '@emma.w' },
  { id: 'u6', name: 'Alex Rivera', handle: '@alexr' },
  { id: 'u7', name: 'Aziz Karimov', handle: '@aziz_uz' },
  { id: 'u8', name: 'Diana Ergasheva', handle: '@diana.e' },
];

const STATUS_BADGES = {
  accepted: { label: 'Accepted', dot: 'bg-emerald-500', badge: 'success' },
  pending:  { label: 'Pending',  dot: 'bg-amber-500',   badge: 'warning' },
  declined: { label: 'Declined', dot: 'bg-rose-500',    badge: 'error' },
};

export default function GroupBooking() {
  // ============================================================
  //  Local state — replace with API once backend endpoint exists
  // ============================================================
  const [eventName, setEventName] = useState('Birthday Soirée');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [guests, setGuests] = useState(8);
  const [search, setSearch] = useState('');
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' | 'custom'
  const [customAmounts, setCustomAmounts] = useState({});
  const [linkCopied, setLinkCopied] = useState(false);

  // invitedFriends: array of { ...friend, status }
  const [invitedFriends, setInvitedFriends] = useState([
    { ...SAMPLE_FRIENDS[3], status: 'accepted' },
    { ...SAMPLE_FRIENDS[4], status: 'pending' },
    { ...SAMPLE_FRIENDS[5], status: 'declined' },
  ]);

  const totalEstimate = guests * 45; // placeholder $45 / guest until venue picked
  const perPerson = guests > 0 ? totalEstimate / guests : 0;
  const acceptedCount = invitedFriends.filter((f) => f.status === 'accepted').length;
  const shareLink = 'smartbook.uz/group/event_x92z';

  const filteredDirectory = useMemo(() => {
    const q = search.toLowerCase().trim();
    const invitedIds = new Set(invitedFriends.map((f) => f.id));
    return SAMPLE_FRIENDS.filter((f) => !invitedIds.has(f.id))
      .filter((f) => !q || f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q));
  }, [search, invitedFriends]);

  const inviteFriend = (friend) => {
    setInvitedFriends((prev) => [...prev, { ...friend, status: 'pending' }]);
  };
  const removeFriend = (id) => {
    setInvitedFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const copyLink = () => {
    if (navigator?.clipboard) navigator.clipboard.writeText(shareLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  // Determine which step is active for the indicator
  const currentStep = invitedFriends.length === 0 ? 'create' : 'invite';

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen">
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        {/* ============================================================
            1. HERO
            ============================================================ */}
        <header className="mb-12 relative overflow-hidden rounded-[2rem] bg-primary-container p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="relative z-10 max-w-xl">
            <Badge variant="accent" size="sm" className="mb-4">
              Collaborative · Group Booking
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-on-primary-container tracking-tightest mb-4 leading-[1.05]">
              Book Together
            </h1>
            <p className="text-lg text-on-primary-container/80 font-medium leading-relaxed">
              Planning a group event should be as fun as the event itself.
              Curate your evening, invite your circle, and let SBT handle the
              logistics.
            </p>
          </div>
          {/* Decorative blob — no real image to avoid broken refs */}
          <div className="relative w-full md:w-1/2 h-56 md:h-72">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-tertiary-fixed-dim via-primary to-primary-container shadow-ambient transform md:rotate-3" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-tertiary-fixed-dim rounded-full mix-blend-multiply blur-2xl opacity-70" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary-fixed-dim rounded-full mix-blend-multiply blur-2xl opacity-70" />
            <div className="relative h-full flex items-center justify-center">
              <Sparkles className="h-20 w-20 text-white/80" />
            </div>
          </div>
        </header>

        {/* ============================================================
            2. STEPPER
            ============================================================ */}
        <Stepper currentStep={currentStep} />

        {/* ============================================================
            3-5. THREE-COLUMN BODY
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ===== LEFT — Event details + Find friends ===== */}
          <div className="lg:col-span-4 space-y-8">
            {/* Event details */}
            <Card tier="low" padding="lg">
              <h3 className="text-lg font-bold mb-6 text-on-surface">Event Details</h3>
              <div className="space-y-5">
                <Input
                  label="Name Your Event"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Birthday Soirée"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                  <Input
                    label="Time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>

                {/* Guests stepper */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 px-1">
                    Guest Count
                  </label>
                  <div className="flex items-center justify-between bg-surface-container-lowest p-1.5 rounded-xl">
                    <StepperBtn onClick={() => setGuests((g) => Math.max(2, g - 1))} aria-label="Decrease">
                      <Minus className="h-4 w-4" />
                    </StepperBtn>
                    <span className="font-bold text-lg text-on-surface">
                      {String(guests).padStart(2, '0')}
                    </span>
                    <StepperBtn onClick={() => setGuests((g) => Math.min(50, g + 1))} aria-label="Increase">
                      <Plus className="h-4 w-4" />
                    </StepperBtn>
                  </div>
                </div>
              </div>
            </Card>

            {/* Find friends */}
            <Card tier="low" padding="lg">
              <h3 className="text-lg font-bold mb-6 text-on-surface">Find Friends</h3>

              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search names or handle"
                  className="w-full bg-surface-container-lowest pl-10 pr-4 py-3 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
                {filteredDirectory.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-4">
                    {search ? 'No matches.' : 'Everyone is invited!'}
                  </p>
                ) : (
                  filteredDirectory.map((f) => (
                    <div key={f.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={f.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{f.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{f.handle}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => inviteFriend(f)}
                        className="bg-secondary-container text-primary text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white transition-all flex items-center gap-1 shrink-0"
                      >
                        <UserPlus className="h-3 w-3" /> Invite
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Share link */}
              <div className="mt-8">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Share Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-container-lowest text-xs text-on-surface-variant truncate p-3 rounded-xl">
                    {shareLink}
                  </div>
                  <button
                    type="button"
                    onClick={copyLink}
                    aria-label="Copy share link"
                    className="bg-surface-container-high p-3 rounded-xl text-primary hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white transition-colors"
                  >
                    {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* ===== MIDDLE — Invited list + Split bill ===== */}
          <div className="lg:col-span-5 space-y-8">
            {/* Invited Friends */}
            <Card padding="lg" className="rounded-3xl">
              <div className="flex justify-between items-center mb-7">
                <h3 className="text-xl font-bold text-on-surface">Invited Friends</h3>
                <Badge variant="primary">{acceptedCount} Confirmed</Badge>
              </div>

              {invitedFriends.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 mx-auto text-outline-variant mb-3" />
                  <p className="text-sm text-on-surface-variant">
                    No one invited yet. Add friends from the panel on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invitedFriends.map((f) => (
                    <InvitedRow key={f.id} friend={f} onRemove={() => removeFriend(f.id)} />
                  ))}
                </div>
              )}
            </Card>

            {/* Split bill */}
            <Card padding="lg" className="rounded-3xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
                <h3 className="text-xl font-bold text-on-surface">Payment Distribution</h3>
                <div className="flex items-center bg-surface-container-low p-1 rounded-xl">
                  <SplitToggle active={splitMode === 'equal'} onClick={() => setSplitMode('equal')}>
                    Equal Split
                  </SplitToggle>
                  <SplitToggle active={splitMode === 'custom'} onClick={() => setSplitMode('custom')}>
                    Custom
                  </SplitToggle>
                </div>
              </div>

              <SplitList
                organizerLabel="You (Organizer)"
                friends={invitedFriends.filter((f) => f.status !== 'declined')}
                guests={guests}
                total={totalEstimate}
                mode={splitMode}
                customAmounts={customAmounts}
                onCustomChange={(id, value) =>
                  setCustomAmounts((prev) => ({ ...prev, [id]: value }))
                }
              />
            </Card>
          </div>

          {/* ===== RIGHT — Sticky summary ===== */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <SummaryCard
                eventName={eventName || 'Untitled Event'}
                eventDate={eventDate}
                guests={guests}
                total={totalEstimate}
                perPerson={perPerson}
              />

              {/* Info note — uses ghost ring + dashed visual via tonal block, no 1px border */}
              <Card tier="low" padding="md">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                    <Info className="h-4 w-4 text-tertiary" />
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Prices are estimates until a venue is selected and the booking
                    is confirmed by all members.
                  </p>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   Sub-components (page-local)
   ============================================================ */

function Stepper({ currentStep }) {
  const idx = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className="mb-12 flex justify-between items-center px-4 max-w-3xl mx-auto relative">
      {/* Tonal rail (NOT a border line) */}
      <div className="absolute top-5 left-6 right-6 h-1 bg-surface-container-high rounded-full -translate-y-1/2 z-0" />
      {/* Progress fill */}
      <div
        className="absolute top-5 left-6 h-1 bg-gradient-to-r from-primary to-primary-container rounded-full -translate-y-1/2 z-0 transition-all duration-500"
        style={{ width: `calc(${(idx / (STEPS.length - 1)) * 100}% - 12px)` }}
      />
      {STEPS.map((step, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all',
                active
                  ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-ambient'
                  : done
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-highest text-on-surface-variant',
              ].join(' ')}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={[
                'text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
                active || done ? 'text-primary' : 'text-on-surface-variant',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StepperBtn({ children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className="w-10 h-10 flex items-center justify-center text-primary hover:bg-gradient-to-r hover:from-primary hover:to-primary-container hover:text-white rounded-lg transition-all"
    >
      {children}
    </button>
  );
}

function InvitedRow({ friend, onRemove }) {
  const status = STATUS_BADGES[friend.status] || STATUS_BADGES.pending;
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-container-low transition-colors group">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar name={friend.name} size="md" />
          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ${status.dot} ring-2 ring-surface-container-lowest`} />
        </div>
        <div>
          <p className="font-bold text-on-surface">{friend.name}</p>
          <p className="text-xs text-on-surface-variant">{friend.handle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={status.badge}>{status.label}</Badge>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${friend.name}`}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SplitToggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
        active
          ? 'bg-surface-container-lowest text-primary shadow-ambient'
          : 'text-on-surface-variant hover:text-on-surface',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function SplitList({ organizerLabel, friends, guests, total, mode, customAmounts, onCustomChange }) {
  // Organizer is always present + each accepted/pending friend = 1 share
  const heads = 1 + friends.length; // organizer + invited (excluding declined)
  const equalShare = heads > 0 ? total / heads : 0;

  const rows = [
    { id: 'me', name: organizerLabel, isOrganizer: true },
    ...friends.map((f) => ({ id: f.id, name: f.name, isOrganizer: false })),
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const value = mode === 'equal'
          ? equalShare.toFixed(2)
          : (customAmounts[row.id] ?? equalShare.toFixed(2));
        return (
          <div key={row.id} className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-7 sm:col-span-8 flex items-center gap-3 min-w-0">
              {row.isOrganizer ? (
                <div className="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                  <Crown className="h-4 w-4 text-tertiary" />
                </div>
              ) : (
                <Avatar name={row.name} size="sm" />
              )}
              <span className="text-sm font-medium text-on-surface truncate">
                {row.name}
              </span>
            </div>
            <div className="col-span-5 sm:col-span-4 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">$</span>
              <input
                type="number"
                value={value}
                disabled={mode === 'equal'}
                onChange={(e) => onCustomChange(row.id, e.target.value)}
                className="w-full bg-surface-container-low pl-7 py-2.5 rounded-lg text-sm text-right font-mono text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-70"
              />
            </div>
          </div>
        );
      })}
      {heads > 0 && (
        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right pt-2">
          Split across {heads} {heads === 1 ? 'person' : 'people'}
        </p>
      )}
    </div>
  );
}

function SummaryCard({ eventName, eventDate, guests, total, perPerson }) {
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Pick a date';
  return (
    <Card padding="lg" className="bg-on-secondary-fixed text-white rounded-[2rem] shadow-ambient relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-tertiary via-primary to-tertiary" />

      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-6 relative">
        Event Summary
      </h3>

      <p className="text-2xl font-bold text-white mb-6 relative tracking-tight">
        {eventName}
      </p>

      <div className="space-y-5 mb-8 relative">
        <div className="flex justify-between items-end">
          <span className="text-white/60 text-sm font-medium">Total Estimate</span>
          <span className="text-3xl font-black tracking-tightest">${total.toFixed(2)}</span>
        </div>
        {/* Sub-row separated by whitespace + tonal contrast, NOT a border-t */}
        <div className="flex justify-between items-end pt-4">
          <span className="text-white/60 text-sm font-medium">Cost per person</span>
          <div className="text-right">
            <span className="text-xl font-bold text-tertiary-fixed-dim">
              ${perPerson.toFixed(2)}
            </span>
            <p className="text-[10px] text-white/60 uppercase font-bold mt-1">
              Split {guests} ways
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-8 relative">
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Users className="h-4 w-4" />
          <span>{guests} guests total</span>
        </div>
      </div>

      <Link
        to="/venues"
        className="relative w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-ambient transition-all active:scale-[0.98]"
      >
        <span>Choose Venue</span>
        <ArrowRight className="h-5 w-5" />
      </Link>
    </Card>
  );
}
