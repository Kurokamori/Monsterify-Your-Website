import { useState, useCallback, useEffect } from 'react';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { MonsterAutocomplete } from '../common/MonsterAutocomplete';
import monsterService from '../../services/monsterService';

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

interface Appearance {
  type: 'bust' | 'halfBody' | 'fullBody';
  count: number;
}

interface SelectedTrainer {
  trainerId: string | number;
  name: string;
  isOwned: boolean;
  isGift: boolean;
  appearances: Appearance[];
  sameAppearanceType: boolean;
}

interface SelectedMonster {
  monsterId: string | number;
  name: string;
  trainerId: string | number;
  trainerName: string;
  isGift: boolean;
  appearances: Appearance[];
  complexityBonus: number;
  sameAppearanceType: boolean;
}

interface SelectedNPC {
  id: string | number;
  name: string;
  size: 'bust' | 'halfbody' | 'fullbody';
  bonus: 'simple' | 'medium' | 'complex' | 'human';
  levels: number;
}

interface Background {
  type: 'none' | 'simple' | 'complex';
}

export interface ArtCalculatorValues {
  quality: string;
  backgroundType: string;
  backgrounds: Background[];
  uniquelyDifficult: boolean;
  trainers: SelectedTrainer[];
  monsters: SelectedMonster[];
  npcs: SelectedNPC[];
}

const COMPLEXITY_OPTIONS: Record<string, { label: string; stages: { label: string; value: number }[] }> = {
  pokemon: {
    label: 'Pokémon / Nexomon / Final Fantasy',
    stages: [
      { label: 'Base Stage (+0)', value: 0 },
      { label: 'First Evolution (+1)', value: 1 },
      { label: 'Final Stage (+2)', value: 2 },
      { label: 'Second Evolution (+3)', value: 3 },
      { label: "Doesn't Evolve (+3)", value: 3 },
    ],
  },
  digimon: {
    label: 'Digimon',
    stages: [
      { label: 'Baby / Fresh (+0)', value: 0 },
      { label: 'Rookie (+1)', value: 1 },
      { label: 'Champion (+3)', value: 3 },
      { label: 'Above Champion (+5)', value: 5 },
    ],
  },
  palworld: {
    label: 'Palworld',
    stages: [
      { label: 'Pal (+2)', value: 2 },
    ],
  },
  yokai: {
    label: 'Yo-kai Watch',
    stages: [
      { label: 'Yo-kai (+2)', value: 2 },
    ],
  },
  monsterhunter: {
    label: 'Monster Hunter',
    stages: [
      { label: 'Monster (+3)', value: 3 },
    ],
  },
};

interface ArtSubmissionCalculatorProps {
  onCalculate: (values: ArtCalculatorValues) => void;
  initialValues?: Partial<ArtCalculatorValues>;
  trainers?: Trainer[];
  monsters?: Monster[];
}

