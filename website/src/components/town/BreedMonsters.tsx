import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import type { Monster } from '../common/MonsterDetails';
import { extractErrorMessage } from '../../utils/errorUtils';
import speciesService from '../../services/speciesService';
import type { SpeciesImageMap } from '../../services/speciesService';
import itemsService from '../../services/itemsService';
import type { Item } from '../../services/itemsService';
import type { TownTrainer } from './types';

const BREEDING_ITEMS = [
  { name: 'Mutagenic Mulch', max: 5, description: 'Increases mutation chance (stacks up to 200%)' },
  { name: 'Teeming Totem', max: 1, description: 'Increases chance of rolling extra monsters' },
  { name: "Hermit's Ward", max: 1, description: 'Decreases likelihood of multiple monsters per roll' }
] as const;

interface BreedMonstersProps {
  onBreedingComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface EligibilityErrors {
  monster1: string;
  monster2: string;
}

interface Offspring {
  species1: string;
  species2?: string;
  species3?: string;
  type1: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  claimed: boolean;
}

interface BreedingResults {
  parent1: Monster;
  parent2: Monster;
  offspring: Offspring[];
  sessionId: string;
  specialBerries: Record<string, number>;
  claimedMonsters: number[];
}

/**
 * BreedMonsters component for breeding two monsters together
 * Allows trainers to select two eligible monsters and breed them to create offspring
 */
export function BreedMonsters({
  onBreedingComplete,
  onCancel,
  className = ''
}: BreedMonstersProps) {
  const { currentUser } = useAuth();

  // Trainer selection state
  const [userTrainer, setUserTrainer] = useState<string | number | null>(null);
  const [anyTrainer, setAnyTrainer] = useState<string | number | null>(null);
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [allTrainers, setAllTrainers] = useState<TownTrainer[]>([]);

  // Monster selection state
  const [userTrainerMonsters, setUserTrainerMonsters] = useState<Monster[]>([]);
  const [anyTrainerMonsters, setAnyTrainerMonsters] = useState<Monster[]>([]);
  const [selectedMonster1, setSelectedMonster1] = useState<Monster | null>(null);
  const [selectedMonster2, setSelectedMonster2] = useState<Monster | null>(null);

  // Eligibility state
  const [eligibleIds1, setEligibleIds1] = useState<Set<number>>(new Set());
  const [eligibleIds2, setEligibleIds2] = useState<Set<number>>(new Set());

  // Legacy Leeway state
  const [legacyLeewayCount, setLegacyLeewayCount] = useState<number>(0);

  // Search state
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');

  // Breeding results state
  const [breedingResults, setBreedingResults] = useState<BreedingResults | null>(null);
  const [offspringSpeciesImages, setOffspringSpeciesImages] = useState<SpeciesImageMap>({});
  const [offspringNames, setOffspringNames] = useState<Record<number, string>>({});
  const [offspringTrainers, setOffspringTrainers] = useState<Record<number, number | string | null>>({});

  // Extra items state
  const [itemsSectionOpen, setItemsSectionOpen] = useState(false);
  const [breedingItemCounts, setBreedingItemCounts] = useState<Record<string, number>>({});
  const [selectedItemAmounts, setSelectedItemAmounts] = useState<Record<string, number>>({});
  const [breedingItemData, setBreedingItemData] = useState<Record<string, Item>>({});

  // Loading and error state
  const [loading, setLoading] = useState(false);
  const [loadingMonsters1, setLoadingMonsters1] = useState(false);
  const [loadingMonsters2, setLoadingMonsters2] = useState(false);
  const [error, setError] = useState('');
  const [eligibilityErrors, setEligibilityErrors] = useState<EligibilityErrors>({
    monster1: '',
    monster2: ''
  });

  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!currentUser?.discord_id) return;

