import { useCallback } from 'react';
import type { CardData, CardField, CardLayout, CardCustomization, ContentLayoutMode, GenderFieldMode } from './types';
import { LAYOUT_PRESETS, ASPECT_RATIOS } from './types';
import { EXTRA_TRAINER_FIELDS, EXTRA_MONSTER_FIELDS, getTrainerFieldValue, getMonsterFieldValue, splitGenderField, combineGenderFields } from './cardDataUtils';
import type { Trainer } from '@components/trainers/types/Trainer';
import type { Monster } from '@services/monsterService';

interface CardEditorProps {
  card: CardData;
  onChange: (card: CardData) => void;
  sourceTrainer: Trainer | null;
  sourceMonster: Monster | null;
}

export const CardEditor = ({ card, onChange, sourceTrainer, sourceMonster }: CardEditorProps) => {
  const { customization, fields } = card;

  const updateCustomization = useCallback((updates: Partial<CardCustomization>) => {
    onChange({ ...card, customization: { ...customization, ...updates } });
  }, [card, customization, onChange]);

  const updateLayout = useCallback((updates: Partial<CardLayout>) => {
    onChange({
      ...card,
      customization: {
        ...customization,
        layout: { ...customization.layout, ...updates },
      },
    });
  }, [card, customization, onChange]);

  const updateField = useCallback((fieldId: string, updates: Partial<CardField>) => {
    onChange({
      ...card,
      fields: fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
    });
  }, [card, fields, onChange]);

  const removeField = useCallback((fieldId: string) => {
    onChange({ ...card, fields: fields.filter(f => f.id !== fieldId) });
  }, [card, fields, onChange]);

  const addCustomField = useCallback(() => {
    const id = `custom_${Date.now()}`;
    onChange({
      ...card,
      fields: [...fields, { id, label: 'New Field', value: '', visible: true, isCustom: true, kind: 'text' }],
    });
  }, [card, fields, onChange]);

  const addExtraField = useCallback((fieldId: string, label: string) => {
    if (fields.some(f => f.id === fieldId)) return;
    let value = '';
    if (sourceTrainer) {
      value = getTrainerFieldValue(sourceTrainer, fieldId);
    } else if (sourceMonster) {
      value = getMonsterFieldValue(sourceMonster, fieldId);
    }
    onChange({
      ...card,
      fields: [...fields, { id: fieldId, label, value, visible: true, isCustom: false, kind: 'text' }],
    });
  }, [card, fields, sourceTrainer, sourceMonster, onChange]);

  const moveField = useCallback((fieldId: string, direction: -1 | 1) => {
    const idx = fields.findIndex(f => f.id === fieldId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= fields.length) return;
    const newFields = [...fields];
    [newFields[idx], newFields[newIdx]] = [newFields[newIdx], newFields[idx]];
    onChange({ ...card, fields: newFields });
  }, [card, fields, onChange]);

  // Available extra fields not yet added
  const extraFields = card.subject === 'trainer'
    ? EXTRA_TRAINER_FIELDS.filter(ef => !fields.some(f => f.id === ef.id))
    : card.subject === 'monster'
      ? EXTRA_MONSTER_FIELDS.filter(ef => !fields.some(f => f.id === ef.id))
      : [];

  return (
    <div className="ccc-editor">
      {/* Layout Presets */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-palette"></i> Layout Preset
        </h3>
        <div className="ccc-editor__presets">
          {LAYOUT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`ccc-editor__preset ${customization.layout.id === preset.id ? 'ccc-editor__preset--active' : ''}`}
              onClick={() => updateCustomization({ layout: preset })}
              style={{
                background: preset.primaryColor,
                borderColor: preset.borderColor,
                color: preset.textColor,
              }}
            >
              <span className="ccc-editor__preset-swatch" style={{ background: preset.accentColor }} />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-eye-dropper"></i> Colors
        </h3>
        <div className="ccc-editor__color-grid">
          <ColorPicker label="Primary" value={customization.layout.primaryColor} onChange={(v) => updateLayout({ primaryColor: v })} />
          <ColorPicker label="Secondary" value={customization.layout.secondaryColor} onChange={(v) => updateLayout({ secondaryColor: v })} />
          <ColorPicker label="Border" value={customization.layout.borderColor} onChange={(v) => updateLayout({ borderColor: v })} />
          <ColorPicker label="Text" value={customization.layout.textColor} onChange={(v) => updateLayout({ textColor: v })} />
          <ColorPicker label="Heading" value={customization.layout.headingColor} onChange={(v) => updateLayout({ headingColor: v })} />
          <ColorPicker label="Accent" value={customization.layout.accentColor} onChange={(v) => updateLayout({ accentColor: v })} />
        </div>
        <label className="ccc-editor__checkbox">
          <input
            type="checkbox"
            checked={customization.useHeadingColor}
            onChange={(e) => updateCustomization({ useHeadingColor: e.target.checked })}
          />
          Use separate heading color
        </label>
      </div>

      {/* Typography */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-font"></i> Typography
        </h3>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Heading Size</label>
          <input
            type="range" min={10} max={24} value={customization.headingFontSize}
            onChange={(e) => updateCustomization({ headingFontSize: Number(e.target.value) })}
          />
          <span className="ccc-editor__range-value">{customization.headingFontSize}px</span>
        </div>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Body Size</label>
          <input
            type="range" min={8} max={18} value={customization.paragraphFontSize}
            onChange={(e) => updateCustomization({ paragraphFontSize: Number(e.target.value) })}
          />
          <span className="ccc-editor__range-value">{customization.paragraphFontSize}px</span>
        </div>
      </div>

      {/* Layout */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-expand-arrows-alt"></i> Layout
        </h3>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Aspect Ratio</label>
          <select
            className="ccc-editor__select"
            value={customization.aspectRatio}
            onChange={(e) => updateCustomization({ aspectRatio: e.target.value })}
          >
            {ASPECT_RATIOS.map((ar) => (
              <option key={ar.value} value={ar.value}>{ar.label}</option>
            ))}
          </select>
        </div>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Image Size</label>
          <input
            type="range" min={20} max={70} value={customization.imageSize}
            onChange={(e) => updateCustomization({ imageSize: Number(e.target.value) })}
          />
          <span className="ccc-editor__range-value">{customization.imageSize}%</span>
        </div>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Border Radius</label>
          <input
            type="range" min={0} max={24} value={customization.layout.borderRadius}
            onChange={(e) => updateLayout({ borderRadius: Number(e.target.value) })}
          />
          <span className="ccc-editor__range-value">{customization.layout.borderRadius}px</span>
        </div>
      </div>

      {/* Image */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-image"></i> Image
        </h3>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Fit</label>
          <div className="ccc-editor__toggle-group">
            <button
              className={`ccc-editor__toggle ${customization.imageObjectFit === 'cover' ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => updateCustomization({ imageObjectFit: 'cover' })}
            >Cover</button>
            <button
              className={`ccc-editor__toggle ${customization.imageObjectFit === 'contain' ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => updateCustomization({ imageObjectFit: 'contain' })}
            >Contain</button>
          </div>
        </div>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Scale</label>
          <input
            type="range" min={100} max={200} value={customization.imageScale}
            onChange={(e) => updateCustomization({ imageScale: Number(e.target.value) })}
          />
          <span className="ccc-editor__range-value">{customization.imageScale}%</span>
        </div>
        {customization.imageObjectFit === 'cover' && (
          <>
            <div className="ccc-editor__row">
              <label className="ccc-editor__label">Position X</label>
              <input
                type="range" min={0} max={100} value={customization.imagePositionX}
                onChange={(e) => updateCustomization({ imagePositionX: Number(e.target.value) })}
              />
              <span className="ccc-editor__range-value">{customization.imagePositionX}%</span>
            </div>
            <div className="ccc-editor__row">
              <label className="ccc-editor__label">Position Y</label>
              <input
                type="range" min={0} max={100} value={customization.imagePositionY}
                onChange={(e) => updateCustomization({ imagePositionY: Number(e.target.value) })}
              />
              <span className="ccc-editor__range-value">{customization.imagePositionY}%</span>
            </div>
          </>
        )}
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Content Padding</label>
          <input
            type="range" min={4} max={40} value={customization.contentPadding}
            onChange={(e) => updateCustomization({ contentPadding: Number(e.target.value) })}
          />
          <span className="ccc-editor__range-value">{customization.contentPadding}px</span>
        </div>
      </div>

      {/* Content Layout */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-th-large"></i> Content Layout
        </h3>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Mode</label>
          <div className="ccc-editor__toggle-group">
            {([
              { value: 'simple', label: 'Simple' },
              { value: 'two-column', label: '2-Col' },
              { value: 'panelled', label: 'Panelled' },
              { value: 'compact', label: 'Compact' },
              { value: 'two-column-panelled', label: '2-Col Panel' },
              { value: 'two-column-combined', label: '2-Col Combined' },
            ] as { value: ContentLayoutMode; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                className={`ccc-editor__toggle ${customization.contentLayout === opt.value ? 'ccc-editor__toggle--active' : ''}`}
                onClick={() => updateCustomization({ contentLayout: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Field Gap</label>
          <input
            type="range" min={0} max={16} value={customization.contentGap}
            onChange={(e) => updateCustomization({ contentGap: Number(e.target.value) })}
          />
          <span className="ccc-editor__range-value">{customization.contentGap}px</span>
        </div>
        {(customization.contentLayout === 'panelled' || customization.contentLayout === 'two-column-panelled' || customization.contentLayout === 'two-column-combined') && (
          <div className="ccc-editor__row">
            <ColorPicker label="Panel Border" value={customization.panelBorderColor} onChange={(v) => updateCustomization({ panelBorderColor: v })} />
          </div>
        )}
      </div>

      {/* Display Options */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-cogs"></i> Display
        </h3>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Types</label>
          <div className="ccc-editor__toggle-group">
            <button
              className={`ccc-editor__toggle ${customization.typeDisplay === 'badges' ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => updateCustomization({ typeDisplay: 'badges' })}
            >Badges</button>
            <button
              className={`ccc-editor__toggle ${customization.typeDisplay === 'text' ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => updateCustomization({ typeDisplay: 'text' })}
            >Text</button>
          </div>
        </div>
        <div className="ccc-editor__row">
          <label className="ccc-editor__label">Gender</label>
          <div className="ccc-editor__toggle-group">
            <button
              className={`ccc-editor__toggle ${customization.genderDisplay === 'symbol' ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => updateCustomization({ genderDisplay: 'symbol' })}
            >Symbol</button>
            <button
              className={`ccc-editor__toggle ${customization.genderDisplay === 'word' ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => updateCustomization({ genderDisplay: 'word' })}
            >Word</button>
          </div>
        </div>
        {customization.genderDisplay === 'symbol' && (
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Symbol Color</label>
            <div className="ccc-editor__toggle-group">
              <button
                className={`ccc-editor__toggle ${customization.genderSymbolColor === 'gendered' ? 'ccc-editor__toggle--active' : ''}`}
                onClick={() => updateCustomization({ genderSymbolColor: 'gendered' })}
              >Blue/Pink</button>
              <button
                className={`ccc-editor__toggle ${customization.genderSymbolColor === 'text' ? 'ccc-editor__toggle--active' : ''}`}
                onClick={() => updateCustomization({ genderSymbolColor: 'text' })}
              >Text Color</button>
            </div>
          </div>
        )}
        {card.stats && (
          <label className="ccc-editor__checkbox">
            <input
              type="checkbox"
              checked={customization.showStatBars}
              onChange={(e) => updateCustomization({ showStatBars: e.target.checked })}
            />
            Show stat bars
          </label>
        )}
        {card.subject === 'trainer' && (
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Gender Fields</label>
            <div className="ccc-editor__toggle-group">
              {(['combined', 'split'] as GenderFieldMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`ccc-editor__toggle ${customization.genderFieldMode === mode ? 'ccc-editor__toggle--active' : ''}`}
                  onClick={() => {
                    const newFields = mode === 'split'
                      ? splitGenderField(fields, sourceTrainer)
                      : combineGenderFields(fields);
                    onChange({ ...card, fields: newFields, customization: { ...customization, genderFieldMode: mode } });
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-list"></i> Fields
        </h3>
        <div className="ccc-editor__fields">
          {fields.map((field, idx) => (
            <div key={field.id} className="ccc-editor__field-row">
              <div className="ccc-editor__field-controls">
                <button
                  className="ccc-editor__field-move"
                  onClick={() => moveField(field.id, -1)}
                  disabled={idx === 0}
                  title="Move up"
                >
                  <i className="fas fa-chevron-up"></i>
                </button>
                <button
                  className="ccc-editor__field-move"
                  onClick={() => moveField(field.id, 1)}
                  disabled={idx === fields.length - 1}
                  title="Move down"
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
              <label className="ccc-editor__field-toggle">
                <input
                  type="checkbox"
                  checked={field.visible}
                  onChange={(e) => updateField(field.id, { visible: e.target.checked })}
                />
              </label>
              <input
                type="text"
                className="ccc-editor__field-label-input"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                placeholder="Label"
              />
              {field.kind === 'text' || field.isCustom ? (
                <input
                  type="text"
                  className="ccc-editor__field-value-input"
                  value={field.value}
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                  placeholder="Value"
                />
              ) : (
                <input
                  type="text"
                  className="ccc-editor__field-value-input"
                  value={field.value}
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                  placeholder="Value"
                />
              )}
              <button
                className="ccc-editor__field-remove"
                onClick={() => removeField(field.id)}
                title="Remove field"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="ccc-editor__field-actions">
          <button className="button secondary sm" onClick={addCustomField}>
            <i className="fas fa-plus"></i> Custom Field
          </button>
          {extraFields.length > 0 && (
            <select
              className="ccc-editor__select"
              value=""
              onChange={(e) => {
                const ef = extraFields.find(f => f.id === e.target.value);
                if (ef) addExtraField(ef.id, ef.label);
              }}
            >
              <option value="" disabled>Add database field...</option>
              {extraFields.map((ef) => (
                <option key={ef.id} value={ef.id}>{ef.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Color Picker Sub-component ---

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="ccc-editor__color-picker">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ccc-editor__color-input"
      />
      <span className="ccc-editor__color-label">{label}</span>
    </div>
  );
}
