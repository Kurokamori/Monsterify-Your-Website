import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Modal } from '../../components/common/Modal';
import trainerService from '../../services/trainerService';
import type { Trainer } from '../../components/trainers/types/Trainer';

// --- Constants ---

type SortField = 'name' | 'level' | 'monster_count' | 'ref_percent' | 'currency';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'level', label: 'Level' },
  { value: 'monster_count', label: 'Monster Count' },
  { value: 'ref_percent', label: 'Ref %' },
  { value: 'currency', label: 'Currency' },
];

const DEFAULT_IMAGE = '/images/default_trainer.png';

// --- Helpers ---

function getRefPercent(trainer: Trainer): number {
  const total = trainer.monster_count || 0;
  if (total === 0) return 0;
  return ((trainer.monster_ref_count || 0) / total) * 100;
}

function compareTrainers(a: Trainer, b: Trainer, sortBy: SortField): number {
  switch (sortBy) {
    case 'name':
      return (a.name || '').localeCompare(b.name || '');
    case 'level':
      return (a.level || 0) - (b.level || 0);
    case 'monster_count':
      return (a.monster_count || 0) - (b.monster_count || 0);
    case 'ref_percent':
      return getRefPercent(a) - getRefPercent(b);
    case 'currency':
      return (a.currency_amount || 0) - (b.currency_amount || 0);
    default:
      return 0;
  }
}

// --- Component ---

