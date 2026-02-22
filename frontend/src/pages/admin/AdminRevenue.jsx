import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '../../services/api';

const formatUZS = (amount) =>
  new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(amount || 0);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.adminGetRevenue()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  const monthly = data?.monthly_revenue || data?.monthlyRevenue || [];
  const statusBreakdown = data?.status_breakdown || data?.statusBreakdown || {};
  const topVenues = data?.top_venues || data?.topVenues || [];
  const totalRevenue = data?.total_revenue || data?.totalRevenue || 0;

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue || m.total || 0), 1);

  const statusCards = [
    { label: 'Completed', key: 'completed', icon: CheckCircle2, color: 'bg-blue-500' },
    { label: 'Confirmed', key: 'confirmed', icon: Calendar, color: 'bg-green-500' },
    { label: 'Pending', key: 'pending', icon: Clock, color: 'bg-yellow-500' },
    { label: 'Cancelled', key: 'cancelled', icon: XCircle, color: 'bg-red-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Revenue Analytics</h1>

      {/* Total revenue card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">{formatUZS(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Monthly revenue bar chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
        {monthly.length === 0 ? (
          <p className="text-gray-500 text-sm">No revenue data available</p>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {monthly.map((m, i) => {
              const value = m.revenue || m.total || 0;
              const heightPct = (value / maxRevenue) * 100;
              const monthLabel = m.month
                ? MONTH_NAMES[parseInt(String(m.month).split('-')[1], 10) - 1] || m.month
                : MONTH_NAMES[i % 12];

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs text-gray-500 mb-1">{formatUZS(value)}</span>
                    <div
                      className="w-full max-w-[40px] bg-primary-500 rounded-t-md transition-all"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{monthLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking status breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statusCards.map(({ label, key, icon: Icon, color }) => (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{statusBreakdown[key] ?? 0}</p>
              </div>
              <div className={`${color} p-3 rounded-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top 5 venues by revenue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Venues by Revenue</h2>
        </div>
        {topVenues.length === 0 ? (
          <p className="text-gray-500 text-sm p-6">No venue revenue data available</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Venue</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Bookings</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topVenues.slice(0, 5).map((v, i) => (
                <tr key={v.id || i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{v.name || v.venue_name}</td>
                  <td className="px-6 py-3 text-gray-600">{v.booking_count || v.bookings || 0}</td>
                  <td className="px-6 py-3 text-gray-600">{formatUZS(v.revenue || v.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
