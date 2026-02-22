import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Building2, MapPin, Clock } from 'lucide-react';
import { api } from '../../services/api';

const venueTypes = [
  { value: 'cafe', label: 'Cafe' }, { value: 'restaurant', label: 'Restaurant' },
  { value: 'stadium', label: 'Stadium' }, { value: 'fitness', label: 'Fitness' },
  { value: 'barbershop', label: 'Barbershop' }, { value: 'carwash', label: 'Car Wash' },
];

const districts = [
  'Bektemir', 'Chilanzar', 'Yakkasaray', 'Yunusabad', 'Mirzo Ulugbek',
  'Mirabad', 'Sergeli', 'Shaykhontohur', 'Olmazar', 'Uchtepa', 'Yashnobod',
];

export default function EditVenue() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({});

  useEffect(() => {
    api.ownerGetVenues()
      .then((data) => {
        const venue = data.venues.find((v) => v.id === venueId);
        if (venue) {
          setForm({
            name: venue.name || '', type: venue.type || '', address: venue.address || '',
            district: venue.district || '', description: venue.description || '',
            cuisine_type: venue.cuisine_type || '', price_range: venue.price_range || 2,
            phone: venue.phone || '', website: venue.website || '',
            latitude: venue.latitude || '', longitude: venue.longitude || '',
            three_d_model_url: venue.three_d_model_url || '',
          });
        } else {
          setError('Venue not found');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [venueId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        price_range: parseInt(form.price_range),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      await api.ownerUpdateVenue(venueId, payload);
      setSuccess('Venue updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/owner/venues" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Venue</h1>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="input-field">
                {venueTypes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select name="price_range" value={form.price_range} onChange={handleChange} className="input-field">
                <option value="1">$ - Budget</option>
                <option value="2">$$ - Moderate</option>
                <option value="3">$$$ - Upscale</option>
                <option value="4">$$$$ - Premium</option>
              </select>
            </div>
            {(form.type === 'restaurant' || form.type === 'cafe') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                <input type="text" name="cuisine_type" value={form.cuisine_type} onChange={handleChange} className="input-field" />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="input-field" rows="3" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" /> Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <select name="district" value={form.district} onChange={handleChange} className="input-field">
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" /> Contact & Media
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="url" name="website" value={form.website} onChange={handleChange} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">3D Model URL</label>
              <input type="url" name="three_d_model_url" value={form.three_d_model_url} onChange={handleChange} className="input-field" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/owner/venues')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
          <button type="submit" disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
