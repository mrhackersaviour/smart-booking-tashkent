import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Layers, Armchair, Sofa, Ruler, Theater, Flower, PlusCircle, Undo2, Redo2,
  PlusSquare, UserPlus, Grid3x3, Magnet, RefreshCw, Trash2, Calendar,
  Minus, Plus, ChevronDown, Save, ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * ManageTables — Floor Plan Editor (table_management_editor).
 *
 * Reference: design-reference/table_management_editor/
 *
 * Layout (3-column workspace inside OwnerLayout canvas):
 *  - Left rail: Editor Tools (Tables / Seating / Walls / Stages / Decor) +
 *    "Add New Zone" + Undo/Redo footer.
 *  - Center: Canvas toolbar (Add Table / Add Seat / Edit Mode toggle / Grid /
 *    Snap / Reset) + dotted-grid scrollable canvas with the venue floor plate;
 *    each table renders as a draggable-looking element with status badge,
 *    capacity, and selection ring when active.
 *  - Right: Properties panel for the selected element (number, type, capacity
 *    stepper, X/Y/Z, status pills, maintenance date, Remove).
 *  - Bottom: Real-time stats footer on `bg-on-secondary-fixed` (Total Capacity
 *    / Available Seats / Booked Today / Utilization).
 *
 * Business logic preserved:
 *  - api.ownerGetTables(venueId) → list
 *  - api.ownerAddTable(venueId, payload)
 *  - api.ownerUpdateTable(venueId, tableId, patch)
 *  - api.ownerDeleteTable(venueId, tableId)
 *
 * Placeholders / TODO:
 *  - Drag-and-drop on the canvas is NOT wired — positions are edited via the
 *    X/Y inputs in the properties panel. TODO: add pointer-drag handlers that
 *    call ownerUpdateTable on drop.
 *  - Undo / Redo buttons are decorative — no history stack yet.
 *  - "Booked Today" comes from a placeholder constant (no booking-by-day API
 *    on this route). TODO: wire api.ownerGetBookings({ venueId, date: today }).
 */

const TOOLS = [
  { id: 'tables', label: 'Tables', icon: Sofa, active: true },
  { id: 'seating', label: 'Seating', icon: Armchair },
  { id: 'walls', label: 'Walls', icon: Ruler },
  { id: 'stages', label: 'Stages', icon: Theater },
  { id: 'decor', label: 'Decor', icon: Flower },
];

const ELEMENT_TYPES = ['Table', 'Booth', 'Single', 'VIP'];

const EMPTY_FORM = {
  table_number: '', label: '', capacity: 2, shape: 'round',
  position_x: 100, position_y: 100, position_z: 1,
  is_vip: false, price_multiplier: 1.0, is_available: true,
};

