import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Pagination } from '@components/common/Pagination';
import type { PromptData, PromptFilters } from './AdminPromptList';
import { buildPromptColumns, toPromptDraft, PROMPT_COLUMN_GROUPS } from './promptGridColumns';
import type { PromptColumn, PromptDraft } from './promptGridColumns';

const STORAGE_KEY: string = 'admin.promptGrid.visibleColumns';

const DEFAULT_VISIBLE_KEYS: string[] = [
  'title', 'description', 'type', 'status', 'rewards', 'submissions', 'actions',
];

const PROMPT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'general', label: 'General' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'progress', label: 'Progress' },
  { value: 'event', label: 'Event' },
];

export interface PromptDraftEntry {
  id: number;
  draft: PromptDraft;
}

interface PromptGridViewProps {
  prompts: PromptData[];
  loading: boolean;
  filters: PromptFilters;
  onFiltersChange: (filters: PromptFilters) => void;
  onEdit: (prompt: PromptData) => void;
  onDelete: (promptId: number) => Promise<void>;
  onInlineSave: (entries: PromptDraftEntry[]) => Promise<boolean>;
  onRefresh: () => void;
  currentPage: number;
  totalPages: number;
  totalPrompts: number;
  perPage: number;
  perPageOptions: number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

function loadStoredColumns(): string[] | null {
  try {
    const raw: string | null = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) { return null; }
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')) {
      return parsed as string[];
    }
    return null;
  } catch {
    return null;
  }
}

function persistColumns(columnKeys: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(columnKeys));
  } catch {
    return;
  }
}

function isDraftDirty(draft: PromptDraft, original: PromptDraft): boolean {
  return (Object.keys(original) as (keyof PromptDraft)[]).some((key) => draft[key] !== original[key]);
}

