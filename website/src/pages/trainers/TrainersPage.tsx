import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { TrainerGrid } from '../../components/trainers/TrainerGrid';
import trainerService from '../../services/trainerService';
import type { Trainer, TrainerCardData, TrainerListFilters } from '../../components/trainers/types/Trainer';

// --- Constants ---

const SORT_OPTIONS = [
  { value: 'name', label: 'Name', icon: 'fa-solid fa-font' },
  { value: 'level', label: 'Level', icon: 'fa-solid fa-star' },
  { value: 'monster_count', label: 'Monsters', icon: 'fa-solid fa-dragon' },
  { value: 'faction', label: 'Faction', icon: 'fa-solid fa-flag' },
];

const PAGE_LIMIT = 50;

// --- Component ---

const TrainersPage = () => {
  useDocumentTitle('Trainers');

  const navigate = useNavigate();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Use refs for fetch parameters to keep fetchTrainers stable
  const searchRef = useRef('');
  const factionRef = useRef('');
  const sortByRef = useRef('name');
  const sortOrderRef = useRef<'asc' | 'desc'>('asc');
  const fetchIdRef = useRef(0);

  const fetchTrainers = useCallback(async (page: number) => {
    const currentFetchId = ++fetchIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const params: Record<string, unknown> = {
        page,
        limit: PAGE_LIMIT,
        sort_by: sortByRef.current,
        sort_order: sortOrderRef.current,
      };

      if (searchRef.current.trim()) {
        params.search = searchRef.current.trim();
      }
      if (factionRef.current.trim()) {
        params.faction = factionRef.current.trim();
      }

      const response = await trainerService.getTrainersPaginated(params);

      // Only update state if this is still the latest request
      if (currentFetchId !== fetchIdRef.current) return;

      setTrainers(response.trainers || []);
      setTotalPages(response.totalPages || 1);
    } catch {
      if (currentFetchId !== fetchIdRef.current) return;
      setError('Failed to load trainers. Please try again later.');
      setTrainers([]);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTrainers(1);
  }, [fetchTrainers]);

  // --- Callbacks ---

  const handleSearchChange = useCallback((search: string) => {
    searchRef.current = search;
    setCurrentPage(1);
    fetchTrainers(1);
  }, [fetchTrainers]);

  const handleFiltersChange = useCallback((filters: TrainerListFilters) => {
    factionRef.current = filters.faction || '';
    setCurrentPage(1);
    fetchTrainers(1);
  }, [fetchTrainers]);

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    sortByRef.current = sortBy;
    sortOrderRef.current = sortOrder;
    setCurrentPage(1);
    fetchTrainers(1);
  }, [fetchTrainers]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchTrainers(page);
  }, [fetchTrainers]);

  const handleTrainerClick = useCallback((trainer: Trainer | TrainerCardData) => {
    navigate(`/trainers/${trainer.id}`);
  }, [navigate]);

  const handleRetry = useCallback(() => {
    fetchTrainers(currentPage);
  }, [fetchTrainers, currentPage]);

  return (
    <TrainerGrid
      trainers={trainers}
      loading={loading}
      error={error}
      onRetry={handleRetry}
      emptyMessage="No trainers found. Try adjusting your search criteria."
      showSearch
      searchPlaceholder="Search trainers..."
      onSearchChange={handleSearchChange}
      showFactionFilter
      onFiltersChange={handleFiltersChange}
      showSort
      sortOptions={SORT_OPTIONS}
      defaultSortBy="name"
      defaultSortOrder="asc"
      onSortChange={handleSortChange}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      showPagination
      showLayoutToggle
      showMonsterCount
      showPlayer
      showTypes
      onTrainerClick={handleTrainerClick}
      getTrainerHref={(trainer) => `/trainers/${trainer.id}`}
      title="Trainers"
    />
  );
};

export default TrainersPage;
