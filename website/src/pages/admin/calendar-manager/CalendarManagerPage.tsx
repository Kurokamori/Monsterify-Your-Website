import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { TabContainer } from '@components/common/TabContainer';
import calendarService, { CalendarMiscItem, HolidayDateItem } from '../../../services/calendarService';
import '../../../styles/admin/calendar-manager.css';

// ============================================================================
// Misc Entries Tab
// ============================================================================

type MiscFormData = { title: string; details: string; startDate: string; endDate: string };
const EMPTY_MISC: MiscFormData = { title: '', details: '', startDate: '', endDate: '' };

function MiscEntriesTab() {
  const [entries, setEntries] = useState<CalendarMiscItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MiscFormData>(EMPTY_MISC);
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEntries(await calendarService.listMiscEntries());
    } catch {
      setError('Failed to load entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const openNew = () => { setEditingId(null); setForm(EMPTY_MISC); setShowForm(true); };
  const openEdit = (entry: CalendarMiscItem) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      details: entry.details || '',
      startDate: entry.startDate ? entry.startDate.slice(0, 10) : '',
      endDate: entry.endDate ? entry.endDate.slice(0, 10) : '',
    });
    setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_MISC); };

  const handleSave = async () => {
    if (!form.title.trim()) { return; }
    try {
      setSaving(true);
      const payload = { title: form.title.trim(), details: form.details.trim() || undefined, startDate: form.startDate || undefined, endDate: form.endDate || undefined };
      if (editingId != null) { await calendarService.updateMiscEntry(editingId, payload); }
      else { await calendarService.createMiscEntry(payload); }
      cancelForm();
      await fetchEntries();
    } catch { setError('Failed to save entry.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this entry?')) { return; }
    try { await calendarService.deleteMiscEntry(id); await fetchEntries(); } catch { setError('Failed to delete.'); }
  };

  return (
    <div>
      <div className="calendar-manager__header">
        <h2 style={{ margin: 0 }}>Misc Calendar Entries</h2>
        <button className="button primary sm" onClick={openNew}><i className="fas fa-plus" /> New Entry</button>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 'var(--spacing-small)' }}><i className="fas fa-exclamation-circle" /> {error}</div>}

      {showForm && (
        <div className="calendar-manager__form">
          <h3 style={{ margin: '0 0 var(--spacing-small)' }}>{editingId != null ? 'Edit Entry' : 'New Entry'}</h3>
          <div className="calendar-manager__form-group">
            <label>Title *</label>
            <input className="input" type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Entry title" />
          </div>
          <div className="calendar-manager__form-group">
            <label>Details</label>
            <textarea className="input" rows={3} value={form.details} onChange={e => setForm(prev => ({ ...prev, details: e.target.value }))} placeholder="Optional details" />
          </div>
          <div className="calendar-manager__form-row">
            <div className="calendar-manager__form-group"><label>Start Date</label><input className="input" type="date" value={form.startDate} onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))} /></div>
            <div className="calendar-manager__form-group"><label>End Date</label><input className="input" type="date" value={form.endDate} onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))} /></div>
          </div>
          <div className="calendar-manager__form-actions">
            <button className="button primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save</>}
            </button>
            <button className="button secondary" onClick={cancelForm}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="calendar-manager__empty"><i className="fas fa-spinner fa-spin" /><p>Loading...</p></div>
      ) : entries.length === 0 ? (
        <div className="calendar-manager__empty"><i className="fas fa-calendar" /><p>No miscellaneous entries yet.</p></div>
      ) : (
        <div className="calendar-manager__list">
          {entries.map(entry => (
            <div key={entry.id} className="calendar-manager__item">
              <div className="calendar-manager__item-info">
                <h3 className="calendar-manager__item-title">{entry.title}</h3>
                {entry.details && <p className="calendar-manager__item-details">{entry.details}</p>}
                {(entry.startDate || entry.endDate) && (
                  <span className="calendar-manager__item-dates">
                    <i className="fas fa-calendar" />{' '}
                    {entry.startDate && entry.endDate
                      ? `${new Date(entry.startDate).toLocaleDateString()} - ${new Date(entry.endDate).toLocaleDateString()}`
                      : new Date((entry.startDate || entry.endDate)!).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="calendar-manager__item-actions">
                <button className="button secondary sm" onClick={() => openEdit(entry)}><i className="fas fa-pen" /></button>
                <button className="button danger sm" onClick={() => handleDelete(entry.id)}><i className="fas fa-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Holiday Dates Tab
// ============================================================================

type HolidayFormData = { holiday: string; year: string; startDate: string; endDate: string };
const EMPTY_HOLIDAY: HolidayFormData = { holiday: '', year: String(new Date().getFullYear()), startDate: '', endDate: '' };

function HolidayDatesTab() {
  const [dates, setDates] = useState<HolidayDateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<HolidayFormData>(EMPTY_HOLIDAY);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  const fetchDates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDates(await calendarService.listHolidayDates());
    } catch {
      setError('Failed to load holiday dates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDates(); }, [fetchDates]);

  const openNew = () => { setForm({ ...EMPTY_HOLIDAY, year: filterYear }); setShowForm(true); };
  const openEdit = (item: HolidayDateItem) => {
    setForm({
      holiday: item.holiday,
      year: String(item.year),
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate.slice(0, 10),
    });
    setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setForm(EMPTY_HOLIDAY); };

  const handleSave = async () => {
    if (!form.holiday.trim() || !form.year || !form.startDate || !form.endDate) { return; }
    try {
      setSaving(true);
      await calendarService.upsertHolidayDate({
        holiday: form.holiday.trim(),
        year: Number(form.year),
        startDate: form.startDate,
        endDate: form.endDate,
      });
      cancelForm();
      await fetchDates();
    } catch { setError('Failed to save holiday date.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this holiday date?')) { return; }
    try { await calendarService.deleteHolidayDate(id); await fetchDates(); } catch { setError('Failed to delete.'); }
  };

  const handleGenerate = async () => {
    const yr = Number(filterYear) || new Date().getFullYear();
    setGenerating(true);
    setGenerateMsg(null);
    try {
      const result = await calendarService.generateHolidayDates(yr);
      setGenerateMsg(`Generated ${result.generated} holiday dates for ${yr}.`);
      await fetchDates();
    } catch {
      setError('Failed to generate holiday dates.');
    } finally {
      setGenerating(false);
    }
  };

  const filteredDates = filterYear
    ? dates.filter(d => String(d.year) === filterYear)
    : dates;

  const uniqueYears = [...new Set(dates.map(d => d.year))].sort((a, b) => b - a);

  return (
    <div>
      <div className="calendar-manager__header">
        <h2 style={{ margin: 0 }}>Holiday Dates</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-xsmall)', alignItems: 'center' }}>
          <select
            className="input"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            style={{ width: 100 }}
          >
            <option value="">All Years</option>
            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            {!uniqueYears.includes(new Date().getFullYear()) && (
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            )}
          </select>
          <button className="button primary sm" onClick={openNew}><i className="fas fa-plus" /> New Date</button>
          <button className="button secondary sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <><i className="fas fa-spinner fa-spin" /> Generating...</> : <><i className="fas fa-magic" /> Auto-Generate {filterYear}</>}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 'var(--font-size-xsmall)', color: 'var(--text-color-muted)', margin: '0 0 var(--spacing-small)' }}>
        Set the start and end dates for each holiday per year. Antiques linked to a holiday will appear on the calendar during these dates.
        Use <strong>Auto-Generate</strong> to calculate dates automatically (runs on Jan 1st each year too). You can override any date afterwards.
      </p>

      {generateMsg && (
        <div className="alert success" style={{ marginBottom: 'var(--spacing-small)' }}>
          <i className="fas fa-check-circle" /> {generateMsg}
        </div>
      )}

      {error && <div className="alert error" style={{ marginBottom: 'var(--spacing-small)' }}><i className="fas fa-exclamation-circle" /> {error}</div>}

      {showForm && (
        <div className="calendar-manager__form">
          <h3 style={{ margin: '0 0 var(--spacing-small)' }}>Holiday Date</h3>
          <div className="calendar-manager__form-row">
            <div className="calendar-manager__form-group">
              <label>Holiday Name *</label>
              <input className="input" type="text" value={form.holiday} onChange={e => setForm(prev => ({ ...prev, holiday: e.target.value }))} placeholder="e.g. Lunar New Year" />
            </div>
            <div className="calendar-manager__form-group">
              <label>Year *</label>
              <input className="input" type="number" value={form.year} onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))} />
            </div>
          </div>
          <div className="calendar-manager__form-row">
            <div className="calendar-manager__form-group"><label>Start Date *</label><input className="input" type="date" value={form.startDate} onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))} /></div>
            <div className="calendar-manager__form-group"><label>End Date *</label><input className="input" type="date" value={form.endDate} onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))} /></div>
          </div>
          <div className="calendar-manager__form-actions">
            <button className="button primary" onClick={handleSave} disabled={saving || !form.holiday.trim() || !form.startDate || !form.endDate}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save</>}
            </button>
            <button className="button secondary" onClick={cancelForm}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="calendar-manager__empty"><i className="fas fa-spinner fa-spin" /><p>Loading...</p></div>
      ) : filteredDates.length === 0 ? (
        <div className="calendar-manager__empty"><i className="fas fa-calendar" /><p>No holiday dates for {filterYear || 'any year'}.</p></div>
      ) : (
        <div className="calendar-manager__list">
          {filteredDates.map(item => (
            <div key={item.id} className="calendar-manager__item">
              <div className="calendar-manager__item-info">
                <h3 className="calendar-manager__item-title">{item.holiday}</h3>
                <span className="calendar-manager__item-dates">
                  <i className="fas fa-calendar" /> {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()} ({item.year})
                </span>
              </div>
              <div className="calendar-manager__item-actions">
                <button className="button secondary sm" onClick={() => openEdit(item)}><i className="fas fa-pen" /></button>
                <button className="button danger sm" onClick={() => handleDelete(item.id)}><i className="fas fa-trash" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

const CalendarManagerContent = () => {
  useDocumentTitle('Calendar Manager');

  return (
    <div className="calendar-manager">
      <div className="calendar-manager__header">
        <h1><i className="fas fa-calendar-plus" /> Calendar Manager</h1>
      </div>

      <TabContainer
        tabs={[
          { key: 'holidays', label: 'Holiday Dates', icon: 'fas fa-star', content: <HolidayDatesTab /> },
          { key: 'misc', label: 'Misc Entries', icon: 'fas fa-ellipsis-h', content: <MiscEntriesTab /> },
        ]}
      />
    </div>
  );
};

const CalendarManagerPage = () => (
  <AdminRoute>
    <CalendarManagerContent />
  </AdminRoute>
);

export default CalendarManagerPage;
