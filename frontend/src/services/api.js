const API_BASE = '/api';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('accessToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const refreshed = await refreshToken();
      if (!refreshed) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
      throw new Error('TOKEN_REFRESHED');
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

const refreshToken = async () => {
  const token = localStorage.getItem('refreshToken');
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    return false;
  }
};

export const api = {
  // Auth
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  register: (data) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(handleResponse),

  // Venues
  getVenues: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/venues?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  getVenue: (id) =>
    fetch(`${API_BASE}/venues/${id}`, { headers: getHeaders() }).then(handleResponse),

  getVenueAvailability: (id, date) =>
    fetch(`${API_BASE}/venues/${id}/availability?date=${date}`, { headers: getHeaders() }).then(handleResponse),

  getDistricts: () =>
    fetch(`${API_BASE}/venues/districts`, { headers: getHeaders() }).then(handleResponse),

  getVenue3DModel: (id) =>
    fetch(`${API_BASE}/venues/${id}/3d-model`, { headers: getHeaders() }).then(handleResponse),

  // Bookings
  createBooking: (data) =>
    fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getMyBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/bookings?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  getBooking: (id) =>
    fetch(`${API_BASE}/bookings/${id}`, { headers: getHeaders() }).then(handleResponse),

  cancelBooking: (id) =>
    fetch(`${API_BASE}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  inviteToBooking: (id, emails) =>
    fetch(`${API_BASE}/bookings/${id}/invite`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ emails }),
    }).then(handleResponse),

  getSplitPayment: (id) =>
    fetch(`${API_BASE}/bookings/${id}/split`, { headers: getHeaders() }).then(handleResponse),

  // AI
  getAIRecommendations: (data) =>
    fetch(`${API_BASE}/ai/recommendations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  sendAIChatMessage: (message, conversationId = null) =>
    fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, conversation_id: conversationId }),
    }).then(handleResponse),

  getAITableSuggestion: (venueId, date, preferences) =>
    fetch(`${API_BASE}/ai/select-table`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ venue_id: venueId, date, preferences }),
    }).then(handleResponse),

  // Loyalty
  getLoyaltyTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/loyalty/transactions?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  getLoyaltySummary: () =>
    fetch(`${API_BASE}/loyalty/summary`, { headers: getHeaders() }).then(handleResponse),

  redeemLoyaltyPoints: (points, bookingId) =>
    fetch(`${API_BASE}/loyalty/redeem`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ points, booking_id: bookingId }),
    }).then(handleResponse),

  // Subscriptions
  getSubscriptionPlans: () =>
    fetch(`${API_BASE}/subscriptions/plans`, { headers: getHeaders() }).then(handleResponse),

  subscribeToPlan: (planType, paymentMethodId) =>
    fetch(`${API_BASE}/subscriptions/subscribe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ plan_type: planType, payment_method_id: paymentMethodId }),
    }).then(handleResponse),

  cancelSubscription: () =>
    fetch(`${API_BASE}/subscriptions/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  // Payments
  createPaymentIntent: (bookingId) =>
    fetch(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ booking_id: bookingId }),
    }).then(handleResponse),

  // Notifications
  getNotifications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/notifications?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  markNotificationRead: (id) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  markAllNotificationsRead: () =>
    fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  confirmPayment: (data) =>
    fetch(`${API_BASE}/payments/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  // Admin
  adminGetDashboard: () =>
    fetch(`${API_BASE}/admin/dashboard`, { headers: getHeaders() }).then(handleResponse),

  adminGetUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/admin/users?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  adminUpdateUser: (id, data) =>
    fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  adminDeleteUser: (id) =>
    fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE', headers: getHeaders(),
    }).then(handleResponse),

  adminGetVenues: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/admin/venues?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  adminCreateVenue: (data) =>
    fetch(`${API_BASE}/admin/venues`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  adminUpdateVenue: (id, data) =>
    fetch(`${API_BASE}/admin/venues/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  adminDeleteVenue: (id) =>
    fetch(`${API_BASE}/admin/venues/${id}`, {
      method: 'DELETE', headers: getHeaders(),
    }).then(handleResponse),

  adminGetBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/admin/bookings?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  adminUpdateBookingStatus: (id, status) =>
    fetch(`${API_BASE}/admin/bookings/${id}/status`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }),
    }).then(handleResponse),

  adminGetRevenue: () =>
    fetch(`${API_BASE}/admin/revenue`, { headers: getHeaders() }).then(handleResponse),

  adminGetPendingVenues: () =>
    fetch(`${API_BASE}/admin/venues/pending`, { headers: getHeaders() }).then(handleResponse),

  adminApproveVenue: (id) =>
    fetch(`${API_BASE}/admin/venues/${id}/approve`, {
      method: 'PUT', headers: getHeaders(),
    }).then(handleResponse),

  adminRejectVenue: (id, reason) =>
    fetch(`${API_BASE}/admin/venues/${id}/reject`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify({ reason }),
    }).then(handleResponse),

  // Owner
  ownerGetDashboard: () =>
    fetch(`${API_BASE}/owner/dashboard`, { headers: getHeaders() }).then(handleResponse),

  ownerGetVenues: () =>
    fetch(`${API_BASE}/owner/venues`, { headers: getHeaders() }).then(handleResponse),

  ownerRegisterVenue: (data) =>
    fetch(`${API_BASE}/owner/venues`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  ownerUpdateVenue: (id, data) =>
    fetch(`${API_BASE}/owner/venues/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  ownerGetTables: (venueId) =>
    fetch(`${API_BASE}/owner/venues/${venueId}/tables`, { headers: getHeaders() }).then(handleResponse),

  ownerAddTable: (venueId, data) =>
    fetch(`${API_BASE}/owner/venues/${venueId}/tables`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  ownerUpdateTable: (venueId, tableId, data) =>
    fetch(`${API_BASE}/owner/venues/${venueId}/tables/${tableId}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),

  ownerDeleteTable: (venueId, tableId) =>
    fetch(`${API_BASE}/owner/venues/${venueId}/tables/${tableId}`, {
      method: 'DELETE', headers: getHeaders(),
    }).then(handleResponse),

  ownerGetBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/owner/bookings?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  ownerUpdateBookingStatus: (id, status) =>
    fetch(`${API_BASE}/owner/bookings/${id}/status`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }),
    }).then(handleResponse),

  ownerGetReviews: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/owner/reviews?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  ownerRespondToReview: (id, response) =>
    fetch(`${API_BASE}/owner/reviews/${id}/respond`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ response }),
    }).then(handleResponse),

  ownerGetRevenue: () =>
    fetch(`${API_BASE}/owner/revenue`, { headers: getHeaders() }).then(handleResponse),
};
