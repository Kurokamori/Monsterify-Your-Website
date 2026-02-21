import { useState, useCallback, useEffect } from 'react';

interface Background {
  type: 'none' | 'simple' | 'complex';
}

interface ExternalCharacter {
  name: string;
  appearance: 'bust' | 'halfBody' | 'fullBody';
  complexity: 'simple' | 'average' | 'complex' | 'extravagant';
}

export interface ExternalArtCalculatorValues {
  quality: string;
  backgrounds: Background[];
  characters: ExternalCharacter[];
}

interface ExternalArtCalculatorProps {
  onCalculate: (values: ExternalArtCalculatorValues) => void;
  initialValues?: Partial<ExternalArtCalculatorValues>;
}

export function ExternalArtCalculator({
  onCalculate,
  initialValues = {},
}: ExternalArtCalculatorProps) {
  const [quality, setQuality] = useState(initialValues.quality || 'rendered');
  const [backgrounds, setBackgrounds] = useState<Background[]>(
    initialValues.backgrounds || [{ type: 'none' }]
  );
  const [characters, setCharacters] = useState<ExternalCharacter[]>(
    initialValues.characters || []
  );
  const [showAddBackground, setShowAddBackground] = useState(false);
  const [newBackgroundType, setNewBackgroundType] = useState<'none' | 'simple' | 'complex'>('simple');
  const [showAddCharacter, setShowAddCharacter] = useState(false);

  // Character form state
  const [charName, setCharName] = useState('');
  const [charAppearance, setCharAppearance] = useState<'bust' | 'halfBody' | 'fullBody'>('fullBody');
  const [charComplexity, setCharComplexity] = useState<'simple' | 'average' | 'complex' | 'extravagant'>('average');

  const buildValues = useCallback((): ExternalArtCalculatorValues => {
    return { quality, backgrounds, characters };
  }, [quality, backgrounds, characters]);

  useEffect(() => {
    onCalculate(buildValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, backgrounds, characters]);

  const handleAddBackground = () => {
    if (newBackgroundType === 'none') {
      setBackgrounds([{ type: 'none' }]);
    } else {
      const filtered = backgrounds.filter(bg => bg.type !== 'none');
      setBackgrounds([...filtered, { type: newBackgroundType }]);
    }
    setShowAddBackground(false);
    setNewBackgroundType('simple');
  };

  const handleRemoveBackground = (index: number) => {
    const updated = [...backgrounds];
    updated.splice(index, 1);
    if (updated.length === 0) updated.push({ type: 'none' });
    setBackgrounds(updated);
  };

  const handleAddCharacter = () => {
    const name = charName || `Character ${characters.length + 1}`;
    setCharacters([...characters, { name, appearance: charAppearance, complexity: charComplexity }]);
    setCharName('');
    setCharAppearance('fullBody');
    setCharComplexity('average');
    setShowAddCharacter(false);
  };

  const handleRemoveCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const complexityLabels: Record<string, string> = {
    simple: 'Simple (+1)',
    average: 'Average (+3)',
    complex: 'Complex (+5)',
    extravagant: 'Extravagant (+7)',
  };

  const appearanceLabels: Record<string, string> = {
    bust: 'Bust (+1)',
    halfBody: 'Half Body (+2)',
    fullBody: 'Full Body (+3)',
  };

  return (
    <div className="art-calculator">
      <div className="calculator-section">
        <h4>Image Quality</h4>
        <p className="form-tooltip--section">
          Select the finish level of your artwork. External art levels are halved after calculation.
        </p>
        <div className="form-radio-list">
          {([
            { value: 'sketch', label: 'Sketch', hint: 'Rough or loose drawing. (+2 levels)' },
            { value: 'sketchSet', label: 'Sketch Set', hint: 'Multiple or detailed sketches. (+3 levels)' },
            { value: 'lineArt', label: 'Line Art', hint: 'Clean line work, no color. (+4 levels)' },
            { value: 'flatColor', label: 'Flat Color', hint: 'Colored without complex shading. (+5 levels)' },
            { value: 'rendered', label: 'Rendered', hint: 'Colored and shaded with depth. (+7 levels)' },
            { value: 'polished', label: 'Polished', hint: 'Fully finished with lighting and effects. (+9 levels)' },
          ] as const).map(q => (
            <label key={q.value}>
              <input
                type="radio"
                name="ext-quality"
                value={q.value}
                checked={quality === q.value}
                onChange={(e) => setQuality(e.target.value)}
              />
              {q.label}
              <span className="radio-option-hint">{q.hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="calculator-section">
        <h4>Backgrounds</h4>
        <p className="form-tooltip--section">Add backgrounds drawn in the art.</p>
        <div className="selected-backgrounds">
          {backgrounds.map((bg, index) => (
            <div key={index} className="selected-background">
              <span>
                {bg.type === 'none' ? 'None (+0 levels)' :
                 bg.type === 'simple' ? 'Simple Background (+3 levels)' :
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
                className="select mb-sm"
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
        <h4>Characters</h4>
        <p className="form-tooltip--section">
          Add each character that appears in the artwork. For external art, characters use a simplified complexity system instead of franchise-based stages.
        </p>

        {characters.length === 0 && (
          <div className="empty-selection-message">
            <p>No characters added yet. Add characters to include them in the level calculation.</p>
          </div>
        )}

        <div className="selected-entities">
          {characters.map((char, index) => (
            <div key={index} className="selected-entity">
              <div className="entity-header">
                <span className="entity-name">{char.name}</span>
                <button
                  type="button"
                  className="button danger icon sm no-flex"
                  onClick={() => handleRemoveCharacter(index)}
                >
                  &times;
                </button>
              </div>
              <div className="entity-details">
                <span>Appearance: {appearanceLabels[char.appearance]}</span>
                <span>Complexity: {complexityLabels[char.complexity]}</span>
              </div>
            </div>
          ))}
        </div>

        {showAddCharacter ? (
          <div className="add-entity-form">
            <div className="flex w-full mb-sm">
              <label className="w-full">
                Name (optional):
                <input
                  type="text"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder={`Character ${characters.length + 1}`}
                  className="input"
                />
              </label>
            </div>

            <div className="flex flex-col w-full mb-sm">
              <label className="w-full">Appearance:</label>
              <p className="form-tooltip">How much of the character is visible in the image.</p>
              <select
                value={charAppearance}
                onChange={(e) => setCharAppearance(e.target.value as 'bust' | 'halfBody' | 'fullBody')}
                className="select"
              >
                <option value="bust">Bust (+1 level)</option>
                <option value="halfBody">Half Body (+2 levels)</option>
                <option value="fullBody">Full Body (+3 levels)</option>
              </select>
            </div>

            <div className="flex flex-col w-full mb-sm">
              <label className="w-full">Complexity:</label>
              <p className="form-tooltip">How complex is this character's design.</p>
              <select
                value={charComplexity}
                onChange={(e) => setCharComplexity(e.target.value as 'simple' | 'average' | 'complex' | 'extravagant')}
                className="select"
              >
                <option value="simple">Simple (+1 level)</option>
                <option value="average">Average (+3 levels)</option>
                <option value="complex">Complex (+5 levels)</option>
                <option value="extravagant">Extravagant (+7 levels)</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setShowAddCharacter(false)}>
                Cancel
              </button>
              <button type="button" className="button primary" onClick={handleAddCharacter}>
                Add Character
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="button primary" onClick={() => setShowAddCharacter(true)}>
            + Add Character
          </button>
        )}
      </div>

      <div className="calculator-actions">
        <button type="button" className="button primary mb-md" onClick={() => onCalculate(buildValues())}>
          Calculate Rewards
        </button>
      </div>
    </div>
  );
}
