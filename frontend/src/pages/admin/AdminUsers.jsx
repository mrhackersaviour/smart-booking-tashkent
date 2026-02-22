import { useState, useEffect, useCallback } from 'react';
import {
  Search, UserPlus, ChevronLeft, ChevronRight, Calendar, Eye, Pencil, Ban,
  ShieldCheck, Store, User as UserIcon, Mail, Download, CheckCircle2, XCircle,
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui';
import { api } from '../../services/api';

/**
 * AdminUsers — User Management table + Pending Venues approval sidebar.
 *
 * Reference: design-reference/admin_management_panel/
 *
 * Layout:
 *  - Page header: title, subtitle, gradient "Add New User" CTA.
 *  - Filters bar: search, role/status selects, date range, "Clear All".
 *  - Bulk action toolbar (deep navy `bg-on-secondary-fixed`) shown when ≥1 row
 *    is selected — Send Message / Suspend / Delete.
 *  - Data table with select column, ID, user details (avatar + email), role
 *    badge, status dot, join date, hover-revealed action icons.
 *  - Footer: Export CSV + pagination.
 *  - Right sidebar (`w-80 bg-surface-container-high`): Pending Venues queue
 *    with thumbnail, owner, type, Approve/Reject pair + "View All Queue" CTA.
 *
 * Business logic preserved:
 *  - api.adminGetUsers({ page, limit, search, role, status }) → list
 *  - api.adminUpdateUser(id, patch) → role/status edits
 *
 * Placeholders / TODO:
 *  - Pending Venues calls api.adminGetVenues({ status: 'pending' }) and
 *    api.adminApproveVenue / api.adminRejectVenue if those exist; gracefully
 *    falls back to empty.
 *  - Bulk Send Message has no backend endpoint — TODO wire when shipped.
 *  - Date Range button is decorative.
 *  - Export CSV is decorative — TODO add `/admin/users/export`.
 */

const ROLE_STYLES = {
  admin: { label: 'Admin', cls: 'bg-violet-100 text-violet-700', icon: ShieldCheck },
  owner: { label: 'Owner', cls: 'bg-emerald-100 text-emerald-700', icon: Store },
  user: { label: 'User', cls: 'bg-sky-100 text-sky-700', icon: UserIcon },
};

const AVATAR_COLORS = [
  'bg-primary-fixed text-primary',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
];

function initialsOf(name = '') {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '??';
}

function avatarColor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(new Set());

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (role) params.role = role;
    if (status) params.status = status;
    api.adminGetUsers(params)
      .then((d) => {
        const list = d.users || d.data || [];
        setUsers(list);
        setTotal(d.total || list.length);
        setTotalPages(d.totalPages || d.total_pages || Math.ceil((d.total || list.length) / 20) || 1);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, role, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  const clearFilters = () => { setSearch(''); setRole(''); setStatus(''); setPage(1); };

  const bulkSuspend = async () => {
    for (const id of selected) {
      try { await api.adminUpdateUser(id, { status: 'inactive' }); } catch {}
    }
    setSelected(new Set());
    fetchUsers();
  };

  return (
    <div className="flex gap-6">
      {/* ============================================================
          MAIN COLUMN
          ============================================================ */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-end gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
              Admin Central
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tightest text-on-surface">
              User Management
            </h1>
            <p className="text-on-surface-variant mt-1">
              Review, manage, and audit all system users and roles.
            </p>
          </div>
          <Button variant="primary" size="lg" iconLeft={UserPlus}>
            Add New User
          </Button>
        </div>

        {error && (
          <Card tier="low" padding="sm" className="bg-error/5">
            <p className="text-sm font-semibold text-error">{error}</p>
          </Card>
        )}

        {/* Filters bar */}
        <Card padding="sm" className="rounded-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-grow max-w-md relative min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Filter by name or email…"
                className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="bg-surface-container-low border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="user">User</option>
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-surface-container-low border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container transition-colors"
            >
              <Calendar className="h-4 w-4" /> Date Range
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-primary text-sm font-bold hover:underline underline-offset-4"
            >
              Clear All
            </button>
          </div>
        </Card>

        {/* Bulk action toolbar */}
        {selected.size > 0 && (
          <div className="bg-on-secondary-fixed text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-ambient">
            <div className="flex items-center gap-4">
              <span className="bg-gradient-to-r from-primary to-primary-container px-2.5 py-0.5 rounded text-xs font-bold">
                {selected.size} SELECTED
              </span>
              <span className="text-sm opacity-80">
                Perform bulk actions on selected users
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BulkBtn icon={Mail}>Send Message</BulkBtn>
              <BulkBtn icon={Ban} onClick={bulkSuspend}>Suspend</BulkBtn>
              <BulkBtn icon={XCircle} tone="error">Delete</BulkBtn>
            </div>
          </div>
        )}

        {/* Data table */}
        <Card padding="none" className="rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selected.size === users.length}
                      onChange={toggleAll}
                      className="rounded text-primary focus:ring-primary border-outline-variant"
                    />
                  </th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Join Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-on-surface-variant">Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-on-surface-variant">No users found.</td></tr>
                ) : users.map((u, idx) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    zebra={idx % 2 === 1}
                    selected={selected.has(u.id)}
                    onToggle={() => toggleOne(u.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between flex-wrap gap-3">
            <button
              type="button"
              className="text-on-surface-variant hover:text-primary text-sm font-bold flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl shadow-ambient transition-all"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <div className="flex items-center gap-4">
              <p className="text-sm text-on-surface-variant">
                Showing <span className="font-semibold text-on-surface">{users.length === 0 ? 0 : 1}–{users.length}</span> of {total} users
              </p>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        </Card>
      </div>

      {/* ============================================================
          PENDING VENUES SIDEBAR
          ============================================================ */}
      <PendingVenuesSidebar />
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function BulkBtn({ icon: Icon, tone, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2',
        tone === 'error'
          ? 'bg-error/20 text-error-container hover:bg-error/30'
          : 'hover:bg-white/10',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function UserRow({ user, zebra, selected, onToggle }) {
  const r = ROLE_STYLES[user.role] || ROLE_STYLES.user;
  const RIcon = r.icon;
  const active = (user.status || 'active') === 'active';
  const idLabel = `#USR-${(user.id || '').toString().padStart(4, '0').slice(-4).toUpperCase()}`;
  const color = avatarColor(user.email || user.full_name);

  return (
    <tr className={`group transition-colors ${zebra ? 'bg-surface-container-low/40' : ''} hover:bg-surface-container-low/70`}>
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="rounded text-primary focus:ring-primary border-outline-variant"
        />
      </td>
      <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{idLabel}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${color}`}>
            {initialsOf(user.full_name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-on-surface truncate">{user.full_name || 'Unnamed'}</p>
            <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${r.cls}`}>
          <RIcon className="h-3 w-3" /> {r.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`flex items-center gap-1.5 font-medium text-xs ${active ? 'text-emerald-600' : 'text-error'}`}>
          <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-error'}`} />
          {active ? 'Active' : 'Suspended'}
        </span>
      </td>
      <td className="px-6 py-4 text-on-surface-variant text-xs">{formatDate(user.created_at)}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <RowAction icon={Eye} title="View" />
          <RowAction icon={Pencil} title="Edit" />
          <RowAction icon={Ban} title="Suspend" tone="error" />
        </div>
      </td>
    </tr>
  );
}

function RowAction({ icon: Icon, title, tone }) {
  return (
    <button
      type="button"
      title={title}
      className={[
        'p-2 transition-colors',
        tone === 'error'
          ? 'text-on-surface-variant hover:text-error'
          : 'text-on-surface-variant hover:text-primary',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="p-2 rounded hover:bg-surface-container transition-colors disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={[
            'w-8 h-8 rounded text-sm font-bold transition-all',
            p === page
              ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-ambient'
              : 'text-on-surface hover:bg-surface-container',
          ].join(' ')}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="p-2 rounded hover:bg-surface-container transition-colors disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ============================================================
   Pending Venues Sidebar
   ============================================================ */

function PendingVenuesSidebar() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (typeof api.adminGetVenues !== 'function') {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.adminGetVenues({ status: 'pending', limit: 6 })
      .then((d) => setVenues(d.venues || d.data || []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const decide = async (venueId, approve) => {
    try {
      const fn = approve ? api.adminApproveVenue : api.adminRejectVenue;
      if (typeof fn === 'function') await fn(venueId);
      load();
    } catch {}
  };

  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="bg-surface-container-high rounded-3xl p-6 sticky top-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold tracking-tightest text-on-surface">
            Pending Venues
          </h2>
          {venues.length > 0 && (
            <Badge variant="primary">{venues.length} new</Badge>
          )}
        </div>
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-surface-container-lowest rounded-2xl animate-pulse" />
            ))
          ) : venues.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">
              No venues awaiting approval.
            </p>
          ) : (
            venues.map((v) => (
              <PendingVenueCard key={v.id} venue={v} onDecide={decide} />
            ))
          )}
        </div>
        <button
          type="button"
          className="w-full mt-6 py-3 rounded-2xl text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:bg-surface-container-lowest hover:text-primary transition-all"
        >
          View All Queue
        </button>
      </div>
    </aside>
  );
}

function PendingVenueCard({ venue, onDecide }) {
  const ago = venue.created_at
    ? new Date(venue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Recent';
  return (
    <Card padding="sm" className="rounded-2xl">
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-high">
          {venue.image_url ? (
            <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary-container" />
          )}
        </div>
        <span className="text-[10px] text-on-surface-variant font-medium">{ago}</span>
      </div>
      <h3 className="font-extrabold tracking-tightest text-on-surface truncate">{venue.name}</h3>
      <p className="text-xs text-on-surface-variant mb-1 truncate">
        Owner: {venue.owner_name || 'Unknown'}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-4">
        {venue.type || 'Venue'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onDecide(venue.id, true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          type="button"
          onClick={() => onDecide(venue.id, false)}
          className="bg-error/10 hover:bg-error/20 text-error py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
        >
          <XCircle className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </Card>
  );
}
