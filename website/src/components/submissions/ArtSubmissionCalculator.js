import React, { useState, useEffect } from 'react';
import TrainerAutocomplete from '../common/TrainerAutocomplete';
import MonsterAutocomplete from '../common/MonsterAutocomplete';


/**
 * Art Submission Calculator Component
 * Calculates rewards for art submissions based on quality, background, and complexity
 */
const ArtSubmissionCalculator = ({
  onCalculate,
  initialValues = {},
  trainers = [],
  monsters = []
}) => {
  // Form state
  const [quality, setQuality] = useState(initialValues.quality || 'rendered');
  const [backgrounds, setBackgrounds] = useState(initialValues.backgrounds || [{type: 'none'}]);
  const [showAddBackground, setShowAddBackground] = useState(false);
  const [newBackgroundType, setNewBackgroundType] = useState('simple');
  const [uniquelyDifficult, setUniquelyDifficult] = useState(initialValues.uniquelyDifficult || false);
  const [selectedTrainers, setSelectedTrainers] = useState(initialValues.trainers || []);
  const [selectedMonsters, setSelectedMonsters] = useState(initialValues.monsters || []);
  const [selectedNPCs, setSelectedNPCs] = useState(initialValues.npcs || []);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddMonster, setShowAddMonster] = useState(false);
  const [showAddNPC, setShowAddNPC] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [appearanceType, setAppearanceType] = useState('bust');
  const [appearanceCount, setAppearanceCount] = useState(1);
  const [complexityBonus, setComplexityBonus] = useState(0);
  const [sameAppearanceType, setSameAppearanceType] = useState(true);
  const [isTrainerGift, setIsTrainerGift] = useState(false);

  // NPC state
  const [npcName, setNpcName] = useState('');
  const [npcSize, setNpcSize] = useState('bust');
  const [npcBonus, setNpcBonus] = useState('simple');
  const [giftRecipientId, setGiftRecipientId] = useState('');
  const [giftParticipants, setGiftParticipants] = useState([]);

  // New monster form state
  const [selectedMonsterId, setSelectedMonsterId] = useState('');
  const [monsterTrainerId, setMonsterTrainerId] = useState('');
  const [availableMonsters, setAvailableMonsters] = useState([]);

  // Handle quality change
  const handleQualityChange = (e) => {
    setQuality(e.target.value);
  };

  // Handle adding a new background
  const handleAddBackground = () => {
    // If adding a "none" background, replace all backgrounds with just "none"
    if (newBackgroundType === 'none') {
      setBackgrounds([{ type: 'none' }]);
    } else {
      // If there's a "none" background, remove it and add the new one
      const filteredBackgrounds = backgrounds.filter(bg => bg.type !== 'none');
      setBackgrounds([...filteredBackgrounds, { type: newBackgroundType }]);
    }

    setShowAddBackground(false);
    setNewBackgroundType('simple');
  };

  // Handle removing a background
  const handleRemoveBackground = (index) => {
    const newBackgrounds = [...backgrounds];
    newBackgrounds.splice(index, 1);

    // If no backgrounds left, add a "none" background
    if (newBackgrounds.length === 0) {
      newBackgrounds.push({ type: 'none' });
    }

    setBackgrounds(newBackgrounds);
  };

  // Handle uniquely difficult change
  const handleUniquelyDifficultChange = (e) => {
    setUniquelyDifficult(e.target.checked);
  };

  // Add trainer to selected trainers
  const handleAddTrainer = () => {
    if (!selectedTrainerId) {
      console.log('Cannot add trainer: No trainer selected');
      return;
    }

    console.log('Adding trainer with ID:', selectedTrainerId);
    console.log('Current selected trainers:', selectedTrainers);

    // Check if trainer already exists
    const existingTrainer = selectedTrainers.find(t => t.trainerId === parseInt(selectedTrainerId));
    if (existingTrainer) {
      console.log('Trainer already exists, adding appearance to existing trainer:', existingTrainer);
      // Add appearance to existing trainer
      const updatedTrainers = selectedTrainers.map(t => {
        if (t.trainerId === parseInt(selectedTrainerId)) {
          return {
            ...t,
            appearances: [
              ...t.appearances,
              {
                type: appearanceType,
                count: appearanceCount
              }
            ]
          };
        }
        return t;
      });
      console.log('Updated trainers after adding appearance:', updatedTrainers);
      setSelectedTrainers(updatedTrainers);
    } else {
      // Add new trainer
      const trainer = trainers.find(t => t.id === parseInt(selectedTrainerId));
      if (trainer) {
        console.log('Found trainer to add:', trainer);
        const newTrainer = {
          trainerId: parseInt(selectedTrainerId),
          name: trainer.name,
          isOwned: trainer.is_owned,
          isGift: isTrainerGift,
          appearances: [
            {
              type: appearanceType,
              count: appearanceCount
            }
          ]
        };
        console.log('New trainer object to add:', newTrainer);

        // If this is a gift, add to gift participants if the trainer is owned by the user
        if (isTrainerGift && trainer.is_owned) {
          const giftRecipient = trainers.find(t => t.id === parseInt(giftRecipientId));
          if (giftRecipient) {
            console.log('Adding gift participant for trainer:', {
              trainer: trainer.name,
              recipient: giftRecipient.name
            });
            setGiftParticipants([
              ...giftParticipants,
              {
                participantId: parseInt(selectedTrainerId),
                participantName: trainer.name,
                recipientId: parseInt(giftRecipientId),
                recipientName: giftRecipient.name
              }
            ]);
          }
        }

        const updatedTrainers = [...selectedTrainers, newTrainer];
        console.log('Updated trainers after adding new trainer:', updatedTrainers);
        setSelectedTrainers(updatedTrainers);
      } else {
        console.warn('Could not find trainer with ID:', selectedTrainerId);
      }
    }

    // Reset form
    setSelectedTrainerId('');
    setAppearanceType('bust');
    setAppearanceCount(1);
    setIsTrainerGift(false);
    setGiftRecipientId('');
    setShowAddTrainer(false);
  };

  // Toggle gift status for a trainer
  const toggleTrainerGift = (trainerId, isGift) => {
    const updatedTrainers = selectedTrainers.map(trainer => {
      if (trainer.trainerId === trainerId) {
        return { ...trainer, isGift };
      }
      return trainer;
    });

    // Update gift participants list
    if (!isGift) {
      // Remove from gift participants if gift is toggled off
      setGiftParticipants(giftParticipants.filter(p => p.participantId !== trainerId));
    }

    setSelectedTrainers(updatedTrainers);
  };

  // Add monster to selected monsters
  const handleAddMonster = () => {
    if (!selectedMonsterId || !monsterTrainerId) {
      console.log('Cannot add monster: Missing monster ID or trainer ID', {
        selectedMonsterId,
        monsterTrainerId
      });
      return;
    }

    const monster = availableMonsters.find(m => m.id === parseInt(selectedMonsterId));
    if (!monster) {
      console.warn('Could not find monster with ID:', selectedMonsterId);
      return;
    }

    const trainer = trainers.find(t => t.id === parseInt(monsterTrainerId));
    if (!trainer) {
      console.warn('Could not find trainer with ID:', monsterTrainerId);
      return;
    }

    console.log('Adding monster:', monster.name, 'with trainer:', trainer.name);

    // Create appearances array based on sameAppearanceType
    let appearances = [];
    if (sameAppearanceType) {
      // Same appearance for all instances
      appearances = [
        {
          type: appearanceType,
          count: appearanceCount
        }
      ];
    } else {
      // Different appearances for each instance
      // First instance uses the selected appearance type
      appearances = [
        {
          type: appearanceType,
          count: 1
        }
      ];

      // Create additional appearances for remaining instances
      for (let i = 1; i < appearanceCount; i++) {
        appearances.push({
          type: 'bust', // Default to bust for additional instances
          count: 1
        });
      }
    }

    console.log('Monster appearances:', appearances);

    const newMonster = {
      monsterId: monster.id, // Use real database ID
      name: monster.name,
      trainerId: parseInt(monsterTrainerId),
      trainerName: trainer.name,
      isGift: false, // Gift detection is automatic
      appearances: appearances,
      complexityBonus: parseInt(complexityBonus),
      sameAppearanceType: sameAppearanceType
    };

    console.log('New monster object to add:', newMonster);



    // Add new monster
    const updatedMonsters = [...selectedMonsters, newMonster];
    console.log('Updated monsters after adding new monster:', updatedMonsters);
    setSelectedMonsters(updatedMonsters);

    // Reset form
    setSelectedMonsterId('');
    setMonsterTrainerId('');
    setAvailableMonsters([]);
    setAppearanceType('bust');
    setAppearanceCount(1);
    setComplexityBonus(0);
    setShowAddMonster(false);
  };

  // Toggle gift status for a monster
  const toggleMonsterGift = (monsterId, isGift) => {
    const updatedMonsters = selectedMonsters.map(monster => {
      if (monster.monsterId === monsterId) {
        return { ...monster, isGift };
      }
      return monster;
    });

    // Update gift participants list
    if (!isGift) {
      // Remove from gift participants if gift is toggled off
      setGiftParticipants(giftParticipants.filter(p => p.participantId !== monsterId));
    }

    setSelectedMonsters(updatedMonsters);
  };

  // Remove trainer from selected trainers
  const handleRemoveTrainer = (trainerId) => {
    console.log('Removing trainer with ID:', trainerId);
    console.log('Current selected trainers before removal:', selectedTrainers);

    const updatedTrainers = selectedTrainers.filter(t => t.trainerId !== trainerId);
    console.log('Updated trainers after removal:', updatedTrainers);

    setSelectedTrainers(updatedTrainers);

    // Also remove from gift participants if present
    const updatedGiftParticipants = giftParticipants.filter(p => p.participantId !== trainerId);
    if (updatedGiftParticipants.length !== giftParticipants.length) {
      console.log('Also removing trainer from gift participants');
      setGiftParticipants(updatedGiftParticipants);
    }
  };

  // Remove monster from selected monsters
  const handleRemoveMonster = (monsterId) => {
    console.log('Removing monster with ID:', monsterId);
    console.log('Current selected monsters before removal:', selectedMonsters);

    const updatedMonsters = selectedMonsters.filter(m => m.monsterId !== monsterId);
    console.log('Updated monsters after removal:', updatedMonsters);

    setSelectedMonsters(updatedMonsters);
  };

  // Add NPC
  const handleAddNPC = () => {
    if (!npcSize || !npcBonus) {
      alert('Please select size and bonus for the NPC.');
      return;
    }

    // Calculate levels based on size and bonus
    let sizeLevels = 0;
    switch (npcSize) {
      case 'bust':
        sizeLevels = 1;
        break;
      case 'halfbody':
        sizeLevels = 2;
        break;
      case 'fullbody':
        sizeLevels = 4;
        break;
    }

    let bonusLevels = 0;
    switch (npcBonus) {
      case 'simple':
        bonusLevels = 1;
        break;
      case 'medium':
        bonusLevels = 3;
        break;
      case 'complex':
        bonusLevels = 5;
        break;
      case 'human':
        bonusLevels = 3;
        break;
    }

    const newNPC = {
      id: Date.now(), // Temporary ID for UI
      name: npcName || `NPC ${selectedNPCs.length + 1}`,
      size: npcSize,
      bonus: npcBonus,
      levels: sizeLevels + bonusLevels
    };

    setSelectedNPCs([...selectedNPCs, newNPC]);

    // Reset form
    setNpcName('');
    setNpcSize('bust');
    setNpcBonus('simple');
    setShowAddNPC(false);
  };

  // Remove NPC
  const handleRemoveNPC = (npcId) => {
    setSelectedNPCs(selectedNPCs.filter(npc => npc.id !== npcId));
  };

  // Fetch monsters for selected trainer
  const handleMonsterTrainerSelection = async (trainerId) => {
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
        quality,
        backgroundType: backgrounds.length > 0 && backgrounds[0].type !== 'none' ? backgrounds[0].type : 'none',
        backgrounds,
        uniquelyDifficult,
        trainers: validTrainers,
        monsters: validMonsters,
        npcs: validNPCs,
        giftParticipants
      };

      // Log the data being sent to the parent component
      console.log('ArtSubmissionCalculator - Data being sent to parent:', dataToSend);

      // Verify that trainers and monsters are arrays and not empty if they should have values
      console.log('Trainers array check:', {
        isArray: Array.isArray(validTrainers),
        length: validTrainers.length,
        content: validTrainers
      });

      console.log('Monsters array check:', {
        isArray: Array.isArray(validMonsters),
        length: validMonsters.length,
        content: validMonsters
      });

      // Make sure trainers and monsters arrays are properly initialized
      onCalculate(dataToSend);
    }
  };

  // Handle calculate button click
  const handleCalculate = () => {
    notifyParent();
  };

  // Notify parent whenever trainers, monsters, or NPCs change
  useEffect(() => {
    notifyParent();
  }, [selectedTrainers, selectedMonsters, selectedNPCs]);

  return (
    <div className="art-calculator">
      <div className="calculator-section">
        <h3>Image Quality</h3>
        <div className="type-tags">
          <label>
            <input
              type="radio"
              name="quality"
              value="sketch"
              checked={quality === 'sketch'}
              onChange={handleQualityChange}
            />
            Sketch (+2 levels)
          </label>
          <label>
            <input
              type="radio"
              name="quality"
              value="sketchSet"
              checked={quality === 'sketchSet'}
              onChange={handleQualityChange}
            />
            Sketch Set (+3 levels)
          </label>
          <label>
            <input
              type="radio"
              name="quality"
              value="lineArt"
              checked={quality === 'lineArt'}
              onChange={handleQualityChange}
            />
            Line Art (+4 levels)
          </label>
          <label>
            <input
              type="radio"
              name="quality"
              value="rendered"
              checked={quality === 'rendered'}
              onChange={handleQualityChange}
            />
            Rendered (+5 levels)
          </label>
          <label>
            <input
              type="radio"
              name="quality"
              value="polished"
              checked={quality === 'polished'}
              onChange={handleQualityChange}
            />
            Polished (+7 levels)
          </label>
        </div>
      </div>

      <div className="calculator-section">
        <h3>Backgrounds</h3>
        <div className="selected-backgrounds">
          {backgrounds.map((background, index) => (
            <div key={index} className="selected-background">
              <span className="background-type">
                {background.type === 'none' ? 'None (+0 levels)' :
                 background.type === 'simple' ? 'Simple Background (+3 levels)' :
                 'Complex Background (+6 levels)'}
              </span>
              {backgrounds.length > 1 && (
                <button
                  type="button"
                  className="button icon danger"
                  onClick={() => handleRemoveBackground(index)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        {showAddBackground ? (
          <div className="add-background-form">
            <div className="form-row">
              <select
                value={newBackgroundType}
                onChange={(e) => setNewBackgroundType(e.target.value)}
                className="background-select"
              >
                <option value="none">None (+0 levels)</option>
                <option value="simple">Simple Background (+3 levels)</option>
                <option value="complex">Complex Background (+6 levels)</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowAddBackground(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleAddBackground}
              >
                Add Background
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button primary"
            onClick={() => setShowAddBackground(true)}
          >
            + Add Background
          </button>
        )}
      </div>

      <div className="calculator-section">
        <h3>Additional Difficulty</h3>
        <label className="difficulty-option">
          <input
            type="checkbox"
            checked={uniquelyDifficult}
            onChange={handleUniquelyDifficultChange}
          />
          Uniquely Difficult (+3 levels)
        </label>
      </div>

      <div className="calculator-section">
        <h3>Trainers</h3>
        {selectedTrainers.length === 0 && (
          <div className="empty-selection-message">
            <p>No trainers selected. Add trainers to include them in the art submission.</p>
          </div>
        )}
        <div className="selected-entities">
          {selectedTrainers.map((trainer) => (
            <div key={trainer.trainerId} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{trainer.name}</span>
                <button
                  type="button"
                  className="button danger icon sm"
                  onClick={() => handleRemoveTrainer(trainer.trainerId)}
                >
                  &times;
                </button>
              </div>
              <div className="entity-appearances">
                {trainer.appearances.map((appearance, index) => (
                  <div key={index} className="entity-appearance">
                    <span className="appearance-type">
                      {appearance.type === 'bust' ? 'Bust (+1)' :
                       appearance.type === 'halfBody' ? 'Half Body (+2)' : 'Full Body (+3)'}
                    </span>
                    {appearance.count > 1 && (
                      <span className="appearance-count">× {appearance.count}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="entity-bonus">
                <span className="bonus-label">Trainer Bonus: +3 levels</span>
              </div>

              {/* Gift checkbox for owned trainers */}
              {trainer.isOwned && (
                <div className="gift-option">
                  <label className="gift-checkbox-label">
                    <input
                      type="checkbox"
                      checked={trainer.isGift || false}
                      onChange={(e) => toggleTrainerGift(trainer.trainerId, e.target.checked)}
                    />
                    This is a gift
                  </label>

                  {/* Show gift recipient dropdown if this is a gift */}
                  {trainer.isGift && (
                    <div className="gift-recipient">
                      <TrainerAutocomplete
                        trainers={trainers.filter(t => t.is_owned && t.id !== trainer.trainerId)}
                        selectedTrainerId={giftParticipants.find(p => p.participantId === trainer.trainerId)?.recipientId || ''}
                        onSelect={(recipientId) => {
                          // Remove old gift participant
                          const filteredParticipants = giftParticipants.filter(p => p.participantId !== trainer.trainerId);

                          // Add new gift participant with updated recipient
                          if (recipientId) {
                            const recipient = trainers.find(t => t.id === parseInt(recipientId));
                            if (recipient) {
                              filteredParticipants.push({
                                participantId: trainer.trainerId,
                                participantName: trainer.name,
                                recipientId: parseInt(recipientId),
                                recipientName: recipient.name
                              });
                            }
                          }

                          setGiftParticipants(filteredParticipants);
                        }}
                        label=""
                        placeholder="Select Gift Recipient..."
                        className="gift-recipient-select"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {showAddTrainer ? (
          <div className="add-entity-form">
            <div className="form-row">
              <TrainerAutocomplete
                trainers={trainers}
                selectedTrainerId={selectedTrainerId}
                onSelect={(id) => setSelectedTrainerId(id)}
                label="Select Trainer"
                placeholder="Type to search trainers..."
                showOwnership={true}
                className="form-input"
              />
            </div>
            <div className="form-row">
              <select
                value={appearanceType}
                onChange={(e) => setAppearanceType(e.target.value)}
                className="form-input"
              >
                <option value="bust">Bust (+1 level)</option>
                <option value="halfBody">Half Body (+2 levels)</option>
                <option value="fullBody">Full Body (+3 levels)</option>
              </select>
              <input
                type="number"
                min="1"
                max="10"
                value={appearanceCount}
                onChange={(e) => setAppearanceCount(parseInt(e.target.value) || 1)}
                className="form-input"
                placeholder="Count"
              />
            </div>

            {/* Gift option for owned trainers */}
            {selectedTrainerId && trainers.find(t => t.id === parseInt(selectedTrainerId))?.is_owned && (
              <div className="form-row gift-option">
                <label className="gift-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isTrainerGift}
                    onChange={(e) => setIsTrainerGift(e.target.checked)}
                  />
                  This is a gift
                </label>

                {isTrainerGift && (
                  <TrainerAutocomplete
                    trainers={trainers.filter(t => t.is_owned && t.id !== parseInt(selectedTrainerId))}
                    selectedTrainerId={giftRecipientId}
                    onSelect={(id) => setGiftRecipientId(id)}
                    label=""
                    placeholder="Select Gift Recipient..."
                    className="gift-recipient-select"
                  />
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowAddTrainer(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleAddTrainer}
                disabled={!selectedTrainerId || (isTrainerGift && !giftRecipientId)}
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button primary"
            onClick={() => setShowAddTrainer(true)}
          >
            + Add Trainer
          </button>
        )}
      </div>

      <div className="calculator-section">
        <h3>Monsters</h3>
        <div className="selected-entities">
          {selectedMonsters.map((monster) => (
            <div key={monster.monsterId} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{monster.name}</span>
                <button
                  type="button"
                  className="button danger icon sm"
                  onClick={() => handleRemoveMonster(monster.monsterId)}
                >
                  &times;
                </button>
              </div>
              <div className="entity-trainer">
                <span className="trainer-label">Trainer: {monster.trainerName}</span>
              </div>
              <div className="entity-appearances">
                {monster.appearances.map((appearance, index) => (
                  <div key={index} className="entity-appearance">
                    <span className="appearance-type">
                      {appearance.type === 'bust' ? 'Bust (+1)' :
                       appearance.type === 'halfBody' ? 'Half Body (+2)' : 'Full Body (+3)'}
                    </span>
                    {appearance.count > 1 && (
                      <span className="appearance-count">× {appearance.count}</span>
                    )}
                  </div>
                ))}
              </div>
              {monster.complexityBonus > 0 && (
                <div className="entity-bonus">
                  <span className="bonus-label">Complexity Bonus: +{monster.complexityBonus} levels</span>
                </div>
              )}

              {/* Gift checkbox for monsters with owned trainers */}
              {trainers.find(t => t.id === monster.trainerId)?.is_owned && (
                <div className="gift-option">
                  <label className="gift-checkbox-label">
                    <input
                      type="checkbox"
                      checked={monster.isGift || false}
                      onChange={(e) => toggleMonsterGift(monster.monsterId, e.target.checked)}
                    />
                    This is a gift
                  </label>

                  {/* Show gift recipient dropdown if this is a gift */}
                  {monster.isGift && (
                    <div className="gift-recipient">
                      <TrainerAutocomplete
                        trainers={trainers.filter(t => t.is_owned && t.id !== monster.trainerId)}
                        selectedTrainerId={giftParticipants.find(p => p.participantId === monster.monsterId)?.recipientId || ''}
                        onSelect={(recipientId) => {
                          // Remove old gift participant
                          const filteredParticipants = giftParticipants.filter(p => p.participantId !== monster.monsterId);

                          // Add new gift participant with updated recipient
                          if (recipientId) {
                            const recipient = trainers.find(t => t.id === parseInt(recipientId));
                            if (recipient) {
                              filteredParticipants.push({
                                participantId: monster.monsterId,
                                participantName: `${monster.name} (${monster.trainerName}'s monster)`,
                                recipientId: parseInt(recipientId),
                                recipientName: recipient.name,
                                isMonster: true
                              });
                            }
                          }

                          setGiftParticipants(filteredParticipants);
                        }}
                        label=""
                        placeholder="Select Gift Recipient..."
                        className="gift-recipient-select"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {showAddMonster ? (
          <div className="add-entity-form">
            <div className="form-row">
              <TrainerAutocomplete
                trainers={trainers}
                selectedTrainerId={monsterTrainerId}
                onSelect={(id) => handleMonsterTrainerSelection(id)}
                label="Select Trainer First"
                placeholder="Type to search trainers..."
                showOwnership={true}
                className="form-input"
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
                  className="form-input"
                  required
                />
              </div>
            )}
            <div className="form-row">
              <select
                value={appearanceType}
                onChange={(e) => setAppearanceType(e.target.value)}
                className="form-input"
              >
                <option value="bust">Bust (+1 level)</option>
                <option value="halfBody">Half Body (+2 levels)</option>
                <option value="fullBody">Full Body (+3 levels)</option>
              </select>
              <input
                type="number"
                min="1"
                max="10"
                value={appearanceCount}
                onChange={(e) => setAppearanceCount(parseInt(e.target.value) || 1)}
                className="form-input"
                placeholder="Count"
              />
            </div>
            <div className="form-row">
              <label className="complexity-label">
                Complexity Bonus:
                <select
                  value={complexityBonus}
                  onChange={(e) => setComplexityBonus(e.target.value)}
                  className="form-input"
                >
                  <option value="0">None (+0)</option>
                  <option value="1">Low (+1)</option>
                  <option value="2">Medium (+2)</option>
                  <option value="3">High (+3)</option>
                  <option value="4">Very High (+4)</option>
                  <option value="5">Extreme (+5)</option>
                </select>
              </label>
            </div>
            <div className="form-row">
              <label className="same-appearance-label">
                <input
                  type="checkbox"
                  checked={sameAppearanceType}
                  onChange={(e) => setSameAppearanceType(e.target.checked)}
                />
                Same appearance type for all instances
              </label>
            </div>



            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setShowAddMonster(false);
                  setMonsterTrainerId('');
                  setSelectedMonsterId('');
                  setAvailableMonsters([]);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleAddMonster}
                disabled={!selectedMonsterId || !monsterTrainerId}
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button primary"
            onClick={() => setShowAddMonster(true)}
          >
            + Add Monster
          </button>
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
                  className="button icon danger"
                  onClick={() => handleRemoveNPC(npc.id)}
                >
                  &times;
                </button>
              </div>
              <div className="entity-details">
                <span>Size: {npc.size} (+{npc.size === 'bust' ? 1 : npc.size === 'halfbody' ? 2 : 4} levels)</span>
                <span>Bonus: {npc.bonus} (+{npc.bonus === 'simple' ? 1 : npc.bonus === 'medium' ? 3 : npc.bonus === 'complex' ? 5 : 3} levels)</span>
                <span>Total: {npc.levels} gift levels</span>
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
                  className="form-input"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Size:
                <select
                  value={npcSize}
                  onChange={(e) => setNpcSize(e.target.value)}
                  className="form-input"
                >
                  <option value="bust">Bust (+1 level)</option>
                  <option value="halfbody">Half Body (+2 levels)</option>
                  <option value="fullbody">Full Body (+4 levels)</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Complexity:
                <select
                  value={npcBonus}
                  onChange={(e) => setNpcBonus(e.target.value)}
                  className="form-input"
                >
                  <option value="simple">Simple (+1 level)</option>
                  <option value="medium">Medium (+3 levels)</option>
                  <option value="complex">Complex (+5 levels)</option>
                  <option value="human">Human/Half-Wild (+3 levels)</option>
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setShowAddNPC(false);
                  setNpcName('');
                  setNpcSize('bust');
                  setNpcBonus('simple');
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
            className="button primary"
            onClick={() => setShowAddNPC(true)}
          >
            + Add NPC
          </button>
        )}
      </div>

      {/* Gift Participants Section */}
      {giftParticipants.length > 0 && (
        <div className="calculator-section gift-participants-section">
          <h3>Gift Participants</h3>
          <div className="gift-participants-list">
            {giftParticipants.map((participant, index) => (
              <div key={index} className="gift-participant-item">
                <div className="gift-participant-info">
                  <span className="gift-participant-name">{participant.participantName}</span>
                  <span className="gift-arrow">→</span>
                  <span className="gift-recipient-name">{participant.recipientName}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="gift-explanation">
            Gift participants will earn levels for both themselves and the gift recipient.
          </p>
        </div>
      )}

      <div className="calculator-actions">
        <button
          type="button"
          className="button primary"
          onClick={handleCalculate}
        >
          Calculate Rewards
        </button>
      </div>
    </div>
  );
};

export default ArtSubmissionCalculator;
