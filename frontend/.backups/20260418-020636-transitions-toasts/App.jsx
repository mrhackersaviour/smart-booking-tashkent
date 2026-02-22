import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Venues from './pages/Venues';
import VenueDetails from './pages/VenueDetails';
import BookingForm from './pages/BookingForm';
import MyBookings from './pages/MyBookings';
import LoyaltyDashboard from './pages/LoyaltyDashboard';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Checkout from './pages/Checkout';
import Help from './pages/Help';
import UserProfile from './pages/UserProfile';
import DesignSystem from './pages/DesignSystem';
import GroupBooking from './pages/GroupBooking';
import Dashboard from './pages/Dashboard';
import Dashboard2 from './pages/Dashboard2';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVenues from './pages/admin/AdminVenues';
import AdminBookings from './pages/admin/AdminBookings';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminOwners from './pages/admin/AdminOwners';
import OwnerLayout from './components/owner/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerVenues from './pages/owner/OwnerVenues';
import RegisterVenue from './pages/owner/RegisterVenue';
import EditVenue from './pages/owner/EditVenue';
import ManageTables from './pages/owner/ManageTables';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerReviews from './pages/owner/OwnerReviews';
import OwnerRevenue from './pages/owner/OwnerRevenue';
import OwnerSettings from './pages/owner/OwnerSettings';
import { api } from './services/api';
import AIChatWidget from './components/ai/AIChatWidget';
import AIAssistant from './pages/AIAssistant';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isOwnerRoute = location.pathname.startsWith('/owner');
  const isPanelRoute = isAdminRoute || isOwnerRoute;

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={isPanelRoute ? '' : 'min-h-screen bg-gray-50'}>
      {!isPanelRoute && <Navbar user={user} onLogout={handleLogout} />}
      {isAdminRoute ? (
        <Routes>
          <Route path="/admin" element={user?.role === 'admin' ? <AdminLayout user={user}><AdminDashboard /></AdminLayout> : <Navigate to="/" />} />
          <Route path="/admin/users" element={user?.role === 'admin' ? <AdminLayout user={user}><AdminUsers /></AdminLayout> : <Navigate to="/" />} />
          <Route path="/admin/venues" element={user?.role === 'admin' ? <AdminLayout user={user}><AdminVenues /></AdminLayout> : <Navigate to="/" />} />
          <Route path="/admin/bookings" element={user?.role === 'admin' ? <AdminLayout user={user}><AdminBookings /></AdminLayout> : <Navigate to="/" />} />
          <Route path="/admin/revenue" element={user?.role === 'admin' ? <AdminLayout user={user}><AdminRevenue /></AdminLayout> : <Navigate to="/" />} />
          <Route path="/admin/owners" element={user?.role === 'admin' ? <AdminLayout user={user}><AdminOwners /></AdminLayout> : <Navigate to="/" />} />
        </Routes>
      ) : isOwnerRoute ? (
        <Routes>
          <Route path="/owner" element={user?.role === 'owner' ? <OwnerLayout user={user}><OwnerDashboard /></OwnerLayout> : <Navigate to="/" />} />
          <Route path="/owner/venues" element={user?.role === 'owner' ? <OwnerLayout user={user}><OwnerVenues /></OwnerLayout> : <Navigate to="/" />} />
          <Route path="/owner/venues/new" element={user?.role === 'owner' ? <OwnerLayout user={user}><RegisterVenue /></OwnerLayout> : <Navigate to="/" />} />
          <Route path="/owner/venues/:venueId/edit" element={user?.role === 'owner' ? <OwnerLayout user={user}><EditVenue /></OwnerLayout> : <Navigate to="/" />} />
          <Route path="/owner/venues/:venueId/tables" element={user?.role === 'owner' ? <OwnerLayout user={user}><ManageTables /></OwnerLayout> : <Navigate to="/" />} />
          <Route path="/owner/bookings" element={user?.role === 'owner' ? <OwnerLayout user={user}><OwnerBookings /></OwnerLayout> : <Navigate to="/" />} />
          <Route path="/owner/reviews" element={user?.role === 'owner' ? <OwnerLayout user={user}><OwnerReviews /></OwnerLayout> : <Navigate to="/" />} />
          <Route path="/owner/revenue" element={user?.role === 'owner' ? <OwnerLayout user={user}><OwnerRevenue /></OwnerLayout> : <Navigate to="/" />} />
          <Route path="/owner/settings" element={user?.role === 'owner' ? <OwnerLayout user={user}><OwnerSettings /></OwnerLayout> : <Navigate to="/" />} />
        </Routes>
      ) : (
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={user ? <Navigate to={user.role === 'owner' ? '/owner' : user.role === 'admin' ? '/admin' : '/'} /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to={user.role === 'owner' ? '/owner' : user.role === 'admin' ? '/admin' : '/'} /> : <Register onLogin={handleLogin} />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetails user={user} />} />
            <Route path="/venues/:id/book" element={user ? <BookingForm /> : <Navigate to="/login" />} />
            <Route path="/my-bookings" element={user ? <MyBookings /> : <Navigate to="/login" />} />
            <Route path="/loyalty" element={user ? <LoyaltyDashboard /> : <Navigate to="/login" />} />
            <Route path="/subscriptions" element={<SubscriptionPlans user={user} />} />
            <Route path="/checkout/:bookingId" element={user ? <Checkout /> : <Navigate to="/login" />} />
            <Route path="/help" element={<Help />} />
            <Route path="/profile" element={user ? <UserProfile user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/design-system" element={<DesignSystem />} />
            <Route path="/group-booking" element={user ? <GroupBooking /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/dashboard-2" element={user ? <Dashboard2 user={user} /> : <Navigate to="/login" />} />
            <Route path="/assistant" element={<AIAssistant user={user} onLogout={handleLogout} />} />
          </Routes>
        </main>
      )}
      {!isPanelRoute && <AIChatWidget />}
    </div>
  );
}

export default App;
