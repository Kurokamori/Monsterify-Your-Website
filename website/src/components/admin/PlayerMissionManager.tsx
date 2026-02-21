import { useState, useEffect, useCallback } from 'react';
import { AdminTable } from './AdminTable';
import type { ColumnDef, FilterConfig } from './AdminTable';
import { Modal } from '../common/Modal';
import { ConfirmModal, useConfirmModal } from '../common';
import type { AdminUserMission } from '@services/missionService';
import missionService from '@services/missionService';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const FILTERS: FilterConfig[] = [
  { key: 'status', label: 'Status', options: STATUS_FILTER_OPTIONS },
];

const COLUMNS: ColumnDef<AdminUserMission>[] = [
  {
    key: 'player',
    header: 'Player',
    sortable: true,
    render: (m) => <>{m.displayName || m.username || m.userId}</>,
  },
  { key: 'title', header: 'Mission', sortable: true },
  {
    key: 'difficulty',
    header: 'Difficulty',
    render: (m) => (
      <span className={`badge sm ${m.difficulty}`}>{m.difficulty}</span>
    ),
  },
  {
    key: 'currentProgress',
    header: 'Progress',
    sortable: true,
    render: (m) => {
      const pct = m.requiredProgress > 0
        ? Math.min(100, Math.round((m.currentProgress / m.requiredProgress) * 100))
        : 0;
      return (
        <div className="player-mission-manager__progress">
          <div className="player-mission-manager__progress-bar">
            <div
              className="player-mission-manager__progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="player-mission-manager__progress-text">
            {m.currentProgress}/{m.requiredProgress}
          </span>
        </div>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (m) => (
      <span className={`badge sm ${m.status}`}>{m.status}</span>
    ),
  },
  {
    key: 'rewardClaimed',
    header: 'Reward',
    render: (m) => (
      <span className={`badge sm ${m.rewardClaimed ? 'active' : 'inactive'}`}>
        {m.rewardClaimed ? 'Claimed' : 'Unclaimed'}
      </span>
    ),
  },
  {
    key: 'startedAt',
    header: 'Started',
    sortable: true,
    render: (m) => <>{new Date(m.startedAt).toLocaleDateString()}</>,
  },
];

export function PlayerMissionManager() {
  const [missions, setMissions] = useState<AdminUserMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterValues, setFilterValues] = useState<Record<string, string>>({ status: '' });
  const [sortBy, setSortBy] = useState('startedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchValue, setSearchValue] = useState('');

  const [editingMission, setEditingMission] = useState<AdminUserMission | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editSaving, setEditSaving] = useState(false);

  const confirmModal = useConfirmModal();

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await missionService.adminGetUserMissions({
        page: currentPage,
        limit: 20,
        search: searchValue || undefined,
        status: filterValues.status || undefined,
        sortBy,
        sortOrder,
      });
      if (result.success !== false) {
        setMissions(result.data ?? []);
        setTotalPages(result.totalPages ?? 1);
      } else {
        setError(result.message || 'Failed to fetch user missions');
      }
    } catch {
      setError('Failed to fetch user missions');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchValue, filterValues, sortBy, sortOrder]);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

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
    setFilterValues({ status: '' });
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleEditProgress = (mission: AdminUserMission) => {
    setEditingMission(mission);
    setEditProgress(mission.currentProgress);
  };

  const handleSaveProgress = async () => {
    if (!editingMission) return;
    try {
      setEditSaving(true);
      const result = await missionService.adminUpdateUserMission(editingMission.id, {
        currentProgress: editProgress,
      });
      if (result.success) {
        setMissions(prev => prev.map(m =>
          m.id === editingMission.id ? { ...m, currentProgress: editProgress } : m
        ));
        setEditingMission(null);
      } else {
        setError(result.message || 'Failed to update progress');
      }
    } catch {
      setError('Failed to update progress');
    } finally {
      setEditSaving(false);
    }
  };

  const handleComplete = (mission: AdminUserMission) => {
    confirmModal.confirm(
      <>Mark <strong>{mission.title}</strong> for <strong>{mission.displayName || mission.username || mission.userId}</strong> as completed?</>,
      async () => {
        try {
          const result = await missionService.adminCompleteUserMission(mission.id);
          if (result.success) {
            setMissions(prev => prev.map(m =>
              m.id === mission.id
                ? { ...m, status: 'completed', currentProgress: m.requiredProgress }
                : m
            ));
          } else {
            setError(result.message || 'Failed to complete mission');
          }
        } catch {
          setError('Failed to complete mission');
        }
        confirmModal.close();
      },
      { title: 'Complete Mission', confirmText: 'Complete' },
    );
  };

  const handleDelete = (mission: AdminUserMission) => {
    confirmModal.confirmDanger(
      <>Are you sure you want to delete <strong>{mission.title}</strong> for <strong>{mission.displayName || mission.username || mission.userId}</strong>? This cannot be undone.</>,
      async () => {
        try {
          const result = await missionService.adminDeleteUserMission(mission.id);
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
      { title: 'Delete Player Mission', confirmText: 'Delete' },
    );
  };

  return (
    <div className="player-mission-manager">
      <AdminTable<AdminUserMission>
        title="Player Mission Manager"
        data={missions}
        columns={COLUMNS}
        keyExtractor={(m) => m.id}
        loading={loading}
        error={error}
        onRetry={fetchMissions}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by player name..."
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
            <button className="button secondary sm" onClick={() => handleEditProgress(mission)}>
              <i className="fas fa-edit" /> Progress
            </button>
            {mission.status === 'active' && (
              <button className="button primary sm" onClick={() => handleComplete(mission)}>
                <i className="fas fa-check" /> Complete
              </button>
            )}
            <button className="button danger sm" onClick={() => handleDelete(mission)}>
              <i className="fas fa-trash" /> Delete
            </button>
          </>
        )}
        emptyMessage="No player missions found."
      />

      <Modal
        isOpen={!!editingMission}
        onClose={() => setEditingMission(null)}
        title="Edit Progress"
        size="small"
        footer={
          <div className="player-mission-manager__modal-footer">
            <button className="button secondary" onClick={() => setEditingMission(null)}>
              Cancel
            </button>
            <button className="button primary" onClick={handleSaveProgress} disabled={editSaving}>
              {editSaving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : 'Save'}
            </button>
          </div>
        }
      >
        {editingMission && (
          <div className="player-mission-manager__edit-form">
            <p>
              <strong>{editingMission.title}</strong> — {editingMission.displayName || editingMission.username || editingMission.userId}
            </p>
            <div className="form-group">
              <label className="label">Current Progress</label>
              <input
                type="number"
                className="input"
                min={0}
                max={editingMission.requiredProgress}
                value={editProgress}
                onChange={(e) => setEditProgress(parseInt(e.target.value, 10) || 0)}
              />
              <span className="player-mission-manager__required">
                / {editingMission.requiredProgress} required
              </span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
}
