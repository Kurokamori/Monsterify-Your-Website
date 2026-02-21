import { useState } from 'react';
import { FileUpload } from '@components/common/FileUpload';
import { ArrayFieldEditor } from './ArrayFieldEditor';

interface WildlifeEntry {
  name: string;
  species: string;
  type: string;
  rarity: string;
  description: string;
}

interface ResourceEntry {
  name: string;
  rarity: string;
  description: string;
}

interface SpecialEncounter {
  type: string;
  chance: number;
  description: string;
}

interface AreaData {
  // Identity
  landmass: string;
  landmassName: string;
  region: string;
  regionName: string;
  // Guide details
  description?: string;
  difficulty?: string;
  specialFeatures?: string[];
  images?: { guide?: string; overworld?: string };
  elevation?: string;
  temperature?: string;
  weatherPatterns?: string;
  accessibility?: string;
  recommendedLevel?: string;
  // Encounter
  needsMissionMandate?: boolean;
  welcomeMessages: { base: string; variations: string[] };
  battleParameters: { weather: string; terrain: string };
  monsterRollerParameters: {
    speciesTypesOptions?: string[];
    includeStages?: string[];
    includeRanks?: string[];
    species_min?: number;
    species_max?: number;
    types_min?: number;
    types_max?: number;
    enableLegendaries?: boolean;
    enableMythicals?: boolean;
  };
  levelRange: { min: number; max: number };
  agroRange: { min: number; max: number };
  itemRequirements?: { needsMissionMandate?: boolean; itemRequired?: string };
  specialEncounters: SpecialEncounter[];
  allowedWildTypes?: string[];
  // Guide extended
  wildlife?: WildlifeEntry[];
  resources?: ResourceEntry[];
  lore?: string;
  history?: string;
  dangers?: string[];
  tips?: string[];
}

interface AreaFormProps {
  data: AreaData;
  onChange: (data: AreaData) => void;
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`collapsible-section${open ? ' collapsible-section--open' : ''}`}>
      <button type="button" className="collapsible-section__toggle" onClick={() => setOpen(!open)}>
        <i className={`fas fa-chevron-${open ? 'down' : 'right'}`}></i>
        <span>{title}</span>
      </button>
      {open && <div className="collapsible-section__content">{children}</div>}
    </div>
  );
}