const MyTrainersPage = () => {
  useDocumentTitle('My Trainers');

  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sort/filter
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterFaction, setFilterFaction] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Trainer | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile/trainers' } });
    }
  }, [isAuthenticated, navigate]);

  // Fetch trainers
  const fetchTrainers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainerService.getUserTrainers(currentUser?.discord_id);
      setTrainers(response.trainers || []);
    } catch {
      setError('Failed to load trainers. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.discord_id]);

  useEffect(() => {
    if (isAuthenticated) fetchTrainers();
  }, [isAuthenticated, fetchTrainers]);

  // Unique factions for filter
  const uniqueFactions = useMemo(() => {
    const factions = trainers
      .map(t => t.faction)
      .filter((f): f is string => !!f && f.trim() !== '');
    return [...new Set(factions)].sort();
  }, [trainers]);

  // Sorted & filtered trainers
  const displayTrainers = useMemo(() => {
    const result = filterFaction
      ? trainers.filter(t => t.faction === filterFaction)
      : [...trainers];

    result.sort((a, b) => {
      const cmp = compareTrainers(a, b, sortBy);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [trainers, filterFaction, sortBy, sortOrder]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await trainerService.deleteTrainer(deleteTarget.id);
      setDeleteTarget(null);
      await fetchTrainers();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to delete trainer. Please try again.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchTrainers]);

  const openDeleteModal = useCallback((trainer: Trainer, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(trainer);
    setDeleteError(null);
  }, []);

  // Loading/error states
  if (!isAuthenticated) return null;
  if (loading) return <LoadingSpinner message="Loading trainers..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchTrainers} />;

  return (
    <div className="my-trainers">
      {/* Header */}
      <div className="my-trainers__header">
        <h1>My Trainers</h1>
        <Link to="/profile/add-trainer" className="button primary no-flex">
          <i className="fa-solid fa-plus"></i> New Trainer
        </Link>
      </div>

      {/* Filter/Sort Bar */}
      {trainers.length > 0 && (
        <div className="my-trainers__toolbar">
          <div className="my-trainers__filter-group">
            <label htmlFor="faction-filter">
              <i className="fa-solid fa-filter"></i> Faction
            </label>
            <select
              id="faction-filter"
              className="select"
              value={filterFaction}
              onChange={e => setFilterFaction(e.target.value)}
            >
              <option value="">All Factions</option>
              {uniqueFactions.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="my-trainers__filter-group">
            <label htmlFor="sort-by">
              <i className="fa-solid fa-sort"></i> Sort By
            </label>
            <select
              id="sort-by"
              className="select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortField)}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="my-trainers__sort-toggle">
            <button
              className={`button sm${sortOrder === 'asc' ? ' primary' : ' secondary'}`}
              onClick={() => setSortOrder('asc')}
              title="Ascending"
            >
              <i className="fa-solid fa-sort-amount-up-alt"></i>
            </button>
            <button
              className={`button sm${sortOrder === 'desc' ? ' primary' : ' secondary'}`}
              onClick={() => setSortOrder('desc')}
              title="Descending"
            >
              <i className="fa-solid fa-sort-amount-down"></i>
            </button>
          </div>

          {filterFaction && (
            <button className="button secondary sm" onClick={() => setFilterFaction('')}>
              <i className="fa-solid fa-times"></i> Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Trainer Grid */}
      {displayTrainers.length > 0 ? (
        <div className="my-trainers__grid">
          {displayTrainers.map(trainer => (
            <div
              key={trainer.id}
              className="card card--default card--clickable card--full-height my-trainer-card"
              onClick={() => navigate(`/trainers/${trainer.id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/trainers/${trainer.id}`);
                }
              }}
            >
              {/* Card Image */}
              <div className="card__image" style={{ height: '180px' }}>
                <img
                  src={trainer.main_ref || DEFAULT_IMAGE}
                  alt={trainer.name}
                  onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                />
              </div>

              <div className="card__body">
                {/* Header: name + level */}
                <div className="card__header">
                  <div className="card__header-content">
                    <h3 className="card__title">{trainer.name}</h3>
                    {trainer.title && (
                      <p className="card__subtitle">{trainer.title}</p>
                    )}
                  </div>
                  <span className="badge badge--accent">Lv. {trainer.level || 1}</span>
                </div>

                {/* Stats */}
                <div className="my-trainer-card__stats">
                  <div className="my-trainer-card__stat">
                    <i className="fa-solid fa-dragon"></i>
                    <span className="my-trainer-card__stat-value">{trainer.monster_count || 0}</span>
                    <span className="my-trainer-card__stat-label">Mons</span>
                  </div>
                  <div className="my-trainer-card__stat">
                    <i className="fa-solid fa-image"></i>
                    <span className="my-trainer-card__stat-value">{trainer.monster_ref_count || 0}</span>
                    <span className="my-trainer-card__stat-label">Refs</span>
                  </div>
                  <div className="my-trainer-card__stat">
                    <i className="fa-solid fa-coins"></i>
                    <span className="my-trainer-card__stat-value">{trainer.currency_amount || 0}</span>
                    <span className="my-trainer-card__stat-label">Coins</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="card__footer" onClick={e => e.stopPropagation()}>
                <div className="card__actions">
                  <Link to={`/trainers/${trainer.id}`} className="button primary sm">
                    <i className="fa-solid fa-eye"></i> View
                  </Link>
                  <Link to={`/trainers/${trainer.id}/edit`} className="button secondary sm">
                    <i className="fa-solid fa-edit"></i> Edit
                  </Link>
                  <button
                    className="button danger sm"
                    onClick={e => openDeleteModal(trainer, e)}
                  >
                    <i className="fa-solid fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : trainers.length > 0 ? (
        // No filter match
        <div className="state-container__empty">
          <i className="state-container__empty-icon fa-solid fa-filter"></i>
          <h2>No Trainers Match Filter</h2>
          <p className="state-container__empty-message">
            No trainers found for the faction "{filterFaction}".
          </p>
          <button className="button primary" onClick={() => setFilterFaction('')}>
            Clear Filter
          </button>
        </div>
      ) : (
        // No trainers at all
        <div className="state-container__empty">
          <i className="state-container__empty-icon fa-solid fa-user-slash"></i>
          <h2>No Trainers Found</h2>
          <p className="state-container__empty-message">
            You don't have any trainers yet. Create your first trainer to start your adventure!
          </p>
          <Link to="/profile/add-trainer" className="button primary">
            Create Your First Trainer
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Trainer"
      >
        {deleteTarget && (
          <div className="my-trainers__delete-modal">
            <p>
              Are you sure you want to delete the trainer <strong>{deleteTarget.name}</strong>?
              This will permanently remove the trainer and all associated data.
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="my-trainers__delete-error">
                <i className="fa-solid fa-exclamation-circle"></i> {deleteError}
              </div>
            )}

            <div className="my-trainers__delete-actions">
              <button className="button secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="button danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Deleting...</>
                ) : (
                  'Delete Trainer'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyTrainersPage;