export default function ManageTables() {
  const { venueId } = useParams();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editMode, setEditMode] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [error, setError] = useState('');

  const selected = useMemo(
    () => tables.find((t) => t.id === selectedId) || null,
    [tables, selectedId]
  );

  useEffect(() => { loadTables(); }, [venueId]);

  // Sync form with selected table
  useEffect(() => {
    if (selected) {
      setForm({
        table_number: selected.table_number,
        label: selected.label || '',
        capacity: selected.capacity,
        shape: selected.shape || 'round',
        position_x: selected.position_x ?? 0,
        position_y: selected.position_y ?? 0,
        position_z: selected.position_z ?? 1,
        is_vip: !!selected.is_vip,
        price_multiplier: selected.price_multiplier || 1,
        is_available: selected.is_available !== false,
      });
    }
  }, [selected]);

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await api.ownerGetTables(venueId);
      setTables(data.tables || []);
      if (data.tables?.length && !selectedId) setSelectedId(data.tables[0].id);
    } catch (e) {
      setError(e.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const persist = async () => {
    if (!selected) return;
    try {
      await api.ownerUpdateTable(venueId, selected.id, {
        ...form,
        table_number: parseInt(form.table_number, 10),
        capacity: parseInt(form.capacity, 10),
        position_x: parseFloat(form.position_x),
        position_y: parseFloat(form.position_y),
        position_z: parseFloat(form.position_z),
        price_multiplier: parseFloat(form.price_multiplier),
      });
      await loadTables();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAdd = async () => {
    try {
      const next = (tables.reduce((m, t) => Math.max(m, t.table_number || 0), 0) || 0) + 1;
      const created = await api.ownerAddTable(venueId, {
        ...EMPTY_FORM,
        table_number: next,
        position_x: 80 + (tables.length % 4) * 220,
        position_y: 80 + Math.floor(tables.length / 4) * 180,
      });
      await loadTables();
      if (created?.table?.id) setSelectedId(created.table.id);
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async () => {
    if (!selected || !confirm('Remove this table?')) return;
    try {
      await api.ownerDeleteTable(venueId, selected.id);
      setSelectedId(null);
      await loadTables();
    } catch (e) { setError(e.message); }
  };

  // Stats
  const stats = useMemo(() => {
    const totalCapacity = tables.reduce((s, t) => s + (t.capacity || 0), 0);
    const availableSeats = tables
      .filter((t) => t.is_available !== false)
      .reduce((s, t) => s + (t.capacity || 0), 0);
    const bookedToday = totalCapacity - availableSeats; // placeholder
    const utilization = totalCapacity ? Math.round((bookedToday / totalCapacity) * 100) : 0;
    return { totalCapacity, availableSeats, bookedToday, utilization };
  }, [tables]);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Top breadcrumb / actions */}
      <div className="h-14 px-6 flex items-center justify-between bg-surface-container-lowest/70 backdrop-blur-glass shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/owner/venues"
            className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-sm font-extrabold tracking-tightest text-on-surface uppercase">
            Floor Plan Editor
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={persist}
            className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface flex items-center gap-2"
          >
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button
            type="button"
            onClick={persist}
            className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-primary to-primary-container text-white rounded-xl shadow-ambient hover:scale-[0.98] transition-transform"
          >
            Publish Layout
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error/5 px-6 py-2 text-sm font-semibold text-error">{error}</div>
      )}

      {/* 3-column workspace */}
      <div className="flex-1 flex min-h-0">
        {/* ============================================================
            LEFT RAIL — Editor Tools
            ============================================================ */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col p-4 bg-surface-container-low">
          <div className="mb-6 px-2">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-extrabold tracking-tightest text-on-surface">
                Editor Tools
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase">
              Drag &amp; Drop Elements
            </p>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={[
                  'p-3 flex items-center gap-3 rounded-lg transition-all text-left',
                  t.active
                    ? 'bg-surface-container-lowest text-primary shadow-ambient font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container',
                ].join(' ')}
              >
                <t.icon className="h-4 w-4" />
                <span className="text-[10px] tracking-widest uppercase font-bold">{t.label}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-ambient flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" /> Add New Zone
          </button>

          <div className="mt-4 flex items-center justify-between px-2 py-3">
            <div className="flex items-center gap-3">
              <button type="button" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 hover:text-primary transition-colors">
                <Undo2 className="h-4 w-4" />
                <span className="text-[9px] uppercase tracking-widest font-bold">Undo</span>
              </button>
              <button type="button" className="flex flex-col items-center gap-0.5 text-on-surface-variant/60 hover:text-primary transition-colors">
                <Redo2 className="h-4 w-4" />
                <span className="text-[9px] uppercase tracking-widest font-bold">Redo</span>
              </button>
            </div>
            <span className="text-[9px] font-bold text-on-surface-variant/60 bg-surface-container px-2 py-1 rounded">
              v2.4.1
            </span>
          </div>
        </aside>

        {/* ============================================================
            CENTER — Canvas
            ============================================================ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas toolbar */}
          <div className="h-14 flex items-center justify-between px-6 bg-surface shrink-0">
            <div className="flex items-center gap-2">
              <ToolbarButton icon={PlusSquare} label="Add Table" onClick={handleAdd} />
              <ToolbarButton icon={UserPlus} label="Add Seat" />
              <div className="ml-2 flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
                <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
                  Edit Mode
                </span>
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  className={[
                    'w-10 h-5 rounded-full relative transition-colors',
                    editMode ? 'bg-gradient-to-r from-primary to-primary-container' : 'bg-surface-container-high',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-ambient transition-all',
                      editMode ? 'right-0.5' : 'left-0.5',
                    ].join(' ')}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconBtn
                icon={Grid3x3}
                title="Toggle grid"
                active={showGrid}
                onClick={() => setShowGrid((v) => !v)}
              />
              <IconBtn icon={Magnet} title="Snap to objects" />
              <button
                type="button"
                onClick={loadTables}
                className="flex items-center gap-2 px-3 py-1.5 text-error font-bold text-sm hover:bg-error/5 rounded-lg transition-all"
              >
                <RefreshCw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          {/* Canvas surface */}
          <div className="flex-1 bg-surface-container-low overflow-auto p-10">
            <div
              className={[
                'relative w-[1200px] h-[800px] bg-surface-container-lowest rounded-2xl shadow-ambient mx-auto',
                showGrid ? 'canvas-grid' : '',
              ].join(' ')}
              onClick={() => setSelectedId(null)}
              style={
                showGrid
                  ? {
                      backgroundSize: '40px 40px',
                      backgroundImage:
                        'radial-gradient(circle, rgba(116,118,134,0.25) 1px, transparent 1px)',
                    }
                  : undefined
              }
            >
              {/* Entrance pin */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-on-secondary-fixed text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full z-10">
                Main Entrance
              </div>

              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                  Loading…
                </div>
              ) : tables.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant gap-3">
                  <Sofa className="h-12 w-12 opacity-30" />
                  <p className="text-sm">No tables yet — click <span className="font-bold text-primary">Add Table</span> to begin.</p>
                </div>
              ) : (
                tables.map((t) => (
                  <CanvasTable
                    key={t.id}
                    table={t}
                    selected={t.id === selectedId}
                    onSelect={(e) => { e.stopPropagation(); setSelectedId(t.id); }}
                  />
                ))
              )}

              {/* Legend */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-8">
                <LegendDot color="bg-emerald-500" label="Available" />
                <LegendDot color="bg-rose-500" label="Booked" />
                <LegendDot color="bg-tertiary" label="Maintenance" />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT — Properties
            ============================================================ */}
        <aside className="hidden lg:flex w-80 shrink-0 flex-col bg-surface-container-lowest">
          <div className="p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface mb-1">
              Properties
            </h2>
            <p className="text-xs text-on-surface-variant">
              Selected:{' '}
              <span className="text-primary font-bold">
                {selected ? `Table T-${selected.table_number}` : 'None'}
              </span>
            </p>
          </div>

          {!selected ? (
            <div className="p-6 text-sm text-on-surface-variant">
              Pick a table on the canvas to edit its properties.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
              <PropField label="Table Number">
                <input
                  type="number"
                  value={form.table_number}
                  onChange={(e) => update('table_number', e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary h-10 px-3"
                />
              </PropField>

              <PropField label="Element Type">
                <div className="relative">
                  <select
                    value={form.is_vip ? 'VIP' : 'Table'}
                    onChange={(e) => update('is_vip', e.target.value === 'VIP')}
                    className="w-full bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary h-10 px-3 appearance-none"
                  >
                    {ELEMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                </div>
              </PropField>

              <PropField label="Capacity">
                <div className="flex items-center bg-surface-container-low rounded-lg h-10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => update('capacity', Math.max(1, parseInt(form.capacity, 10) - 1))}
                    className="w-10 h-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => update('capacity', e.target.value)}
                    className="flex-1 bg-transparent border-none text-center text-sm font-bold focus:ring-0 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => update('capacity', parseInt(form.capacity, 10) + 1)}
                    className="w-10 h-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </PropField>

              <div className="grid grid-cols-3 gap-3">
                <CoordInput label="X-Pos" value={form.position_x} onChange={(v) => update('position_x', v)} />
                <CoordInput label="Y-Pos" value={form.position_y} onChange={(v) => update('position_y', v)} />
                <CoordInput label="Z-Idx" value={form.position_z} onChange={(v) => update('position_z', v)} />
              </div>

              <PropField label="Status">
                <div className="grid grid-cols-2 gap-2">
                  <StatusPill
                    active={form.is_available}
                    color="emerald"
                    label="Avail"
                    onClick={() => update('is_available', true)}
                  />
                  <StatusPill
                    active={!form.is_available}
                    color="rose"
                    label="Booked"
                    onClick={() => update('is_available', false)}
                  />
                </div>
              </PropField>

              <PropField label="Maintenance Date">
                <div className="flex items-center bg-surface-container-low rounded-lg h-10 px-3 gap-3">
                  <Calendar className="h-4 w-4 text-on-surface-variant" />
                  <span className="text-sm font-medium text-on-surface">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </PropField>

              <button
                type="button"
                onClick={persist}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-ambient hover:opacity-95 transition-all"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2 bg-error/5 text-error rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-error/10 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove Element
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ============================================================
          BOTTOM STATS
          ============================================================ */}
      <footer className="h-20 bg-on-secondary-fixed text-white flex items-center px-8 gap-10 shrink-0">
        <StatBlock label="Total Capacity" value={stats.totalCapacity} />
        <StatBlock label="Available Seats" value={stats.availableSeats} accent="text-emerald-300" sub={
          stats.totalCapacity ? `${Math.round((stats.availableSeats / stats.totalCapacity) * 100)}%` : '0%'
        } />
        <StatBlock label="Booked Today" value={stats.bookedToday} />
        <div className="flex-1" />
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Utilization
            </span>
            <span className="text-2xl font-extrabold tracking-tightest text-primary-fixed-dim">
              {stats.utilization}%
            </span>
          </div>
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-container transition-all"
              style={{ width: `${stats.utilization}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function ToolbarButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest text-on-surface rounded-lg text-sm font-semibold hover:text-primary hover:ring-1 hover:ring-primary/30 shadow-ambient transition-all"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function IconBtn({ icon: Icon, title, active, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        'p-2 rounded-lg transition-colors',
        active ? 'text-primary bg-primary-fixed/40' : 'text-on-surface-variant hover:bg-surface-container-high',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function CanvasTable({ table, selected, onSelect }) {
  const isVip = !!table.is_vip;
  const available = table.is_available !== false;
  const round = (table.shape || 'round') === 'round';
  const baseW = isVip ? 256 : round ? 128 : 192;
  const baseH = isVip ? 96 : round ? 128 : 128;

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        left: `${table.position_x ?? 0}px`,
        top: `${table.position_y ?? 0}px`,
        width: `${baseW}px`,
        height: `${baseH}px`,
      }}
      className={[
        'absolute flex flex-col items-center justify-center cursor-pointer transition-all',
        round ? 'rounded-full' : 'rounded-2xl',
        'bg-surface-container-low',
        selected ? 'ring-2 ring-primary shadow-ambient' : 'hover:ring-1 hover:ring-primary/30',
      ].join(' ')}
    >
      <div className={[
        'absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-surface-container-lowest',
        selected ? 'bg-gradient-to-br from-primary to-primary-container text-white' : 'bg-on-surface text-white',
      ].join(' ')}>
        T-{table.table_number}
      </div>
      <Sofa className={`h-6 w-6 ${selected ? 'text-primary/60' : 'text-on-surface-variant/40'}`} />
      <span
        className={[
          'mt-2 px-2 py-0.5 text-[10px] font-bold rounded uppercase',
          available ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
        ].join(' ')}
      >
        {available ? 'Available' : 'Booked'}
      </span>
      <div className="mt-1 text-[10px] text-on-surface-variant font-medium">
        Capacity: {table.capacity}
      </div>
      {selected && (
        <>
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-surface-container-lowest ring-2 ring-primary rounded-sm" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-surface-container-lowest ring-2 ring-primary rounded-sm" />
        </>
      )}
    </button>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}

function PropField({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function CoordInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-low border-none rounded-lg text-xs text-center h-8 focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function StatusPill({ active, color, label, onClick }) {
  const colors = {
    emerald: { active: 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300', dot: 'bg-emerald-500' },
    rose: { active: 'bg-rose-50 text-rose-700 ring-2 ring-rose-300', dot: 'bg-rose-500' },
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center justify-center gap-2 p-2 rounded-lg transition-all',
        active ? colors.active : 'bg-surface-container-low text-on-surface-variant opacity-60 hover:opacity-100',
      ].join(' ')}
    >
      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
}

function StatBlock({ label, value, accent, sub }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-extrabold tracking-tightest ${accent || ''}`}>{value}</span>
        {sub && <span className="text-xs text-white/40">{sub}</span>}
      </div>
    </div>
  );
}
