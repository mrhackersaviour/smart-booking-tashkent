import { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, Eye } from 'lucide-react';
import { api } from '../../services/api';

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', venue_id: '' });
  const [venues, setVenues] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    api.ownerGetVenues().then((data) => setVenues(data.venues)).catch(console.error);
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter.status) params.status = filter.status;
      if (filter.venue_id) params.venue_id = filter.venue_id;
      const data = await api.ownerGetBookings(params);
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.ownerUpdateBookingStatus(id, status);
      loadBookings(pagination.page);
    } catch (err) {
      alert(err.message);
    }
  };

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    no_show: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4">
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="input-field w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filter.venue_id} onChange={(e) => setFilter({ ...filter, venue_id: e.target.value })}
          className="input-field w-auto">
          <option value="">All Venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{b.user_name}</div>
                      <div className="text-xs text-gray-500">{b.user_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.venue_name}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{b.booking_date}</div>
                      <div className="text-xs text-gray-500">{b.start_time} - {b.end_time}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.guests_count}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {b.total_price ? `${b.total_price.toLocaleString()} UZS` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {b.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Confirm">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleStatusUpdate(b.id, 'cancelled')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => handleStatusUpdate(b.id, 'completed')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Complete">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button onClick={() => loadBookings(pagination.page - 1)} disabled={pagination.page <= 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
              <button onClick={() => loadBookings(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
