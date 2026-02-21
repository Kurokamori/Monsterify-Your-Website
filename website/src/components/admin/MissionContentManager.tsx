import { useState, useEffect, useCallback } from 'react';
import { AdminTable } from './AdminTable';
import type { ColumnDef, FilterConfig } from './AdminTable';
import { MissionForm } from './MissionForm';
import { ConfirmModal, useConfirmModal } from '../common';
import type { Mission } from '@services/missionService';
import missionService from '@services/missionService';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
];

const DIFFICULTY_FILTER_OPTIONS = [
  { value: '', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

const FILTERS: FilterConfig[] = [
  { key: 'status', label: 'Status', options: STATUS_FILTER_OPTIONS },
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_FILTER_OPTIONS },
];

const COLUMNS: ColumnDef<Mission>[] = [
  { key: 'title', header: 'Title', sortable: true },
  {
    key: 'difficulty',
    header: 'Difficulty',
    sortable: true,
    render: (m) => (
      <span className={`badge sm ${m.difficulty}`}>{m.difficulty}</span>
    ),
  },
  {
    key: 'duration',
    header: 'Duration',
    render: (m) => <>{m.duration}h</>,
  },
  { key: 'minLevel', header: 'Min Lvl', render: (m) => <>{m.minLevel}</> },
  { key: 'maxMonsters', header: 'Max Monsters', render: (m) => <>{m.maxMonsters}</> },
  {
    key: 'status',
    header: 'Status',
    render: (m) => (
      <span className={`badge sm ${m.status}`}>{m.status}</span>
    ),
  },
];

export function MissionContentManager() {
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  const [filterValues, setFilterValues] = useState<Record<string, string>>({ status: '', difficulty: '' });
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchValue, setSearchValue] = useState('');

  const confirmModal = useConfirmModal();

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await missionService.adminGetAllMissions({
        page: currentPage,
        limit: 20,
        difficulty: filterValues.difficulty || undefined,
        status: filterValues.status || 'all',
        sortBy,
        sortOrder,
      });
      if (result.success !== false) {
        setMissions(result.data ?? []);
        setTotalPages(result.totalPages ?? 1);
      } else {
        setError(result.message || 'Failed to fetch missions');
      }
    } catch {
      setError('Failed to fetch missions');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterValues, sortBy, sortOrder]);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const handleCreate = () => {
    setEditingMission(null);
    setActiveTab('form');
  };

  const handleEdit = (mission: Mission) => {
    setEditingMission(mission);
    setActiveTab('form');
  };

  const handleDelete = (mission: Mission) => {
    confirmModal.confirmDanger(
      <>Are you sure you want to delete <strong>{mission.title}</strong>? This cannot be undone.</>,
      async () => {
        try {
          const result = await missionService.adminDeleteMission(mission.id);
          if (result.success) {
            setMissions(prev => prev.filter(m => m.id !== mission.id));
          } else {
            setError(result.message || 'Failed to delete mission');
          }
        } catch {
          setError('Failed to delete mission');
        }
        confirmModal.close();
      },
      { title: 'Delete Mission', confirmText: 'Delete' }
    );
  };

  const handleFormSuccess = (saved: Mission) => {
    if (editingMission) {
      setMissions(prev => prev.map(m => m.id === saved.id ? saved : m));
    } else {
      setMissions(prev => [saved, ...prev]);
    }
    setActiveTab('list');
    setEditingMission(null);
  };

  const handleFormCancel = () => {
    setActiveTab('list');
    setEditingMission(null);
  };

  const handleSortChange = (field: string) => {
    if (field === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilterValues(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilterValues({ status: '', difficulty: '' });
    setCurrentPage(1);
  };

  // Client-side search filtering (server handles pagination/sorting)
  const filteredMissions = searchValue.trim()
    ? missions.filter(m => m.title.toLowerCase().includes(searchValue.toLowerCase()))
    : missions;

  return (
    <div className="mission-content-manager">
      <div className="item-header">
        <h2>Mission Content Manager</h2>
        <div className="header-actions">
          <button onClick={handleCreate} className="button primary">
            <i className="fas fa-plus" /> Create New Mission
          </button>
        </div>
      </div>

      <div className="mission-content-manager__tabs">
        <button
          className={`button tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Mission List
        </button>
        <button
          className={`button tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          {editingMission ? 'Edit Mission' : 'Create Mission'}
        </button>
      </div>

      <div className="mission-content-manager__content">
        {activeTab === 'list' && (
          <AdminTable<Mission>
            title=""
            data={filteredMissions}
            columns={COLUMNS}
            keyExtractor={(m) => m.id}
            loading={loading}
            error={error}
            onRetry={fetchMissions}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search missions by title..."
            filters={FILTERS}
            filterValues={filterValues}
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            actions={(mission) => (
              <>
                <button className="button secondary sm" onClick={() => handleEdit(mission)}>
                  <i className="fas fa-edit" /> Edit
                </button>
                <button className="button danger sm" onClick={() => handleDelete(mission)}>
                  <i className="fas fa-trash" /> Delete
                </button>
              </>
            )}
            emptyMessage="No missions found. Create your first mission!"
          />
        )}

        {activeTab === 'form' && (
          <MissionForm
            mission={editingMission}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </div>

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
}