export function PromptGridView({
  prompts, loading, filters, onFiltersChange, onEdit, onDelete, onInlineSave, onRefresh,
  currentPage, totalPages, totalPrompts, perPage, perPageOptions, onPageChange, onPerPageChange,
}: PromptGridViewProps) {
  const [drafts, setDrafts] = useState<Record<number, PromptDraft>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => loadStoredColumns() ?? DEFAULT_VISIBLE_KEYS);

  const originals: Record<number, PromptDraft> = useMemo(() => {
    const map: Record<number, PromptDraft> = {};
    for (const prompt of prompts) { map[prompt.id] = toPromptDraft(prompt); }
    return map;
  }, [prompts]);

  useEffect(() => { setDrafts({}); }, [prompts]);

  useEffect(() => { persistColumns(visibleKeys); }, [visibleKeys]);

  const startRowEdit = useCallback((prompt: PromptData) => {
    setDrafts((previous) => ({ ...previous, [prompt.id]: toPromptDraft(prompt) }));
  }, []);

  const cancelRowEdit = useCallback((promptId: number) => {
    setDrafts((previous) => {
      const next: Record<number, PromptDraft> = { ...previous };
      delete next[promptId];
      return next;
    });
  }, []);

  const columns: PromptColumn[] = useMemo(
    () => buildPromptColumns({ onEdit, onDelete, onInlineEdit: startRowEdit }),
    [onEdit, onDelete, startRowEdit]
  );

  const editableColumns: PromptColumn[] = useMemo(
    () => columns.filter((column) => column.renderEdit !== undefined),
    [columns]
  );

  const visibleColumns: PromptColumn[] = useMemo(
    () => columns.filter((column) => visibleKeys.includes(column.key)),
    [columns, visibleKeys]
  );

  const columnByKey: Map<string, PromptColumn> = useMemo(
    () => new Map(columns.map((column) => [column.key, column])),
    [columns]
  );

  const editedIds: number[] = useMemo(() => Object.keys(drafts).map(Number), [drafts]);

  const dirtyEntries: PromptDraftEntry[] = useMemo(
    () => editedIds
      .filter((id) => originals[id] !== undefined && isDraftDirty(drafts[id], originals[id]))
      .map((id) => ({ id, draft: drafts[id] })),
    [editedIds, drafts, originals]
  );

  const editAll: boolean = prompts.length > 0 && editedIds.length === prompts.length;

  const toggleColumn = useCallback((columnKey: string) => {
    setVisibleKeys((previous) => previous.includes(columnKey)
      ? previous.filter((key) => key !== columnKey)
      : [...previous, columnKey]);
  }, []);

  const updateDraft = useCallback((promptId: number, patch: Partial<PromptDraft>) => {
    setDrafts((previous) => {
      const current: PromptDraft | undefined = previous[promptId];
      if (current === undefined) { return previous; }
      return { ...previous, [promptId]: { ...current, ...patch } };
    });
  }, []);

  const handleToggleEditAll = () => {
    if (editAll) {
      setDrafts({});
      return;
    }
    const next: Record<number, PromptDraft> = {};
    for (const prompt of prompts) { next[prompt.id] = toPromptDraft(prompt); }
    setDrafts(next);
  };

  const handleEnsureEditColumns = () => {
    const editableKeys: string[] = editableColumns.map((column) => column.key);
    setVisibleKeys((previous) => {
      const missing: string[] = editableKeys.filter((key) => !previous.includes(key));
      return missing.length === 0 ? previous : [...previous, ...missing];
    });
  };

  const handleSave = async (entries: PromptDraftEntry[]) => {
    if (entries.length === 0) { return; }
    setSaving(true);
    await onInlineSave(entries);
    setSaving(false);
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, type: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const renderCell = (column: PromptColumn, prompt: PromptData): ReactNode => {
    const draft: PromptDraft | undefined = drafts[prompt.id];

    if (draft !== undefined && column.key === 'actions') {
      const original: PromptDraft | undefined = originals[prompt.id];
      const dirty: boolean = original !== undefined && isDraftDirty(draft, original);
      return (
        <div className="admin-prompt__actions grid-stacked">
          <button className="button success sm" disabled={saving || !dirty}
            onClick={() => handleSave([{ id: prompt.id, draft }])}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="button secondary sm" disabled={saving}
            onClick={() => cancelRowEdit(prompt.id)}>Cancel</button>
        </div>
      );
    }

    if (draft !== undefined && column.renderEdit) {
      return column.renderEdit(draft, (patch) => updateDraft(prompt.id, patch));
    }

    return column.render(prompt);
  };

  return (
    <div className="prompt-grid-view">
      <div className="list-filters">
        <div className="form-row">
          <div className="set-item">
            <label htmlFor="grid-type-filter">Type:</label>
            <select id="grid-type-filter" value={filters.type} className="filter-input"
              onChange={(event) => handleTypeChange(event.target.value)}>
              {PROMPT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="set-item">
            <label htmlFor="grid-status-filter">Status:</label>
            <select id="grid-status-filter" value={filters.status} className="filter-input"
              onChange={(event) => handleStatusChange(event.target.value)}>
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <label className="toggle-switch" title="Put every row on this page into quick-edit mode">
            <input type="checkbox" checked={editAll} disabled={prompts.length === 0}
              onChange={handleToggleEditAll} />
            <span className="toggle-slider" />
            <span>Quick Edit All</span>
          </label>
          <button onClick={() => setPickerOpen((open) => !open)}
            className="button secondary"
            aria-expanded={pickerOpen}
            aria-controls="prompt-column-picker">
            Columns ({visibleColumns.length}/{columns.length})
          </button>
          <button onClick={onRefresh} className="button secondary" disabled={saving}>Refresh</button>
        </div>

        {pickerOpen && (
          <div id="prompt-column-picker" className="column-picker">
            <div className="column-picker-actions">
              <button className="button secondary sm"
                onClick={() => setVisibleKeys(columns.map((column) => column.key))}>Show All</button>
              <button className="button secondary sm"
                onClick={() => setVisibleKeys(['title', 'actions'])}>Hide All</button>
              <button className="button secondary sm"
                onClick={handleEnsureEditColumns}>Show Editable</button>
              <button className="button secondary sm"
                onClick={() => setVisibleKeys(DEFAULT_VISIBLE_KEYS)}>Reset</button>
            </div>
            <div className="column-picker-groups">
              {PROMPT_COLUMN_GROUPS.map((group) => (
                <div key={group.label} className="column-picker-group">
                  <h4>{group.label}</h4>
                  {group.columnKeys.map((columnKey) => {
                    const column: PromptColumn | undefined = columnByKey.get(columnKey);
                    if (!column) { return null; }
                    return (
                      <label key={columnKey} className="checkbox-label">
                        <input type="checkbox"
                          checked={visibleKeys.includes(columnKey)}
                          onChange={() => toggleColumn(columnKey)} />
                        <span>
                          {column.label}
                          {column.renderEdit && <span className="column-editable-hint"> (editable)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editedIds.length > 0 && (
        <div className="bulk-actions">
          <span className="selection-count">
            {editedIds.length} row(s) in quick edit · {dirtyEntries.length} unsaved change(s)
          </span>
          <div className="bulk-buttons">
            <button className="button success sm" disabled={saving || dirtyEntries.length === 0}
              onClick={() => handleSave(dirtyEntries)}>
              {saving ? 'Saving...' : `Save All (${dirtyEntries.length})`}
            </button>
            <button className="button secondary sm" disabled={saving}
              onClick={() => setDrafts({})}>Cancel All</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-prompt-list loading"><p>Loading prompts...</p></div>
      ) : (
        <div className="prompts-table-container">
          <table className="prompts-table prompt-grid-table">
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <th key={column.key} className={column.className}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prompts.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)} className="no-prompts">
                    No prompts found matching your criteria.
                  </td>
                </tr>
              ) : (
                prompts.map((prompt) => (
                  <tr key={prompt.id} className={drafts[prompt.id] !== undefined ? 'selected' : ''}>
                    {visibleColumns.map((column) => (
                      <td key={column.key} className={column.className}>{renderCell(column, prompt)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        perPageOptions={perPageOptions}
      />

      <div className="item-config">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="admin-prompt__stat-label">Total Prompts:</span>
            <span className="stat-value">{totalPrompts}</span>
          </div>
          <div className="stat-item">
            <span className="admin-prompt__stat-label">Showing:</span>
            <span className="stat-value">{prompts.length} (page {currentPage} of {totalPages})</span>
          </div>
          <div className="stat-item">
            <span className="admin-prompt__stat-label">Visible Columns:</span>
            <span className="stat-value">{visibleColumns.length} of {columns.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
