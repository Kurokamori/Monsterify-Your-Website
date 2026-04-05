import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { getItemImageUrl, handleItemImageError } from '../../../utils/imageUtils';
import calendarService, {
  CalendarData,
  CalendarAntiqueItem,
  CalendarEventItem,
  CalendarMiscItem,
} from '../../../services/calendarService';
import '../../../styles/guides/calendar.css';

// ============================================================================
// Helpers
// ============================================================================

type Category = 'antiques' | 'events' | 'misc';
type ViewMode = 'list' | 'calendar';

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'antiques', label: 'Antiques (Holidays)', icon: 'fas fa-gem' },
  { key: 'events', label: 'Events', icon: 'fas fa-calendar-alt' },
  { key: 'misc', label: 'Misc.', icon: 'fas fa-ellipsis-h' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getEventStatus(event: CalendarEventItem): 'current' | 'upcoming' | 'past' {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  if (now >= start && now <= end) { return 'current'; }
  if (now < start) { return 'upcoming'; }
  return 'past';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) { return ''; }
  return new Date(dateStr).toLocaleDateString();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

function getEventColor(event: CalendarEventItem): string | undefined {
  if (event.color) { return `var(--${event.color})`; }
  return undefined;
}

// ============================================================================
// Detail Modal
// ============================================================================

type DetailItem =
  | { type: 'antique'; item: CalendarAntiqueItem }
  | { type: 'event'; item: CalendarEventItem }
  | { type: 'misc'; item: CalendarMiscItem };

function DetailModal({ detail, onClose }: { detail: DetailItem; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (detail.type === 'antique') {
    const a = detail.item;
    const imageUrl = a.imageUrl || getItemImageUrl({ name: a.itemName, category: 'antique' });
    return (
      <div className="calendar-detail-overlay" onClick={onClose}>
        <div className="calendar-detail" onClick={e => e.stopPropagation()}>
          <button className="calendar-detail__close" onClick={onClose}><i className="fas fa-times" /></button>
          <h2 className="calendar-detail__title">{a.itemName}</h2>
          <div className="calendar-detail__meta">
            <span className="calendar-detail__badge"><i className="fas fa-tag" /> {a.category}</span>
            <span className="calendar-detail__badge"><i className="fas fa-star" /> {a.holiday}</span>
            {a.startDate && a.endDate && (
              <span className="calendar-detail__badge">
                <i className="fas fa-calendar" /> {formatDate(a.startDate)} - {formatDate(a.endDate)}
              </span>
            )}
          </div>
          <img
            className="calendar-detail__image"
            src={imageUrl}
            alt={a.itemName}
            onError={(e) => handleItemImageError(e, 'antique')}
          />
          {a.description && <p className="calendar-detail__description">{a.description}</p>}
          <div className="calendar-detail__actions">
            <Link
              to={`/town/visit/antique-store?view=catalogue&antique=${encodeURIComponent(a.itemName)}`}
              className="button primary sm"
            >
              <i className="fas fa-book" /> View in Catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (detail.type === 'event') {
    const ev = detail.item;
    const status = getEventStatus(ev);
    const colorStyle = getEventColor(ev);
    return (
      <div className="calendar-detail-overlay" onClick={onClose}>
        <div className="calendar-detail" onClick={e => e.stopPropagation()}>
          <button className="calendar-detail__close" onClick={onClose}><i className="fas fa-times" /></button>
          <h2 className="calendar-detail__title" style={colorStyle ? { color: colorStyle } : undefined}>{ev.title}</h2>
          <div className="calendar-detail__meta">
            <span className={`calendar-card__status calendar-card__status--${status}`}>{status}</span>
            <span className="calendar-detail__badge">
              <i className="fas fa-calendar-alt" /> {formatDate(ev.startDate)} - {formatDate(ev.endDate)}
            </span>
            {ev.isMultiPart && (
              <span className="calendar-detail__badge"><i className="fas fa-layer-group" /> {ev.parts.length} parts</span>
            )}
          </div>
          <p className="calendar-detail__description">{ev.description}</p>
          {ev.isMultiPart && ev.parts.length > 0 && (
            <div className="calendar-detail__parts">
              <h4 className="calendar-detail__parts-title">Event Parts</h4>
              {[...ev.parts].sort((a, b) => a.sortOrder - b.sortOrder).map((part, i) => {
                const isPartActive = part.startDate && part.endDate
                  ? isDateInRange(new Date(), new Date(part.startDate), new Date(part.endDate))
                  : false;
                return (
                  <div key={part.id} className={`calendar-detail__part ${isPartActive ? 'calendar-detail__part--active' : ''}`}>
                    <span className="calendar-detail__part-num" style={colorStyle ? { backgroundColor: colorStyle } : undefined}>{i + 1}</span>
                    <div>
                      <span>{part.title}</span>
                      {part.startDate && part.endDate && (
                        <span className="calendar-detail__part-dates">
                          {formatDate(part.startDate)} - {formatDate(part.endDate)}
                          {isPartActive && <span className="calendar-detail__part-active-badge">Active</span>}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="calendar-detail__actions">
            <Link to={`/adventures/events/${ev.eventId}`} className="button primary sm">
              <i className="fas fa-external-link-alt" /> View Event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // misc
  const m = detail.item;
  return (
    <div className="calendar-detail-overlay" onClick={onClose}>
      <div className="calendar-detail" onClick={e => e.stopPropagation()}>
        <button className="calendar-detail__close" onClick={onClose}><i className="fas fa-times" /></button>
        <h2 className="calendar-detail__title">{m.title}</h2>
        {(m.startDate || m.endDate) && (
          <div className="calendar-detail__meta">
            <span className="calendar-detail__badge">
              <i className="fas fa-calendar" />
              {m.startDate && m.endDate
                ? `${formatDate(m.startDate)} - ${formatDate(m.endDate)}`
                : formatDate(m.startDate || m.endDate)}
            </span>
          </div>
        )}
        {m.details && <p className="calendar-detail__description">{m.details}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// List View Cards
// ============================================================================

function AntiqueCard({ item, onClick }: { item: CalendarAntiqueItem; onClick: () => void }) {
  const imageUrl = item.imageUrl || getItemImageUrl({ name: item.itemName, category: 'antique' });
  return (
    <div className="calendar-card" onClick={onClick}>
      <div className="calendar-card__header">
        <img
          className="calendar-card__item-image"
          src={imageUrl}
          alt={item.itemName}
          onError={(e) => handleItemImageError(e, 'antique')}
        />
        <div>
          <h3 className="calendar-card__title">{item.itemName}</h3>
          <p className="calendar-card__subtitle">{item.holiday} &middot; {item.category}</p>
        </div>
      </div>
      <div className="calendar-card__body">
        {item.startDate && item.endDate && (
          <div className="calendar-card__dates">
            <i className="fas fa-calendar" /> {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </div>
        )}
        {item.description && <p className="calendar-card__description">{item.description}</p>}
      </div>
    </div>
  );
}

function EventCard({ item, onClick }: { item: CalendarEventItem; onClick: () => void }) {
  const status = getEventStatus(item);
  const colorStyle = getEventColor(item);
  return (
    <div className="calendar-card" onClick={onClick} style={colorStyle ? { borderLeftColor: colorStyle, borderLeftWidth: 3 } : undefined}>
      <div className="calendar-card__header">
        <i className="calendar-card__icon fas fa-calendar-alt" style={colorStyle ? { color: colorStyle } : undefined} />
        <div>
          <h3 className="calendar-card__title">
            {item.title}
            {item.isMultiPart && <span className="calendar-card__status" style={{ marginLeft: 8 }}>{item.parts.length} parts</span>}
          </h3>
          <p className="calendar-card__subtitle">
            <span className={`calendar-card__status calendar-card__status--${status}`}>{status}</span>
          </p>
        </div>
      </div>
      <div className="calendar-card__body">
        <div className="calendar-card__dates">
          <i className="fas fa-clock" /> {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </div>
        {item.description && <p className="calendar-card__description">{item.description}</p>}
        {item.isMultiPart && item.parts.some(p => p.startDate) && (
          <div className="calendar-card__parts-summary">
            {[...item.parts].sort((a, b) => a.sortOrder - b.sortOrder).map((p, i) => {
              const isActive = p.startDate && p.endDate
                ? isDateInRange(new Date(), new Date(p.startDate), new Date(p.endDate))
                : false;
              return (
                <span key={p.id} className={`calendar-card__part-chip ${isActive ? 'calendar-card__part-chip--active' : ''}`}>
                  Part {i + 1}{isActive ? ' (Active)' : ''}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MiscCard({ item, onClick }: { item: CalendarMiscItem; onClick: () => void }) {
  return (
    <div className="calendar-card" onClick={onClick}>
      <div className="calendar-card__header">
        <i className="calendar-card__icon fas fa-info-circle" />
        <div>
          <h3 className="calendar-card__title">{item.title}</h3>
          {(item.startDate || item.endDate) && (
            <p className="calendar-card__subtitle">
              {item.startDate && item.endDate
                ? `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
                : formatDate(item.startDate || item.endDate)}
            </p>
          )}
        </div>
      </div>
      {item.details && (
        <div className="calendar-card__body">
          <p className="calendar-card__description">{item.details}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Calendar Grid View
// ============================================================================

type CalendarDayItem = {
  label: string;
  category: Category;
  detail: DetailItem;
  color?: string;
};

function CalendarGridView({
  data,
  filteredAntiques,
  sortedEvents,
  activeCategories,
  onSelectDetail,
}: {
  data: CalendarData;
  filteredAntiques: CalendarAntiqueItem[];
  sortedEvents: CalendarEventItem[];
  activeCategories: Set<Category>;
  onSelectDetail: (d: DetailItem) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build items per day
  const dayItems = useMemo(() => {
    const map = new Map<number, CalendarDayItem[]>();

    for (let d = 1; d <= daysInMonth; d++) {
      map.set(d, []);
    }

    // Events: overall event + separate entries per active part
    if (activeCategories.has('events')) {
      for (const ev of sortedEvents) {
        const start = new Date(ev.startDate);
        const end = new Date(ev.endDate);
        const eventColor = ev.color ? `var(--${ev.color})` : undefined;

        // Collect parts with dates for separate entries
        const partsWithDates = ev.isMultiPart
          ? [...ev.parts].filter(p => p.startDate && p.endDate).sort((a, b) => a.sortOrder - b.sortOrder)
          : [];

        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(year, month, d);
          if (!isDateInRange(date, start, end)) { continue; }

          // Always show the overall event
          map.get(d)!.push({
            label: ev.title,
            category: 'events',
            detail: { type: 'event', item: ev },
            color: eventColor,
          });

          // Show each active part as its own entry
          for (const part of partsWithDates) {
            if (isDateInRange(date, new Date(part.startDate!), new Date(part.endDate!))) {
              map.get(d)!.push({
                label: `↳ ${part.title}`,
                category: 'events',
                detail: { type: 'event', item: ev },
                color: eventColor,
              });
            }
          }
        }
      }
    }

    // Antiques with holiday dates
    if (activeCategories.has('antiques')) {
      for (const a of filteredAntiques) {
        if (a.startDate && a.endDate) {
          const start = new Date(a.startDate);
          const end = new Date(a.endDate);
          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            if (isDateInRange(date, start, end)) {
              map.get(d)!.push({
                label: `${a.holiday}: ${a.itemName}`,
                category: 'antiques',
                detail: { type: 'antique', item: a },
              });
            }
          }
        }
      }
    }

    // Misc items with dates
    if (activeCategories.has('misc')) {
      for (const m of data.misc) {
        if (m.startDate || m.endDate) {
          const start = new Date(m.startDate || m.endDate!);
          const end = new Date(m.endDate || m.startDate!);
          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            if (isDateInRange(date, start, end)) {
              map.get(d)!.push({
                label: m.title,
                category: 'misc',
                detail: { type: 'misc', item: m },
              });
            }
          }
        }
      }
    }

    return map;
  }, [year, month, daysInMonth, sortedEvents, filteredAntiques, data.misc, activeCategories]);

  // Count dateless antiques
  const datelessAntiques = activeCategories.has('antiques')
    ? filteredAntiques.filter(a => !a.startDate).length
    : 0;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else { setMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else { setMonth(m => m + 1); }
  };
  const goToToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const isToday = (day: number) => isSameDay(new Date(year, month, day), today);

  return (
    <div className="calendar-grid-view">
      {/* Month nav */}
      <div className="calendar-grid__nav">
        <button className="button secondary sm" onClick={prevMonth}>
          <i className="fas fa-chevron-left" />
        </button>
        <h2 className="calendar-grid__month">{MONTH_NAMES[month]} {year}</h2>
        <button className="button secondary sm" onClick={nextMonth}>
          <i className="fas fa-chevron-right" />
        </button>
        <button className="button ghost sm" onClick={goToToday}>Today</button>
      </div>

      {datelessAntiques > 0 && (
        <p className="calendar-grid__note">
          <i className="fas fa-gem" /> {datelessAntiques} antique{datelessAntiques !== 1 ? 's' : ''} have no holiday dates set for this year. An admin can configure dates in the Calendar Manager.
        </p>
      )}

      {/* Day headers */}
      <div className="calendar-grid">
        {DAY_NAMES.map(d => (
          <div key={d} className="calendar-grid__day-header">{d}</div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="calendar-grid__cell calendar-grid__cell--empty" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const items = dayItems.get(day) ?? [];
          return (
            <div key={day} className={`calendar-grid__cell ${isToday(day) ? 'calendar-grid__cell--today' : ''}`}>
              <span className="calendar-grid__day-num">{day}</span>
              <div className="calendar-grid__items">
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    className={`calendar-grid__item calendar-grid__item--${item.category}`}
                    onClick={() => onSelectDetail(item.detail)}
                    title={item.label}
                    style={item.color ? { backgroundColor: item.color, color: 'var(--background-color)' } : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

const CalendarPage = () => {
  useDocumentTitle('Calendar');

  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(['antiques', 'events', 'misc']));
  const [activeSubcategories, setActiveSubcategories] = useState<Set<string>>(new Set());
  const [subcatsInitialized, setSubcatsInitialized] = useState(false);
  const [detail, setDetail] = useState<DetailItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await calendarService.getCalendarData();
      setData(result);
    } catch {
      setError('Failed to load calendar data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derive unique holiday categories from antique data
  const holidayCategories = useMemo(() => {
    if (!data) { return new Map<string, string[]>(); }
    const map = new Map<string, Set<string>>();
    for (const a of data.antiques) {
      if (!map.has(a.category)) { map.set(a.category, new Set()); }
      map.get(a.category)!.add(a.holiday);
    }
    const result = new Map<string, string[]>();
    for (const [cat, holidays] of map) {
      result.set(cat, [...holidays].sort());
    }
    return result;
  }, [data]);

  // Initialize subcategories to all enabled once data loads
  useEffect(() => {
    if (data && !subcatsInitialized) {
      const all = new Set<string>();
      for (const [cat, holidays] of holidayCategories) {
        all.add(cat);
        for (const h of holidays) { all.add(`${cat}::${h}`); }
      }
      setActiveSubcategories(all);
      setSubcatsInitialized(true);
    }
  }, [data, holidayCategories, subcatsInitialized]);

  const toggleCategory = (key: Category) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const toggleSubcategory = (key: string) => {
    setActiveSubcategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        if (!key.includes('::')) {
          for (const k of prev) {
            if (k.startsWith(`${key}::`)) { next.delete(k); }
          }
        }
      } else {
        next.add(key);
        if (!key.includes('::')) {
          const holidays = holidayCategories.get(key) ?? [];
          for (const h of holidays) { next.add(`${key}::${h}`); }
        }
      }
      return next;
    });
  };

  const filteredAntiques = useMemo(() => {
    if (!data) { return []; }
    return data.antiques.filter(a => activeSubcategories.has(`${a.category}::${a.holiday}`));
  }, [data, activeSubcategories]);

  const sortedEvents = useMemo(() => {
    if (!data) { return []; }
    const order = { current: 0, upcoming: 1, past: 2 };
    return [...data.events].sort((a, b) => order[getEventStatus(a)] - order[getEventStatus(b)]);
  }, [data]);

  if (loading) {
    return (
      <div className="calendar-page">
        <div className="calendar-page__header">
          <h1><i className="fas fa-calendar" /> Calendar</h1>
        </div>
        <div className="calendar-page__empty">
          <i className="fas fa-spinner fa-spin" />
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="calendar-page">
        <div className="calendar-page__header">
          <h1><i className="fas fa-calendar" /> Calendar</h1>
        </div>
        <div className="calendar-page__empty">
          <i className="fas fa-exclamation-triangle" />
          <p>{error || 'Failed to load data.'}</p>
          <button className="button primary sm" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-page__header">
        <h1><i className="fas fa-calendar" /> Calendar</h1>
        <p>View holidays, events, and important dates for the game.</p>
      </div>

      {/* View Toggle + Category Toggles */}
      <div className="calendar-page__toggles">
        <div className="calendar-page__view-toggle">
          <button
            className={`calendar-page__toggle-btn ${viewMode === 'calendar' ? 'calendar-page__toggle-btn--active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <i className="fas fa-calendar" /> Calendar
          </button>
          <button
            className={`calendar-page__toggle-btn ${viewMode === 'list' ? 'calendar-page__toggle-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list" /> List
          </button>
        </div>
        <div className="calendar-page__category-toggles">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`calendar-page__toggle-btn ${activeCategories.has(c.key) ? 'calendar-page__toggle-btn--active' : ''}`}
              onClick={() => toggleCategory(c.key)}
            >
              <i className={c.icon} /> {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory toggles for Antiques */}
      {activeCategories.has('antiques') && holidayCategories.size > 0 && (
        <div className="calendar-page__subcategories">
          <span className="calendar-page__subcategories-label">Holiday Filters:</span>
          {[...holidayCategories.keys()].map(cat => (
            <button
              key={cat}
              className={`calendar-page__sub-btn ${activeSubcategories.has(cat) ? 'calendar-page__sub-btn--active' : ''}`}
              onClick={() => toggleSubcategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Calendar Grid View */}
      {viewMode === 'calendar' && (
        <CalendarGridView
          data={data}
          filteredAntiques={filteredAntiques}
          sortedEvents={sortedEvents}
          activeCategories={activeCategories}
          onSelectDetail={setDetail}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {activeCategories.has('antiques') && (
            <div className="calendar-page__section">
              <h2 className="calendar-page__section-title"><i className="fas fa-gem" /> Antiques (Holidays)</h2>
              {filteredAntiques.length > 0 ? (
                <div className="calendar-page__grid">
                  {filteredAntiques.map(a => (
                    <AntiqueCard key={a.itemName} item={a} onClick={() => setDetail({ type: 'antique', item: a })} />
                  ))}
                </div>
              ) : (
                <div className="calendar-page__empty">
                  <i className="fas fa-gem" />
                  <p>No antiques match the current filters.</p>
                </div>
              )}
            </div>
          )}

          {activeCategories.has('events') && (
            <div className="calendar-page__section">
              <h2 className="calendar-page__section-title"><i className="fas fa-calendar-alt" /> Events</h2>
              {sortedEvents.length > 0 ? (
                <div className="calendar-page__grid">
                  {sortedEvents.map(ev => (
                    <EventCard key={ev.id} item={ev} onClick={() => setDetail({ type: 'event', item: ev })} />
                  ))}
                </div>
              ) : (
                <div className="calendar-page__empty">
                  <i className="fas fa-calendar-alt" />
                  <p>No events found.</p>
                </div>
              )}
            </div>
          )}

          {activeCategories.has('misc') && (
            <div className="calendar-page__section">
              <h2 className="calendar-page__section-title"><i className="fas fa-ellipsis-h" /> Misc.</h2>
              {data.misc.length > 0 ? (
                <div className="calendar-page__grid">
                  {data.misc.map(m => (
                    <MiscCard key={m.id} item={m} onClick={() => setDetail({ type: 'misc', item: m })} />
                  ))}
                </div>
              ) : (
                <div className="calendar-page__empty">
                  <i className="fas fa-ellipsis-h" />
                  <p>No miscellaneous dates.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {detail && <DetailModal detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
};

export default CalendarPage;
