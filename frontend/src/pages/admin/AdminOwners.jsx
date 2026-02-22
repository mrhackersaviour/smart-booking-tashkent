import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Store,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminOwners() {
  // --- Owner list state ---
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  // --- Pending venues state ---
  const [pendingVenues, setPendingVenues] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [venueActionLoading, setVenueActionLoading] = useState(null);

  // ---- Fetch owners ----
  const fetchOwners = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20, role: 'owner' };
    if (search) params.search = search;

    api.adminGetUsers(params)
      .then((data) => {
        setOwners(data.users || data.data || []);
        setTotalPages(
          data.totalPages || data.total_pages || Math.ceil((data.total || 0) / 20) || 1
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  // ---- Fetch pending venues ----
  const fetchPendingVenues = useCallback(() => {
    setPendingLoading(true);
    api.adminGetPendingVenues()
      .then((data) => {
        setPendingVenues(data.venues || data.data || data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setPendingLoading(false));
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);
  useEffect(() => { fetchPendingVenues(); }, [fetchPendingVenues]);

  // ---- Toggle owner active/inactive ----
  const handleToggleStatus = async (owner) => {
    setActionLoading(owner.id);
    try {
      const newActive = owner.is_active === 1 || owner.status === 'active' ? 0 : 1;
      await api.adminUpdateUser(owner.id, { is_active: newActive });
      fetchOwners();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Approve venue ----
  const handleApproveVenue = async (id) => {
    setVenueActionLoading(id);
    try {
      await api.adminApproveVenue(id);
      fetchPendingVenues();
    } catch (err) {
      setError(err.message);
    } finally {
      setVenueActionLoading(null);
    }
  };

  // ---- Reject venue ----
  const handleRejectVenue = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason === null) return; // cancelled
    setVenueActionLoading(id);
    try {
      await api.adminRejectVenue(id, reason || '');
      fetchPendingVenues();
    } catch (err) {
      setError(err.message);
    } finally {
      setVenueActionLoading(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOwners();
  };

  const isActive = (owner) => owner.is_active === 1 || owner.status === 'active' || (!owner.status && owner.is_active === undefined);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex gap-8">
      {/* ==================== Main Content ==================== */}
      <div className="flex-grow min-w-0 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ds-on-surface">
            Venue Owners
          </h1>
          <p className="text-ds-on-surface-variant mt-1">
            Manage venue owner accounts, review statuses, and approve pending venues.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}
            <button onClick={() => setError('')} className="ml-3 font-semibold underline">Dismiss</button>
          </div>
        )}

        {/* Search / Filters */}
        <section className="bg-ds-surface-lowest rounded-2xl shadow-ambient p-4 flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="flex-grow max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-on-surface-variant" />
            <input
              type="text"
              placeholder="Filter by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-ds-surface-low border-none rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-ds-primary/20 transition-all"
            />
          </form>
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="text-ds-primary text-sm font-semibold hover:underline"
            >
              Clear
            </button>
          )}
        </section>

        {/* Owners Table */}
        <div className="bg-ds-surface-lowest rounded-2xl shadow-ambient overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-7 w-7 animate-spin text-ds-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-ds-surface-low text-ds-on-surface-variant border-b border-ds-outline-variant/10">
                  <tr>
                    <th className="px-6 py-4 uppercase text-xs font-bold tracking-widest">Name / Email</th>
                    <th className="px-6 py-4 uppercase text-xs font-bold tracking-widest">Phone</th>
                    <th className="px-6 py-4 uppercase text-xs font-bold tracking-widest">Status</th>
                    <th className="px-6 py-4 uppercase text-xs font-bold tracking-widest">Venues</th>
                    <th className="px-6 py-4 uppercase text-xs font-bold tracking-widest">Join Date</th>
                    <th className="px-6 py-4 uppercase text-xs font-bold tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ds-surface-container">
                  {owners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-ds-on-surface-variant">
                        No owners found
                      </td>
                    </tr>
                  ) : (
                    owners.map((owner) => {
                      const active = isActive(owner);
                      return (
                        <tr
                          key={owner.id}
                          className="hover:bg-ds-surface-low/50 transition-colors group"
                        >
                          {/* Name / Email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                                {getInitials(owner.full_name || owner.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-ds-on-surface truncate">
                                  {owner.full_name || owner.name}
                                </p>
                                <p className="text-xs text-ds-on-surface-variant truncate">
                                  {owner.email}
                                </p>
                              </div>
                              <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 flex-shrink-0">
                                <Store className="h-3 w-3" /> Owner
                              </span>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-6 py-4 text-ds-on-surface-variant">
                            {owner.phone || owner.phone_number || '-'}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {active ? (
                              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-600" /> Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-red-500 font-medium">
                                <span className="w-2 h-2 rounded-full bg-red-500" /> Inactive
                              </span>
                            )}
                          </td>

                          {/* Venues Count */}
                          <td className="px-6 py-4 text-ds-on-surface-variant font-medium">
                            {owner.venues_count ?? owner.venue_count ?? 0}
                          </td>

                          {/* Join Date */}
                          <td className="px-6 py-4 text-ds-on-surface-variant">
                            {formatDate(owner.created_at || owner.joined_at)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleToggleStatus(owner)}
                                disabled={actionLoading === owner.id}
                                title={active ? 'Deactivate owner' : 'Activate owner'}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  active
                                    ? 'text-ds-on-surface-variant hover:text-red-600 hover:bg-red-50'
                                    : 'text-ds-on-surface-variant hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {actionLoading === owner.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : active ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-ds-surface-low flex items-center justify-between border-t border-ds-outline-variant/10">
              <p className="text-sm text-ds-on-surface-variant">
                Page <span className="font-semibold text-ds-on-surface">{page}</span> of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded hover:bg-ds-surface-container transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded hover:bg-ds-surface-container transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== Pending Venues Sidebar ==================== */}
      <aside className="w-80 flex-shrink-0">
        <div className="bg-ds-surface-high rounded-2xl p-6 border border-ds-outline-variant/5 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold tracking-tight text-ds-on-surface">Pending Venues</h2>
            {!pendingLoading && pendingVenues.length > 0 && (
              <span className="bg-ds-primary-container text-ds-on-primary-container px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                {pendingVenues.length} NEW
              </span>
            )}
          </div>

          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-ds-primary" />
            </div>
          ) : pendingVenues.length === 0 ? (
            <p className="text-sm text-ds-on-surface-variant text-center py-8">
              No pending venues to review.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingVenues.map((venue) => (
                <div
                  key={venue.id}
                  className="bg-ds-surface-lowest rounded-xl p-4 shadow-sm border border-ds-outline-variant/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    {venue.image_url || venue.photo ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                        <img
                          src={venue.image_url || venue.photo}
                          alt={venue.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-ds-surface-low flex items-center justify-center flex-shrink-0">
                        <Store className="h-5 w-5 text-ds-on-surface-variant" />
                      </div>
                    )}
                    {venue.created_at && (
                      <span className="text-[10px] text-ds-on-surface-variant font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(venue.created_at)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-ds-on-surface">{venue.name}</h3>
                  {(venue.owner_name || venue.owner?.full_name) && (
                    <p className="text-xs text-ds-on-surface-variant mb-1">
                      Owner: {venue.owner_name || venue.owner?.full_name}
                    </p>
                  )}
                  {(venue.type || venue.category) && (
                    <p className="text-[11px] uppercase tracking-widest text-ds-primary font-bold mb-4">
                      {venue.type || venue.category}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApproveVenue(venue.id)}
                      disabled={venueActionLoading === venue.id}
                      className="bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {venueActionLoading === venue.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectVenue(venue.id)}
                      disabled={venueActionLoading === venue.id}
                      className="bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