      try {
        setLoading(true);
        const response = await api.get(`/trainers/user/${currentUser.discord_id}`);
        const trainers = response.data.data || response.data.trainers || [];
        setUserTrainers(trainers);
        if (trainers.length > 0) {
          setUserTrainer(trainers[0].id);
        }
      } catch (err) {
        console.error('Error fetching user trainers:', err);
        setError(extractErrorMessage(err, 'Failed to load trainers.'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrainers();
  }, [currentUser?.discord_id]);

  // Fetch all trainers
  useEffect(() => {
    const fetchAllTrainers = async () => {
      try {
        const response = await api.get('/trainers/all');
        const trainers = response.data.data || response.data || [];
        setAllTrainers(Array.isArray(trainers) ? trainers : []);
      } catch (err) {
        console.error('Error fetching all trainers:', err);
      }
    };

    fetchAllTrainers();
  }, []);

  // Fetch eligible monster IDs for a list of monsters
  const fetchEligibleIds = useCallback(async (monsters: Monster[]): Promise<Set<number>> => {
    const ids = monsters.filter(m => m.id != null).map(m => m.id as number);
    if (ids.length === 0) return new Set();

    try {
      const response = await api.post('/town/farm/breed/check-eligibility/batch', { monsterIds: ids });
      if (response.data?.success) {
        return new Set(response.data.eligibleIds as number[]);
      }
    } catch (err) {
      console.error('Error fetching eligible IDs:', err);
    }
    // Fallback: show all if batch check fails
    return new Set(ids);
  }, []);

  // Fetch user trainer monsters and Legacy Leeway count
  useEffect(() => {
    if (!userTrainer) return;

    const fetchMonsters = async () => {
      try {
        setLoadingMonsters1(true);
        const [monstersRes, inventoryRes] = await Promise.all([
          api.get(`/monsters/trainer/${userTrainer}`),
          api.get(`/trainers/${userTrainer}/inventory`)
        ]);
        const monsters: Monster[] = monstersRes.data.monsters || [];
        setUserTrainerMonsters(monsters);

        const inventory = inventoryRes.data?.data || inventoryRes.data?.inventory || inventoryRes.data;
        const items = typeof inventory?.items === 'string' ? JSON.parse(inventory.items) : inventory?.items || {};
        setLegacyLeewayCount(items['Legacy Leeway'] ?? 0);
        setBreedingItemCounts({
          'Mutagenic Mulch': items['Mutagenic Mulch'] ?? 0,
          'Teeming Totem': items['Teeming Totem'] ?? 0,
          "Hermit's Ward": items["Hermit's Ward"] ?? 0
        });

        const eligible = await fetchEligibleIds(monsters);
        setEligibleIds1(eligible);
      } catch (err) {
        console.error('Error fetching monsters:', err);
        setError(extractErrorMessage(err, 'Failed to load monsters.'));
      } finally {
        setLoadingMonsters1(false);
      }
    };

    fetchMonsters();
  }, [userTrainer, fetchEligibleIds]);

  // Fetch any trainer monsters
  useEffect(() => {
    if (!anyTrainer) return;

    const fetchMonsters = async () => {
      try {
        setLoadingMonsters2(true);
        const response = await api.get(`/monsters/trainer/${anyTrainer}`);
        const monsters: Monster[] = response.data.monsters || [];
        setAnyTrainerMonsters(monsters);
        const eligible = await fetchEligibleIds(monsters);
        setEligibleIds2(eligible);
      } catch (err) {
        console.error('Error fetching monsters:', err);
        setError(extractErrorMessage(err, 'Failed to load monsters.'));
      } finally {
        setLoadingMonsters2(false);
      }
    };

    fetchMonsters();
  }, [anyTrainer, fetchEligibleIds]);

  // Fetch breeding item data (images/descriptions)
  useEffect(() => {
    const fetchItemData = async () => {
      try {
        const response = await itemsService.getItems({ category: 'items', limit: 100 });
        const itemMap: Record<string, Item> = {};
        for (const item of response.data) {
          if (BREEDING_ITEMS.some(bi => bi.name === item.name)) {
            itemMap[item.name] = item;
          }
        }
        setBreedingItemData(itemMap);
      } catch (err) {
        console.error('Error fetching breeding item data:', err);
      }
    };
    fetchItemData();
  }, []);

  // Fetch species images when breeding results change
  useEffect(() => {
    if (!breedingResults) return;

    const speciesNames = breedingResults.offspring.flatMap(o =>
      [o.species1, o.species2, o.species3].filter((s): s is string => !!s)
    );
    const unique = [...new Set(speciesNames)];
    if (unique.length === 0) return;

    speciesService.getSpeciesImages(unique).then(setOffspringSpeciesImages).catch(console.error);
  }, [breedingResults]);

  // Filter monsters: must have image, be eligible, and match search
  const filteredMonsters1 = useMemo(() => {
    const eligible = userTrainerMonsters.filter(m =>
      m.img_link?.trim() && m.id != null && eligibleIds1.has(m.id)
    );
    if (!searchTerm1.trim()) return eligible;

    const term = searchTerm1.toLowerCase();
    return eligible.filter(monster =>
      monster.name?.toLowerCase().includes(term) ||
      monster.species1?.toLowerCase().includes(term) ||
      monster.species2?.toLowerCase().includes(term) ||
      monster.species3?.toLowerCase().includes(term)
    );
  }, [userTrainerMonsters, searchTerm1, eligibleIds1]);

  const filteredMonsters2 = useMemo(() => {
    const eligible = anyTrainerMonsters.filter(m =>
      m.img_link?.trim() && m.id != null && eligibleIds2.has(m.id)
    );
    if (!searchTerm2.trim()) return eligible;

    const term = searchTerm2.toLowerCase();
    return eligible.filter(monster =>
      monster.name?.toLowerCase().includes(term) ||
      monster.species1?.toLowerCase().includes(term) ||
      monster.species2?.toLowerCase().includes(term) ||
      monster.species3?.toLowerCase().includes(term)
    );
  }, [anyTrainerMonsters, searchTerm2, eligibleIds2]);

  // Check monster eligibility
  const checkEligibility = useCallback(async (monsterId: number, monsterNumber: 1 | 2): Promise<boolean> => {
    try {
      const response = await api.post('/town/farm/breed/check-eligibility', { monsterId });

      if (response.data?.success) {
        if (response.data.eligible) {
          setEligibilityErrors(prev => ({ ...prev, [`monster${monsterNumber}`]: '' }));
          return true;
        } else {
          setEligibilityErrors(prev => ({
            ...prev,
            [`monster${monsterNumber}`]: response.data.reason || 'Not eligible for breeding'
          }));
          return false;
        }
      }
      return false;
    } catch (err) {
      setEligibilityErrors(prev => ({
        ...prev,
        [`monster${monsterNumber}`]: extractErrorMessage(err, 'Error checking eligibility')
      }));
      return false;
    }
  }, []);

  // Handle monster selection
  const handleMonsterSelect = useCallback(async (monster: Monster, monsterNumber: 1 | 2) => {
    if (monster.id == null) return;
    if (monsterNumber === 1) {
      if (selectedMonster1?.id === monster.id) return;
      setSelectedMonster1(monster);
      await checkEligibility(monster.id, 1);
    } else {
      if (selectedMonster2?.id === monster.id) return;
      setSelectedMonster2(monster);
      await checkEligibility(monster.id, 2);
    }
  }, [selectedMonster1?.id, selectedMonster2?.id, checkEligibility]);

  // Handle breeding
  const handleBreed = useCallback(async () => {
    if (!userTrainer || !selectedMonster1 || !selectedMonster2) {
      setError('Please select both monsters for breeding');
      return;
    }

    if (selectedMonster1.id == null || selectedMonster2.id == null) {
      setError('Selected monsters are missing IDs');
      return;
    }

    if (legacyLeewayCount <= 0) {
      setError('Your trainer does not have a Legacy Leeway item required for breeding.');
      return;
    }

    const [eligible1, eligible2] = await Promise.all([
      checkEligibility(selectedMonster1.id, 1),
      checkEligibility(selectedMonster2.id, 2)
    ]);

    if (!eligible1 || !eligible2) {
      setError('One or both monsters are not eligible for breeding.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const extraItems: Record<string, number> = {};
      for (const [name, amount] of Object.entries(selectedItemAmounts)) {
        if (amount > 0) extraItems[name] = amount;
      }

      const response = await api.post('/town/farm/breed', {
        trainerId: userTrainer,
        parent1Id: selectedMonster1.id,
        parent2Id: selectedMonster2.id,
        ...(Object.keys(extraItems).length > 0 && { extraItems })
      });

      if (response.data?.success) {
        setLegacyLeewayCount(prev => Math.max(0, prev - 1));
        setBreedingItemCounts(prev => {
          const updated = { ...prev };
          for (const [name, amount] of Object.entries(selectedItemAmounts)) {
            if (amount > 0) updated[name] = Math.max(0, (updated[name] ?? 0) - amount);
          }
          return updated;
        });
        setSelectedItemAmounts({});
        setBreedingResults({
          ...response.data.data,
          sessionId: response.data.data.sessionId,
          specialBerries: response.data.data.specialBerries || {},
          offspring: response.data.data.offspring.map((o: Offspring) => ({ ...o, claimed: false })),
          claimedMonsters: response.data.data.claimedMonsters || []
        });
      } else {
        setError(response.data?.message || 'Breeding failed.');
      }
    } catch (err) {
      console.error('Error breeding:', err);
      setError(extractErrorMessage(err, 'Breeding failed.'));
    } finally {
      setLoading(false);
    }
  }, [userTrainer, selectedMonster1, selectedMonster2, checkEligibility, legacyLeewayCount, selectedItemAmounts]);

  // Handle claiming offspring
  const handleClaimOffspring = useCallback(async (index: number) => {
    if (!breedingResults) return;

    const selectedTrainerId = offspringTrainers[index];
    if (!selectedTrainerId) {
      setError('Please select a trainer to claim this monster.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/town/farm/breed/claim', {
        sessionId: breedingResults.sessionId,
        monsterIndex: index,
        name: offspringNames[index] || undefined,
        trainerId: selectedTrainerId
      });

      if (response.data?.success) {
        setBreedingResults(prev => prev ? {
          ...prev,
          offspring: prev.offspring.map((o, i) => i === index ? { ...o, claimed: true } : o),
          specialBerries: response.data.data.specialBerries,
          claimedMonsters: response.data.data.claimedMonsters
        } : null);
      } else {
        setError(response.data?.message || 'Failed to claim monster.');
      }
    } catch (err) {
      console.error('Error claiming:', err);
      setError(extractErrorMessage(err, 'Failed to claim monster.'));
    } finally {
      setLoading(false);
    }
  }, [breedingResults, offspringNames, offspringTrainers]);

  // Handle reroll
  const handleReroll = useCallback(async () => {
    if (!breedingResults) return;

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/town/farm/breed/reroll', {
        sessionId: breedingResults.sessionId
      });

      if (response.data?.success) {
        setOffspringNames({});
        setOffspringTrainers({});
        setBreedingResults(prev => prev ? {
          ...prev,
          offspring: response.data.data.offspring.map((o: Offspring) => ({ ...o, claimed: false })),
          specialBerries: response.data.data.specialBerries,
          claimedMonsters: []
        } : null);
      } else {
        setError(response.data?.message || 'Failed to reroll.');
      }
    } catch (err) {
      console.error('Error rerolling:', err);
      setError(extractErrorMessage(err, 'Failed to reroll.'));
    } finally {
      setLoading(false);
    }
  }, [breedingResults]);

  // Render monster card
  const renderMonsterCard = (monster: Monster, isSelected: boolean, onSelect: () => void, errorMsg?: string) => (
    <Card
      key={monster.id}
      onClick={onSelect}
      selected={isSelected}
      className="breeding-monster-card"
      image={monster.img_link || undefined}
      imageAlt={monster.name}
      imageHeight="120px"
      title={monster.name}
      subtitle={[monster.species1, monster.species2, monster.species3].filter(Boolean).join(' + ')}
    >
      <div className="badge-group badge-group--wrap badge-group--gap-xs badge-group--sm mt-xs">
        {monster.type1 && <TypeBadge type={monster.type1} size="sm" />}
        {monster.type2 && <TypeBadge type={monster.type2} size="sm" />}
        {monster.type3 && <TypeBadge type={monster.type3} size="sm" />}
        {monster.type4 && <TypeBadge type={monster.type4} size="sm" />}
        {monster.type5 && <TypeBadge type={monster.type5} size="sm" />}
      </div>
      {errorMsg && <p className="text-danger text-sm mt-xs">{errorMsg}</p>}
    </Card>
  );

  // Render breeding results
  if (breedingResults) {
    return (
      <div className={`breed-monsters ${className}`.trim()}>
        <h2>Breeding Results</h2>

        <div className="breeding-parents">
          <Card className="breeding-parent">
            <div className="card__body">
              {breedingResults.parent1.img_link && (
                <img src={breedingResults.parent1.img_link} alt={breedingResults.parent1.name} className="breeding-parent-image" />
              )}
              <h4>{breedingResults.parent1.name}</h4>
              <div className="badge-group badge-group--wrap badge-group--gap-xs badge-group--sm mt-xs">
                {breedingResults.parent1.type1 && <TypeBadge type={breedingResults.parent1.type1} size="sm" />}
                {breedingResults.parent1.type2 && <TypeBadge type={breedingResults.parent1.type2} size="sm" />}
                {breedingResults.parent1.type3 && <TypeBadge type={breedingResults.parent1.type3} size="sm" />}
                {breedingResults.parent1.type4 && <TypeBadge type={breedingResults.parent1.type4} size="sm" />}
                {breedingResults.parent1.type5 && <TypeBadge type={breedingResults.parent1.type5} size="sm" />}
              </div>
              <div className="flex justify-center mt-xs">
                {breedingResults.parent1.attribute && <AttributeBadge attribute={breedingResults.parent1.attribute} size="sm" />}
              </div>
            </div>
          </Card>
          <div className="breeding-plus">+</div>
          <Card className="breeding-parent">
            <div className="card__body">
              {breedingResults.parent2.img_link && (
                <img src={breedingResults.parent2.img_link} alt={breedingResults.parent2.name} className="breeding-parent-image" />
              )}
              <h4>{breedingResults.parent2.name}</h4>
              <div className="badge-group badge-group--wrap badge-group--gap-xs badge-group--sm mt-xs">
                {breedingResults.parent2.type1 && <TypeBadge type={breedingResults.parent2.type1} size="sm" />}
                {breedingResults.parent2.type2 && <TypeBadge type={breedingResults.parent2.type2} size="sm" />}
                {breedingResults.parent2.type3 && <TypeBadge type={breedingResults.parent2.type3} size="sm" />}
                {breedingResults.parent2.type4 && <TypeBadge type={breedingResults.parent2.type4} size="sm" />}
                {breedingResults.parent2.type5 && <TypeBadge type={breedingResults.parent2.type5} size="sm" />}
              </div>
              <div className="flex justify-center mt-xs">
                {breedingResults.parent2.attribute && <AttributeBadge attribute={breedingResults.parent2.attribute} size="sm" />}
              </div>
            </div>
          </Card>
        </div>

        {breedingResults.specialBerries?.['Forget-Me-Not'] > 0 && (
          <div className="action-button-group action-button-group--align-center action-button-group--gap-md">
            <button
              className="button special no-flex"
              onClick={handleReroll}
              disabled={loading}
            >
              <i className="fas fa-dice"></i> Reroll Offspring ({breedingResults.specialBerries['Forget-Me-Not']})
            </button>
          </div>
        )}

        <h3>Offspring ({breedingResults.offspring.length})</h3>

        <div className="offspring-grid">
          {breedingResults.offspring.map((offspring, index) => {
            const speciesList = [offspring.species1, offspring.species2, offspring.species3].filter((s): s is string => !!s);
            return (
              <Card key={index} className="offspring-card">
                <div className="card__body">
                  <div className="offspring-species-images">
                    {speciesList.map(species => {
                      const imgUrl = offspringSpeciesImages[species]?.image_url;
                      return imgUrl ? (
                        <img
                          key={species}
                          src={imgUrl}
                          alt={species}
                          className="offspring-species-image"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null;
                    })}
                  </div>
                  <h4>{speciesList.join(' / ')}</h4>
                  <div className="badge-group badge-group--sm mt-xs badge-group--wrap badge-group--gap-sm">
                    {offspring.type1 && <TypeBadge type={offspring.type1} size="sm" />}
                    {offspring.type2 && <TypeBadge type={offspring.type2} size="sm" />}
                    {offspring.type3 && <TypeBadge type={offspring.type3} size="sm" />}
                    {offspring.type4 && <TypeBadge type={offspring.type4} size="sm" />}
                    {offspring.type5 && <TypeBadge type={offspring.type5} size="sm" />}
                  </div>
                  {offspring.attribute && (
                    <div className="mt-xs">
                      <AttributeBadge attribute={offspring.attribute} size="sm" />
                    </div>
                  )}
                  {!offspring.claimed && (
                    <>
                      <div className="form-group form-group--no-padding mt-xs">
                        <input
                          type="text"
                          className="input input--sm"
                          placeholder={speciesList[0] ?? 'Name your monster...'}
                          value={offspringNames[index] ?? ''}
                          onChange={(e) => setOffspringNames(prev => ({ ...prev, [index]: e.target.value }))}
                        />
                      </div>
                      <div className="form-group form-group--no-padding mt-xs">
                        <TrainerAutocomplete
                          trainers={allTrainers}
                          selectedTrainerId={offspringTrainers[index] ?? null}
                          onSelect={(trainerId) => setOffspringTrainers(prev => ({ ...prev, [index]: trainerId }))}
                          label=""
                          placeholder="Select trainer to claim..."
                          noPadding={true}
                        />
                      </div>
                    </>
                  )}
                  <div className="action-button-group action-button-group--align-center action-button-group--gap-sm mt-sm">
                    <button
                      className={`button ${offspring.claimed ? 'secondary' : 'primary'} no-flex`}
                      onClick={() => handleClaimOffspring(index)}
                      disabled={offspring.claimed || loading}
                    >
                      {offspring.claimed ? 'Claimed' : 'Claim'}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="action-button-group action-button-group--align-center action-button-group--gap-md mt-md">
          <button className="button secondary no-flex" onClick={onBreedingComplete}>
            Done
          </button>
        </div>

        {loading && (
          <div className="state-container state-container--centered">
            <LoadingSpinner />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`breed-monsters ${className}`.trim()}>
      <h2>Breed Monsters</h2>

      {error && <ErrorMessage message={error} />}

      <div className="breeding-selection">
        <div className="breeding-column">
          <div className="form-section">
            <h3>Your Trainer</h3>
            <TrainerAutocomplete
              trainers={userTrainers}
              selectedTrainerId={userTrainer}
              onSelect={setUserTrainer}
              label=""
              placeholder="Select your trainer..."
            />
            {userTrainer && (
              <p className={`text-sm mt-xs ${legacyLeewayCount > 0 ? 'text-success' : 'text-danger'}`}>
                <i className="fas fa-scroll"></i> Legacy Leeway: {legacyLeewayCount}
              </p>
            )}
          </div>

          <div className="form-group">
            <input
              type="text"
              className="input"
              placeholder="Search your monsters..."
              value={searchTerm1}
              onChange={(e) => setSearchTerm1(e.target.value)}
            />
          </div>

          <div className="breeding-monster-grid">
            {loadingMonsters1 ? (
              <div className="state-container state-container--centered">
                <LoadingSpinner />
              </div>
            ) : filteredMonsters1.length === 0 ? (
              <div className="empty-state">
                <p>No eligible monsters found</p>
              </div>
            ) : (
              filteredMonsters1.map(monster =>
                renderMonsterCard(
                  monster,
                  selectedMonster1?.id === monster.id,
                  () => handleMonsterSelect(monster, 1),
                  selectedMonster1?.id === monster.id ? eligibilityErrors.monster1 : undefined
                )
              )
            )}
          </div>
        </div>

        <div className="breeding-column">
          <div className="form-section">
            <h3>Partner Trainer</h3>
            <TrainerAutocomplete
              trainers={allTrainers}
              selectedTrainerId={anyTrainer}
              onSelect={setAnyTrainer}
              label=""
              placeholder="Select partner trainer..."
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              className="input"
              placeholder="Search partner monsters..."
              value={searchTerm2}
              onChange={(e) => setSearchTerm2(e.target.value)}
            />
          </div>

          <div className="breeding-monster-grid">
            {!anyTrainer ? (
              <div className="empty-state">
                <p>Select a partner trainer first</p>
              </div>
            ) : loadingMonsters2 ? (
              <div className="state-container state-container--centered">
                <LoadingSpinner />
              </div>
            ) : filteredMonsters2.length === 0 ? (
              <div className="empty-state">
                <p>No eligible monsters found</p>
              </div>
            ) : (
              filteredMonsters2.map(monster =>
                renderMonsterCard(
                  monster,
                  selectedMonster2?.id === monster.id,
                  () => handleMonsterSelect(monster, 2),
                  selectedMonster2?.id === monster.id ? eligibilityErrors.monster2 : undefined
                )
              )
            )}
          </div>
        </div>
      </div>

      <div className="breeding-extra-items-section mt-md">
        <button
          type="button"
          className="button secondary w-full"
          onClick={() => setItemsSectionOpen(prev => !prev)}
        >
          <i className={`fas fa-chevron-${itemsSectionOpen ? 'up' : 'down'}`}></i> Use Extra Items
        </button>
        {itemsSectionOpen && (
          <div className="breeding-extra-items-grid mt-sm">
            {BREEDING_ITEMS.map(item => {
              const owned = breedingItemCounts[item.name] ?? 0;
              const selected = selectedItemAmounts[item.name] ?? 0;
              const itemData = breedingItemData[item.name];
              const maxUsable = Math.min(item.max, owned);
              return (
                <Card key={item.name} className="breeding-item-card">
                  <div className="card__body breeding-item-content">
                    {itemData?.image_url && (
                      <img
                        src={itemData.image_url}
                        alt={item.name}
                        className="breeding-item-icon"
                      />
                    )}
                    <h4 className="text-center">{item.name}</h4>
                    <p className="text-sm text-muted text-center">{item.description}</p>
                    <p className="text-sm mt-xs">
                      Owned: <strong>{owned}</strong>
                    </p>
                    {owned > 0 ? (
                      item.max > 1 ? (
                        <div className="form-group form-group--no-padding mt-xs">
                          <div className="flex align-center gap-xs">
                            <button
                              type="button"
                              className="button secondary small no-flex"
                              disabled={selected <= 0}
                              onClick={() => setSelectedItemAmounts(prev => ({ ...prev, [item.name]: Math.max(0, selected - 1) }))}
                            >-</button>
                            <span className="text-center" style={{ minWidth: '2rem' }}>{selected}</span>
                            <button
                              type="button"
                              className="button secondary small no-flex"
                              disabled={selected >= maxUsable}
                              onClick={() => setSelectedItemAmounts(prev => ({ ...prev, [item.name]: Math.min(maxUsable, selected + 1) }))}
                            >+</button>
                          </div>
                          <p className="text-xs text-muted text-center">Max: {item.max}</p>
                        </div>
                      ) : (
                        <div className="form-group form-group--no-padding mt-xs">
                          <label className="flex align-center gap-xs">
                            <input
                              type="checkbox"
                              checked={selected > 0}
                              onChange={(e) => setSelectedItemAmounts(prev => ({ ...prev, [item.name]: e.target.checked ? 1 : 0 }))}
                            />
                            Use
                          </label>
                        </div>
                      )
                    ) : (
                      <p className="text-sm text-muted mt-xs">None available</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="action-button-group action-button-group--align-center action-button-group--gap-md action-button-group--full-width action-button-group--margin-top mb-md">
        <button
          className="button primary"
          onClick={handleBreed}
          disabled={!userTrainer || !selectedMonster1 || !selectedMonster2 || loading || legacyLeewayCount <= 0}
        >
          <i className="fas fa-egg"></i> Breed Monsters
        </button>
        {onCancel && (
          <button className="button secondary" onClick={onCancel}>
            <i className="fas fa-times"></i> Cancel
          </button>
        )}
      </div>

      {loading && (
        <div className="state-container state-container--centered">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}

export default BreedMonsters;
