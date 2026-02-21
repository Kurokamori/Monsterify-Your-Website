import { ReactNode, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Pagination } from '../common/Pagination';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

type AddButton =
  | { label: string; to: string; onClick?: never }
  | { label: string; onClick: () => void; to?: never };

interface BulkAction {
  label: string;
  className: string;
  onClick: (ids: (string | number)[]) => void;
}

interface AdminTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;

  title: string;
  addButton?: AddButton;

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFiltersChange?: (filters: Record<string, string>) => void;
  onResetFilters?: () => void;

  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;

  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;

  selectable?: boolean;
  bulkActions?: BulkAction[];

  actions?: (item: T) => ReactNode;
  emptyMessage?: string;
}

export function AdminTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  error,
  onRetry,
  title,
  addButton,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  filterValues = {},
  onFiltersChange,
  onResetFilters,
  sortBy,
  sortOrder = 'asc',
  onSortChange,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  selectable = false,
  bulkActions,
  actions,
  emptyMessage = 'No items found',
}: AdminTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const showToolbar = onSearchChange || (filters && filters.length > 0);
  const showBulkActions = selectable && selectedIds.length > 0 && bulkActions && bulkActions.length > 0;
  const totalColumns = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(keyExtractor));
    }
  }, [selectedIds.length, data, keyExtractor]);

  const handleSelectItem = useCallback((id: string | number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    onFiltersChange?.({ ...filterValues, [key]: value });
  }, [filterValues, onFiltersChange]);

  const getCellValue = (item: T, key: string): ReactNode => {
    const value = (item as Record<string, unknown>)[key];
    if (value === null || value === undefined) return 'N/A';
    return String(value);
  };

  return (
    <div className="admin-table-page">
      {/* Header */}
      <div className="admin-table-page__header">
        <h1>{title}</h1>
        {addButton && (
          <div className="admin-table-page__header-actions">
            {addButton.to ? (
              <Link to={addButton.to} className="button primary">
                <i className="fas fa-plus"></i> {addButton.label}
              </Link>
            ) : (
              <button className="button primary" onClick={addButton.onClick}>
                <i className="fas fa-plus"></i> {addButton.label}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="admin-table-page__toolbar">
          {onSearchChange && (
            <div className="admin-table-page__search">
              <i className="fas fa-search admin-table-page__search-icon"></i>
              <input
                type="text"
                className="input admin-table-page__search-input"
                placeholder={searchPlaceholder}
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchValue && (
                <button
                  type="button"
                  className="admin-table-page__search-clear"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          )}

          {filters && filters.length > 0 && (
            <div className="admin-table-page__filters">
              {filters.map(filter => (
                <select
                  key={filter.key}
                  className="select admin-table-page__filter"
                  value={filterValues[filter.key] ?? ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  aria-label={filter.label}
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}

          {onResetFilters && (
            <button className="button secondary sm" onClick={onResetFilters}>
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="admin-table-page__bulk-actions">
          <span className="admin-table-page__selection-count">
            {selectedIds.length} item(s) selected
          </span>
          <div className="admin-table-page__bulk-buttons">
            {bulkActions!.map(action => (
              <button
                key={action.label}
                className={`button sm ${action.className}`}
                onClick={() => {
                  action.onClick(selectedIds);
                  setSelectedIds([]);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={onRetry} />
      ) : (
        <>
          <div className="admin-table-page__table-container">
            <table className="admin-table-page__table">
              <thead>
                <tr>
                  {selectable && (
                    <th className="admin-table-page__checkbox-cell">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedIds.length === data.length && data.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={`${col.sortable ? 'sortable' : ''} ${col.className ?? ''}`}
                      onClick={col.sortable ? () => onSortChange?.(col.key) : undefined}
                    >
                      {col.header}
                      {col.sortable && sortBy === col.key && (
                        <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} sort-icon`}></i>
                      )}
                    </th>
                  ))}
                  {actions && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumns} className="admin-table-page__empty">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map(item => {
                    const id = keyExtractor(item);
                    const isSelected = selectedIds.includes(id);
                    return (
                      <tr key={id} className={isSelected ? 'selected' : ''}>
                        {selectable && (
                          <td className="admin-table-page__checkbox-cell">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectItem(id)}
                            />
                          </td>
                        )}
                        {columns.map(col => (
                          <td key={col.key} className={col.className ?? ''}>
                            {col.render ? col.render(item) : getCellValue(item, col.key)}
                          </td>
                        ))}
                        {actions && (
                          <td className="admin-table-page__actions-cell">
                            {actions(item)}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && onPageChange && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
