import { useState, useEffect, useCallback } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { FormInput } from '../common/FormInput';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { Card } from '../common/Card';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import api from '../../services/api';
import bazarService from '../../services/bazarService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type {
  TownTrainer,
  BazarMonster,
  BazarAdoptMonsterProps
} from './types';

/**
 * BazarAdoptMonster - Adopt forfeited monsters from the bazar
 * Browse and claim monsters forfeited by other trainers
 */
export function BazarAdoptMonster({
  className = '',
  onAdoptComplete
}: BazarAdoptMonsterProps) {
  // Monsters and pagination
  const [monsters, setMonsters] = useState<BazarMonster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 12
  });

  // User's trainers for adoption
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);

  // Adoption modal
  const [selectedMonster, setSelectedMonster] = useState<BazarMonster | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<TownTrainer | null>(null);
  const [monsterName, setMonsterName] = useState('');
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState('');
  const [adoptSuccess, setAdoptSuccess] = useState('');

  // Fetch available monsters
  const fetchMonsters = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await api.get(`/town/bazar/monsters?${params.toString()}`);

      setMonsters(response.data.monsters || []);
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        limit: pagination.limit
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load bazar monsters'));
      setMonsters([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Initial load
  useEffect(() => {
    fetchMonsters(1);
    bazarService.getUserTrainers().then(data => {
      setUserTrainers(data.trainers || data || []);
    }).catch(() => setUserTrainers([]));
  }, [fetchMonsters]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    fetchMonsters(page);
  }, [fetchMonsters]);

  // Get species display string
  const getSpeciesDisplay = useCallback((monster: BazarMonster) => {
    const species = [monster.species1, monster.species2, monster.species3]
      .filter(Boolean)
      .join(' / ');
    return species || 'Unknown';
  }, []);

  // Get types array
  const getTypes = useCallback((monster: BazarMonster) => {
    return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter(Boolean) as string[];
  }, []);

  // Open adoption modal
  const handleMonsterClick = useCallback((monster: BazarMonster) => {
    setSelectedMonster(monster);
    setSelectedTrainer(null);
    setMonsterName(monster.name || '');
    setAdoptError('');
    setAdoptSuccess('');
    setShowModal(true);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedMonster(null);
    setSelectedTrainer(null);
    setMonsterName('');
    setAdoptError('');
    setAdoptSuccess('');
  }, []);

  // Handle adoption
  const handleAdopt = useCallback(async () => {
    if (!selectedMonster || !selectedTrainer) return;

    if (!monsterName.trim()) {
      setAdoptError('Please enter a name for your new monster.');
      return;
    }

    try {
      setAdoptLoading(true);
      setAdoptError('');

      await api.post('/town/bazar/adopt/monster', {
        bazarMonsterId: selectedMonster.id,
        trainerId: selectedTrainer.id,
        newName: monsterName.trim()
      });

      setAdoptSuccess(`Successfully adopted ${monsterName}!`);
      onAdoptComplete?.(selectedMonster, selectedTrainer.id);

      // Refresh monsters list after a short delay
      setTimeout(() => {
        handleCloseModal();
        fetchMonsters(pagination.page);
      }, 1500);
    } catch (err) {
      setAdoptError(extractErrorMessage(err, 'Failed to adopt monster'));
    } finally {
      setAdoptLoading(false);
    }
  }, [selectedMonster, selectedTrainer, monsterName, pagination.page, fetchMonsters, handleCloseModal, onAdoptComplete]);

  return (
    <div className={`bazar-adopt-monster ${className}`}>
      <div className="bazar-adopt-monster__header">
        <h2 className="bazar-adopt-monster__title">
          <i className="fas fa-paw"></i> Adopt Monsters
        </h2>
        <p className="bazar-adopt-monster__description">
          Browse monsters forfeited by other trainers and give them a new home.
        </p>
      </div>

      {/* Content */}
      <div className="bazar-adopt-monster__content">
        {loading ? (
          <div className="bazar-adopt-monster__loading">
            <LoadingSpinner />
            <p>Loading available monsters...</p>
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : monsters.length === 0 ? (
          <div className="bazar-adopt-monster__empty">
            <i className="fas fa-paw"></i>
            <p>No monsters available for adoption.</p>
          </div>
        ) : (
          <>
            <div className="bazar-adopt-monster__grid">
              {monsters.map(monster => (
                <Card
                  key={monster.id}
                  className="bazar-adopt-monster__card"
                  onClick={() => handleMonsterClick(monster)}
                  hoverable
                >
                  <div className="bazar-adopt-monster__card-image">
                    {monster.img_link ? (
                      <img
                        src={monster.img_link}
                        alt={monster.name || getSpeciesDisplay(monster)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/monsters/default.png';
                        }}
                      />
                    ) : (
                      <div className="bazar-adopt-monster__card-placeholder">
                        <i className="fas fa-question"></i>
                      </div>
                    )}
                  </div>
                  <div className="bazar-adopt-monster__card-info">
                    <h4 className="bazar-adopt-monster__card-name">
                      {monster.name || 'Unnamed'}
                    </h4>
                    <p className="bazar-adopt-monster__card-species">
                      {getSpeciesDisplay(monster)}
                    </p>
                    <div className="bazar-adopt-monster__card-types">
                      {getTypes(monster).slice(0, 2).map((type, idx) => (
                        <TypeBadge key={idx} type={type} size="sm" />
                      ))}
                    </div>
                    {monster.level && (
                      <span className="bazar-adopt-monster__card-level">
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

      {/* Adoption Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Adopt Monster"
        size="medium"
      >
        {selectedMonster && (
          <div className="bazar-adopt-monster__modal-content">
            {adoptSuccess ? (
              <div className="bazar-adopt-monster__success">
                <div className="bazar-adopt-monster__success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Success!</h3>
                <p>{adoptSuccess}</p>
              </div>
            ) : (
              <>
                {/* Monster Preview */}
                <div className="bazar-adopt-monster__preview">
                  <div className="bazar-adopt-monster__preview-image">
                    {selectedMonster.img_link ? (
                      <img
                        src={selectedMonster.img_link}
                        alt={selectedMonster.name || getSpeciesDisplay(selectedMonster)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/monsters/default.png';
                        }}
                      />
                    ) : (
                      <div className="bazar-adopt-monster__preview-placeholder">
                        <i className="fas fa-question"></i>
                      </div>
                    )}
                  </div>
                  <div className="bazar-adopt-monster__preview-info">
                    <h3>{selectedMonster.name || 'Unnamed Monster'}</h3>
                    <p className="bazar-adopt-monster__preview-species">
                      {getSpeciesDisplay(selectedMonster)}
                    </p>
                    <div className="bazar-adopt-monster__preview-types">
                      {getTypes(selectedMonster).map((type, idx) => (
                        <TypeBadge key={idx} type={type} size="sm" />
                      ))}
                    </div>
                    {selectedMonster.attribute && (
                      <AttributeBadge attribute={selectedMonster.attribute} size="sm" />
                    )}
                    {selectedMonster.level && (
                      <p className="bazar-adopt-monster__preview-level">
                        Level {selectedMonster.level}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trainer Selection */}
                <div className="bazar-adopt-monster__trainer-select">
                  <label className="form-label">Select Trainer to Adopt</label>
                  <TrainerAutocomplete
                    trainers={userTrainers}
                    onSelectTrainer={(trainer) => setSelectedTrainer(trainer as TownTrainer | null)}
                    value={selectedTrainer?.id ?? null}
                    placeholder="Search for your trainer..."
                  />
                </div>

                {/* Monster Name */}
                <div className="bazar-adopt-monster__name-input">
                  <FormInput
                    label="Monster Name"
                    value={monsterName}
                    onChange={(e) => setMonsterName(e.target.value)}
                    placeholder="Enter a name for your new monster..."
                    required
                  />
                </div>

                {adoptError && <ErrorMessage message={adoptError} />}

                {/* Actions */}
                <ActionButtonGroup align="end" className="mt-md">
                  <button
                    className="button secondary"
                    onClick={handleCloseModal}
                    disabled={adoptLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="button primary"
                    onClick={handleAdopt}
                    disabled={adoptLoading || !selectedTrainer || !monsterName.trim()}
                  >
                    {adoptLoading ? (
                      <>
                        <LoadingSpinner size="sm" message="" />
                        Adopting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-heart"></i> Adopt
                      </>
                    )}
                  </button>
                </ActionButtonGroup>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BazarAdoptMonster;
