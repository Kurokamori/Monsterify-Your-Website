import { ReactNode, useCallback } from 'react';
import { DataGrid } from '../common/DataGrid';
import { TrainerCard, TrainerCardSkeleton } from './TrainerCard';
import { FACTIONS } from './data/trainerFormOptions';
import type { Trainer, TrainerCardData, TrainerListFilters } from './types/Trainer';

type SortOrder = 'asc' | 'desc';

interface TrainerGridProps {
  /** Trainer data array */
  trainers: (Trainer | TrainerCardData)[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | Error | null;
  /** Retry handler for errors */
  onRetry?: () => void;
  /** Empty state message */
  emptyMessage?: string;

  // Search & Filters
  /** Show search bar */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Callback when search changes */
  onSearchChange?: (search: string) => void;
  /** Show faction filter */
  showFactionFilter?: boolean;
  /** Callback when filters change */
  onFiltersChange?: (filters: TrainerListFilters) => void;

  // Sorting
  /** Show sort options */
  showSort?: boolean;
  /** Custom sort options (overrides built-in name/level/date) */
  sortOptions?: { value: string; label: string; icon?: string }[];
  /** Default sort field */
  defaultSortBy?: string;
  /** Default sort order */
  defaultSortOrder?: SortOrder;
  /** Callback when sort changes */
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void;

  // Pagination
  /** Current page */
  currentPage?: number;
  /** Total pages */
  totalPages?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Show pagination */
  showPagination?: boolean;

  // Layout
  /** Show layout toggle (grid/list) */
  showLayoutToggle?: boolean;
  /** Default layout mode */
  defaultLayout?: 'grid' | 'list';
  /** Grid columns */
  gridColumns?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 2 | 3 | 4 | 5 | 6;

  // Card Options
  /** Show monster count on cards */
  showMonsterCount?: boolean;
  /** Show player name on cards */
  showPlayer?: boolean;
  /** Show types on cards */
  showTypes?: boolean;
  /** Maximum types to display per card */
  maxTypes?: number;

  // Interactions
  /** Trainer click handler */
  onTrainerClick?: (trainer: Trainer | TrainerCardData) => void;
  /** Currently selected trainer ID */
  selectedTrainerId?: number;
  /** Trainer action buttons */
  trainerActions?: (trainer: Trainer | TrainerCardData) => {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    icon?: string;
  }[];

  // Header
  /** Grid title */
  title?: string;
  /** Header actions */
  headerActions?: ReactNode;

  /** Additional className */
  className?: string;
}

// Filter configuration for DataGrid
const FACTION_FILTER_OPTIONS = FACTIONS.map(faction => ({
  value: faction,
  label: faction
}));

// Sort options
const SORT_OPTIONS = [
  { value: 'name', label: 'Name', icon: 'fas fa-font' },
  { value: 'level', label: 'Level', icon: 'fas fa-arrow-up' },
  { value: 'created_at', label: 'Date', icon: 'fas fa-calendar' }
];

/**
 * TrainerGrid - Grid/list display for trainers
 * Extends DataGrid with trainer-specific features
 */
export function TrainerGrid({
  trainers,
  loading = false,
  error,
  onRetry,
  emptyMessage = 'No trainers found',

  // Search & Filters
  showSearch = true,
  searchPlaceholder = 'Search trainers...',
  onSearchChange,
  showFactionFilter = true,
  onFiltersChange,

  // Sorting
  showSort = true,
  sortOptions: customSortOptions,
  defaultSortBy = 'name',
  defaultSortOrder = 'asc',
  onSortChange,

  // Pagination
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showPagination = true,

  // Layout
  showLayoutToggle = true,
  defaultLayout = 'grid',
  gridColumns = 'sm',

  // Card Options
  showMonsterCount = true,
  showPlayer = false,
  showTypes = true,
  maxTypes = 6,

  // Interactions
  onTrainerClick,
  selectedTrainerId,
  trainerActions,

  // Header
  title,
  headerActions,

  className = ''
}: TrainerGridProps) {
  // Build filters array
  const filters = showFactionFilter
    ? [
        {
          key: 'faction',
          label: 'All Factions',
          options: FACTION_FILTER_OPTIONS
        }
      ]
    : undefined;

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (filterValues: Record<string, string>) => {
      onFiltersChange?.({
        faction: filterValues.faction || undefined
      });
    },
    [onFiltersChange]
  );

  // Render individual trainer card
  const renderTrainer = useCallback(
    (trainer: Trainer | TrainerCardData) => {
      const actions = trainerActions?.(trainer);

      return (
        <TrainerCard
          trainer={trainer}
          showMonsterCount={showMonsterCount}
          showPlayer={showPlayer}
          showTypes={showTypes}
          maxTypes={maxTypes}
          onClick={onTrainerClick}
          selected={selectedTrainerId === trainer.id}
          actions={actions?.map(action => ({
            ...action,
            onClick: (e) => {
              e.stopPropagation();
              action.onClick();
            }
          }))}
        />
      );
    },
    [showMonsterCount, showPlayer, showTypes, maxTypes, onTrainerClick, selectedTrainerId, trainerActions]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (trainer: Trainer | TrainerCardData) => trainer.id,
    []
  );

  return (
    <DataGrid
      data={trainers}
      renderItem={renderTrainer}
      keyExtractor={keyExtractor}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyMessage={emptyMessage}
      emptyIcon="fas fa-users"
      loadingMessage="Loading trainers..."
      // Search
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      onSearchChange={onSearchChange}
      // Filters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      // Sorting
      sortOptions={showSort ? (customSortOptions ?? SORT_OPTIONS) : undefined}
      defaultSortBy={defaultSortBy}
      defaultSortOrder={defaultSortOrder}
      onSortChange={onSortChange}
      // Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      showPagination={showPagination}
      // Layout
      showLayoutToggle={showLayoutToggle}
      defaultLayout={defaultLayout}
      gridColumns={gridColumns}
      gap="md"
      // Header
      title={title}
      headerActions={headerActions}
      className={`trainer-grid ${className}`}
    />
  );
}

/**
 * TrainerGridSkeleton - Loading skeleton for trainer grid
 */
export function TrainerGridSkeleton({
  count = 6,
  columns = 3
}: {
  count?: number;
  columns?: number;
}) {
  return (
    <div
      className="data-grid__items data-grid__items--grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'var(--spacing-medium)'
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="data-grid__item">
          <TrainerCardSkeleton />
        </div>
      ))}
    </div>
  );
}
