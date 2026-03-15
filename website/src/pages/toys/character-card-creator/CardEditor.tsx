import { useCallback, useState } from 'react';
import type { CardData, CardField, CardLayout, CardCustomization, ContentLayoutMode, GenderFieldMode, PaletteConfig, PaletteStyle, PaletteOrientation, PaletteSizing, PaletteColor, CardSection, ImageGridSection, ImageCalloutSection, FeaturedMonstersSection, FeaturedMonsterItem, ImageStyleConfig, ImageBackgroundShape, ImageObjectFit, SectionJustification, GridImage } from './types';
import { LAYOUT_PRESETS, ASPECT_RATIOS, createImageGridSection, createImageCalloutSection, createFeaturedMonstersSection } from './types';
import { EXTRA_TRAINER_FIELDS, EXTRA_MONSTER_FIELDS, getTrainerFieldValue, getMonsterFieldValue, splitGenderField, combineGenderFields } from './cardDataUtils';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import { MonsterAutocomplete } from '@components/common/MonsterAutocomplete';
import monsterService from '@services/monsterService';
import type { Trainer } from '@components/trainers/types/Trainer';
import type { Monster } from '@services/monsterService';

interface CardEditorProps {
  card: CardData;
  onChange: (card: CardData) => void;
  sourceTrainer: Trainer | null;
  sourceMonster: Monster | null;
  trainers: Trainer[];
}

export const CardEditor = ({ card, onChange, sourceTrainer, sourceMonster, trainers }: CardEditorProps) => {
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

      {/* Color Palette */}
      <PaletteEditor
        palette={customization.palette}
        onChange={(palette) => updateCustomization({ palette })}
        imageSrc={card.imageFile ? URL.createObjectURL(card.imageFile) : card.image}
      />

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

      {/* Sections (Image Grids & Callouts) */}
      <div className="ccc-editor__section">
        <h3 className="ccc-editor__section-title">
          <i className="fas fa-th"></i> Sections
        </h3>
        <p className="ccc-editor__section-hint">Add image grids and callouts below the card fields.</p>
        {card.sections.map((section, idx) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={idx}
            total={card.sections.length}
            panelBorderColor={customization.panelBorderColor}
            trainers={trainers}
            onChange={(updated) => {
              const newSections = card.sections.map(s => s.id === updated.id ? updated : s);
              onChange({ ...card, sections: newSections });
            }}
            onRemove={() => {
              onChange({ ...card, sections: card.sections.filter(s => s.id !== section.id) });
            }}
            onMove={(dir) => {
              const newIdx = idx + dir;
              if (newIdx < 0 || newIdx >= card.sections.length) return;
              const newSections = [...card.sections];
              [newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]];
              onChange({ ...card, sections: newSections });
            }}
          />
        ))}
        <div className="ccc-editor__field-actions">
          <button className="button secondary sm" onClick={() => onChange({ ...card, sections: [...card.sections, createImageGridSection()] })}>
            <i className="fas fa-th"></i> Add Image Grid
          </button>
          <button className="button secondary sm" onClick={() => onChange({ ...card, sections: [...card.sections, createImageCalloutSection()] })}>
            <i className="fas fa-columns"></i> Add Image Callout
          </button>
          <button className="button secondary sm" onClick={() => onChange({ ...card, sections: [...card.sections, createFeaturedMonstersSection()] })}>
            <i className="fas fa-dragon"></i> Add Featured Monsters
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Palette Editor Sub-component ---

