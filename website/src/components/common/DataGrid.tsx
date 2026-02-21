import { ReactNode, useState, useEffect, useCallback } from 'react';
import { AutoStateContainer } from './StateContainer';
import { Pagination } from './Pagination';
import { useDebounce } from '../../hooks/useDebounce';

type LayoutMode = 'grid' | 'list';
type SortOrder = 'asc' | 'desc';

interface SortOption {
  value: string;
  label: string;
  icon?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
}

interface DataGridProps<T> {
  /** Data items to display */
  data: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Unique key extractor */
  keyExtractor: (item: T) => string | number;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | Error | null;
  /** Retry handler */
  onRetry?: () => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: string;
  /** Loading message */
  loadingMessage?: string;

  // Layout
  /** Default layout mode */
  defaultLayout?: LayoutMode;
  /** Show layout toggle */
  showLayoutToggle?: boolean;
  /** Grid columns (for grid mode) */
  gridColumns?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 2 | 3 | 4 | 5 | 6;
  /** Gap size */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Callback when layout changes */
  onLayoutChange?: (layout: LayoutMode) => void;

  // Search
  /** Show search bar */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Debounce time for search (ms) */
  searchDebounce?: number;
  /** Callback when search changes */
  onSearchChange?: (search: string) => void;
  /** Controlled search value */
  searchValue?: string;

  // Filters
  /** Filter configurations */
  filters?: FilterConfig[];
  /** Callback when filters change */
  onFiltersChange?: (filters: Record<string, string>) => void;

  // Sorting
  /** Sort options */
  sortOptions?: SortOption[];
  /** Default sort field */
  defaultSortBy?: string;
  /** Default sort order */
  defaultSortOrder?: SortOrder;
  /** Callback when sort changes */
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void;

  // Pagination
  /** Current page (1-indexed) */
  currentPage?: number;
  /** Total pages */
  totalPages?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Show pagination */
  showPagination?: boolean;

  // Header
  /** Header title */
  title?: string;
  /** Header right content */
  headerActions?: ReactNode;

  /** Additional className for container */
  className?: string;
  /** Additional className for grid */
  gridClassName?: string;
  /** Minimum height */
  minHeight?: string;
}

export function DataGrid<T>({
  data,
  renderItem,
  keyExtractor,
  loading = false,
  error,
  onRetry,
  emptyMessage = 'No items found',
  emptyIcon = 'fas fa-inbox',
  loadingMessage = 'Loading...',

  // Layout
  defaultLayout = 'grid',
  showLayoutToggle = false,
  gridColumns = 'md',
  gap = 'md',
  onLayoutChange,

  // Search
  showSearch = false,
  searchPlaceholder = 'Search...',
  searchDebounce = 300,
  onSearchChange,
  searchValue: controlledSearchValue,

  // Filters
  filters,
  onFiltersChange,

  // Sorting
  sortOptions,
  defaultSortBy,
  defaultSortOrder = 'asc',
  onSortChange,

  // Pagination
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showPagination = true,

  // Header
  title,
  headerActions,

  className = '',
  gridClassName = '',
  minHeight
}: DataGridProps<T>) {
  // Internal state
  const [layout, setLayout] = useState<LayoutMode>(defaultLayout);
  const [searchTerm, setSearchTerm] = useState(controlledSearchValue || '');
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    filters?.forEach(filter => {
      initial[filter.key] = filter.defaultValue || '';
    });
    return initial;
  });
  const [sortBy, setSortBy] = useState(defaultSortBy || sortOptions?.[0]?.value || '');
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, searchDebounce);

  // Sync controlled search value
  useEffect(() => {
    if (controlledSearchValue !== undefined) {
      setSearchTerm(controlledSearchValue);
    }
  }, [controlledSearchValue]);

  // Emit search change
  useEffect(() => {
    onSearchChange?.(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: LayoutMode) => {
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [onLayoutChange]);

  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);
    onFiltersChange?.(newFilters);
  }, [filterValues, onFiltersChange]);

  // Handle sort change
  const handleSortChange = useCallback((field: string) => {
    let newOrder: SortOrder = 'asc';
    if (sortBy === field) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortBy(field);
    setSortOrder(newOrder);
    onSortChange?.(field, newOrder);
  }, [sortBy, sortOrder, onSortChange]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    onSearchChange?.('');
  }, [onSearchChange]);

  // Build grid class
  const getGridClass = () => {
    const classes = ['data-grid__items'];

    if (layout === 'grid') {
      classes.push('data-grid__items--grid');
      if (typeof gridColumns === 'number') {
        classes.push(`data-grid__items--cols-${gridColumns}`);
      } else {
        classes.push(`data-grid__items--${gridColumns}`);
      }
    } else {
      classes.push('data-grid__items--list');
    }

    classes.push(`data-grid__items--gap-${gap}`);

    if (gridClassName) {
      classes.push(gridClassName);
    }

    return classes.join(' ');
  };

  // Check if toolbar should be shown
  const showToolbar = showSearch || (filters && filters.length > 0) || sortOptions || showLayoutToggle;

  return (
    <div className={`data-grid ${className}`}>
      {/* Header */}
      {(title || headerActions) && (
        <div className="data-grid__header">
          {title && <h2 className="data-grid__title">{title}</h2>}
          {headerActions && <div className="data-grid__header-actions">{headerActions}</div>}
        </div>
      )}

      {/* Toolbar */}
      {showToolbar && (
        <div className="data-grid__toolbar">
          {/* Search */}
          {showSearch && (
            <div className="data-grid__search">
              <i className="fas fa-search data-grid__search-icon"></i>
              <input
                type="text"
                className="input data-grid__search-input"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="data-grid__search-clear"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          )}

          {/* Filters */}
          {filters && filters.length > 0 && (
            <div className="data-grid__filters">
              {filters.map(filter => (
                <select
                  key={filter.key}
                  className="select data-grid__filter"
                  value={filterValues[filter.key] || ''}
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

          {/* Sort */}
          {sortOptions && sortOptions.length > 0 && (
            <div className="data-grid__sort">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`button sm ${sortBy === option.value ? 'primary' : 'secondary'}`}
                  onClick={() => handleSortChange(option.value)}
                >
                  {option.icon && <i className={option.icon}></i>}
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Layout Toggle */}
          {showLayoutToggle && (
            <div className="data-grid__layout-toggle">
              <button
                type="button"
                className={`button icon sm ${layout === 'grid' ? 'primary' : 'secondary'}`}
                onClick={() => handleLayoutChange('grid')}
                aria-label="Grid view"
              >
                <i className="fas fa-th"></i>
              </button>
              <button
                type="button"
                className={`button icon sm ${layout === 'list' ? 'primary' : 'secondary'}`}
                onClick={() => handleLayoutChange('list')}
                aria-label="List view"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <AutoStateContainer
        loading={loading}
        error={error}
        data={data}
        onRetry={onRetry}
        emptyMessage={emptyMessage}
        emptyIcon={emptyIcon}
        loadingMessage={loadingMessage}
        minHeight={minHeight}
      >
        <div className={getGridClass()}>
          {data.map((item, index) => (
            <div key={keyExtractor(item)} className="data-grid__item">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </AutoStateContainer>

      {/* Pagination */}
      {showPagination && totalPages > 1 && !loading && !error && (
        <div className="data-grid__pagination">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange || (() => {})}
          />
        </div>
      )}
    </div>
  );
}
