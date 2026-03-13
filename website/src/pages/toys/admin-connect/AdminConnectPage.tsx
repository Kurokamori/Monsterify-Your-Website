import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import adminConnectService, {
  AdminConnectItem,
  AdminConnectSubItem,
  AdminConnectCategory,
  AdminConnectStatus,
  AdminConnectUrgency,
  AdminConnectDifficulty,
  AdminConnectDataField,
  AdminConnectItemCreateInput,
} from '@services/adminConnectService';
import '@styles/toys/admin-connect.css';

// ── Constants ───────────────────────────────────────────────────

const CATEGORIES: { value: AdminConnectCategory; label: string }[] = [
  { value: 'art', label: 'Art' },
  { value: 'content', label: 'Content' },
  { value: 'guides', label: 'Guides' },
  { value: 'gameplay', label: 'Gameplay' },
  { value: 'features', label: 'Features' },
  { value: 'bug-fixes', label: 'Bug Fixes' },
  { value: 'styling', label: 'Styling' },
  { value: 'misc', label: 'Misc' },
];

const STATUSES: { value: AdminConnectStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const URGENCIES: { value: AdminConnectUrgency; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const DIFFICULTIES: { value: AdminConnectDifficulty; label: string }[] = [
  { value: 'trivial', label: 'Trivial' },
  { value: 'normal', label: 'Normal' },
  { value: 'complex', label: 'Complex' },
  { value: 'extra', label: 'Extra Difficulty' },
];

const CATEGORY_ICONS: Record<AdminConnectCategory, string> = {
  art: 'fa-palette',
  content: 'fa-file-alt',
  guides: 'fa-book',
  gameplay: 'fa-gamepad',
  features: 'fa-star',
  'bug-fixes': 'fa-bug',
  styling: 'fa-paint-brush',
  misc: 'fa-ellipsis-h',
};

type SortMode = 'priority' | 'category' | 'urgency' | 'difficulty' | 'status' | 'newest' | 'oldest';
type FilterStatus = 'all' | AdminConnectStatus;
type ViewMode = 'list' | 'board';

// ── Main Component ──────────────────────────────────────────────

export default function AdminConnectPage() {
  useDocumentTitle('Admin Connect');
  const { currentUser } = useAuth();
  const isAdmin = !!currentUser?.is_admin;

  const [items, setItems] = useState<AdminConnectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [filterCategory, setFilterCategory] = useState<AdminConnectCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Admin modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultCategory, setCreateDefaultCategory] = useState<AdminConnectCategory | undefined>();
  const [editingItem, setEditingItem] = useState<AdminConnectItem | null>(null);

  // Drag state
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  const hasFetchedRef = useRef(false);

  const fetchItems = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) {
        setLoading(true);
      }
      const data = await adminConnectService.getAll();
      setItems(data);
    } catch {
      setError('Failed to load items');
    } finally {
      setLoading(false);
      hasFetchedRef.current = true;
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Sorting & Filtering ─────────────────────────────────────

  const filteredItems = items.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = item.isSecret && !isAdmin ? (item.secretName ?? '') : item.name;
      return name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    // Resolved items always sort below non-resolved
    const aResolved = a.status === 'resolved' ? 1 : 0;
    const bResolved = b.status === 'resolved' ? 1 : 0;
    if (aResolved !== bResolved) return aResolved - bResolved;

    switch (sortMode) {
      case 'priority': return a.priority - b.priority;
      case 'category': return a.category.localeCompare(b.category);
      case 'urgency': {
        const order: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
        return (order[a.urgency] ?? 2) - (order[b.urgency] ?? 2);
      }
      case 'difficulty': {
        const order: Record<string, number> = { extra: 0, complex: 1, normal: 2, trivial: 3 };
        return (order[a.difficulty] ?? 2) - (order[b.difficulty] ?? 2);
      }
      case 'status': {
        const order: Record<string, number> = { 'in-progress': 0, open: 1, resolved: 2 };
        return (order[a.status] ?? 1) - (order[b.status] ?? 1);
      }
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default: return 0;
    }
  });

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(sortedItems.map((i) => i.id)));
  const collapseAll = () => setExpandedIds(new Set());

  // ── Admin actions ───────────────────────────────────────────

  const handleMarkInProgress = async (id: number) => {
    try {
      await adminConnectService.update(id, { status: 'in-progress' });
      await fetchItems();
    } catch { setError('Failed to update item'); }
  };

  const handleResolve = async (id: number) => {
    try {
      await adminConnectService.resolve(id);
      await fetchItems();
    } catch { setError('Failed to resolve item'); }
  };

  const handleReopen = async (id: number) => {
    try {
      await adminConnectService.reopen(id);
      await fetchItems();
    } catch { setError('Failed to reopen item'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item permanently?')) return;
    try {
      await adminConnectService.remove(id);
      await fetchItems();
    } catch { setError('Failed to delete item'); }
  };

  const handleToggleSubItem = async (item: AdminConnectItem, sub: AdminConnectSubItem) => {
    try {
      await adminConnectService.updateSubItem(item.id, sub.id, { isCompleted: !sub.isCompleted });
      await fetchItems();
    } catch { setError('Failed to update sub-item'); }
  };

  // ── Drag & Drop (admin only, priority sort) ─────────────────

  const handleDragStart = (id: number) => { dragItemRef.current = id; };
  const handleDragEnter = (id: number) => { dragOverItemRef.current = id; };
  const handleDragEnd = async () => {
    if (dragItemRef.current === null || dragOverItemRef.current === null) return;
    const from = sortedItems.findIndex((i) => i.id === dragItemRef.current);
    const to = sortedItems.findIndex((i) => i.id === dragOverItemRef.current);
    if (from === -1 || to === -1 || from === to) return;

    const reordered = [...sortedItems];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const orderedIds = reordered.map((i) => i.id);

    try {
      await adminConnectService.reorder(orderedIds);
      await fetchItems();
    } catch { setError('Failed to reorder items'); }
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  // ── Stats bar ───────────────────────────────────────────────

  const totalOpen = items.filter((i) => i.status === 'open').length;
  const totalInProgress = items.filter((i) => i.status === 'in-progress').length;
  const totalResolved = items.filter((i) => i.status === 'resolved').length;

  // ── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="ac-page">
        <div className="spinner-container">
          <div className="spinner-dots"><div className="spinner-dot" /><div className="spinner-dot" /><div className="spinner-dot" /></div>
          <p className="spinner-message">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ac-page">
      <header className="ac-header">
        <div className="ac-header__title-row">
          <h1 className="ac-header__title">
            <i className="fas fa-clipboard-list" /> Admin Connect
          </h1>
          {isAdmin && (
            <button className="button primary no-flex" onClick={() => { setCreateDefaultCategory(undefined); setShowCreateModal(true); }}>
              <i className="fas fa-plus" /> New Item
            </button>
          )}
        </div>
        <p className="ac-header__subtitle">
          Track the goings on of the website - known bugs, planned features, upcoming content and more. Click into items to see details, progress, sub-tasks, etc. <br />
          Do remember that while these are generally sorted by priority, that is not a garuntee that I will work through them concretely from top to bottom.
        </p>

        {/* Stats */}
        <div className="ac-stats">
          <div className="ac-stats__item ac-stats__item--open">
            <span className="ac-stats__count">{totalOpen}</span>
            <span className="ac-stats__label">Open</span>
          </div>
          <div className="ac-stats__item ac-stats__item--progress">
            <span className="ac-stats__count">{totalInProgress}</span>
            <span className="ac-stats__label">In Progress</span>
          </div>
          <div className="ac-stats__item ac-stats__item--resolved">
            <span className="ac-stats__count">{totalResolved}</span>
            <span className="ac-stats__label">Resolved</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert error ac-alert-dismissible">
          <i className="fas fa-exclamation-triangle" /> {error}
          <button className="button close" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="ac-toolbar">
        <div className="ac-toolbar__left">
          <input
            className="input"
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ac-toolbar__right">
          <div className="ac-view-toggle">
            <button
              className={`button toggle no-flex ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <i className="fas fa-list" />
            </button>
            <button
              className={`button toggle no-flex ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
              title="Category board"
            >
              <i className="fas fa-th-large" />
            </button>
          </div>
          {viewMode === 'list' && (
            <select className="select" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
              <option value="urgency">Urgency</option>
              <option value="difficulty">Difficulty</option>
              <option value="status">Status</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          )}
          {viewMode === 'list' && (
            <select className="select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as AdminConnectCategory | 'all')}>
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}
          <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}>
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button className="button ghost no-flex" onClick={expandAll} title="Expand all">
            <i className="fas fa-expand-arrows-alt" />
          </button>
          <button className="button ghost no-flex" onClick={collapseAll} title="Collapse all">
            <i className="fas fa-compress-arrows-alt" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        sortedItems.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox" />
            <p>No items found.</p>
          </div>
        ) : (
          <div className="ac-list">
            {sortedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                expanded={expandedIds.has(item.id)}
                onToggle={() => toggleExpand(item.id)}
                onMarkInProgress={() => handleMarkInProgress(item.id)}
                onResolve={() => handleResolve(item.id)}
                onReopen={() => handleReopen(item.id)}
                onDelete={() => handleDelete(item.id)}
                onEdit={() => setEditingItem(item)}
                onToggleSub={(sub) => handleToggleSubItem(item, sub)}
                onRefresh={fetchItems}
                draggable={isAdmin && sortMode === 'priority'}
                onDragStart={() => handleDragStart(item.id)}
                onDragEnter={() => handleDragEnter(item.id)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )
      ) : (
        <CategoryBoardView
          items={filteredItems}
          isAdmin={isAdmin}
          expandedIds={expandedIds}
          onToggle={toggleExpand}
          onMarkInProgress={handleMarkInProgress}
          onResolve={handleResolve}
          onReopen={handleReopen}
          onDelete={handleDelete}
          onEdit={setEditingItem}
          onToggleSub={handleToggleSubItem}
          onRefresh={fetchItems}
          onCreateForCategory={(cat) => { setCreateDefaultCategory(cat); setShowCreateModal(true); }}
        />
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingItem) && (
        <ItemFormModal
          item={editingItem}
          defaultCategory={createDefaultCategory}
          onClose={() => { setShowCreateModal(false); setEditingItem(null); setCreateDefaultCategory(undefined); }}
          onSaved={() => { setShowCreateModal(false); setEditingItem(null); setCreateDefaultCategory(undefined); fetchItems(); }}
        />
      )}
    </div>
  );
}

// ── Category Board View ─────────────────────────────────────────

interface CategoryBoardViewProps {
  items: AdminConnectItem[];
  isAdmin: boolean;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onMarkInProgress: (id: number) => void;
  onResolve: (id: number) => void;
  onReopen: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (item: AdminConnectItem) => void;
  onToggleSub: (item: AdminConnectItem, sub: AdminConnectSubItem) => void;
  onRefresh: () => void;
  onCreateForCategory: (category: AdminConnectCategory) => void;
}

function CategoryBoardView({
  items, isAdmin, expandedIds, onToggle, onMarkInProgress, onResolve, onReopen, onDelete, onEdit, onToggleSub, onRefresh, onCreateForCategory,
}: CategoryBoardViewProps) {
  const grouped = new Map<AdminConnectCategory, AdminConnectItem[]>();
  for (const cat of CATEGORIES) {
    grouped.set(cat.value, []);
  }
  for (const item of items) {
    const list = grouped.get(item.category);
    if (list) {
      list.push(item);
    }
  }

  // Only show categories that have items
  const activeCategories = CATEGORIES.filter((cat) => {
    const list = grouped.get(cat.value);
    return list && list.length > 0;
  });

  if (activeCategories.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-inbox" />
        <p>No items found.</p>
      </div>
    );
  }

  return (
    <div className="ac-board">
      {activeCategories.map((cat) => {
        const catItems = grouped.get(cat.value) ?? [];
        const openCount = catItems.filter((i) => i.status !== 'resolved').length;
        const resolvedCount = catItems.filter((i) => i.status === 'resolved').length;

        return (
          <div key={cat.value} className="ac-board__panel">
            <div className={`ac-board__panel-header ac-board__panel-header--${cat.value}`}>
              <span className="ac-board__panel-icon">
                <i className={`fas ${CATEGORY_ICONS[cat.value]}`} />
              </span>
              <span className="ac-board__panel-title">{cat.label}</span>
              <span className="ac-board__panel-counts">
                <span className="ac-board__panel-count">{openCount} open</span>
                {resolvedCount > 0 && (
                  <span className="ac-board__panel-count ac-board__panel-count--resolved">
                    {resolvedCount} done
                  </span>
                )}
              </span>
              {isAdmin && (
                <button
                  className="ac-board__panel-add"
                  onClick={() => onCreateForCategory(cat.value)}
                  title={`Add ${cat.label} item`}
                >
                  <i className="fas fa-plus" />
                </button>
              )}
            </div>
            <div className="ac-board__panel-body">
              {catItems.sort((a, b) => {
                const aR = a.status === 'resolved' ? 1 : 0;
                const bR = b.status === 'resolved' ? 1 : 0;
                if (aR !== bR) return aR - bR;
                return a.priority - b.priority;
              }).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  expanded={expandedIds.has(item.id)}
                  onToggle={() => onToggle(item.id)}
                  onMarkInProgress={() => onMarkInProgress(item.id)}
                  onResolve={() => onResolve(item.id)}
                  onReopen={() => onReopen(item.id)}
                  onDelete={() => onDelete(item.id)}
                  onEdit={() => onEdit(item)}
                  onToggleSub={(sub) => onToggleSub(item, sub)}
                  onRefresh={onRefresh}
                  draggable={false}
                  onDragStart={() => {}}
                  onDragEnter={() => {}}
                  onDragEnd={() => {}}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Item Card ───────────────────────────────────────────────────

interface ItemCardProps {
  item: AdminConnectItem;
  isAdmin: boolean;
  expanded: boolean;
  onToggle: () => void;
  onMarkInProgress: () => void;
  onResolve: () => void;
  onReopen: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleSub: (sub: AdminConnectSubItem) => void;
  onRefresh: () => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}

function ItemCard({
  item, isAdmin, expanded, onToggle, onMarkInProgress, onResolve, onReopen, onDelete, onEdit,
  onToggleSub, onRefresh, draggable, onDragStart, onDragEnter, onDragEnd,
}: ItemCardProps) {
  const isSecret = item.isSecret && !isAdmin;
  const displayName = isSecret ? (item.secretName ?? 'Secret Item') : item.name;

  const completedSubs = item.subItems.filter((s) => s.isCompleted).length;
  const totalSubs = item.subItems.length;
  const subProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : null;

  const effectiveProgress = item.progress > 0 ? item.progress : subProgress;

  return (
    <div
      className={`ac-card ac-card--${item.status} ${expanded ? 'ac-card--expanded' : ''} ${isSecret ? 'ac-card--secret' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Card header */}
      <div className="ac-card__header" onClick={onToggle}>
        {draggable && (
          <span className="ac-card__drag-handle" title="Drag to reorder">
            <i className="fas fa-grip-vertical" />
          </span>
        )}

        <span className={`ac-card__category-icon ac-card__category-icon--${item.category}`} title={item.category}>
          <i className={`fas ${CATEGORY_ICONS[item.category] ?? 'fa-ellipsis-h'}`} />
        </span>

        <span className="ac-card__name">
          {displayName}
        </span>

        <div className="ac-card__badges">
          <span className={`ac-badge ac-badge--status ac-badge--${item.status}`}>
            {STATUSES.find((s) => s.value === item.status)?.label ?? item.status}
          </span>
          {item.urgency !== 'normal' && (
            <span className={`ac-badge ac-badge--urgency ac-badge--urgency-${item.urgency}`}>
              {item.urgency}
            </span>
          )}
          {item.difficulty !== 'normal' && (
            <span className={`ac-badge ac-badge--difficulty ac-badge--difficulty-${item.difficulty}`}>
              {item.difficulty}
            </span>
          )}
          {item.isSecret && (
            <span className="ac-badge ac-badge--secret">
              <i className="fas fa-lock" /> Secret
            </span>
          )}
        </div>

        <span className="ac-card__chevron">
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`} />
        </span>
      </div>

      {/* Progress bar */}
      {effectiveProgress !== null && effectiveProgress > 0 && (
        <div className="ac-card__progress">
          <div className="ac-card__progress-bar" style={{ width: `${effectiveProgress}%` }} />
          <span className="ac-card__progress-label">{effectiveProgress}%</span>
        </div>
      )}

      {/* Expanded body */}
      {expanded && !isSecret && (
        <div className="ac-card__body">
          {item.description && (
            <p className="ac-card__description">{item.description}</p>
          )}

          {/* Data fields */}
          {item.dataFields.length > 0 && (
            <div className="ac-card__data-fields">
              {item.dataFields.map((df, i) => (
                <div key={i} className="ac-card__data-field">
                  <span className="ac-card__data-key">{df.key}</span>
                  <span className="ac-card__data-value">{df.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sub-items */}
          {item.subItems.length > 0 && (
            <div className="ac-card__sub-items">
              <h4 className="ac-card__sub-items-title">
                Sub-tasks ({completedSubs}/{totalSubs})
              </h4>
              {item.subItems.map((sub) => (
                <SubItemRow
                  key={sub.id}
                  sub={sub}
                  isAdmin={isAdmin}
                  itemId={item.id}
                  onToggle={() => onToggleSub(sub)}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div className="ac-card__actions">
              <button className="button small no-flex" onClick={onEdit}>
                <i className="fas fa-edit" /> Edit
              </button>
              {item.status !== 'in-progress' && item.status !== 'resolved' && (
                <button className="button secondary small no-flex" onClick={onMarkInProgress}>
                  <i className="fas fa-spinner" /> In Progress
                </button>
              )}
              {item.status !== 'resolved' ? (
                <button className="button success small no-flex" onClick={onResolve}>
                  <i className="fas fa-check" /> Resolve
                </button>
              ) : (
                <button className="button secondary small no-flex" onClick={onReopen}>
                  <i className="fas fa-undo" /> Reopen
                </button>
              )}
              <button className="button danger small no-flex" onClick={onDelete}>
                <i className="fas fa-trash" /> Delete
              </button>
              <AddSubItemInline itemId={item.id} onAdded={onRefresh} />
            </div>
          )}
        </div>
      )}

      {/* Secret expanded placeholder */}
      {expanded && isSecret && (
        <div className="ac-card__body ac-card__body--secret">
          <p className="ac-card__secret-msg">
            <i className="fas fa-lock" /> This item&apos;s details are hidden.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Sub Item Row ────────────────────────────────────────────────

interface SubItemRowProps {
  sub: AdminConnectSubItem;
  isAdmin: boolean;
  itemId: number;
  onToggle: () => void;
  onRefresh: () => void;
}

function SubItemRow({ sub, isAdmin, itemId, onToggle, onRefresh }: SubItemRowProps) {
  const handleDelete = async () => {
    try {
      await adminConnectService.removeSubItem(itemId, sub.id);
      onRefresh();
    } catch { /* ignore */ }
  };

  return (
    <div className={`ac-sub-item ${sub.isCompleted ? 'ac-sub-item--completed' : ''}`}>
      {isAdmin ? (
        <button className="ac-sub-item__check" onClick={onToggle}>
          <i className={`fas ${sub.isCompleted ? 'fa-check-square' : 'fa-square'}`} />
        </button>
      ) : (
        <span className="ac-sub-item__check">
          <i className={`fas ${sub.isCompleted ? 'fa-check-square' : 'fa-square'}`} />
        </span>
      )}
      <div className="ac-sub-item__content">
        <span className="ac-sub-item__name">{sub.name}</span>
        {sub.description && <span className="ac-sub-item__desc">{sub.description}</span>}
      </div>
      {isAdmin && (
        <button className="ac-sub-item__delete" onClick={handleDelete} title="Remove sub-task">
          <i className="fas fa-times" />
        </button>
      )}
    </div>
  );
}

// ── Add Sub Item Inline ─────────────────────────────────────────

function AddSubItemInline({ itemId, onAdded }: { itemId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await adminConnectService.createSubItem(itemId, { name: name.trim() });
      setName('');
      setOpen(false);
      onAdded();
    } catch { /* ignore */ }
  };

  if (!open) {
    return (
      <button className="button ghost small no-flex" onClick={() => setOpen(true)}>
        <i className="fas fa-plus" /> Sub-task
      </button>
    );
  }

  return (
    <div className="ac-inline-add">
      <input
        className="input input--sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false); }}
        placeholder="Sub-task name..."
        autoFocus
      />
      <button className="button primary small no-flex" onClick={handleAdd}>Add</button>
      <button className="button ghost small no-flex" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}

// ── Create / Edit Modal ─────────────────────────────────────────

interface ItemFormModalProps {
  item: AdminConnectItem | null;
  defaultCategory?: AdminConnectCategory;
  onClose: () => void;
  onSaved: () => void;
}

function ItemFormModal({ item, defaultCategory, onClose, onSaved }: ItemFormModalProps) {
  const isEdit = !!item;
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [secretName, setSecretName] = useState(item?.secretName ?? '');
  const [isSecret, setIsSecret] = useState(item?.isSecret ?? false);
  const [category, setCategory] = useState<AdminConnectCategory>(item?.category ?? defaultCategory ?? 'misc');
  const [status, setStatus] = useState<AdminConnectStatus>(item?.status ?? 'open');
  const [urgency, setUrgency] = useState<AdminConnectUrgency>(item?.urgency ?? 'normal');
  const [difficulty, setDifficulty] = useState<AdminConnectDifficulty>(item?.difficulty ?? 'normal');
  const [progress, setProgress] = useState(item?.progress ?? 0);
  const [dataFields, setDataFields] = useState<AdminConnectDataField[]>(item?.dataFields ?? []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const addDataField = () => setDataFields([...dataFields, { key: '', value: '' }]);
  const removeDataField = (idx: number) => setDataFields(dataFields.filter((_, i) => i !== idx));
  const updateDataField = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...dataFields];
    updated[idx] = { ...updated[idx], [field]: val };
    setDataFields(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return; }
    if (isSecret && !secretName.trim()) { setFormError('Secret name is required when item is secret'); return; }
    setSaving(true);
    setFormError('');

    const cleanFields = dataFields.filter((f) => f.key.trim() && f.value.trim());

    try {
      if (isEdit && item) {
        await adminConnectService.update(item.id, {
          name: name.trim(),
          description: description.trim() || null,
          secretName: secretName.trim() || null,
          isSecret,
          category,
          status,
          urgency,
          difficulty,
          progress,
          dataFields: cleanFields,
        });
      } else {
        const input: AdminConnectItemCreateInput = {
          name: name.trim(),
          description: description.trim() || undefined,
          secretName: secretName.trim() || undefined,
          isSecret,
          category,
          status,
          urgency,
          difficulty,
          progress,
          dataFields: cleanFields,
        };
        await adminConnectService.create(input);
      }
      onSaved();
    } catch {
      setFormError('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Item' : 'New Item'}</h2>
          <button className="button close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {formError && <div className="alert error sm">{formError}</div>}

          <div className="form-group form-group--small-padding">
            <label className="form-label">Name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name..." />
          </div>

          <div className="form-group form-group--small-padding">
            <label className="form-label">Description</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task..." rows={3} />
          </div>

          <div className="ac-form-row">
            <div className="form-group form-group--small-padding">
              <label className="form-label">Category</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value as AdminConnectCategory)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group form-group--small-padding">
              <label className="form-label">Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value as AdminConnectStatus)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="ac-form-row">
            <div className="form-group form-group--small-padding">
              <label className="form-label">Urgency</label>
              <select className="select" value={urgency} onChange={(e) => setUrgency(e.target.value as AdminConnectUrgency)}>
                {URGENCIES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div className="form-group form-group--small-padding">
              <label className="form-label">Difficulty</label>
              <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as AdminConnectDifficulty)}>
                {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group form-group--small-padding">
            <label className="form-label">Progress ({progress}%)</label>
            <input className="input" type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
          </div>

          {/* Secret toggle */}
          <div className="form-group form-group--small-padding">
            <label className="checkbox-label">
              <input className="checkbox" type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} />
              <span>Mark as Secret</span>
            </label>
          </div>
          {isSecret && (
            <div className="form-group form-group--small-padding">
              <label className="form-label">Secret Display Name *</label>
              <input className="input" value={secretName} onChange={(e) => setSecretName(e.target.value)} placeholder="e.g. New Feature #3" />
            </div>
          )}

          {/* Data fields */}
          <div className="form-group form-group--small-padding">
            <div className="ac-form-group__header">
              <label className="form-label">Custom Data Fields</label>
              <button className="button ghost small no-flex" type="button" onClick={addDataField}>
                <i className="fas fa-plus" /> Add Field
              </button>
            </div>
            {dataFields.map((df, i) => (
              <div key={i} className="ac-data-field-row">
                <input className="input" value={df.key} onChange={(e) => updateDataField(i, 'key', e.target.value)} placeholder="Key" />
                <input className="input" value={df.value} onChange={(e) => updateDataField(i, 'value', e.target.value)} placeholder="Value" />
                <button className="button danger small no-flex" type="button" onClick={() => removeDataField(i)}>
                  <i className="fas fa-times" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="button ghost no-flex" onClick={onClose}>Cancel</button>
          <button className="button primary no-flex" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : (isEdit ? 'Save Changes' : 'Create Item')}
          </button>
        </div>
      </div>
    </div>
  );
}