export function AreaForm({ data, onChange }: AreaFormProps) {
  const update = (patch: Partial<AreaData>) => onChange({ ...data, ...patch });
  const mrp = data.monsterRollerParameters;

  return (
    <div className="entity-form">
      {/* Basic Info */}
      <CollapsibleSection title="Basic Info" defaultOpen>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={4} value={data.description ?? ''} onChange={(e) => update({ description: e.target.value })} />
        </div>
        <div className="map-form-row">
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select className="form-input" value={data.difficulty ?? ''} onChange={(e) => update({ difficulty: e.target.value || undefined })}>
              <option value="">—</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
              <option>Extreme</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Recommended Level</label>
            <input className="form-input" value={data.recommendedLevel ?? ''} onChange={(e) => update({ recommendedLevel: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Special Features (comma-separated)</label>
          <input className="form-input" value={(data.specialFeatures ?? []).join(', ')} onChange={(e) => update({ specialFeatures: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
        </div>
        <div className="map-form-row">
          <div className="form-group">
            <label className="form-label">Guide Image</label>
            <FileUpload initialImageUrl={data.images?.guide} onUploadSuccess={(url) => update({ images: { ...data.images, guide: url ?? undefined } })} folder="areas" />
          </div>
          <div className="form-group">
            <label className="form-label">Overworld Image</label>
            <FileUpload initialImageUrl={data.images?.overworld} onUploadSuccess={(url) => update({ images: { ...data.images, overworld: url ?? undefined } })} folder="areas" />
          </div>
        </div>
      </CollapsibleSection>

      {/* Environment */}
      <CollapsibleSection title="Environment">
        <div className="map-form-row">
          <div className="form-group">
            <label className="form-label">Elevation</label>
            <input className="form-input" value={data.elevation ?? ''} onChange={(e) => update({ elevation: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Temperature</label>
            <input className="form-input" value={data.temperature ?? ''} onChange={(e) => update({ temperature: e.target.value })} />
          </div>
        </div>
        <div className="map-form-row">
          <div className="form-group">
            <label className="form-label">Weather Patterns</label>
            <input className="form-input" value={data.weatherPatterns ?? ''} onChange={(e) => update({ weatherPatterns: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Accessibility</label>
            <input className="form-input" value={data.accessibility ?? ''} onChange={(e) => update({ accessibility: e.target.value })} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Encounter Configuration */}
      <CollapsibleSection title="Encounter Configuration">
        <div className="form-group">
          <label className="form-label">Welcome Message (Base)</label>
          <textarea className="form-input" rows={2} value={data.welcomeMessages.base} onChange={(e) => update({ welcomeMessages: { ...data.welcomeMessages, base: e.target.value } })} />
        </div>
        <div className="form-group">
          <label className="form-label">Welcome Variations (one per line)</label>
          <textarea className="form-input" rows={4} value={data.welcomeMessages.variations.join('\n')} onChange={(e) => update({ welcomeMessages: { ...data.welcomeMessages, variations: e.target.value.split('\n').filter(Boolean) } })} />
        </div>
        <div className="map-form-row">
          <div className="form-group">
            <label className="form-label">Battle Weather</label>
            <input className="form-input" value={data.battleParameters.weather} onChange={(e) => update({ battleParameters: { ...data.battleParameters, weather: e.target.value } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Battle Terrain</label>
            <input className="form-input" value={data.battleParameters.terrain} onChange={(e) => update({ battleParameters: { ...data.battleParameters, terrain: e.target.value } })} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Allowed Wild Types */}
      <CollapsibleSection title="Allowed Wild Types">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-color-muted)', margin: '0 0 0.5rem' }}>
          Restrict the resulting types wild monsters can have. Leave all unchecked for no restriction.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.25rem 0.75rem' }}>
          {(['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'] as const).map(type => {
            const selected = data.allowedWildTypes ?? [];
            const isChecked = selected.includes(type);
            return (
              <label key={type} className="form-label" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const next = isChecked
                      ? selected.filter(t => t !== type)
                      : [...selected, type];
                    update({ allowedWildTypes: next.length > 0 ? next : undefined });
                  }}
                />
                {' '}{type}
              </label>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Monster Roller */}
      <CollapsibleSection title="Monster Roller">
        <div className="form-group">
          <label className="form-label">Species Types Options (comma-separated)</label>
          <input className="form-input" value={(mrp.speciesTypesOptions ?? []).join(', ')} onChange={(e) => update({ monsterRollerParameters: { ...mrp, speciesTypesOptions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
        </div>
        <div className="form-group">
          <label className="form-label">Include Stages (comma-separated)</label>
          <input className="form-input" value={(mrp.includeStages ?? []).join(', ')} onChange={(e) => update({ monsterRollerParameters: { ...mrp, includeStages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
        </div>
        <div className="form-group">
          <label className="form-label">Include Ranks (comma-separated)</label>
          <input className="form-input" value={(mrp.includeRanks ?? []).join(', ')} onChange={(e) => update({ monsterRollerParameters: { ...mrp, includeRanks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
        </div>
        <div className="map-form-row">
          <div className="form-group">
            <label className="form-label">Species Min</label>
            <input className="form-input" type="number" value={mrp.species_min ?? ''} onChange={(e) => update({ monsterRollerParameters: { ...mrp, species_min: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Species Max</label>
            <input className="form-input" type="number" value={mrp.species_max ?? ''} onChange={(e) => update({ monsterRollerParameters: { ...mrp, species_max: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Types Min</label>
            <input className="form-input" type="number" value={mrp.types_min ?? ''} onChange={(e) => update({ monsterRollerParameters: { ...mrp, types_min: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Types Max</label>
            <input className="form-input" type="number" value={mrp.types_max ?? ''} onChange={(e) => update({ monsterRollerParameters: { ...mrp, types_max: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
        </div>
        <div className="map-form-row">
          <div className="form-group">
            <label className="form-label">
              <input type="checkbox" checked={mrp.enableLegendaries ?? false} onChange={(e) => update({ monsterRollerParameters: { ...mrp, enableLegendaries: e.target.checked } })} />
              {' '}Enable Legendaries
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">
              <input type="checkbox" checked={mrp.enableMythicals ?? false} onChange={(e) => update({ monsterRollerParameters: { ...mrp, enableMythicals: e.target.checked } })} />
              {' '}Enable Mythicals
            </label>
          </div>
        </div>
      </CollapsibleSection>

      {/* Level & Agro Ranges */}
      <CollapsibleSection title="Level & Agro Ranges">
        <div className="map-form-row">
          <div className="form-group">
            <label className="form-label">Level Min</label>
            <input className="form-input" type="number" value={data.levelRange.min} onChange={(e) => update({ levelRange: { ...data.levelRange, min: Number(e.target.value) } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Level Max</label>
            <input className="form-input" type="number" value={data.levelRange.max} onChange={(e) => update({ levelRange: { ...data.levelRange, max: Number(e.target.value) } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Agro Min</label>
            <input className="form-input" type="number" value={data.agroRange.min} onChange={(e) => update({ agroRange: { ...data.agroRange, min: Number(e.target.value) } })} />
          </div>
          <div className="form-group">
            <label className="form-label">Agro Max</label>
            <input className="form-input" type="number" value={data.agroRange.max} onChange={(e) => update({ agroRange: { ...data.agroRange, max: Number(e.target.value) } })} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Item Requirements */}
      <CollapsibleSection title="Item Requirements">
        <div className="form-group">
          <label className="form-label">
            <input type="checkbox" checked={data.itemRequirements?.needsMissionMandate ?? false} onChange={(e) => update({ itemRequirements: { ...data.itemRequirements, needsMissionMandate: e.target.checked } })} />
            {' '}Needs Mission Mandate
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Item Required</label>
          <input className="form-input" value={data.itemRequirements?.itemRequired ?? ''} onChange={(e) => update({ itemRequirements: { ...data.itemRequirements, itemRequired: e.target.value || undefined } })} />
        </div>
      </CollapsibleSection>

      {/* Special Encounters */}
      <CollapsibleSection title="Special Encounters">
        <ArrayFieldEditor<SpecialEncounter>
          label="Special Encounters"
          items={data.specialEncounters}
          onChange={(items) => update({ specialEncounters: items })}
          createEmpty={() => ({ type: '', chance: 0, description: '' })}
          renderItem={(item, _idx, onChangeItem) => (
            <div className="map-form-row">
              <div className="form-group">
                <input className="form-input" placeholder="Type" value={item.type} onChange={(e) => onChangeItem({ ...item, type: e.target.value })} />
              </div>
              <div className="form-group">
                <input className="form-input" type="number" placeholder="Chance" value={item.chance} onChange={(e) => onChangeItem({ ...item, chance: Number(e.target.value) })} />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <input className="form-input" placeholder="Description" value={item.description} onChange={(e) => onChangeItem({ ...item, description: e.target.value })} />
              </div>
            </div>
          )}
        />
      </CollapsibleSection>

      {/* Wildlife */}
      <CollapsibleSection title="Wildlife">
        <ArrayFieldEditor<WildlifeEntry>
          label="Wildlife"
          items={data.wildlife ?? []}
          onChange={(items) => update({ wildlife: items })}
          createEmpty={() => ({ name: '', species: '', type: '', rarity: '', description: '' })}
          renderItem={(item, _idx, onChangeItem) => (
            <div>
              <div className="map-form-row">
                <div className="form-group"><input className="form-input" placeholder="Name" value={item.name} onChange={(e) => onChangeItem({ ...item, name: e.target.value })} /></div>
                <div className="form-group"><input className="form-input" placeholder="Species" value={item.species} onChange={(e) => onChangeItem({ ...item, species: e.target.value })} /></div>
                <div className="form-group"><input className="form-input" placeholder="Type" value={item.type} onChange={(e) => onChangeItem({ ...item, type: e.target.value })} /></div>
                <div className="form-group"><input className="form-input" placeholder="Rarity" value={item.rarity} onChange={(e) => onChangeItem({ ...item, rarity: e.target.value })} /></div>
              </div>
              <div className="form-group">
                <input className="form-input" placeholder="Description" value={item.description} onChange={(e) => onChangeItem({ ...item, description: e.target.value })} />
              </div>
            </div>
          )}
        />
      </CollapsibleSection>

      {/* Resources */}
      <CollapsibleSection title="Resources">
        <ArrayFieldEditor<ResourceEntry>
          label="Resources"
          items={data.resources ?? []}
          onChange={(items) => update({ resources: items })}
          createEmpty={() => ({ name: '', rarity: '', description: '' })}
          renderItem={(item, _idx, onChangeItem) => (
            <div className="map-form-row">
              <div className="form-group"><input className="form-input" placeholder="Name" value={item.name} onChange={(e) => onChangeItem({ ...item, name: e.target.value })} /></div>
              <div className="form-group"><input className="form-input" placeholder="Rarity" value={item.rarity} onChange={(e) => onChangeItem({ ...item, rarity: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 2 }}><input className="form-input" placeholder="Description" value={item.description} onChange={(e) => onChangeItem({ ...item, description: e.target.value })} /></div>
            </div>
          )}
        />
      </CollapsibleSection>

      {/* Lore & History */}
      <CollapsibleSection title="Lore & History">
        <div className="form-group">
          <label className="form-label">Lore</label>
          <textarea className="form-input" rows={6} value={data.lore ?? ''} onChange={(e) => update({ lore: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">History</label>
          <textarea className="form-input" rows={6} value={data.history ?? ''} onChange={(e) => update({ history: e.target.value })} />
        </div>
      </CollapsibleSection>

      {/* Dangers & Tips */}
      <CollapsibleSection title="Dangers & Tips">
        <div className="form-group">
          <label className="form-label">Dangers (one per line)</label>
          <textarea className="form-input" rows={4} value={(data.dangers ?? []).join('\n')} onChange={(e) => update({ dangers: e.target.value.split('\n').filter(Boolean) })} />
        </div>
        <div className="form-group">
          <label className="form-label">Tips (one per line)</label>
          <textarea className="form-input" rows={4} value={(data.tips ?? []).join('\n')} onChange={(e) => update({ tips: e.target.value.split('\n').filter(Boolean) })} />
        </div>
      </CollapsibleSection>
    </div>
  );
}
