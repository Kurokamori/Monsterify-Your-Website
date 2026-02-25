import { useState, useEffect, useCallback } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { MonsterAutocomplete } from '../common/MonsterAutocomplete';
import monsterService from '../../services/monsterService';
import api from '../../services/api';

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

interface SelectedTrainer {
  trainerId: string | number;
  name: string;
  isOwned: boolean;
  isGift: boolean;
}

interface SelectedMonster {
  monsterId: string | number;
  name: string;
  trainerId: string | number;
  trainerName: string;
  isGift: boolean;
}

interface SelectedNPC {
  id: string | number;
  name: string;
}

export interface WritingCalculatorValues {
  wordCount: number;
  trainers: SelectedTrainer[];
  monsters: SelectedMonster[];
  npcs: SelectedNPC[];
}

interface WritingSubmissionCalculatorProps {
  onCalculate: (values: WritingCalculatorValues) => void;
  initialValues?: Partial<WritingCalculatorValues>;
  trainers?: Trainer[];
  monsters?: Monster[];
  content?: string;
  inputMethod?: 'direct' | 'file' | 'url';
}

export function WritingSubmissionCalculator({
  onCalculate,
  initialValues = {},
  trainers = [],
  content = '',
  inputMethod = 'direct'
}: WritingSubmissionCalculatorProps) {
  // Form state
  const [wordCount, setWordCount] = useState(initialValues.wordCount || 0);
  const [selectedTrainers, setSelectedTrainers] = useState<SelectedTrainer[]>(initialValues.trainers || []);
  const [selectedMonsters, setSelectedMonsters] = useState<SelectedMonster[]>(initialValues.monsters || []);
  const [selectedNPCs, setSelectedNPCs] = useState<SelectedNPC[]>(initialValues.npcs || []);
  const [autoCountWords, setAutoCountWords] = useState(true);

  // UI state for adding trainers/monsters/NPCs
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddMonster, setShowAddMonster] = useState(false);
  const [showAddNPC, setShowAddNPC] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | number | null>(null);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | number | null>(null);
  const [monsterTrainerId, setMonsterTrainerId] = useState<string | number | null>(null);
  const [availableMonsters, setAvailableMonsters] = useState<Monster[]>([]);

  // NPC state
  const [npcName, setNpcName] = useState('');

  // Self-fetch trainers when none provided
  const [fetchedTrainers, setFetchedTrainers] = useState<Trainer[]>([]);
  useEffect(() => {
    if (!trainers || trainers.length === 0) {
      api.get('/trainers/all')
        .then(response => {
          const data = response.data?.trainers || response.data || [];
          setFetchedTrainers(Array.isArray(data) ? data : []);
        })
        .catch(() => setFetchedTrainers([]));
    }
  }, [trainers]);
  const resolvedTrainers = trainers?.length ? trainers : fetchedTrainers;

  // Add trainer to selected trainers
  const handleAddTrainer = () => {
    if (!selectedTrainerId) return;

    if (selectedTrainers.some(t => t.trainerId === selectedTrainerId)) {
      alert('This trainer is already added to the submission.');
      return;
    }

    const trainer = resolvedTrainers.find(t => t.id === selectedTrainerId);
    if (trainer) {
      const newTrainer: SelectedTrainer = {
        trainerId: selectedTrainerId,
        name: trainer.name,
        isOwned: trainer.is_owned || false,
        isGift: false
      };

      setSelectedTrainers([...selectedTrainers, newTrainer]);
      setSelectedTrainerId(null);
      setShowAddTrainer(false);
    }
  };

  // Add monster to selected monsters
  const handleAddMonster = () => {
    if (!selectedMonsterId || !monsterTrainerId) return;

    const monster = availableMonsters.find(m => m.id === selectedMonsterId);
    if (!monster) return;

    const trainer = resolvedTrainers.find(t => t.id === monsterTrainerId);
    const trainerName = trainer ? trainer.name : 'Unknown Trainer';

    const newMonster: SelectedMonster = {
      monsterId: monster.id,
      name: monster.name,
      trainerId: monsterTrainerId,
      trainerName,
      isGift: false
    };

    setSelectedMonsters([...selectedMonsters, newMonster]);
    setSelectedMonsterId(null);
    setMonsterTrainerId(null);
    setAvailableMonsters([]);
    setShowAddMonster(false);
  };

  // Remove trainer from selected trainers
  const handleRemoveTrainer = (trainerId: string | number) => {
    setSelectedTrainers(selectedTrainers.filter(t => t.trainerId !== trainerId));
  };

  // Remove monster from selected monsters
  const handleRemoveMonster = (monsterId: string | number) => {
    setSelectedMonsters(selectedMonsters.filter(m => m.monsterId !== monsterId));
  };

  // Add NPC
  const handleAddNPC = () => {
    const newNPC: SelectedNPC = {
      id: Date.now(),
      name: npcName || `NPC ${selectedNPCs.length + 1}`,
    };

    setSelectedNPCs([...selectedNPCs, newNPC]);
    setNpcName('');
    setShowAddNPC(false);
  };

  // Remove NPC
  const handleRemoveNPC = (npcId: string | number) => {
    setSelectedNPCs(selectedNPCs.filter(npc => npc.id !== npcId));
  };

  // Fetch monsters for selected trainer
  const handleTrainerSelection = async (trainerId: string | number | null) => {
    setMonsterTrainerId(trainerId);
    setSelectedMonsterId(null);
    setAvailableMonsters([]);

    if (!trainerId) return;

    try {
      const response = await monsterService.getTrainerMonsters(trainerId);
      setAvailableMonsters(response.monsters || []);
    } catch (error) {
      console.error('Error fetching trainer monsters:', error);
      setAvailableMonsters([]);
    }
  };

  // Build current calculator values
  const buildValues = useCallback((): WritingCalculatorValues => {
    return {
      wordCount,
      trainers: Array.isArray(selectedTrainers) ? selectedTrainers : [],
      monsters: Array.isArray(selectedMonsters) ? selectedMonsters : [],
      npcs: Array.isArray(selectedNPCs) ? selectedNPCs : []
    };
  }, [selectedTrainers, selectedMonsters, selectedNPCs, wordCount]);

  // Auto-sync calculator values to parent whenever selections change
  useEffect(() => {
    onCalculate(buildValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrainers, selectedMonsters, selectedNPCs, wordCount]);

  // Handle calculate button click - sends current values to parent
  const handleCalculate = () => {
    onCalculate(buildValues());
  };

  // Function to count words in text
  const countWords = (text: string): number => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Auto-count words when content changes (only for direct input)
  useEffect(() => {
    if (autoCountWords && inputMethod === 'direct' && content) {
      const newWordCount = countWords(content);
      if (newWordCount !== wordCount) {
        setWordCount(newWordCount);
      }
    }
  }, [content, autoCountWords, inputMethod, wordCount]);

  // Calculate estimated levels based on word count
  const estimatedLevels = Math.floor(wordCount / 50);
  const totalParticipants = selectedTrainers.length + selectedMonsters.length + selectedNPCs.length;
  const levelsPerParticipant = totalParticipants > 0 ? Math.floor(estimatedLevels / totalParticipants) : estimatedLevels;
  const npcGiftLevels = selectedNPCs.length * levelsPerParticipant;

  return (
    <div className="art-calculator">
      <div className="calculator-section">
        <h4>Word Count</h4>
        <p className="form-tooltip--section">Every 50 words equals 1 level. Word count auto-updates from direct input, or enter manually for files/URLs.</p>
        <div className="form-group">
          <label htmlFor="word-count">Word Count (50 words = 1 level)</label>
          <div className="word-count-controls">
            <input
              id="word-count"
              type="number"
              min="0"
              value={wordCount || ''}
              onChange={(e) => {
                const parsed = parseInt(e.target.value);
                setWordCount(isNaN(parsed) ? 0 : parsed);
              }}
              onBlur={() => {
                if (wordCount < 0) setWordCount(0);
              }}
              className="form-input"
              disabled={autoCountWords && inputMethod === 'direct'}
            />
            {inputMethod === 'direct' && (
              <div>
                <input
                  id="auto-count"
                  type="checkbox"
                  checked={autoCountWords}
                  onChange={(e) => setAutoCountWords(e.target.checked)}
                />
                <label className="flex items-center" htmlFor="auto-count">Auto-count from content</label>
              </div>
            )}
          </div>
          <div className="word-count-info">
            {autoCountWords && inputMethod === 'direct' && (
              <span className="auto-count-notice">Word count automatically calculated from content</span>
            )}
            <span>Estimated Total Levels: {estimatedLevels}</span>
            {totalParticipants > 0 && (
              <span>Levels per Participant: ~{levelsPerParticipant}</span>
            )}
          </div>
        </div>
      </div>

      <div className="calculator-section">
        <div className="section-header">
          <h4>Trainers ({selectedTrainers.length})</h4>
          <button
            type="button"
            onClick={() => setShowAddTrainer(!showAddTrainer)}
            className="button secondary ml-lg"
          >
            {showAddTrainer ? 'Cancel' : 'Add Trainer'}
          </button>
        </div>
        <p className="form-tooltip--section">Add trainers featured in the story. Levels are split evenly among all participants.</p>

        <div className="selected-entities">
          {selectedTrainers.map((trainer, index) => (
            <div key={index} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{trainer.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTrainer(trainer.trainerId)}
                  className="button danger no-flex"
                >
                  &times;
                </button>
              </div>
              <div className="entity-details">
                <span>
                  {trainer.isOwned ? 'Your Trainer' : 'Other Trainer'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {showAddTrainer && (
          <div className="add-entity-form">
            <div className="flex w-full mb-sm">
              <TrainerAutocomplete
                trainers={trainers?.length ? trainers : undefined}
                selectedTrainerId={selectedTrainerId}
                onSelect={(id) => setSelectedTrainerId(id)}
                label="Select Trainer"
                placeholder="Type to search trainers..."
                showOwnership={true}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleAddTrainer} className="button primary">
                Add Trainer
              </button>
              <button type="button" onClick={() => setShowAddTrainer(false)} className="button secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="calculator-section">
        <div className="section-header">
          <h4>Monsters ({selectedMonsters.length})</h4>
          <button
            type="button"
            onClick={() => setShowAddMonster(!showAddMonster)}
            className="button secondary ml-lg"
          >
            {showAddMonster ? 'Cancel' : 'Add Monster'}
          </button>
        </div>
        <p className="form-tooltip--section">Add monsters featured in the story. Select the monster's trainer first, then choose the monster.</p>

        <div className="selected-entities">
          {selectedMonsters.map((monster, index) => (
            <div key={index} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{monster.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMonster(monster.monsterId)}
                  className="button danger no-flex"
                >
                  &times;
                </button>
              </div>
              <div className="entity-details">
                <span>
                  Trainer: {monster.trainerName}
                </span>
              </div>
            </div>
          ))}
        </div>

        {showAddMonster && (
          <div className="add-entity-form">
            <div className="flex w-full mb-sm">
              <TrainerAutocomplete
                trainers={trainers?.length ? trainers : undefined}
                selectedTrainerId={monsterTrainerId}
                onSelect={(id) => handleTrainerSelection(id)}
                label="Select Trainer First"
                placeholder="Type to search trainers..."
                showOwnership={true}
              />
            </div>

            {monsterTrainerId && (
              <div className="flex w-full mb-sm">
                <MonsterAutocomplete
                  monsters={availableMonsters}
                  selectedMonsterId={selectedMonsterId}
                  onSelect={(id) => setSelectedMonsterId(id)}
                  label="Select Monster"
                  placeholder="Type to search monsters..."
                />
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={handleAddMonster}
                className="button primary"
                disabled={!selectedMonsterId || !monsterTrainerId}
              >
                Add Monster
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMonster(false);
                  setMonsterTrainerId(null);
                  setSelectedMonsterId(null);
                  setAvailableMonsters([]);
                }}
                className="button secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="calculator-section">
        <h4>Non-Player Characters (NPCs)</h4>
        <p className="form-tooltip--section">Add NPCs who appear in your writing. NPCs count as participants in the level split, and their share becomes gift levels.</p>
        <div className="selected-entities">
          {selectedNPCs.map((npc) => (
            <div key={npc.id} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{npc.name}</span>
                <button
                  type="button"
                  className="button icon danger no-flex"
                  onClick={() => handleRemoveNPC(npc.id)}
                >
                  &times;
                </button>
              </div>
              {totalParticipants > 0 && (
                <div className="entity-details">
                  <span>Gift Levels: ~{levelsPerParticipant}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {showAddNPC ? (
          <div className="add-entity-form">
            <h4>Add NPC</h4>
            <div className="flex w-full mb-sm">
              <label className="w-full">
                Name (optional):
                <input
                  type="text"
                  value={npcName}
                  onChange={(e) => setNpcName(e.target.value)}
                  placeholder="NPC name for tracking"
                  className="form-input"
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setShowAddNPC(false);
                  setNpcName('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleAddNPC}
              >
                Add NPC
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button secondary"
            onClick={() => setShowAddNPC(true)}
          >
            + Add NPC
          </button>
        )}

        {selectedNPCs.length > 0 && (
          <div className="npc-summary">
            <p>Total NPC Gift Levels: ~{npcGiftLevels}</p>
          </div>
        )}
      </div>

      <div className="calculator-actions">
        <button type="button" onClick={handleCalculate} className="button secondary mb-md">
          Calculate Rewards
        </button>
      </div>
    </div>
  );
}
