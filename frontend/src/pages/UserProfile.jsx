import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon, Mail, Phone, MapPin, Camera, Star, Crown, Shield,
  Bell, Wallet, Settings, ChevronRight, Lock, BadgeCheck, Sparkles, LogOut,
  Calendar, Heart, TrendingUp,
} from 'lucide-react';
import { Button, Card, Input, Avatar, Badge } from '../components/ui';

/**
 * UserProfile — account settings page (bento layout).
 *
 * Reference: design-reference/user_profile_settings/
 *
 * Layout (per DESIGN.md):
 *  - Two-column shell: left sidebar (avatar + tier + section nav + upgrade
 *    card) on `bg-surface-container-low`, right canvas with section content.
 *  - Main canvas uses a 3-col bento grid:
 *      • Form column (col-span-2): identity / security / preferences forms
 *      • Side widgets (col-span-1): loyalty card + Quick stats + privacy note
 *  - No 1px solid borders. Tonal layering everywhere.
 *  - All inputs use the `Input` primitive (borderless surface lift).
 *  - Material Symbols → lucide-react.
 *
 * Business logic:
 *  - Backend has no `PUT /auth/me` endpoint yet — Save/Discard run optimistic
 *    UI updates only. When the endpoint lands, wire `api.updateMe(form)` into
 *    `handleSave`.
 */

const SECTIONS = [
  { id: 'personal',    label: 'Personal Info',   icon: UserIcon },
  { id: 'security',    label: 'Security',        icon: Lock },
  { id: 'preferences', label: 'Preferences',     icon: Settings },
  { id: 'payments',    label: 'Payment Methods', icon: Wallet },
];

function tierFromPoints(points = 0) {
  if (points >= 5000) return { name: 'Platinum', next: null, progress: 100, gradient: 'from-slate-700 to-slate-900' };
  if (points >= 2500) return { name: 'Gold',     next: 5000, progress: ((points - 2500) / 2500) * 100, gradient: 'from-amber-500 to-orange-600' };
  if (points >= 1000) return { name: 'Silver',   next: 2500, progress: ((points - 1000) / 1500) * 100, gradient: 'from-slate-400 to-slate-600' };
  return { name: 'Bronze', next: 1000, progress: (points / 1000) * 100, gradient: 'from-orange-400 to-rose-500' };
}

export default function UserProfile({ user, onLogout }) {
  const [section, setSection] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    address: user?.address || '',
  });
  const [savedToast, setSavedToast] = useState('');

  const tier = useMemo(() => tierFromPoints(user?.loyalty_points), [user?.loyalty_points]);
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

  if (!user) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        Please sign in to view your profile.
      </div>
    );
  }

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: replace with `api.updateMe(form)` once backend endpoint exists.
    setEditMode(false);
    setSavedToast('Profile updated locally.');
    setTimeout(() => setSavedToast(''), 2500);
  };

  const handleDiscard = () => {
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '',
      address: user.address || '',
    });
    setEditMode(false);
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        {/* ============================================================
            SIDEBAR
            ============================================================ */}
        <aside className="w-full lg:w-72 lg:min-h-[calc(100vh-64px)] bg-surface-container-low px-6 lg:px-8 pt-10 pb-6 shrink-0">
          {/* Avatar block */}
          <div className="mb-10">
            <div className="relative w-24 h-24 mb-4 group">
              <Avatar name={user.full_name} size="xl" ring />
              <button
                type="button"
                aria-label="Change photo"
                className="absolute bottom-0 right-0 bg-gradient-to-r from-primary to-primary-container text-white p-2 rounded-full shadow-ambient hover:scale-110 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-on-surface tracking-tightest">
              {user.full_name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Crown className="h-4 w-4 text-tertiary fill-tertiary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
                {tier.name} Tier Member
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 truncate">{user.email}</p>
          </div>

          {/* Section nav */}
          <nav className="space-y-1 mb-10">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={[
                    'w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all',
                    active
                      ? 'bg-surface-container-lowest text-primary shadow-ambient'
                      : 'text-on-surface-variant hover:bg-surface-container',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Upgrade card */}
          {tier.name !== 'Platinum' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" />
                <p className="font-bold text-sm">Upgrade to Platinum</p>
              </div>
              <p className="text-white/80 text-xs mb-4 leading-relaxed">
                Unlock 15% more rewards and exclusive VIP venue access.
              </p>
              <Link
                to="/subscriptions"
                className="block w-full py-2 bg-white text-primary rounded-lg text-xs font-bold text-center hover:bg-white/90 transition-colors"
              >
                View Plans
              </Link>
            </div>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-6 w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-error hover:bg-error/10 transition-colors"
            >
              <LogOut className="h-5 w-5" /> Sign Out
            </button>
          )}
        </aside>

        {/* ============================================================
            MAIN CANVAS
            ============================================================ */}
        <section className="flex-1 px-6 lg:px-12 py-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                  Account · Settings
                </p>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tightest text-on-surface mb-2">
                  Account Settings
                </h1>
                <p className="text-on-surface-variant max-w-md">
                  Manage your personal info, security preferences, and payment methods.
                </p>
              </div>
              <EditModeToggle on={editMode} onChange={setEditMode} />
            </div>

            {/* Saved toast */}
            {savedToast && (
              <Card tier="low" padding="sm" className="mb-6 bg-emerald-50">
                <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" /> {savedToast}
                </p>
              </Card>
            )}

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ===== FORM COLUMN ===== */}
              <div className="md:col-span-2 space-y-6">
                {section === 'personal' && (
                  <PersonalSection
                    form={form}
                    editMode={editMode}
                    onChange={handleChange}
                    onSave={handleSave}
                    onDiscard={handleDiscard}
                  />
                )}
                {section === 'security'    && <SecuritySection />}
                {section === 'preferences' && <PreferencesSection />}
                {section === 'payments'    && <PaymentsSection />}
              </div>

              {/* ===== SIDE WIDGETS ===== */}
              <div className="space-y-6">
                <LoyaltyCard user={user} tier={tier} memberSince={memberSince} />
                <QuickStats user={user} />
                <PrivacyNote />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   Sections
   ============================================================ */

