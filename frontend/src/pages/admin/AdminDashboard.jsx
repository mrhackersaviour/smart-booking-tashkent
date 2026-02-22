import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Building2,
  TrendingUp,
  UserCheck,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';

const formatUZS = (amount) =>
  new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .adminGetDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-[3px] border-ds-primary/20 border-t-ds-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-5 rounded-2xl text-sm font-medium">
        {error}
      </div>
    );
  }

  const stats = data?.stats || data || {};

  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers ?? stats.total_users ?? 0,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total Owners',
      value: stats.totalOwners ?? stats.total_owners ?? 0,
      icon: UserCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Active Venues',
      value: stats.totalVenues ?? stats.total_venues ?? 0,
      icon: Building2,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings ?? stats.total_bookings ?? 0,
      icon: Calendar,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Revenue',
      value: formatUZS(stats.totalRevenue ?? stats.total_revenue),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Pending Venues',
      value: stats.pendingVenues ?? stats.pending_venues ?? 0,
      icon: Clock,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-ds-on-surface tracking-tight">
          System Overview
        </h2>
        <p className="text-ds-on-surface-variant font-medium mt-1">
          Live platform performance and operational metrics.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-2xl shadow-ambient hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              {card.label}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{card.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
