import { useState, useEffect } from 'react';
import { TrendingUp, Building2, Calendar } from 'lucide-react';
import { api } from '../../services/api';

export default function OwnerRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ownerGetRevenue()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const totalRevenue = data?.revenueByVenue?.reduce((sum, v) => sum + v.total_revenue, 0) || 0;
  const totalBookings = data?.revenueByVenue?.reduce((sum, v) => sum + v.booking_count, 0) || 0;

  const statusColor = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    cancelled: 'bg-red-500',
    completed: 'bg-blue-500',
    no_show: 'bg-gray-500',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Revenue & Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} UZS</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Venues</p>
              <p className="text-2xl font-bold text-gray-900">{data?.revenueByVenue?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue (Last 12 Months)</h2>
        {data?.monthlyRevenue?.length > 0 ? (
          <div className="space-y-3">
            {data.monthlyRevenue.map((m) => {
              const maxRevenue = Math.max(...data.monthlyRevenue.map((r) => r.revenue), 1);
              const width = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-20">{m.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                    <div className="bg-emerald-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(width, 5)}%` }}>
                      <span className="text-xs text-white font-medium">{m.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 w-24 text-right">{m.booking_count} bookings</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No revenue data yet</p>
        )}
      </div>

      {/* Revenue by Venue */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Revenue by Venue</h2>
        </div>
        {data?.revenueByVenue?.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.revenueByVenue.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{v.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.booking_count}</td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-600">{v.total_revenue.toLocaleString()} UZS</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-gray-500 text-center">No venue revenue data</p>
        )}
      </div>

      {/* Bookings by Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Status</h2>
        {data?.bookingsByStatus?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {data.bookingsByStatus.map((s) => (
              <div key={s.status} className="text-center p-4 rounded-lg bg-gray-50">
                <div className={`w-3 h-3 rounded-full ${statusColor[s.status] || 'bg-gray-400'} mx-auto mb-2`}></div>
                <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                <p className="text-sm text-gray-500 capitalize">{s.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No booking status data</p>
        )}
      </div>
    </div>
  );
}
