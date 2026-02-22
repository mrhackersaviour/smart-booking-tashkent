import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin, XCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const STATUS_STYLES = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
  no_show: 'bg-red-100 text-red-700',
};

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    const params = {};
    if (filter) params.status = filter;
    api.getMyBookings(params)
      .then((data) => setBookings(data.bookings))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(id);
    try {
      await api.cancelBooking(id);
      fetchBookings();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link to="/venues" className="btn-primary text-sm">New Booking</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: '', label: 'All' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'pending', label: 'Pending' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ].map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse p-6">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 card">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No bookings yet</p>
          <Link to="/venues" className="text-primary-600 font-medium hover:text-primary-700">Browse venues</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <Link to={`/venues/${booking.venue_id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                    {booking.venue_name}
                  </Link>
                  <span className="text-sm text-gray-500 ml-2 capitalize">{booking.venue_type}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(booking.booking_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gray-400" />
                  {booking.guests_count} guest{booking.guests_count > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {booking.table_label || 'Auto-assigned'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-500">Total: </span>
                  <span className="font-semibold text-gray-900">
                    {parseInt(booking.total_price).toLocaleString()} UZS
                  </span>
                  {booking.loyalty_points_earned > 0 && (
                    <span className="text-primary-600 ml-2">+{booking.loyalty_points_earned} pts</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {['confirmed', 'pending'].includes(booking.status) && booking.payment_status !== 'paid' && (
                    <button onClick={() => navigate(`/checkout/${booking.id}`)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </button>
                  )}
                  {['confirmed', 'pending'].includes(booking.status) && (
                    <button onClick={() => handleCancel(booking.id)}
                      disabled={cancelling === booking.id}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      {cancelling === booking.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>

              {booking.special_requests && (
                <p className="mt-3 text-sm text-gray-500 italic border-t border-gray-100 pt-3">
                  "{booking.special_requests}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
