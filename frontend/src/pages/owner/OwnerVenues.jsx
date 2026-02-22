import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, MapPin, Star, Users, Settings } from 'lucide-react';
import { api } from '../../services/api';

export default function OwnerVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ownerGetVenues()
      .then((data) => setVenues(data.venues))
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

  const approvalBadge = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const typeIcons = {
    cafe: '☕', restaurant: '🍽️', stadium: '🏟️',
    fitness: '💪', barbershop: '💈', carwash: '🚗',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Venues</h1>
        <Link to="/owner/venues/new" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
          <Plus className="h-4 w-4" /> Add New Venue
        </Link>
      </div>

      {venues.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No venues yet</h3>
          <p className="text-gray-500 mb-6">Register your first venue to start receiving bookings</p>
          <Link to="/owner/venues/new" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
            <Plus className="h-5 w-5" /> Register Your First Venue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-5xl">{typeIcons[venue.type] || '🏢'}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${approvalBadge[venue.approval_status] || approvalBadge.pending}`}>
                    {venue.approval_status || 'approved'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 capitalize mb-3">{venue.type}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <MapPin className="h-4 w-4 mr-1" /> {venue.address}, {venue.district}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {venue.rating || '0.0'}</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {venue.total_bookings || 0} bookings</span>
                  <span className="flex items-center gap-1"><Settings className="h-4 w-4" /> {venue.total_tables || 0} tables</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/owner/venues/${venue.id}/edit`} className="flex-1 text-center bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                    <Edit className="h-4 w-4 inline mr-1" /> Edit
                  </Link>
                  <Link to={`/owner/venues/${venue.id}/tables`} className="flex-1 text-center bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    <Settings className="h-4 w-4 inline mr-1" /> Tables
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Building2Icon(props) {
  return <Building2 {...props} />;
}