function PaletteEditor({ palette, onChange, imageSrc }: {
  palette: PaletteConfig;
  onChange: (p: PaletteConfig) => void;
  imageSrc: string | null;
}) {
  const updatePalette = (updates: Partial<PaletteConfig>) => {
    onChange({ ...palette, ...updates });
  };

  const updateColor = (index: number, updates: Partial<PaletteColor>) => {
    const newColors = palette.colors.map((c, i) => i === index ? { ...c, ...updates } : c);
    onChange({ ...palette, colors: newColors });
  };

  const addColor = () => {
    onChange({ ...palette, colors: [...palette.colors, { color: '#888888', size: 100 / (palette.colors.length + 1) }] });
  };

  const removeColor = (index: number) => {
    if (palette.colors.length <= 1) return;
    onChange({ ...palette, colors: palette.colors.filter((_, i) => i !== index) });
  };

  // Eye-dropper (uses EyeDropper API if available)
  const pickFromImage = async (index: number) => {
    if ('EyeDropper' in window) {
      try {
        const dropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
        const result = await dropper.open();
        updateColor(index, { color: result.sRGBHex });
      } catch {
        // User cancelled
      }
    }
  };

  const hasEyeDropper = 'EyeDropper' in window;

  return (
    <div className="ccc-editor__section">
      <h3 className="ccc-editor__section-title">
        <i className="fas fa-swatchbook"></i> Color Palette
      </h3>
      <label className="ccc-editor__checkbox">
        <input
          type="checkbox"
          checked={palette.enabled}
          onChange={(e) => updatePalette({ enabled: e.target.checked })}
        />
        Show color palette
      </label>

      {palette.enabled && (
        <>
          {/* Style */}
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Style</label>
            <div className="ccc-editor__toggle-group">
              {([
                { value: 'rectangles', label: 'Rectangles' },
                { value: 'circles', label: 'Circles' },
                { value: 'slanted', label: 'Slanted' },
              ] as { value: PaletteStyle; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  className={`ccc-editor__toggle ${palette.style === opt.value ? 'ccc-editor__toggle--active' : ''}`}
                  onClick={() => updatePalette({ style: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Direction</label>
            <div className="ccc-editor__toggle-group">
              {([
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'vertical', label: 'Vertical' },
              ] as { value: PaletteOrientation; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  className={`ccc-editor__toggle ${palette.orientation === opt.value ? 'ccc-editor__toggle--active' : ''}`}
                  onClick={() => updatePalette({ orientation: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sizing mode */}
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Sizing</label>
            <div className="ccc-editor__toggle-group">
              {([
                { value: 'uniform', label: 'Uniform' },
                { value: 'custom', label: 'Custom' },
              ] as { value: PaletteSizing; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  className={`ccc-editor__toggle ${palette.sizing === opt.value ? 'ccc-editor__toggle--active' : ''}`}
                  onClick={() => updatePalette({ sizing: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Size</label>
            <input
              type="range" min={16} max={80} value={palette.height}
              onChange={(e) => updatePalette({ height: Number(e.target.value) })}
            />
            <span className="ccc-editor__range-value">{palette.height}px</span>
          </div>

          {/* Gap */}
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Gap</label>
            <input
              type="range" min={0} max={16} value={palette.gap}
              onChange={(e) => updatePalette({ gap: Number(e.target.value) })}
            />
            <span className="ccc-editor__range-value">{palette.gap}px</span>
          </div>

          {/* Swatch Radius */}
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Roundness</label>
            <input
              type="range" min={0} max={palette.style === 'circles' ? 50 : 20} value={palette.swatchRadius}
              onChange={(e) => updatePalette({ swatchRadius: Number(e.target.value) })}
            />
            <span className="ccc-editor__range-value">{palette.swatchRadius}px</span>
          </div>

          {/* Border */}
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Border Width</label>
            <input
              type="range" min={0} max={6} value={palette.swatchBorderWidth}
              onChange={(e) => updatePalette({ swatchBorderWidth: Number(e.target.value) })}
            />
            <span className="ccc-editor__range-value">{palette.swatchBorderWidth}px</span>
          </div>
          {palette.swatchBorderWidth > 0 && (
            <div className="ccc-editor__row">
              <ColorPicker label="Border Color" value={palette.swatchBorderColor} onChange={(v) => updatePalette({ swatchBorderColor: v })} />
            </div>
          )}

          {/* Skew angle (slanted only) */}
          {palette.style === 'slanted' && (
            <div className="ccc-editor__row">
              <label className="ccc-editor__label">Skew</label>
              <input
                type="range" min={-45} max={45} value={palette.skewAngle}
                onChange={(e) => updatePalette({ skewAngle: Number(e.target.value) })}
              />
              <span className="ccc-editor__range-value">{palette.skewAngle}°</span>
            </div>
          )}

          {/* Color swatches */}
          <div className="ccc-palette-editor__colors">
            {palette.colors.map((c, idx) => (
              <div key={idx} className="ccc-palette-editor__color-row">
                <input
                  type="color"
                  value={c.color}
                  onChange={(e) => updateColor(idx, { color: e.target.value })}
                  className="ccc-editor__color-input"
                />
                {hasEyeDropper && imageSrc && (
                  <button
                    className="ccc-palette-editor__eyedropper"
                    onClick={() => pickFromImage(idx)}
                    title="Pick color from screen"
                  >
                    <i className="fas fa-eye-dropper"></i>
                  </button>
                )}
                {palette.sizing === 'custom' && (
                  <input
                    type="range" min={5} max={100} value={c.size}
                    onChange={(e) => updateColor(idx, { size: Number(e.target.value) })}
                    className="ccc-palette-editor__size-slider"
                  />
                )}
                <button
                  className="ccc-editor__field-remove"
                  onClick={() => removeColor(idx)}
                  disabled={palette.colors.length <= 1}
                  title="Remove color"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
          <button className="button secondary sm" onClick={addColor}>
            <i className="fas fa-plus"></i> Add Color
          </button>
        </>
      )}
    </div>
  );
}

// --- Section Editor Sub-component ---

const SECTION_ICONS: Record<CardSection['type'], string> = {
  'image-grid': 'fa-th',
  'image-callout': 'fa-columns',
  'featured-monsters': 'fa-dragon',
};

const SECTION_LABELS: Record<CardSection['type'], string> = {
  'image-grid': 'Image Grid',
  'image-callout': 'Image Callout',
  'featured-monsters': 'Featured Monsters',
};

function SectionEditor({ section, index, total, panelBorderColor, trainers, onChange, onRemove, onMove }: {
  section: CardSection;
  index: number;
  total: number;
  panelBorderColor: string;
  trainers: Trainer[];
  onChange: (s: CardSection) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="ccc-editor__subsection" style={{ border: `1px solid ${panelBorderColor}`, borderRadius: 6, padding: 10, marginBottom: 8 }}>
      <div className="ccc-editor__subsection-header">
        <span className="ccc-editor__subsection-label">
          <i className={`fas ${SECTION_ICONS[section.type]}`}></i>
          {' '}{SECTION_LABELS[section.type]}
        </span>
        <div className="ccc-editor__subsection-actions">
          <button className="ccc-editor__field-move" onClick={() => onMove(-1)} disabled={index === 0} title="Move up">
            <i className="fas fa-chevron-up"></i>
          </button>
          <button className="ccc-editor__field-move" onClick={() => onMove(1)} disabled={index === total - 1} title="Move down">
            <i className="fas fa-chevron-down"></i>
          </button>
          <button className="ccc-editor__field-remove" onClick={onRemove} title="Remove section">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {section.type === 'image-grid' && (
        <ImageGridEditor section={section} onChange={(s) => onChange(s)} />
      )}
      {section.type === 'image-callout' && (
        <ImageCalloutEditor section={section} onChange={(s) => onChange(s)} />
      )}
      {section.type === 'featured-monsters' && (
        <FeaturedMonstersEditor section={section} trainers={trainers} onChange={(s) => onChange(s)} />
      )}
    </div>
  );
}

// --- Image Grid Editor ---

function ImageGridEditor({ section, onChange }: {
  section: ImageGridSection;
  onChange: (s: ImageGridSection) => void;
}) {
  const addImage = () => {
    onChange({
      ...section,
      images: [...section.images, { id: `img_${Date.now()}`, url: '', file: null }],
    });
  };

  const updateImage = (imgId: string, updates: Partial<GridImage>) => {
    onChange({
      ...section,
      images: section.images.map(img => img.id === imgId ? { ...img, ...updates } : img),
    });
  };

  const removeImage = (imgId: string) => {
    onChange({
      ...section,
      images: section.images.filter(img => img.id !== imgId),
    });
  };

  const handleImageFile = (imgId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateImage(imgId, { file, url: '' });
  };

  return (
    <div className="ccc-editor__grid-editor">
      {/* Heading */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Heading</label>
        <input
          type="text"
          className="ccc-editor__field-value-input"
          value={section.heading}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder="Section heading..."
        />
      </div>

      {/* Grid dimensions */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Columns</label>
        <input
          type="range" min={1} max={6} value={section.columns}
          onChange={(e) => onChange({ ...section, columns: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.columns}</span>
      </div>
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Rows</label>
        <input
          type="range" min={1} max={6} value={section.rows}
          onChange={(e) => onChange({ ...section, rows: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.rows}</span>
      </div>

      {/* Justification */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Justify</label>
        <div className="ccc-editor__toggle-group">
          {(['left', 'center', 'right'] as SectionJustification[]).map((j) => (
            <button
              key={j}
              className={`ccc-editor__toggle ${section.justification === j ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => onChange({ ...section, justification: j })}
            >
              {j.charAt(0).toUpperCase() + j.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Scale */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Grid Size</label>
        <input
          type="range" min={20} max={100} value={section.gridScale}
          onChange={(e) => onChange({ ...section, gridScale: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.gridScale}%</span>
      </div>

      {/* Border */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Border Width</label>
        <input
          type="range" min={0} max={6} value={section.borderWidth}
          onChange={(e) => onChange({ ...section, borderWidth: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.borderWidth}px</span>
      </div>
      {section.borderWidth > 0 && (
        <div className="ccc-editor__row">
          <ColorPicker label="Border Color" value={section.borderColor} onChange={(v) => onChange({ ...section, borderColor: v })} />
        </div>
      )}

      {/* Image Style */}
      <ImageStyleEditor
        style={section.imageStyle}
        onChange={(imageStyle) => onChange({ ...section, imageStyle })}
      />

      {/* Images list */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Images ({section.images.length})</label>
      </div>
      <div className="ccc-editor__images-list">
        {section.images.map((img) => (
          <div key={img.id} className="ccc-editor__image-item">
            <div className="ccc-editor__image-item-preview">
              {(img.file || img.url) ? (
                <img
                  src={img.file ? URL.createObjectURL(img.file) : img.url}
                  alt=""
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                />
              ) : (
                <div style={{ width: 40, height: 40, background: 'rgba(128,128,128,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-image" style={{ opacity: 0.4 }}></i>
                </div>
              )}
            </div>
            <input
              type="text"
              className="ccc-editor__field-value-input"
              value={img.url}
              onChange={(e) => updateImage(img.id, { url: e.target.value, file: null })}
              placeholder="Image URL..."
              style={{ flex: 1 }}
            />
            <label className="button secondary sm" style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
              <i className="fas fa-upload"></i>
              <input type="file" accept="image/*" onChange={(e) => handleImageFile(img.id, e)} style={{ display: 'none' }} />
            </label>
            <button className="ccc-editor__field-remove" onClick={() => removeImage(img.id)} title="Remove image">
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>
      <button className="button secondary sm" onClick={addImage}>
        <i className="fas fa-plus"></i> Add Image
      </button>
    </div>
  );
}

// --- Image Callout Editor ---

function ImageCalloutEditor({ section, onChange }: {
  section: ImageCalloutSection;
  onChange: (s: ImageCalloutSection) => void;
}) {
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ ...section, image: { ...section.image, file, url: '' } });
  };

  return (
    <div className="ccc-editor__callout-editor">
      {/* Heading */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Heading</label>
        <input
          type="text"
          className="ccc-editor__field-value-input"
          value={section.heading}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder="Section heading..."
        />
      </div>

      {/* Body */}
      <div className="ccc-editor__row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <label className="ccc-editor__label">Body Text</label>
        <textarea
          className="ccc-editor__textarea"
          value={section.body}
          onChange={(e) => onChange({ ...section, body: e.target.value })}
          placeholder="Body text..."
          rows={3}
        />
      </div>

      {/* Image Position */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Image Side</label>
        <div className="ccc-editor__toggle-group">
          <button
            className={`ccc-editor__toggle ${section.imagePosition === 'left' ? 'ccc-editor__toggle--active' : ''}`}
            onClick={() => onChange({ ...section, imagePosition: 'left' })}
          >Left</button>
          <button
            className={`ccc-editor__toggle ${section.imagePosition === 'right' ? 'ccc-editor__toggle--active' : ''}`}
            onClick={() => onChange({ ...section, imagePosition: 'right' })}
          >Right</button>
        </div>
      </div>

      {/* Image Size */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Image Size</label>
        <input
          type="range" min={20} max={80} value={section.imageSizePercent}
          onChange={(e) => onChange({ ...section, imageSizePercent: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.imageSizePercent}%</span>
      </div>

      {/* Border */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Border Width</label>
        <input
          type="range" min={0} max={6} value={section.borderWidth}
          onChange={(e) => onChange({ ...section, borderWidth: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.borderWidth}px</span>
      </div>
      {section.borderWidth > 0 && (
        <div className="ccc-editor__row">
          <ColorPicker label="Border Color" value={section.borderColor} onChange={(v) => onChange({ ...section, borderColor: v })} />
        </div>
      )}

      {/* Image Style */}
      <ImageStyleEditor
        style={section.imageStyle}
        onChange={(imageStyle) => onChange({ ...section, imageStyle })}
      />

      {/* Image upload */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Image</label>
      </div>
      <div className="ccc-editor__image-item">
        <div className="ccc-editor__image-item-preview">
          {(section.image.file || section.image.url) ? (
            <img
              src={section.image.file ? URL.createObjectURL(section.image.file) : section.image.url}
              alt=""
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
            />
          ) : (
            <div style={{ width: 40, height: 40, background: 'rgba(128,128,128,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-image" style={{ opacity: 0.4 }}></i>
            </div>
          )}
        </div>
        <input
          type="text"
          className="ccc-editor__field-value-input"
          value={section.image.url}
          onChange={(e) => onChange({ ...section, image: { ...section.image, url: e.target.value, file: null } })}
          placeholder="Image URL..."
          style={{ flex: 1 }}
        />
        <label className="button secondary sm" style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
          <i className="fas fa-upload"></i>
          <input type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
        </label>
        {(section.image.file || section.image.url) && (
          <button className="ccc-editor__field-remove" onClick={() => onChange({ ...section, image: { ...section.image, url: '', file: null } })} title="Clear image">
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
}

// --- Featured Monsters Editor ---

function FeaturedMonstersEditor({ section, trainers, onChange }: {
  section: FeaturedMonstersSection;
  trainers: Trainer[];
  onChange: (s: FeaturedMonstersSection) => void;
}) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | number | null>(null);
  const [availableMonsters, setAvailableMonsters] = useState<Monster[]>([]);
  const [loadingMonsters, setLoadingMonsters] = useState(false);

  const handleTrainerSelect = async (trainerId: string | number | null) => {
    setSelectedTrainerId(trainerId);
    if (!trainerId) {
      setAvailableMonsters([]);
      return;
    }
    setLoadingMonsters(true);
    try {
      const data = await monsterService.getTrainerMonsters(trainerId);
      const monsters = Array.isArray(data) ? data : data.monsters || data.data || [];
      setAvailableMonsters(monsters);
    } catch {
      setAvailableMonsters([]);
    } finally {
      setLoadingMonsters(false);
    }
  };

  const handleMonsterAdd = (monsterId: string | number | null) => {
    if (!monsterId) return;
    const monster = availableMonsters.find(m => m.id === monsterId);
    if (!monster) return;
    const m = monster as Record<string, unknown>;
    // Avoid duplicates
    if (section.monsters.some(fm => fm.monsterId === Number(monsterId))) return;
    const item: FeaturedMonsterItem = {
      id: `fm_${Date.now()}_${monsterId}`,
      monsterId: Number(monsterId),
      name: (m.name as string) || 'Monster',
      imageUrl: (m.img_link as string) || '',
      objectFit: section.globalObjectFit,
      scale: section.globalScale,
      positionX: section.globalPositionX,
      positionY: section.globalPositionY,
      useOverride: false,
    };
    onChange({ ...section, monsters: [...section.monsters, item] });
  };

  const updateMonster = (itemId: string, updates: Partial<FeaturedMonsterItem>) => {
    onChange({
      ...section,
      monsters: section.monsters.map(m => m.id === itemId ? { ...m, ...updates } : m),
    });
  };

  const removeMonster = (itemId: string) => {
    onChange({ ...section, monsters: section.monsters.filter(m => m.id !== itemId) });
  };

  const moveMonster = (itemId: string, dir: -1 | 1) => {
    const idx = section.monsters.findIndex(m => m.id === itemId);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= section.monsters.length) return;
    const newMonsters = [...section.monsters];
    [newMonsters[idx], newMonsters[newIdx]] = [newMonsters[newIdx], newMonsters[idx]];
    onChange({ ...section, monsters: newMonsters });
  };

  return (
    <div className="ccc-editor__grid-editor">
      {/* Heading */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Heading</label>
        <input
          type="text"
          className="ccc-editor__field-value-input"
          value={section.heading}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder="Section heading..."
        />
      </div>

      {/* Grid dimensions */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Columns</label>
        <input
          type="range" min={1} max={6} value={section.columns}
          onChange={(e) => onChange({ ...section, columns: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.columns}</span>
      </div>
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Rows</label>
        <input
          type="range" min={1} max={6} value={section.rows}
          onChange={(e) => onChange({ ...section, rows: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.rows}</span>
      </div>

      {/* Justification */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Justify</label>
        <div className="ccc-editor__toggle-group">
          {(['left', 'center', 'right'] as SectionJustification[]).map((j) => (
            <button
              key={j}
              className={`ccc-editor__toggle ${section.justification === j ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => onChange({ ...section, justification: j })}
            >
              {j.charAt(0).toUpperCase() + j.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Show names */}
      <label className="ccc-editor__checkbox">
        <input
          type="checkbox"
          checked={section.showNames}
          onChange={(e) => onChange({ ...section, showNames: e.target.checked })}
        />
        Show monster names
      </label>

      {/* Grid Scale */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Grid Size</label>
        <input
          type="range" min={20} max={100} value={section.gridScale}
          onChange={(e) => onChange({ ...section, gridScale: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.gridScale}%</span>
      </div>

      {/* Border */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Border Width</label>
        <input
          type="range" min={0} max={6} value={section.borderWidth}
          onChange={(e) => onChange({ ...section, borderWidth: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.borderWidth}px</span>
      </div>
      {section.borderWidth > 0 && (
        <div className="ccc-editor__row">
          <ColorPicker label="Border Color" value={section.borderColor} onChange={(v) => onChange({ ...section, borderColor: v })} />
        </div>
      )}

      {/* Image Style */}
      <ImageStyleEditor
        style={section.imageStyle}
        onChange={(imageStyle) => onChange({ ...section, imageStyle })}
      />

      {/* Global Image Settings */}
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Default Fit</label>
        <div className="ccc-editor__toggle-group">
          {(['cover', 'contain'] as ImageObjectFit[]).map((fit) => (
            <button
              key={fit}
              className={`ccc-editor__toggle ${section.globalObjectFit === fit ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => onChange({ ...section, globalObjectFit: fit })}
            >
              {fit.charAt(0).toUpperCase() + fit.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Default Scale</label>
        <input
          type="range" min={100} max={300} value={section.globalScale}
          onChange={(e) => onChange({ ...section, globalScale: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{section.globalScale}%</span>
      </div>
      {section.globalObjectFit === 'cover' && (
        <>
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Default Pos X</label>
            <input
              type="range" min={0} max={100} value={section.globalPositionX}
              onChange={(e) => onChange({ ...section, globalPositionX: Number(e.target.value) })}
            />
            <span className="ccc-editor__range-value">{section.globalPositionX}%</span>
          </div>
          <div className="ccc-editor__row">
            <label className="ccc-editor__label">Default Pos Y</label>
            <input
              type="range" min={0} max={100} value={section.globalPositionY}
              onChange={(e) => onChange({ ...section, globalPositionY: Number(e.target.value) })}
            />
            <span className="ccc-editor__range-value">{section.globalPositionY}%</span>
          </div>
        </>
      )}

      {/* Add Monster Picker */}
      <div className="ccc-editor__monster-picker">
        <label className="ccc-editor__label">Add Monster</label>
        <TrainerAutocomplete
          trainers={trainers}
          selectedTrainerId={selectedTrainerId}
          onSelect={handleTrainerSelect}
          label=""
          placeholder="Select a trainer..."
          noPadding
        />
        {selectedTrainerId && (
          <div style={{ marginTop: 4 }}>
            {loadingMonsters ? (
              <span className="ccc-editor__loading-text">Loading monsters...</span>
            ) : (
              <MonsterAutocomplete
                key={`picker_${section.monsters.length}`}
                monsters={availableMonsters as { id: string | number; name: string }[]}
                selectedMonsterId={null}
                onSelect={handleMonsterAdd}
                label=""
                placeholder="Search & add a monster..."
                noPadding
              />
            )}
          </div>
        )}
      </div>

      {/* Monster List */}
      {section.monsters.length > 0 && (
        <div className="ccc-editor__images-list">
          {section.monsters.map((item, idx) => (
            <div key={item.id} className="ccc-editor__featured-monster-item">
              <div className="ccc-editor__featured-monster-row">
                <div className="ccc-editor__field-controls">
                  <button className="ccc-editor__field-move" onClick={() => moveMonster(item.id, -1)} disabled={idx === 0} title="Move up">
                    <i className="fas fa-chevron-up"></i>
                  </button>
                  <button className="ccc-editor__field-move" onClick={() => moveMonster(item.id, 1)} disabled={idx === section.monsters.length - 1} title="Move down">
                    <i className="fas fa-chevron-down"></i>
                  </button>
                </div>
                <div className="ccc-editor__image-item-preview">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, background: 'rgba(128,128,128,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-dragon" style={{ opacity: 0.4, fontSize: 12 }}></i>
                    </div>
                  )}
                </div>
                <span className="ccc-editor__featured-monster-name">{item.name}</span>
                <label className="ccc-editor__checkbox" style={{ marginLeft: 'auto' }}>
                  <input
                    type="checkbox"
                    checked={item.useOverride}
                    onChange={(e) => updateMonster(item.id, { useOverride: e.target.checked })}
                  />
                  Override
                </label>
                <button className="ccc-editor__field-remove" onClick={() => removeMonster(item.id)} title="Remove monster">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              {/* Per-image overrides */}
              {item.useOverride && (
                <div className="ccc-editor__featured-monster-overrides">
                  <div className="ccc-editor__row">
                    <label className="ccc-editor__label">Fit</label>
                    <div className="ccc-editor__toggle-group">
                      {(['cover', 'contain'] as ImageObjectFit[]).map((fit) => (
                        <button
                          key={fit}
                          className={`ccc-editor__toggle ${item.objectFit === fit ? 'ccc-editor__toggle--active' : ''}`}
                          onClick={() => updateMonster(item.id, { objectFit: fit })}
                        >
                          {fit.charAt(0).toUpperCase() + fit.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="ccc-editor__row">
                    <label className="ccc-editor__label">Scale</label>
                    <input
                      type="range" min={100} max={300} value={item.scale}
                      onChange={(e) => updateMonster(item.id, { scale: Number(e.target.value) })}
                    />
                    <span className="ccc-editor__range-value">{item.scale}%</span>
                  </div>
                  {item.objectFit === 'cover' && (
                    <>
                      <div className="ccc-editor__row">
                        <label className="ccc-editor__label">Pos X</label>
                        <input
                          type="range" min={0} max={100} value={item.positionX}
                          onChange={(e) => updateMonster(item.id, { positionX: Number(e.target.value) })}
                        />
                        <span className="ccc-editor__range-value">{item.positionX}%</span>
                      </div>
                      <div className="ccc-editor__row">
                        <label className="ccc-editor__label">Pos Y</label>
                        <input
                          type="range" min={0} max={100} value={item.positionY}
                          onChange={(e) => updateMonster(item.id, { positionY: Number(e.target.value) })}
                        />
                        <span className="ccc-editor__range-value">{item.positionY}%</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Image Style Editor (shared between grid and callout) ---

function ImageStyleEditor({ style, onChange }: {
  style: ImageStyleConfig;
  onChange: (s: ImageStyleConfig) => void;
}) {
  return (
    <div className="ccc-editor__image-style">
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Cut Style</label>
        <input
          type="range" min={0} max={50} value={style.cutRadius}
          onChange={(e) => onChange({ ...style, cutRadius: Number(e.target.value) })}
        />
        <span className="ccc-editor__range-value">{style.cutRadius}%</span>
      </div>
      <div className="ccc-editor__row">
        <label className="ccc-editor__label">Background</label>
        <div className="ccc-editor__toggle-group">
          {(['none', 'circle', 'square', 'rounded', 'diamond', 'hexagon'] as ImageBackgroundShape[]).map((shape) => (
            <button
              key={shape}
              className={`ccc-editor__toggle ${style.backgroundShape === shape ? 'ccc-editor__toggle--active' : ''}`}
              onClick={() => onChange({ ...style, backgroundShape: shape })}
            >
              {shape.charAt(0).toUpperCase() + shape.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {style.backgroundShape !== 'none' && (
        <div className="ccc-editor__row">
          <ColorPicker label="Bg Color" value={style.backgroundColor} onChange={(v) => onChange({ ...style, backgroundColor: v })} />
        </div>
      )}
    </div>
  );
}

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
