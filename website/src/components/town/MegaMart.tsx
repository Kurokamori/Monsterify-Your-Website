import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import megaMartService from '../../services/megaMartService';
import type { AbilitySlot } from '../../services/megaMartService';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import type { Monster } from '../common/MonsterDetails';
import type {
  TownTrainer,
  MegaMartProps,
  MonsterAbilities,
  MegaMartInventory,
  AbilityInfo
} from './types';
import { extractErrorMessage } from '../../utils/errorUtils';

/**
 * MegaMart component for modifying monster abilities
 * Supports Ability Capsule (swap primary/secondary) and Scroll of Secrets (set specific ability)
 */
export function MegaMart({ className = '' }: MegaMartProps) {
  const { isAuthenticated, currentUser } = useAuth();

  // Trainer and monster state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState<Monster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected monster state
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [monsterAbilities, setMonsterAbilities] = useState<MonsterAbilities | null>(null);
  const [abilitiesLoading, setAbilitiesLoading] = useState(false);

  // Inventory state
  const [trainerInventory, setTrainerInventory] = useState<MegaMartInventory | null>(null);

  // All abilities (for Scroll of Secrets search)
  const [allAbilities, setAllAbilities] = useState<AbilityInfo[]>([]);
  const [abilitySearchTerm, setAbilitySearchTerm] = useState('');

  // Modal state
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [showScrollModal, setShowScrollModal] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState('');
  const [selectedAbilitySlot, setSelectedAbilitySlot] = useState<AbilitySlot>('ability1');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState('');

  // Refs for syncing monster grid height to detail panel
  const monstersRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const MIN_MONSTERS_HEIGHT = 600;

  useEffect(() => {
    const detailEl = detailRef.current;
    const monstersEl = monstersRef.current;
    if (!detailEl || !monstersEl) return;

    const syncHeight = () => {
      const detailHeight = detailEl.scrollHeight;
      monstersEl.style.maxHeight = `${Math.max(MIN_MONSTERS_HEIGHT, detailHeight)}px`;
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(detailEl);
    return () => observer.disconnect();
  }, [selectedMonster, monsterAbilities]);

  // Derived: filtered monsters
  const filteredMonsters = useMemo(() => {
    if (!searchTerm.trim()) return trainerMonsters;

    const term = searchTerm.toLowerCase();
    return trainerMonsters.filter(monster =>
      monster.name?.toLowerCase().includes(term) ||
      monster.species1?.toLowerCase().includes(term) ||
      monster.species2?.toLowerCase().includes(term) ||
      monster.species3?.toLowerCase().includes(term) ||
      monster.type1?.toLowerCase().includes(term) ||
      monster.type2?.toLowerCase().includes(term) ||
      monster.type3?.toLowerCase().includes(term)
    );
  }, [trainerMonsters, searchTerm]);

  // Derived: filtered abilities
  const filteredAbilities = useMemo(() => {
    if (!abilitySearchTerm.trim()) return allAbilities;

    const term = abilitySearchTerm.toLowerCase();
    return allAbilities.filter(ability =>
      ability.name.toLowerCase().includes(term) ||
      ability.effect?.toLowerCase().includes(term)
    );
  }, [allAbilities, abilitySearchTerm]);

  // Inventory helpers
  const getItemCount = useCallback((itemName: string): number => {
    return trainerInventory?.items?.[itemName] ?? 0;
  }, [trainerInventory]);

  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError('');
        const userId = currentUser?.discord_id;
        const response = await api.get(`/trainers/user/${userId}`);
        setUserTrainers(response.data.data || response.data.trainers || []);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers.'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, [isAuthenticated, currentUser]);

  // Fetch all abilities on mount
  useEffect(() => {
    const fetchAllAbilities = async () => {
      try {
        const response = await megaMartService.getAllAbilities({ limit: 5000 });
        setAllAbilities(response.data || []);
      } catch (err) {
        console.error('Error fetching abilities:', err);
      }
    };

    fetchAllAbilities();
  }, []);

  // Fetch trainer monsters and inventory when trainer is selected
  useEffect(() => {
    if (!selectedTrainer) {
      setTrainerMonsters([]);
      setTrainerInventory(null);
      setSelectedMonster(null);
      setMonsterAbilities(null);
      return;
    }

    const fetchTrainerData = async () => {
      try {
        setLoading(true);
        setError('');
        setSelectedMonster(null);
        setMonsterAbilities(null);

        const [monstersResponse, inventoryResponse] = await Promise.all([
          api.get(`/monsters/trainer/${selectedTrainer}`),
          api.get(`/trainers/${selectedTrainer}/inventory`)
        ]);

        setTrainerMonsters(monstersResponse.data.monsters || []);
        setTrainerInventory(inventoryResponse.data.data || inventoryResponse.data.inventory || { items: {} });
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainer data.'));
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerData();
  }, [selectedTrainer]);

  // Handle monster selection
  const handleMonsterClick = useCallback(async (monster: Monster) => {
    if (selectedMonster?.id === monster.id) return;
    if (!monster.id) return;

    setSelectedMonster(monster);
    setActionError('');
    setActionSuccess(false);

    try {
      setAbilitiesLoading(true);
      const response = await megaMartService.getMonsterAbilities(monster.id);
      setMonsterAbilities(response.abilities || response.data || null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load monster abilities.'));
    } finally {
      setAbilitiesLoading(false);
    }
  }, [selectedMonster?.id]);

  // Refresh inventory
  const refreshInventory = useCallback(async () => {
    try {
      const inventoryResponse = await api.get(`/trainers/${selectedTrainer}/inventory`);
      setTrainerInventory(inventoryResponse.data.data || inventoryResponse.data.inventory || { items: {} });
    } catch (err) {
      console.error('Error refreshing inventory:', err);
    }
  }, [selectedTrainer]);

  // Handle Ability Capsule
  const handleUseCapsule = useCallback(() => {
    if (!monsterAbilities?.ability1 || !monsterAbilities?.ability2) {
      setActionError('This monster does not have both primary and secondary abilities.');
      return;
    }
    if (getItemCount('Ability Capsule') < 1) {
      setActionError('You do not have any Ability Capsules.');
      return;
    }
    setShowCapsuleModal(true);
    setActionError('');
    setActionSuccess(false);
  }, [monsterAbilities, getItemCount]);

  const confirmUseCapsule = useCallback(async () => {
    if (!selectedMonster) return;

    try {
      setActionLoading(true);
      setActionError('');

      const response = await megaMartService.useAbilityCapsule(
        selectedMonster.id as number,
        parseInt(selectedTrainer)
      );

      setMonsterAbilities(response.abilities || response.data || null);
      setActionSuccess(true);
      await refreshInventory();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to use Ability Capsule.'));
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonster, selectedTrainer, refreshInventory]);

  const closeCapsuleModal = useCallback(() => {
    setShowCapsuleModal(false);
    setActionSuccess(false);
    setActionError('');
  }, []);

  // Handle Scroll of Secrets
  const handleUseScroll = useCallback(() => {
    if (getItemCount('Scroll of Secrets') < 1) {
      setActionError('You do not have any Scrolls of Secrets.');
      return;
    }
    setShowScrollModal(true);
    setSelectedAbility('');
    setSelectedAbilitySlot('ability1');
    setAbilitySearchTerm('');
    setActionError('');
    setActionSuccess(false);
  }, [getItemCount]);

  const confirmUseScroll = useCallback(async () => {
    if (!selectedMonster || !selectedAbility) {
      setActionError('Please select an ability.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');

      const response = await megaMartService.useScrollOfSecrets(
        selectedMonster.id as number,
        parseInt(selectedTrainer),
        selectedAbility,
        selectedAbilitySlot
      );

      setMonsterAbilities(response.abilities || response.data || null);
      setActionSuccess(true);
      await refreshInventory();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to use Scroll of Secrets.'));
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonster, selectedTrainer, selectedAbility, selectedAbilitySlot, refreshInventory]);

  const closeScrollModal = useCallback(() => {
    setShowScrollModal(false);
    setActionSuccess(false);
    setActionError('');
  }, []);

  // Handle trainer change
  const handleTrainerChange = useCallback((id: string | number | null) => {
    setSelectedTrainer(id ? String(id) : '');
  }, []);

  return (
    <div className={`mega-mart ${className}`.trim()}>
      {error && <ErrorMessage message={error} />}

      <div className="form-sections">
        {/* Trainer Selection */}
        <div className="form-group">
          <TrainerAutocomplete
            trainers={userTrainers}
            selectedTrainerId={selectedTrainer || null}
            onSelect={handleTrainerChange}
            label="Select Trainer"
            placeholder="Type to search trainers..."
          />
        </div>

        {selectedTrainer && (
          <>
            {/* Monster Search */}
            <div className="form-group">
              <div className="mega-mart__search">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  className="input"
                  placeholder="Search monsters by name, species, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="button ghost sm" onClick={() => setSearchTerm('')}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="state-container state-container--centered">
                <LoadingSpinner />
                <p className="spinner-message">Loading monsters...</p>
              </div>
            ) : (
              <div className="mega-mart__layout">
                {/* Monster Grid */}
                <div className="mega-mart__monsters" ref={monstersRef}>
                  <div className="data-grid__items data-grid__items--grid data-grid__items--sm data-grid__items--gap-md">
                    {filteredMonsters.length === 0 ? (
                      <div className="empty-state">
                        <i className="fas fa-ghost"></i>
                        <h3>No monsters found</h3>
                        <p>
                          {searchTerm
                            ? `No monsters match "${searchTerm}".`
                            : "This trainer doesn't have any monsters yet."
                          }
                        </p>
                      </div>
                    ) : (
                      filteredMonsters.map(monster => (
                        <Card
                          key={monster.id}
                          onClick={() => handleMonsterClick(monster)}
                          selected={selectedMonster?.id === monster.id}
                          className="mega-mart__monster-card"
                        >
                          <div className="card__image-container">
                            <img
                              src={monster.img_link || '/images/default_mon.png'}
                              alt={monster.name}
                              className="card__image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/default_mon.png';
                              }}
                            />
                          </div>
                          <div className="card__body">
                            <h4 className="card__title">{monster.name}</h4>
                            <p className="card__subtitle">
                              {monster.species1}
                              {monster.species2 && ` + ${monster.species2}`}
                              {monster.species3 && ` + ${monster.species3}`}
                            </p>
                            <div className="badge-group badge-group--sm badge-group--gap-xs badge-group--wrap mt-xs">
                              {monster.type1 && <TypeBadge type={monster.type1} size="xs" />}
                              {monster.type2 && <TypeBadge type={monster.type2} size="xs" />}
                              {monster.type3 && <TypeBadge type={monster.type3} size="xs" />}
                              {monster.type4 && <TypeBadge type={monster.type4} size="xs" />}
                              {monster.type5 && <TypeBadge type={monster.type5} size="xs" />}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Monster Detail / Ability Panel */}
                <div className="mega-mart__detail" ref={detailRef}>
                  {selectedMonster && monsterAbilities ? (
                    <div className="mega-mart__panel">
                      {/* Monster Info */}
                      <div className="mega-mart__monster-info">
                        <h3>{selectedMonster.name}</h3>
                        <div className="badge-group badge-group--md badge-group--gap-xs badge-group--wrap mt-xs">
                          {selectedMonster.species1 && <span className="badge">{selectedMonster.species1}</span>}
                          {selectedMonster.species2 && <span className="badge">{selectedMonster.species2}</span>}
                          {selectedMonster.species3 && <span className="badge">{selectedMonster.species3}</span>}
                        </div>
                        <div className="badge-group badge-group--md badge-group--gap-xs badge-group--wrap mt-xs">
                          {selectedMonster.type1 && <TypeBadge type={selectedMonster.type1} size="md" />}
                          {selectedMonster.type2 && <TypeBadge type={selectedMonster.type2} size="md" />}
                          {selectedMonster.type3 && <TypeBadge type={selectedMonster.type3} size="md" />}
                          {selectedMonster.type4 && <TypeBadge type={selectedMonster.type4} size="md" />}
                          {selectedMonster.type5 && <TypeBadge type={selectedMonster.type5} size="md" />}
                        </div>
                        {selectedMonster.attribute && (
                          <div className="mt-xs">
                            <AttributeBadge attribute={selectedMonster.attribute} size="sm" />
                          </div>
                        )}
                      </div>

                      {/* Ability Cards */}
                      <div className="mega-mart__abilities">
                        <div className="mega-mart__ability-card">
                          <h4>Primary Ability</h4>
                          <p className="mega-mart__ability-name">
                            {monsterAbilities.ability1?.name || 'None'}
                          </p>
                          <p className="mega-mart__ability-effect">
                            {monsterAbilities.ability1?.effect || 'No description available'}
                          </p>
                        </div>

                        <div className="mega-mart__ability-card">
                          <h4>Secondary Ability</h4>
                          <p className="mega-mart__ability-name">
                            {monsterAbilities.ability2?.name || 'None'}
                          </p>
                          <p className="mega-mart__ability-effect">
                            {monsterAbilities.ability2?.effect || 'No description available'}
                          </p>
                        </div>

                        {monsterAbilities.hidden_ability && (
                          <div className="mega-mart__ability-card mega-mart__ability-card--hidden">
                            <h4>Hidden Ability</h4>
                            <p className="mega-mart__ability-name">
                              {monsterAbilities.hidden_ability.name}
                            </p>
                            <p className="mega-mart__ability-effect">
                              {monsterAbilities.hidden_ability.effect}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {actionError && (
                        <div className="alert error mb-sm">
                          <i className="fas fa-exclamation-circle"></i> {actionError}
                        </div>
                      )}

                      <div className="mega-mart__actions">
                        <button
                          className="button primary vertical"
                          onClick={handleUseCapsule}
                          disabled={!monsterAbilities.ability1 || !monsterAbilities.ability2}
                        >
                          <span>Use Ability Capsule</span>
                          <span className="item-button__count">
                            {getItemCount('Ability Capsule')} available
                          </span>
                        </button>

                        <button
                          className="button primary vertical"
                          onClick={handleUseScroll}
                        >
                          <span>Use Scroll of Secrets</span>
                          <span className="item-button__count">
                            {getItemCount('Scroll of Secrets')} available
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : abilitiesLoading ? (
                    <div className="state-container state-container--centered">
                      <LoadingSpinner />
                      <p className="spinner-message">Loading abilities...</p>
                    </div>
                  ) : (
                    <div className="mega-mart__empty">
                      <i className="fas fa-paw"></i>
                      <h3>Select a Monster</h3>
                      <p>Choose a monster from the list to view and modify its abilities</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ability Capsule Modal */}
      <Modal
        isOpen={showCapsuleModal}
        onClose={closeCapsuleModal}
        title={actionSuccess ? 'Ability Capsule Used!' : 'Use Ability Capsule'}
        size="medium"
      >
        {actionSuccess ? (
          <div className="success-display">
            <div className="success-display__icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="success-display__title">Abilities Swapped!</h3>
            <p>The Ability Capsule has been used successfully. Your monster's primary and secondary abilities have been swapped.</p>
            <div className="action-button-group action-button-group--align-center mt-md">
              <button className="button primary no-flex" onClick={closeCapsuleModal}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="mega-mart__capsule-modal">
            <p className="mb-md">
              Using an Ability Capsule will swap your monster's primary and secondary abilities.
              This action cannot be undone.
            </p>

            <div className="mega-mart__swap-preview">
              <div className="mega-mart__swap-ability">
                <span className="text-muted text-sm">Primary</span>
                <strong>{monsterAbilities?.ability1?.name || 'None'}</strong>
              </div>
              <div className="mega-mart__swap-icon">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <div className="mega-mart__swap-ability">
                <span className="text-muted text-sm">Secondary</span>
                <strong>{monsterAbilities?.ability2?.name || 'None'}</strong>
              </div>
            </div>

            {actionError && <ErrorMessage message={actionError} />}

            <div className="action-button-group action-button-group--align-end action-button-group--gap-md mt-md">
              <button className="button secondary no-flex" onClick={closeCapsuleModal}>
                Cancel
              </button>
              <button
                className="button primary no-flex"
                onClick={confirmUseCapsule}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Use Ability Capsule'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Scroll of Secrets Modal */}
      <Modal
        isOpen={showScrollModal}
        onClose={closeScrollModal}
        title={actionSuccess ? 'Scroll of Secrets Used!' : 'Use Scroll of Secrets'}
        size="large"
      >
        {actionSuccess ? (
          <div className="success-display">
            <div className="success-display__icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="success-display__title">Ability Changed!</h3>
            <p>The Scroll of Secrets has been used successfully. Your monster's ability has been changed.</p>
            <div className="action-button-group action-button-group--align-center mt-md">
              <button className="button primary no-flex" onClick={closeScrollModal}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="mega-mart__scroll-modal">
            <p className="mb-md">
              Using a Scroll of Secrets will change one of your monster's abilities to any ability of your choice.
              This action cannot be undone.
            </p>

            {/* Ability Slot Selection */}
            <div className="form-group">
              <label className="form-label">Select ability slot to change:</label>
              <div className="mega-mart__slot-selection">
                <label className="mega-mart__slot-option">
                  <input
                    type="radio"
                    name="abilitySlot"
                    value="ability1"
                    checked={selectedAbilitySlot === 'ability1'}
                    onChange={() => setSelectedAbilitySlot('ability1')}
                  />
                  <span>Primary Ability ({monsterAbilities?.ability1?.name || 'None'})</span>
                </label>
                <label className="mega-mart__slot-option">
                  <input
                    type="radio"
                    name="abilitySlot"
                    value="ability2"
                    checked={selectedAbilitySlot === 'ability2'}
                    onChange={() => setSelectedAbilitySlot('ability2')}
                  />
                  <span>Secondary Ability ({monsterAbilities?.ability2?.name || 'None'})</span>
                </label>
              </div>
            </div>

            {/* Ability Search */}
            <div className="form-group">
              <label className="form-label">Search for an ability:</label>
              <input
                type="text"
                className="input"
                value={abilitySearchTerm}
                onChange={(e) => setAbilitySearchTerm(e.target.value)}
                placeholder="Search by name or effect..."
              />
            </div>

            {/* Ability List */}
            <div className="mega-mart__ability-list">
              {filteredAbilities.length === 0 ? (
                <p className="text-muted text-center">No abilities found matching your search.</p>
              ) : (
                filteredAbilities.map(ability => (
                  <button
                    key={ability.name}
                    className={`mega-mart__ability-option ${selectedAbility === ability.name ? 'selected' : ''}`}
                    onClick={() => setSelectedAbility(ability.name)}
                  >
                    <strong>{ability.name}</strong>
                    <span>{ability.effect}</span>
                  </button>
                ))
              )}
            </div>

            {actionError && <ErrorMessage message={actionError} />}

            <div className="action-button-group action-button-group--align-end action-button-group--gap-md mt-md">
              <button className="button secondary no-flex" onClick={closeScrollModal}>
                Cancel
              </button>
              <button
                className="button primary no-flex"
                onClick={confirmUseScroll}
                disabled={actionLoading || !selectedAbility}
              >
                {actionLoading ? 'Processing...' : 'Use Scroll of Secrets'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MegaMart;
