import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import { ConfirmModal, useConfirmModal } from '../common/ConfirmModal';
import { Card } from '../common/Card';
import { TypeBadge } from '../common/TypeBadge';
import { Pagination } from '../common/Pagination';
import { useAuth } from '../../contexts/useAuth';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorUtils';
import type {
  TownTrainer,
  TrainerMonster,
  BazarForfeitMonsterProps
} from './types';

/**
 * BazarForfeitMonster - Forfeit monsters to the bazar
 * Allows trainers to donate monsters for other trainers to adopt
 */
export function BazarForfeitMonster({
  className = '',
  onForfeitComplete
}: BazarForfeitMonsterProps) {
  const { currentUser } = useAuth();

  // Trainer selection
  const [selectedTrainer, setSelectedTrainer] = useState<TownTrainer | null>(null);
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);

  // Fetch user's trainers
  useEffect(() => {
    if (!currentUser?.discord_id) return;
    api.get(`/trainers/user/${currentUser.discord_id}?limit=100`).then(res => {
      const data = res.data?.data ?? res.data?.trainers ?? (Array.isArray(res.data) ? res.data : []);
      setUserTrainers(data);
    }).catch(() => {});
  }, [currentUser?.discord_id]);

  // Monsters
  const [monsters, setMonsters] = useState<TrainerMonster[]>([]);
  const [monstersLoading, setMonstersLoading] = useState(false);
  const [selectedMonsters, setSelectedMonsters] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 12
  });

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Confirm modal
  const confirmModal = useConfirmModal();

  // Selected monsters count
  const selectedCount = useMemo(() => selectedMonsters.size, [selectedMonsters]);

  // Fetch trainer's monsters
  const fetchMonsters = useCallback(async (trainerId: string | number, page = 1) => {
    try {
      setMonstersLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await api.get(`/trainers/${trainerId}/monsters?${params.toString()}`);

      setMonsters(response.data.monsters || []);
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        limit: pagination.limit
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load monsters'));
      setMonsters([]);
    } finally {
      setMonstersLoading(false);
    }
  }, [pagination.limit]);

  // Handle trainer selection
  const handleTrainerSelect = useCallback((trainer: TownTrainer | null) => {
    setSelectedTrainer(trainer);
    setSelectedMonsters(new Set());
    setMonsters([]);
    setError('');
    setSuccess('');

    if (trainer) {
      fetchMonsters(trainer.id, 1);
    }
  }, [fetchMonsters]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (selectedTrainer) {
      fetchMonsters(selectedTrainer.id, page);
    }
  }, [selectedTrainer, fetchMonsters]);

  // Toggle monster selection
  const toggleMonsterSelection = useCallback((monsterId: number) => {
    setSelectedMonsters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monsterId)) {
        newSet.delete(monsterId);
      } else {
        newSet.add(monsterId);
      }
      return newSet;
    });
  }, []);

  // Select all on current page
  const handleSelectAll = useCallback(() => {
    setSelectedMonsters(prev => {
      const newSet = new Set(prev);
      monsters.forEach(monster => newSet.add(monster.id));
      return newSet;
    });
  }, [monsters]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedMonsters(new Set());
  }, []);

  // Get species display string
  const getSpeciesDisplay = useCallback((monster: TrainerMonster) => {
    const species = [monster.species1, monster.species2, monster.species3]
      .filter(Boolean)
      .join(' / ');
    return species || 'Unknown';
  }, []);

  // Get types array
  const getTypes = useCallback((monster: TrainerMonster) => {
    return [monster.type1, monster.type2]
      .filter(Boolean) as string[];
  }, []);

  // Handle forfeit confirmation
  const handleForfeitClick = useCallback(() => {
    if (selectedCount === 0) return;

    const selectedMonstersList = monsters.filter(m => selectedMonsters.has(m.id));

    const monsterDetails = (
      <ul>
        {selectedMonstersList.map(m => (
          <li key={m.id}>{m.name}</li>
        ))}
      </ul>
    );

    confirmModal.confirmDanger(
      `Are you sure you want to forfeit ${selectedCount} monster${selectedCount > 1 ? 's' : ''} to the bazar?`,
      async () => {
        try {
          setLoading(true);
          setError('');

          await api.post('/town/bazar/forfeit/monsters', {
            monsters: Array.from(selectedMonsters).map(monsterId => ({
              monsterId,
              trainerId: selectedTrainer!.id,
            }))
          });

          setSuccess(`Successfully forfeited ${selectedCount} monster${selectedCount > 1 ? 's' : ''} to the bazar!`);

          const forfeitedMonsters = monsters.filter(m => selectedMonsters.has(m.id));
          onForfeitComplete?.(forfeitedMonsters);

          // Refresh monsters list
          setSelectedMonsters(new Set());
          fetchMonsters(selectedTrainer!.id, pagination.page);
        } catch (err) {
          setError(extractErrorMessage(err, 'Failed to forfeit monsters'));
        } finally {
          setLoading(false);
        }
      },
      {
        title: 'Confirm Forfeit',
        details: monsterDetails,
        warning: 'This action cannot be undone.'
      }
    );
  }, [selectedCount, selectedMonsters, monsters, selectedTrainer, confirmModal, pagination.page, fetchMonsters, onForfeitComplete]);

  // Reset form
  const handleReset = useCallback(() => {
    setSelectedTrainer(null);
    setSelectedMonsters(new Set());
    setMonsters([]);
    setError('');
    setSuccess('');
  }, []);

  return (
    <div className={`bazar-forfeit-monster ${className}`}>
      <div className="bazar-forfeit-monster__header">
        <h2 className="bazar-forfeit-monster__title">
          <i className="fas fa-heart-broken"></i> Forfeit Monsters
        </h2>
        <p className="bazar-forfeit-monster__description">
          Select monsters from your team to donate to the bazar for other trainers to adopt.
        </p>
      </div>

      <div className="bazar-forfeit-monster__content">
        {/* Trainer Selection */}
        <div className="bazar-forfeit-monster__section">
          <label className="form-label">Select Trainer</label>
          <TrainerAutocomplete
            trainers={userTrainers}
            onSelectTrainer={handleTrainerSelect}
            value={selectedTrainer?.id ?? null}
            placeholder="Search for a trainer..."
          />
        </div>

        {selectedTrainer && (
          <>
            {/* Selection Controls */}
            <div className="bazar-forfeit-monster__controls">
              <div className="bazar-forfeit-monster__selection-info">
                <span className="bazar-forfeit-monster__selection-count">
                  {selectedCount} monster{selectedCount !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="bazar-forfeit-monster__selection-actions">
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handleSelectAll}
                  disabled={monstersLoading || monsters.length === 0}
                >
                  Select All on Page
                </button>
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={handleClearSelection}
                  disabled={selectedCount === 0}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Monsters Grid */}
            <div className="bazar-forfeit-monster__monsters">
              {monstersLoading ? (
                <div className="bazar-forfeit-monster__loading">
                  <LoadingSpinner />
                  <p>Loading monsters...</p>
                </div>
              ) : monsters.length === 0 ? (
                <div className="bazar-forfeit-monster__empty">
                  <i className="fas fa-paw"></i>
                  <p>No monsters found for this trainer.</p>
                </div>
              ) : (
                <>
                  <div className="bazar-forfeit-monster__grid">
                    {monsters.map(monster => (
                      <Card
                        key={monster.id}
                        className={`bazar-forfeit-monster__card ${selectedMonsters.has(monster.id) ? 'bazar-forfeit-monster__card--selected' : ''}`}
                        onClick={() => toggleMonsterSelection(monster.id)}
                        hoverable
                      >
                        <div className="bazar-forfeit-monster__card-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedMonsters.has(monster.id)}
                            onChange={() => toggleMonsterSelection(monster.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="bazar-forfeit-monster__card-image">
                          {monster.img_link ? (
                            <img
                              src={monster.img_link}
                              alt={monster.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/monsters/default.png';
                              }}
                            />
                          ) : (
                            <div className="bazar-forfeit-monster__card-placeholder">
                              <i className="fas fa-question"></i>
                            </div>
                          )}
                        </div>
                        <div className="bazar-forfeit-monster__card-info">
                          <h4 className="bazar-forfeit-monster__card-name">
                            {monster.name}
                          </h4>
                          <p className="bazar-forfeit-monster__card-species">
                            {getSpeciesDisplay(monster)}
                          </p>
                          <div className="bazar-forfeit-monster__card-types">
                            {getTypes(monster).map((type, idx) => (
                              <TypeBadge key={idx} type={type} size="sm" />
                            ))}
                          </div>
                          {monster.level && (
                            <span className="bazar-forfeit-monster__card-level">
                              Lv. {monster.level}
                            </span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Messages */}
        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success} />}

        {/* Actions */}
        <ActionButtonGroup align="end" className="mt-md">
          <button
            className="button secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
          <button
            className="button danger"
            onClick={handleForfeitClick}
            disabled={loading || selectedCount === 0}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" message="" />
                Forfeiting...
              </>
            ) : (
              <>
                <i className="fas fa-heart-broken"></i> Forfeit {selectedCount > 0 ? `(${selectedCount})` : ''}
              </>
            )}
          </button>
        </ActionButtonGroup>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        {...confirmModal.modalProps}
        loading={loading}
        confirmText="Forfeit"
      />
    </div>
  );
}

export default BazarForfeitMonster;
