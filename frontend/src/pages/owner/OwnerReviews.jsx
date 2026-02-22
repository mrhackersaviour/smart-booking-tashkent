import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { api } from '../../services/api';

export default function OwnerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [venueFilter, setVenueFilter] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    api.ownerGetVenues().then((data) => setVenues(data.venues)).catch(console.error);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [venueFilter]);

  const loadReviews = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (venueFilter) params.venue_id = venueFilter;
      const data = await api.ownerGetReviews(params);
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      await api.ownerRespondToReview(reviewId, replyText.trim());
      setReplyingTo(null);
      setReplyText('');
      loadReviews(pagination.page);
    } catch (err) {
      alert(err.message);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{review.user_name}</span>
                    <span className="text-sm text-gray-400">on</span>
                    <span className="text-sm font-medium text-emerald-600">{review.venue_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 mb-4">{review.comment}</p>
              )}

              {/* Owner response */}
              {review.owner_response ? (
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg">
                  <p className="text-sm font-medium text-emerald-800 mb-1">Your Response:</p>
                  <p className="text-sm text-emerald-700">{review.owner_response}</p>
                  {review.owner_response_at && (
                    <p className="text-xs text-emerald-500 mt-2">{new Date(review.owner_response_at).toLocaleDateString()}</p>
                  )}
                </div>
              ) : replyingTo === review.id ? (
                <div className="mt-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input-field mb-2"
                    rows="3"
                    placeholder="Write your response..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReply(review.id)}
                      className="inline-flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
                      <Send className="h-4 w-4" /> Send Reply
                    </button>
                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setReplyingTo(review.id)}
                  className="mt-3 inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" /> Reply to Review
                </button>
              )}
            </div>
          ))}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <button onClick={() => loadReviews(pagination.page - 1)} disabled={pagination.page <= 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
                <button onClick={() => loadReviews(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
