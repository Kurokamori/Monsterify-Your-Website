import { useState } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { MonsterAutocomplete } from '../common/MonsterAutocomplete';
import { ErrorMessage } from '../common/ErrorMessage';
import { LoadingSpinner } from '../common/LoadingSpinner';
import submissionService from '../../services/submissionService';
import monsterService from '../../services/monsterService';
import trainerService from '../../services/trainerService';

interface Trainer {
  id: string | number;
  name: string;
  is_owned?: boolean;
}

interface Monster {
  id: string | number;
  name: string;
  trainer_id?: string | number;
}

interface AllocationRecord {
  recipientType: 'trainer' | 'monster';
  recipientId: number;
  recipientName: string;
  levels: number;
  coins: number;
}

interface ExternalLevelAllocatorProps {
  submissionId: number;
  totalLevels: number;
  totalCoins: number;
  onAllocationComplete?: () => void;
}

export function ExternalLevelAllocator({
  submissionId,
  totalLevels,
  totalCoins,
  onAllocationComplete,
}: ExternalLevelAllocatorProps) {
  const [recipientType, setRecipientType] = useState<'trainer' | 'monster'>('trainer');
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | number | null>(null);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | number | null>(null);
  const [monsterTrainerId, setMonsterTrainerId] = useState<string | number | null>(null);
  const [levels, setLevels] = useState(1);
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [remainingLevels, setRemainingLevels] = useState(totalLevels);
  const [remainingCoins, setRemainingCoins] = useState(totalCoins);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [trainersLoaded, setTrainersLoaded] = useState(false);

  const loadTrainers = async () => {
    if (trainersLoaded) return;
    try {
      const response = await trainerService.getUserTrainers();
      setTrainers(response.trainers || []);
      setTrainersLoaded(true);
    } catch (err) {
      console.error('Error loading trainers:', err);
    }
  };

  const handleMonsterTrainerSelection = async (trainerId: string | number | null) => {
    setMonsterTrainerId(trainerId);
    setSelectedMonsterId(null);
    setMonsters([]);

    if (!trainerId) return;

    try {
      const response = await monsterService.getTrainerMonsters(trainerId);
      setMonsters(response.monsters || []);
    } catch (err) {
      console.error('Error fetching trainer monsters:', err);
      setMonsters([]);
    }
  };

  const handleAllocate = async () => {
    const recipientId = recipientType === 'trainer' ? selectedTrainerId : selectedMonsterId;
    if (!recipientId || levels <= 0 || levels > remainingLevels) return;

    setLoading(true);
    setError(null);

    try {
      await submissionService.allocateExternalLevels(submissionId, recipientType, recipientId, levels);

      const coinsAllocated = levels * 50;
      const recipientName = recipientType === 'trainer'
        ? trainers.find(t => t.id === recipientId)?.name || `Trainer #${recipientId}`
        : monsters.find(m => m.id === recipientId)?.name || `Monster #${recipientId}`;

      setAllocations([...allocations, {
        recipientType,
        recipientId: Number(recipientId),
        recipientName,
        levels,
        coins: coinsAllocated,
      }]);

      setRemainingLevels(prev => prev - levels);
      setRemainingCoins(prev => prev - coinsAllocated);
      setLevels(1);
      setSelectedTrainerId(null);
      setSelectedMonsterId(null);
      setMonsterTrainerId(null);

      if (remainingLevels - levels <= 0 && onAllocationComplete) {
        onAllocationComplete();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to allocate levels';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (remainingLevels <= 0) {
    return (
      <div className="external-allocator">
        <div className="allocator-complete">
          <i className="fas fa-check-circle"></i>
          <h4>All levels allocated!</h4>
          <p>You have successfully allocated all {totalLevels} levels from this submission.</p>
        </div>
        {allocations.length > 0 && (
          <AllocationHistory allocations={allocations} />
        )}
      </div>
    );
  }

  return (
    <div className="external-allocator">
      <div className="allocator-header">
        <h4>Allocate Levels</h4>
        <p className="form-tooltip--section">
          Assign your earned levels to your trainers or monsters. Each level allocated also awards 50 coins to the trainer.
        </p>
        <div className="allocator-remaining">
          <span className="remaining-badge">
            <i className="fas fa-star"></i> {remainingLevels} levels remaining
          </span>
          <span className="remaining-badge">
            <i className="fas fa-coins"></i> {remainingCoins} coins remaining
          </span>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="allocator-form">
        <div className="flex flex-col w-full mb-sm">
          <label className="w-full">Recipient Type:</label>
          <div className="type-tags">
            <button
              type="button"
              className={`button tab ${recipientType === 'trainer' ? 'active' : ''}`}
              onClick={() => { setRecipientType('trainer'); loadTrainers(); }}
            >
              <i className="fas fa-user"></i> Trainer
            </button>
            <button
              type="button"
              className={`button tab ${recipientType === 'monster' ? 'active' : ''}`}
              onClick={() => { setRecipientType('monster'); loadTrainers(); }}
            >
              <i className="fas fa-dragon"></i> Monster
            </button>
          </div>
        </div>

        {recipientType === 'trainer' && (
          <div className="flex w-full mb-sm">
            <TrainerAutocomplete
              trainers={trainers}
              selectedTrainerId={selectedTrainerId}
              onSelect={(id) => setSelectedTrainerId(id)}
              label="Select Trainer"
              placeholder="Type to search trainers..."
              showOwnership={true}
              noPadding={true}
            />
          </div>
        )}

        {recipientType === 'monster' && (
          <>
            <div className="flex w-full mb-sm">
              <TrainerAutocomplete
                trainers={trainers}
                selectedTrainerId={monsterTrainerId}
                onSelect={(id) => handleMonsterTrainerSelection(id)}
                label="Select Trainer First"
                placeholder="Type to search trainers..."
                showOwnership={true}
                noPadding={true}
              />
            </div>
            {monsterTrainerId && (
              <div className="flex w-full mb-sm">
                <MonsterAutocomplete
                  monsters={monsters}
                  selectedMonsterId={selectedMonsterId}
                  onSelect={(id) => setSelectedMonsterId(id)}
                  label="Select Monster"
                  placeholder="Type to search monsters..."
                  noPadding={true}
                />
              </div>
            )}
          </>
        )}

        <div className="flex flex-col w-full mb-sm">
          <label className="w-full">Levels to Allocate:</label>
          <input
            type="number"
            min="1"
            max={remainingLevels}
            value={levels || ''}
            onChange={(e) => {
              const parsed = parseInt(e.target.value);
              setLevels(isNaN(parsed) ? 0 : Math.min(parsed, remainingLevels));
            }}
            onBlur={() => {
              if (!levels || levels < 1) setLevels(1);
            }}
            className="input"
          />
          <p className="form-tooltip">
            This will award {levels} level{levels !== 1 ? 's' : ''} and {levels * 50} coins.
          </p>
        </div>

        <button
          type="button"
          className="button primary"
          onClick={handleAllocate}
          disabled={loading || !((recipientType === 'trainer' && selectedTrainerId) || (recipientType === 'monster' && selectedMonsterId)) || levels <= 0}
        >
          {loading ? <LoadingSpinner /> : 'Allocate Levels'}
        </button>
      </div>

      {allocations.length > 0 && (
        <AllocationHistory allocations={allocations} />
      )}
    </div>
  );
}

function AllocationHistory({ allocations }: { allocations: AllocationRecord[] }) {
  return (
    <div className="allocation-history">
      <h4>Allocation History</h4>
      <div className="allocation-list">
        {allocations.map((alloc, index) => (
          <div key={index} className="allocation-record">
            <i className={`fas ${alloc.recipientType === 'trainer' ? 'fa-user' : 'fa-dragon'}`}></i>
            <span className="allocation-name">{alloc.recipientName}</span>
            <span className="allocation-levels">+{alloc.levels} levels</span>
            <span className="allocation-coins">+{alloc.coins} coins</span>
          </div>
        ))}
      </div>
    </div>
  );
}