function PersonalSection({ form, editMode, onChange, onSave, onDiscard }) {
  return (
    <Card padding="lg" as="form" onSubmit={onSave}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-secondary-container text-primary flex items-center justify-center">
          <BadgeCheck className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold tracking-tight text-on-surface">Identity Details</h3>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Full Name"
            name="full_name"
            value={form.full_name}
            onChange={onChange}
            icon={UserIcon}
            disabled={!editMode}
            required
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            icon={Mail}
            disabled={!editMode}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={onChange}
            icon={Phone}
            disabled={!editMode}
          />
          <Input
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={onChange}
            icon={Calendar}
            disabled={!editMode}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Residential Address
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={onChange}
            disabled={!editMode}
            rows={2}
            placeholder="Tashkent, Uzbekistan"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed resize-none"
          />
        </div>
      </div>

      {editMode && (
        <div className="flex items-center justify-end gap-4 mt-8 pt-6">
          <button
            type="button"
            onClick={onDiscard}
            className="px-6 py-3 text-on-surface-variant font-bold text-sm hover:text-on-surface transition-colors"
          >
            Discard
          </button>
          <Button type="submit" variant="primary">Save Changes</Button>
        </div>
      )}
    </Card>
  );
}

function SecuritySection() {
  return (
    <Card padding="lg">
      <SectionHeader icon={Shield} title="Security & Privacy" />
      <div className="space-y-3">
        <SettingsRow icon={Lock} title="Change Password" subtitle="Last changed 14 days ago" />
        <SettingsRow icon={Shield} title="Two-Factor Authentication" subtitle="Add an extra layer of security" />
        <SettingsRow icon={BadgeCheck} title="Login Sessions" subtitle="3 active sessions" />
      </div>
    </Card>
  );
}

function PreferencesSection() {
  return (
    <Card padding="lg">
      <SectionHeader icon={Settings} title="Preferences" />
      <div className="space-y-3">
        <SettingsRow icon={Bell} title="Notifications" subtitle="Email, SMS & push alerts" />
        <SettingsRow icon={Heart} title="Favorite Categories" subtitle="Personalize recommendations" />
        <SettingsRow icon={MapPin} title="Default Location" subtitle="Tashkent, Uzbekistan" />
      </div>
    </Card>
  );
}

function PaymentsSection() {
  return (
    <Card padding="lg">
      <SectionHeader icon={Wallet} title="Payment Methods" />
      <div className="text-center py-12 text-on-surface-variant">
        <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm mb-4">No payment methods saved yet.</p>
        <Button variant="primary">+ Add Payment Method</Button>
      </div>
    </Card>
  );
}

/* ============================================================
   Side widgets
   ============================================================ */

function LoyaltyCard({ user, tier, memberSince }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tier.gradient} rounded-2xl p-6 text-white shadow-ambient group`}>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-glass">
            <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">
            ID: {String(user.id || '').slice(0, 8).toUpperCase()}
          </span>
        </div>
        <h4 className="text-xl font-bold tracking-tight mb-1">{user.full_name}</h4>
        <p className="text-sm opacity-70 mb-6">
          {tier.name} Tier · Member since {memberSince}
        </p>
        {tier.next && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span>To Next Tier</span>
              <span>{user.loyalty_points} / {tier.next}</span>
            </div>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: `${Math.min(100, tier.progress)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStats({ user }) {
  return (
    <Card padding="md">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-5">
        Recent Activity
      </h3>
      <div className="space-y-4">
        <ActivityRow color="bg-primary" label="Updated profile photo" hint="2 days ago" />
        <ActivityRow color="bg-outline-variant" label="Changed password" hint="14 days ago" />
        <ActivityRow color="bg-outline-variant" label="New login: Tashkent" hint="Last month" />
      </div>
    </Card>
  );
}

function PrivacyNote() {
  return (
    <Card tier="low" padding="md">
      <div className="flex items-center gap-2 text-primary mb-2">
        <Shield className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Privacy Note</span>
      </div>
      <p className="text-[11px] leading-relaxed text-on-surface-variant">
        Your data is encrypted with AES-256. We never share details with third
        parties without your explicit consent.
      </p>
    </Card>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function EditModeToggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-full shadow-ambient"
    >
      <span className="text-sm font-medium text-on-surface-variant">Edit mode</span>
      <span
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-outline-variant/60'}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition translate-y-0.5 ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-full bg-secondary-container text-primary flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-on-surface">{title}</h3>
    </div>
  );
}

function SettingsRow({ icon: Icon, title, subtitle }) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface-variant flex items-center justify-center group-hover:bg-secondary-container group-hover:text-primary transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-left">
          <h4 className="font-bold text-on-surface text-sm">{title}</h4>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-outline" />
    </button>
  );
}

function ActivityRow({ color, label, hint }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`w-2 h-2 rounded-full ${color} mt-1.5 shrink-0`} />
      <div>
        <p className="text-xs font-bold text-on-surface">{label}</p>
        <p className="text-[10px] text-on-surface-variant">{hint}</p>
      </div>
    </div>
  );
}
