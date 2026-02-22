import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Bell, Mail, MessageSquare, Shield } from 'lucide-react';
import { api } from '../../services/api';

export default function OwnerSettings({ user }) {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailReviews: true,
    smsBookings: false,
    smsReminders: true,
    pushNotifications: true,
    marketingEmails: false,
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    } else {
      api.getMe()
        .then((data) => {
          const u = data.user || data;
          setProfile({ name: u.name || '', email: u.email || '', phone: u.phone || '' });
        })
        .catch(() => {});
    }
  }, [user]);

  const handleProfileSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Placeholder: API call to update profile
      await new Promise((r) => setTimeout(r, 600));
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwords.newPass.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setPasswords({ current: '', newPass: '', confirm: '' });
      setMessage({ type: 'success', text: 'Password changed successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const Toggle = ({ enabled, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-ds-primary' : 'bg-ds-outline-variant/40'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-ds-on-surface-variant mt-1">Manage your profile, notifications, and security.</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <section className="bg-ds-surface-lowest rounded-2xl p-6 md:p-8 shadow-ambient">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-ds-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-ds-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Profile Information</h2>
            <p className="text-xs text-ds-on-surface-variant">Update your personal details.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-ds-on-surface-variant block mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="input-field"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-ds-on-surface-variant block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-ds-on-surface-variant block mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="input-field"
              placeholder="+998 90 123 45 67"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleProfileSave}
              disabled={saving}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="bg-ds-surface-lowest rounded-2xl p-6 md:p-8 shadow-ambient">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Bell className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Notification Preferences</h2>
            <p className="text-xs text-ds-on-surface-variant">Choose how you want to be notified.</p>
          </div>
        </div>

        <div className="divide-y divide-ds-outline-variant/20">
          {[
            { key: 'emailBookings', icon: Mail, label: 'Email - New Bookings', desc: 'Receive an email when a new booking is made.' },
            { key: 'emailReviews', icon: MessageSquare, label: 'Email - New Reviews', desc: 'Get notified when a customer leaves a review.' },
            { key: 'smsBookings', icon: Mail, label: 'SMS - Booking Alerts', desc: 'Receive SMS for booking confirmations.' },
            { key: 'smsReminders', icon: Bell, label: 'SMS - Daily Reminders', desc: 'Morning summary of today\'s bookings.' },
            { key: 'pushNotifications', icon: Bell, label: 'Push Notifications', desc: 'Real-time browser push notifications.' },
            { key: 'marketingEmails', icon: Mail, label: 'Marketing & Tips', desc: 'Occasional tips to grow your venue business.' },
          ].map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-ds-on-surface-variant/60" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-xs text-ds-on-surface-variant">{desc}</p>
                </div>
              </div>
              <Toggle enabled={notifications[key]} onToggle={() => toggleNotification(key)} />
            </div>
          ))}
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-ds-surface-lowest rounded-2xl p-6 md:p-8 shadow-ambient">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Change Password</h2>
            <p className="text-xs text-ds-on-surface-variant">Ensure your account stays secure.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          {[
            { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'newPass', label: 'New Password', placeholder: 'At least 8 characters' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-ds-on-surface-variant block mb-1.5">
                {label}
              </label>
              <div className="relative">
                <input
                  type={showPasswords[key] ? 'text' : 'password'}
                  value={passwords[key]}
                  onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                  className="input-field pr-12"
                  placeholder={placeholder}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ds-outline hover:text-ds-on-surface transition-colors"
                >
                  {showPasswords[key] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
