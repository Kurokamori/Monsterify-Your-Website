import React, { useState, useEffect } from 'react';
import TrainerAutocomplete from '../common/TrainerAutocomplete';
import MonsterAutocomplete from '../common/MonsterAutocomplete';


/**
 * Writing Submission Calculator Component
 * Calculates rewards for writing submissions based on word count and participants
 */
const WritingSubmissionCalculator = ({
  onCalculate,
  initialValues = {},
  trainers = [],
  monsters = [],
  content = '',
  inputMethod = 'direct'
}) => {
  // Form state
  const [wordCount, setWordCount] = useState(initialValues.wordCount || 0);
  const [selectedTrainers, setSelectedTrainers] = useState(initialValues.trainers || []);
  const [selectedMonsters, setSelectedMonsters] = useState(initialValues.monsters || []);
  const [selectedNPCs, setSelectedNPCs] = useState(initialValues.npcs || []);
  const [giftParticipants, setGiftParticipants] = useState(initialValues.giftParticipants || []);
  const [autoCountWords, setAutoCountWords] = useState(true);

  // UI state for adding trainers/monsters/NPCs
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddMonster, setShowAddMonster] = useState(false);
  const [showAddNPC, setShowAddNPC] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [selectedMonsterId, setSelectedMonsterId] = useState('');
  const [monsterTrainerId, setMonsterTrainerId] = useState('');
  const [availableMonsters, setAvailableMonsters] = useState([]);

  // NPC state
  const [npcName, setNpcName] = useState('');
  const [npcWordCount, setNpcWordCount] = useState(50);

  // Add trainer to selected trainers
  const handleAddTrainer = () => {
    if (!selectedTrainerId) return;

    // Check if trainer is already added
    if (selectedTrainers.some(t => t.trainerId === parseInt(selectedTrainerId))) {
      alert('This trainer is already added to the submission.');
      return;
    }

    // Add new trainer
    const trainer = trainers.find(t => t.id === parseInt(selectedTrainerId));
    if (trainer) {
      const newTrainer = {
        trainerId: parseInt(selectedTrainerId),
        name: trainer.name,
        isOwned: trainer.is_owned,
        isGift: false // Gift detection is automatic based on isOwned
      };

      setSelectedTrainers([...selectedTrainers, newTrainer]);

      // Reset form
      setSelectedTrainerId('');
      setShowAddTrainer(false);
    }
  };

  // Add monster to selected monsters
  const handleAddMonster = () => {
    if (!selectedMonsterId || !monsterTrainerId) return;

    const monster = availableMonsters.find(m => m.id === parseInt(selectedMonsterId));
    if (!monster) return;

    const trainer = trainers.find(t => t.id === parseInt(monsterTrainerId));
    const trainerName = trainer ? trainer.name : 'Unknown Trainer';

    const newMonster = {
      monsterId: monster.id, // Use real database ID
      name: monster.name,
      trainerId: parseInt(monsterTrainerId),
      trainerName,
      isGift: false // Gift detection is automatic based on trainer ownership
    };

    setSelectedMonsters([...selectedMonsters, newMonster]);

    // Reset form
    setSelectedMonsterId('');
    setMonsterTrainerId('');
    setAvailableMonsters([]);
    setShowAddMonster(false);
  };

  // Remove trainer from selected trainers
  const handleRemoveTrainer = (trainerId) => {
    const updatedTrainers = selectedTrainers.filter(t => t.trainerId !== trainerId);
    setSelectedTrainers(updatedTrainers);
  };

  // Remove monster from selected monsters
  const handleRemoveMonster = (monsterId) => {
    const updatedMonsters = selectedMonsters.filter(m => m.monsterId !== monsterId);
    setSelectedMonsters(updatedMonsters);
  };

  // Add NPC
  const handleAddNPC = () => {
    if (!npcWordCount || npcWordCount < 1) {
      alert('Please enter a valid word count for the NPC.');
      return;
    }

    const newNPC = {
      id: Date.now(), // Temporary ID for UI
      name: npcName || `NPC ${selectedNPCs.length + 1}`,
      wordCount: parseInt(npcWordCount),
      levels: Math.floor(parseInt(npcWordCount) / 50) // 50 words = 1 level
    };

    setSelectedNPCs([...selectedNPCs, newNPC]);

    // Reset form
    setNpcName('');
    setNpcWordCount(50);
    setShowAddNPC(false);
  };

  // Remove NPC
  const handleRemoveNPC = (npcId) => {
    setSelectedNPCs(selectedNPCs.filter(npc => npc.id !== npcId));
  };

  // Fetch monsters for selected trainer
  const handleTrainerSelection = async (trainerId) => {
    setMonsterTrainerId(trainerId);
    setSelectedMonsterId('');
    setAvailableMonsters([]);

    if (!trainerId) return;

    try {
      // Import monsterService to get ALL trainer monsters (non-paginated)
      const { default: monsterService } = await import('../../services/monsterService');
      const response = await monsterService.getTrainerMonsters(trainerId);
      console.log(`Fetched ${response.monsters?.length || 0} monsters for trainer ${trainerId}`);
      setAvailableMonsters(response.monsters || []);
    } catch (error) {
      console.error('Error fetching trainer monsters:', error);
      setAvailableMonsters([]);
    }
  };

  // Helper function to notify parent of data changes
  const notifyParent = () => {
    if (onCalculate) {
      // Ensure trainers, monsters, and NPCs are valid arrays
      const validTrainers = Array.isArray(selectedTrainers) ? selectedTrainers : [];
      const validMonsters = Array.isArray(selectedMonsters) ? selectedMonsters : [];
      const validNPCs = Array.isArray(selectedNPCs) ? selectedNPCs : [];

      // Create the data object to send to the parent component
      const dataToSend = {
        wordCount,
        trainers: validTrainers,
        monsters: validMonsters,
        npcs: validNPCs
      };

      // Make sure trainers and monsters arrays are properly initialized
      onCalculate(dataToSend);
    }
  };

  // Handle calculate button click
  const handleCalculate = () => {
    notifyParent();
  };

  // Function to count words in text
  const countWords = (text) => {
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
  }, [content, autoCountWords, inputMethod]);

  // Notify parent whenever trainers, monsters, NPCs, or word count changes
  useEffect(() => {
    notifyParent();
  }, [selectedTrainers, selectedMonsters, selectedNPCs, wordCount]);

  // Calculate estimated levels based on word count
  const estimatedLevels = Math.floor(wordCount / 50);
  const npcGiftLevels = selectedNPCs.reduce((total, npc) => total + npc.levels, 0);
  const totalParticipants = selectedTrainers.length + selectedMonsters.length;
  const levelsPerParticipant = totalParticipants > 0 ? Math.floor(estimatedLevels / totalParticipants) : estimatedLevels;

  return (
    <div className="art-calculator">
      <div className="calculator-section">
        <h4>Word Count</h4>
        <div className="form-group">
          <label htmlFor="word-count">Word Count (50 words = 1 level)</label>
          <div className="word-count-controls">
            <input
              id="word-count"
              type="number"
              min="0"
              value={wordCount}
              onChange={(e) => setWordCount(parseInt(e.target.value) || 0)}
              className="word-count-input"
              disabled={autoCountWords && inputMethod === 'direct'}
            />
            {inputMethod === 'direct' && (
              <div className="checkbox-container">
                <input
                  id="auto-count"
                  type="checkbox"
                  checked={autoCountWords}
                  onChange={(e) => setAutoCountWords(e.target.checked)}
                />
                <label htmlFor="auto-count">Auto-count from content</label>
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

      {/* Trainers Section */}
      <div className="calculator-section">
        <div className="section-header">
          <h4>Trainers ({selectedTrainers.length})</h4>
          <button
            type="button"
            onClick={() => setShowAddTrainer(!showAddTrainer)}
            className="add-entity-button"
          >
            {showAddTrainer ? 'Cancel' : 'Add Trainer'}
          </button>
        </div>

        <div className="selected-entities">
          {selectedTrainers.map((trainer, index) => (
            <div key={index} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{trainer.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTrainer(trainer.trainerId)}
                  className="remove-entity"
                >
                  &times;
                </button>
              </div>
              <div className="entity-details">
                <span className="trainer-label">
                  {trainer.isOwned ? 'Your Trainer' : 'Other Trainer'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {showAddTrainer && (
          <div className="add-entity-form">
            <div className="form-row">
              <TrainerAutocomplete
                trainers={trainers}
                selectedTrainerId={selectedTrainerId}
                onSelect={(id) => setSelectedTrainerId(id)}
                label="Select Trainer"
                placeholder="Type to search trainers..."
                showOwnership={true}
                className="entity-select"
                required
              />
            </div>



            <div className="form-actions">
              <button type="button" onClick={handleAddTrainer} className="add-button">
                Add Trainer
              </button>
              <button type="button" onClick={() => setShowAddTrainer(false)} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Monsters Section */}
      <div className="calculator-section">
        <div className="section-header">
          <h4>Monsters ({selectedMonsters.length})</h4>
          <button
            type="button"
            onClick={() => setShowAddMonster(!showAddMonster)}
            className="add-entity-button"
          >
            {showAddMonster ? 'Cancel' : 'Add Monster'}
          </button>
        </div>

        <div className="selected-entities">
          {selectedMonsters.map((monster, index) => (
            <div key={index} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{monster.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMonster(monster.monsterId)}
                  className="remove-entity"
                >
                  &times;
                </button>
              </div>
              <div className="entity-details">
                <span className="trainer-label">
                  Trainer: {monster.trainerName}
                </span>
              </div>
            </div>
          ))}
        </div>

        {showAddMonster && (
          <div className="add-entity-form">
            <div className="form-row">
              <TrainerAutocomplete
                trainers={trainers}
                selectedTrainerId={monsterTrainerId}
                onSelect={(id) => handleTrainerSelection(id)}
                label="Select Trainer First"
                placeholder="Type to search trainers..."
                showOwnership={true}
                className="entity-select"
                required
              />
            </div>

            {monsterTrainerId && (
              <div className="form-row">
                <MonsterAutocomplete
                  monsters={availableMonsters}
                  selectedMonsterId={selectedMonsterId}
                  onSelect={(id) => setSelectedMonsterId(id)}
                  label="Select Monster"
                  placeholder="Type to search monsters..."
                  className="entity-select"
                  required
                />
              </div>
            )}



            <div className="form-actions">
              <button
                type="button"
                onClick={handleAddMonster}
                className="add-button"
                disabled={!selectedMonsterId || !monsterTrainerId}
              >
                Add Monster
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMonster(false);
                  setMonsterTrainerId('');
                  setSelectedMonsterId('');
                  setAvailableMonsters([]);
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NPCs Section */}
      <div className="calculator-section">
        <h3>Non-Player Characters (NPCs)</h3>
        <div className="selected-entities">
          {selectedNPCs.map((npc) => (
            <div key={npc.id} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{npc.name}</span>
                <button
                  type="button"
                  className="remove-entity"
                  onClick={() => handleRemoveNPC(npc.id)}
                >
                  &times;
                </button>
              </div>
              <div className="entity-details">
                <span>Word Count: {npc.wordCount}</span>
                <span>Gift Levels: {npc.levels}</span>
              </div>
            </div>
          ))}
        </div>

        {showAddNPC ? (
          <div className="add-entity-form">
            <h4>Add NPC</h4>

            <div className="form-row">
              <label>
                Name (optional):
                <input
                  type="text"
                  value={npcName}
                  onChange={(e) => setNpcName(e.target.value)}
                  placeholder="NPC name for tracking"
                  className="entity-select"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Word Count (50 words = 1 level):
                <input
                  type="number"
                  min="1"
                  value={npcWordCount}
                  onChange={(e) => setNpcWordCount(e.target.value)}
                  placeholder="Word count for this NPC"
                  className="entity-select"
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowAddNPC(false);
                  setNpcName('');
                  setNpcWordCount(50);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="add-button"
                onClick={handleAddNPC}
                disabled={!npcWordCount || npcWordCount < 1}
              >
                Add NPC
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="add-entity-button"
            onClick={() => setShowAddNPC(true)}
          >
            + Add NPC
          </button>
        )}

        {selectedNPCs.length > 0 && (
          <div className="npc-summary">
            <p>Total NPC Gift Levels: {npcGiftLevels}</p>
          </div>
        )}
      </div>

      {/* Calculate Button */}
      <div className="calculator-actions">
        <button type="button" onClick={handleCalculate} className="calculate-button">
          Calculate Rewards
        </button>
      </div>
    </div>
  );
};

export default WritingSubmissionCalculator;