export function ArtSubmissionCalculator({
  onCalculate,
  initialValues = {},
  trainers = []
}: ArtSubmissionCalculatorProps) {
  // Form state
  const [quality, setQuality] = useState(initialValues.quality || 'rendered');
  const [backgrounds, setBackgrounds] = useState<Background[]>(initialValues.backgrounds || [{ type: 'none' }]);
  const [showAddBackground, setShowAddBackground] = useState(false);
  const [newBackgroundType, setNewBackgroundType] = useState<'none' | 'simple' | 'complex'>('simple');
  const [uniquelyDifficult, setUniquelyDifficult] = useState(initialValues.uniquelyDifficult || false);
  const [selectedTrainers, setSelectedTrainers] = useState<SelectedTrainer[]>(initialValues.trainers || []);
  const [selectedMonsters, setSelectedMonsters] = useState<SelectedMonster[]>(initialValues.monsters || []);
  const [selectedNPCs, setSelectedNPCs] = useState<SelectedNPC[]>(initialValues.npcs || []);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddMonster, setShowAddMonster] = useState(false);
  const [showAddNPC, setShowAddNPC] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | number | null>(null);
  const [appearanceType, setAppearanceType] = useState<'bust' | 'halfBody' | 'fullBody'>('bust');
  const [appearanceCount, setAppearanceCount] = useState(1);
  const [complexityBonus, setComplexityBonus] = useState(0);
  const [complexityFranchise, setComplexityFranchise] = useState('');
  const [sameAppearanceType, setSameAppearanceType] = useState(true);
  const [trainerSameAppearance, setTrainerSameAppearance] = useState(true);
  const [perInstanceAppearances, setPerInstanceAppearances] = useState<Array<'bust' | 'halfBody' | 'fullBody'>>([]);

  // NPC state
  const [npcName, setNpcName] = useState('');
  const [npcSize, setNpcSize] = useState<'bust' | 'halfbody' | 'fullbody'>('bust');
  const [npcBonus, setNpcBonus] = useState<'simple' | 'medium' | 'complex' | 'human'>('simple');
  // Monster form state
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | number | null>(null);
  const [monsterTrainerId, setMonsterTrainerId] = useState<string | number | null>(null);
  const [availableMonsters, setAvailableMonsters] = useState<Monster[]>([]);

  // Handle adding a new background
  const handleAddBackground = () => {
    if (newBackgroundType === 'none') {
      setBackgrounds([{ type: 'none' }]);
    } else {
      const filteredBackgrounds = backgrounds.filter(bg => bg.type !== 'none');
      setBackgrounds([...filteredBackgrounds, { type: newBackgroundType }]);
    }
    setShowAddBackground(false);
    setNewBackgroundType('simple');
  };

  // Handle removing a background
  const handleRemoveBackground = (index: number) => {
    const newBackgrounds = [...backgrounds];
    newBackgrounds.splice(index, 1);
    if (newBackgrounds.length === 0) {
      newBackgrounds.push({ type: 'none' });
    }
    setBackgrounds(newBackgrounds);
  };

  // Add trainer to selected trainers
  const handleAddTrainer = () => {
    if (!selectedTrainerId) return;

    const existingTrainer = selectedTrainers.find(t => t.trainerId === selectedTrainerId);

    // Build appearances array
    let appearances: Appearance[];
    if (trainerSameAppearance) {
      appearances = [{ type: appearanceType, count: appearanceCount }];
    } else {
      // Group per-instance appearances by type and count them
      const typeCounts: Record<string, number> = {};
      for (const type of perInstanceAppearances) {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
      appearances = Object.entries(typeCounts).map(([type, count]) => ({
        type: type as 'bust' | 'halfBody' | 'fullBody',
        count
      }));
    }

    if (existingTrainer) {
      const updatedTrainers = selectedTrainers.map(t => {
        if (t.trainerId === selectedTrainerId) {
          return {
            ...t,
            appearances: [...t.appearances, ...appearances],
            sameAppearanceType: trainerSameAppearance
          };
        }
        return t;
      });
      setSelectedTrainers(updatedTrainers);
    } else {
      const trainer = trainers.find(t => t.id === selectedTrainerId);
      if (trainer) {
        const newTrainer: SelectedTrainer = {
          trainerId: selectedTrainerId,
          name: trainer.name,
          isOwned: trainer.is_owned || false,
          isGift: !(trainer.is_owned),
          appearances,
          sameAppearanceType: trainerSameAppearance
        };

        setSelectedTrainers([...selectedTrainers, newTrainer]);
      }
    }

    setSelectedTrainerId(null);
    setAppearanceType('bust');
    setAppearanceCount(1);
    setTrainerSameAppearance(true);
    setPerInstanceAppearances([]);
    setShowAddTrainer(false);
  };

  // Add monster to selected monsters
  const handleAddMonster = () => {
    if (!selectedMonsterId || !monsterTrainerId) return;

    const monster = availableMonsters.find(m => m.id === selectedMonsterId);
    if (!monster) return;

    const trainer = trainers.find(t => t.id === monsterTrainerId);
    if (!trainer) return;

    let appearances: Appearance[] = [];
    if (sameAppearanceType) {
      appearances = [{ type: appearanceType, count: appearanceCount }];
    } else {
      // Group per-instance appearances by type and count them
      const typeCounts: Record<string, number> = {};
      for (const type of perInstanceAppearances) {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
      appearances = Object.entries(typeCounts).map(([type, count]) => ({
        type: type as 'bust' | 'halfBody' | 'fullBody',
        count
      }));
    }

    const newMonster: SelectedMonster = {
      monsterId: monster.id,
      name: monster.name,
      trainerId: monsterTrainerId,
      trainerName: trainer.name,
      isGift: !(trainer.is_owned),
      appearances,
      complexityBonus,
      sameAppearanceType
    };

    setSelectedMonsters([...selectedMonsters, newMonster]);

    setSelectedMonsterId(null);
    setMonsterTrainerId(null);
    setAvailableMonsters([]);
    setAppearanceType('bust');
    setAppearanceCount(1);
    setComplexityBonus(0);
    setComplexityFranchise('');
    setSameAppearanceType(true);
    setPerInstanceAppearances([]);
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
    let sizeLevels = 0;
    switch (npcSize) {
      case 'bust': sizeLevels = 1; break;
      case 'halfbody': sizeLevels = 2; break;
      case 'fullbody': sizeLevels = 4; break;
    }

    let bonusLevels = 0;
    switch (npcBonus) {
      case 'simple': bonusLevels = 1; break;
      case 'medium': bonusLevels = 3; break;
      case 'complex': bonusLevels = 5; break;
      case 'human': bonusLevels = 3; break;
    }

    const newNPC: SelectedNPC = {
      id: Date.now(),
      name: npcName || `NPC ${selectedNPCs.length + 1}`,
      size: npcSize,
      bonus: npcBonus,
      levels: sizeLevels + bonusLevels
    };

    setSelectedNPCs([...selectedNPCs, newNPC]);
    setNpcName('');
    setNpcSize('bust');
    setNpcBonus('simple');
    setShowAddNPC(false);
  };

  // Remove NPC
  const handleRemoveNPC = (npcId: string | number) => {
    setSelectedNPCs(selectedNPCs.filter(npc => npc.id !== npcId));
  };

  // Fetch monsters for selected trainer
  const handleMonsterTrainerSelection = async (trainerId: string | number | null) => {
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
  const buildValues = useCallback((): ArtCalculatorValues => {
    return {
      quality,
      backgroundType: backgrounds.length > 0 && backgrounds[0].type !== 'none' ? backgrounds[0].type : 'none',
      backgrounds,
      uniquelyDifficult,
      trainers: Array.isArray(selectedTrainers) ? selectedTrainers : [],
      monsters: Array.isArray(selectedMonsters) ? selectedMonsters : [],
      npcs: Array.isArray(selectedNPCs) ? selectedNPCs : [],
    };
  }, [selectedTrainers, selectedMonsters, selectedNPCs, quality, backgrounds, uniquelyDifficult]);

  // Auto-sync calculator values to parent whenever selections change
  useEffect(() => {
    onCalculate(buildValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrainers, selectedMonsters, selectedNPCs, quality, backgrounds, uniquelyDifficult]);

  // Handle calculate button click - sends current values to parent
  const handleCalculate = () => {
    onCalculate(buildValues());
  };

  return (
    <div className="art-calculator">
      <div className="calculator-section">
        <h4>Image Quality</h4>
        <p className="form-tooltip--section">Select the finish level of your artwork -- this refers to the overall level of finish and polish for the work. If there's variance, try to take an average, or stick to what is true for the vast majority of the artwork.</p>
        <div className="form-radio-list">
          {([
            { value: 'sketch', label: 'Sketch', hint: 'Rough or loose drawing, minimal detail. (+2 levels)' },
            { value: 'sketchSet', label: 'Sketch Set', hint: 'Multiple sketches or a detailed sketch page. (+3 levels)' },
            { value: 'lineArt', label: 'Line Art', hint: 'Clean line work, no color or shading. (+4 levels)' },
            { value: 'flatColor', label: 'Flat Color', hint: 'Colored artwork without complex shading. (+5 levels)' },
            { value: 'rendered', label: 'Rendered', hint: 'Colored and shaded artwork with depth. (+7 levels)' },
            { value: 'polished', label: 'Polished', hint: 'Fully finished piece with lighting, effects, or refined detail. (+9 levels)' },
          ] as const).map(q => (
            <label key={q.value}>
              <input
                type="radio"
                name="quality"
                value={q.value}
                checked={quality === q.value}
                onChange={(e) => setQuality(e.target.value)}
              />
              {q.label}
              {q.hint && <span className="radio-option-hint">{q.hint}</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="calculator-section">
        <h4>Backgrounds</h4>
        <p className="form-tooltip--section">Add backgrounds drawn in the art. Multiple backgrounds can be added for multi-scene pieces.</p>
        <div className="selected-backgrounds">
          {backgrounds.map((background, index) => (
            <div key={index} className="selected-background">
              <span>
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
            <div className="flex w-full">
              <select
                className="form-input mb-sm"
                value={newBackgroundType}
                onChange={(e) => setNewBackgroundType(e.target.value as 'none' | 'simple' | 'complex')}

              >
                <option value="none">None (+0 levels)</option>
                <option value="simple">Simple Background (+3 levels)</option>
                <option value="complex">Complex Background (+6 levels)</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setShowAddBackground(false)}>
                Cancel
              </button>
              <button type="button" className="button primary" onClick={handleAddBackground}>
                Add Background
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="button primary" onClick={() => setShowAddBackground(true)}>
            + Add Background
          </button>
        )}
      </div>

      <div className="calculator-section">
        <h4>Additional Difficulty</h4>
        <p className="form-tooltip--section">Select this if the artwork was uniquely difficult and required extra effort for YOU. This is an extra bonus for going above and beyond YOUR normal effort.</p>
        <label className="difficulty-option">
          <input
            type="checkbox"
            checked={uniquelyDifficult}
            onChange={(e) => setUniquelyDifficult(e.target.checked)}
          />
          Uniquely Difficult (+3 levels)
        </label>
      </div>

      <div className="calculator-section">
        <h4>Trainers</h4>
        <p className="form-tooltip--section">Add each trainer that appears in the artwork with their appearance size.</p>
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
                  className="button danger icon sm no-flex"
                  onClick={() => handleRemoveTrainer(trainer.trainerId)}
                >
                  &times;
                </button>
              </div>
              <div className="entity-appearances">
                {trainer.appearances.map((appearance, index) => (
                  <div key={index} className="entity-appearance">
                    <span>
                      {appearance.type === 'bust' ? 'Bust (+1)' :
                       appearance.type === 'halfBody' ? 'Half Body (+2)' : 'Full Body (+3)'}
                    </span>
                    {appearance.count > 1 && (
                      <span>&times; {appearance.count}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="entity-bonus">
                <span>Trainer Bonus: +3 levels</span>
              </div>

            </div>
          ))}
        </div>

        {showAddTrainer ? (
          <div className="add-entity-form">
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

            <div className="flex flex-col w-full mb-sm">
              <label className="w-full">Appearance Count:</label>
              <p className="form-tooltip">How many times does this trainer appear in the image.</p>
              <input
                type="number"
                min="1"
                max="10"
                value={appearanceCount || ''}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value);
                  const count = isNaN(parsed) ? 0 : parsed;
                  setAppearanceCount(count);
                  if (!trainerSameAppearance && count > 0) {
                    setPerInstanceAppearances(prev => {
                      const updated = [...prev];
                      while (updated.length < count) updated.push('bust');
                      return updated.slice(0, count);
                    });
                  }
                }}
                onBlur={() => {
                  if (!appearanceCount || appearanceCount < 1) setAppearanceCount(1);
                }}
                className="form-input"
                placeholder="Count"
              />
            </div>

            {appearanceCount > 1 && (
              <div className="flex w-full mb-sm">
                <label className="flex items-center gap-xs">
                  <input
                    type="checkbox"
                    checked={trainerSameAppearance}
                    onChange={(e) => {
                      setTrainerSameAppearance(e.target.checked);
                      if (!e.target.checked) {
                        setPerInstanceAppearances(Array(appearanceCount).fill(appearanceType));
                      }
                    }}
                  />
                  Same appearance type for all instances
                </label>
              </div>
            )}

            {trainerSameAppearance ? (
              <div className="flex flex-col w-full mb-sm">
                <label className="w-full">Appearance Type:</label>
                <p className="form-tooltip">How much of the trainer is visible in the image. A rule of thumb: <br /> Bust: head/shoulders. <br /> Half Body: torso and up. <br /> Full Body: entire body visible (at least 90%).</p>
                <select
                  value={appearanceType}
                  onChange={(e) => setAppearanceType(e.target.value as 'bust' | 'halfBody' | 'fullBody')}
                  className="form-input"
                >
                  <option value="bust">Bust (+1 level)</option>
                  <option value="halfBody">Half Body (+2 levels)</option>
                  <option value="fullBody">Full Body (+3 levels)</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col w-full mb-sm">
                <label className="w-full">Per-Instance Appearance Types:</label>
                <p className="form-tooltip">Set the appearance type for each instance of this trainer.</p>
                {perInstanceAppearances.map((type, i) => (
                  <div key={i} className="flex w-full mb-xs">
                    <label className="per-instance-label">Instance {i + 1}:</label>
                    <select
                      value={type}
                      onChange={(e) => {
                        const updated = [...perInstanceAppearances];
                        updated[i] = e.target.value as 'bust' | 'halfBody' | 'fullBody';
                        setPerInstanceAppearances(updated);
                      }}
                      className="form-input"
                    >
                      <option value="bust">Bust (+1 level)</option>
                      <option value="halfBody">Half Body (+2 levels)</option>
                      <option value="fullBody">Full Body (+3 levels)</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setShowAddTrainer(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleAddTrainer}
                disabled={!selectedTrainerId}
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="button primary" onClick={() => setShowAddTrainer(true)}>
            + Add Trainer
          </button>
        )}
      </div>

      <div className="calculator-section">
        <h4>Monsters</h4>
        <p className="form-tooltip--section">Add each monster drawn in the artwork. Select the monster's trainer first, then choose the monster.</p>
        <div className="selected-entities">
          {selectedMonsters.map((monster) => (
            <div key={monster.monsterId} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{monster.name}</span>
                <button
                  type="button"
                  className="button danger icon sm no-flex"
                  onClick={() => handleRemoveMonster(monster.monsterId)}
                >
                  &times;
                </button>
              </div>
              <div className="entity-trainer">
                <span>Trainer: {monster.trainerName}</span>
              </div>
              <div className="entity-appearances">
                {monster.appearances.map((appearance, index) => (
                  <div key={index} className="entity-appearance">
                    <span>
                      {appearance.type === 'bust' ? 'Bust (+1)' :
                       appearance.type === 'halfBody' ? 'Half Body (+2)' : 'Full Body (+3)'}
                    </span>
                    {appearance.count > 1 && (
                      <span>&times; {appearance.count}</span>
                    )}
                  </div>
                ))}
              </div>
              {monster.complexityBonus > 0 && (
                <div className="entity-bonus">
                  <span>Complexity Bonus: +{monster.complexityBonus} levels</span>
                </div>
              )}

            </div>
          ))}
        </div>

        {showAddMonster ? (
          <div className="add-entity-form">
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
                  monsters={availableMonsters}
                  selectedMonsterId={selectedMonsterId}
                  onSelect={(id) => setSelectedMonsterId(id)}
                  label="Select Monster"
                  placeholder="Type to search monsters..."
                  noPadding={true}
                />
              </div>
            )}

            <div className="flex w-full flex-col mb-sm">
              <label className="w-full">Appearance Count:</label>
              <p className="form-tooltip">
                How many times does this monster appear in the image.
              </p>
              <input
                type="number"
                min="1"
                max="10"
                value={appearanceCount || ''}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value);
                  const count = isNaN(parsed) ? 0 : parsed;
                  setAppearanceCount(count);
                  if (!sameAppearanceType && count > 0) {
                    setPerInstanceAppearances(prev => {
                      const updated = [...prev];
                      while (updated.length < count) updated.push('bust');
                      return updated.slice(0, count);
                    });
                  }
                }}
                onBlur={() => {
                  if (!appearanceCount || appearanceCount < 1) setAppearanceCount(1);
                }}
                className="form-input"
                placeholder="Count"
              />
            </div>

            {appearanceCount > 1 && (
              <div className="flex w-full mb-sm">
                <label className="flex items-center gap-xs">
                  <input
                    type="checkbox"
                    checked={sameAppearanceType}
                    onChange={(e) => {
                      setSameAppearanceType(e.target.checked);
                      if (!e.target.checked) {
                        setPerInstanceAppearances(Array(appearanceCount).fill(appearanceType));
                      }
                    }}
                  />
                  Same appearance type for all instances
                </label>
              </div>
            )}

            {sameAppearanceType ? (
              <div className="flex flex-col w-full mb-sm">
                <label className="w-full">Appearance Type:</label>
                <p className="form-tooltip">How much of the monster is visible. A good rule of thumb: <br /> Bust: head/shoulders. <br /> Half Body: torso and up. <br /> Full Body: entire body visible (at least 90%).</p>
                <select
                  value={appearanceType}
                  onChange={(e) => setAppearanceType(e.target.value as 'bust' | 'halfBody' | 'fullBody')}
                  className="form-input"
                >
                  <option value="bust">Bust (+1 level)</option>
                  <option value="halfBody">Half Body (+2 levels)</option>
                  <option value="fullBody">Full Body (+3 levels)</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col w-full mb-sm">
                <label className="w-full">Per-Instance Appearance Types:</label>
                <p className="form-tooltip">Set the appearance type for each instance of this monster (e.g. full body in one panel, bust in another).</p>
                {perInstanceAppearances.map((type, i) => (
                  <div key={i} className="flex w-full mb-xs">
                    <label className="per-instance-label">Instance {i + 1}:</label>
                    <select
                      value={type}
                      onChange={(e) => {
                        const updated = [...perInstanceAppearances];
                        updated[i] = e.target.value as 'bust' | 'halfBody' | 'fullBody';
                        setPerInstanceAppearances(updated);
                      }}
                      className="form-input"
                    >
                      <option value="bust">Bust (+1 level)</option>
                      <option value="halfBody">Half Body (+2 levels)</option>
                      <option value="fullBody">Full Body (+3 levels)</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col w-full mb-sm">
              <label className="w-full">Complexity Bonus:</label>
              <p className="form-tooltip">
                Select the franchise and evolution stage. For fusions, use whichever species gives the highest bonus (e.g. Pichu/Tyranitar fusion = +3).
              </p>
              <select
                value={complexityFranchise}
                onChange={(e) => {
                  const franchise = e.target.value;
                  setComplexityFranchise(franchise);
                  if (franchise && COMPLEXITY_OPTIONS[franchise]) {
                    const stages = COMPLEXITY_OPTIONS[franchise].stages;
                    // Auto-select if only one stage option
                    if (stages.length === 1) {
                      setComplexityBonus(stages[0].value);
                    } else {
                      setComplexityBonus(0);
                    }
                  } else {
                    setComplexityBonus(0);
                  }
                }}
                className="form-input mb-xs"
              >
                <option value="">Select franchise...</option>
                {Object.entries(COMPLEXITY_OPTIONS).map(([key, opt]) => (
                  <option key={key} value={key}>{opt.label}</option>
                ))}
              </select>
              {complexityFranchise && COMPLEXITY_OPTIONS[complexityFranchise] && COMPLEXITY_OPTIONS[complexityFranchise].stages.length > 1 && (
                <select
                  value={complexityBonus}
                  onChange={(e) => setComplexityBonus(parseInt(e.target.value))}
                  className="form-input"
                >
                  {COMPLEXITY_OPTIONS[complexityFranchise].stages.map((stage, i) => (
                    <option key={i} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
              )}
              {complexityFranchise && COMPLEXITY_OPTIONS[complexityFranchise] && COMPLEXITY_OPTIONS[complexityFranchise].stages.length === 1 && (
                <span className="form-tooltip">
                  {COMPLEXITY_OPTIONS[complexityFranchise].stages[0].label}
                </span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setShowAddMonster(false);
                  setMonsterTrainerId(null);
                  setSelectedMonsterId(null);
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
          <button type="button" className="button primary" onClick={() => setShowAddMonster(true)}>
            + Add Monster
          </button>
        )}
      </div>

      <div className="calculator-section">
        <h4>Non-Player Characters (NPCs)</h4>
        <p className="form-tooltip--section">Add NPCs drawn in the art. NPC levels are awarded as gift levels based on their size and complexity.</p>
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
            <div className="flex w-full mb-sm">
              <label className="w-full">
                Size:
                <select
                  value={npcSize}
                  onChange={(e) => setNpcSize(e.target.value as 'bust' | 'halfbody' | 'fullbody')}
                  className="form-input"
                >
                  <option value="bust">Bust (+1 level)</option>
                  <option value="halfbody">Half Body (+2 levels)</option>
                  <option value="fullbody">Full Body (+4 levels)</option>
                </select>
              </label>
            </div>
            <div className="flex w-full mb-md">
              <label className="w-full">
                Complexity:
                <select
                  value={npcBonus}
                  onChange={(e) => setNpcBonus(e.target.value as 'simple' | 'medium' | 'complex' | 'human')}
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
              <button type="button" className="button primary" onClick={handleAddNPC}>
                Add NPC
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="button primary" onClick={() => setShowAddNPC(true)}>
            + Add NPC
          </button>
        )}
      </div>

      <div className="calculator-actions">
        <button type="button" className="button primary mb-md" onClick={handleCalculate}>
          Calculate Rewards
        </button>
      </div>
    </div>
  );
}
