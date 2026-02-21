import { useState, useEffect, useRef, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { ConfirmModal, useConfirmModal } from '@components/common';
import { ArrayFieldEditor } from '@components/admin/map-manager/ArrayFieldEditor';
import areaService from '@services/areaService';
import type { LandmassGuide, RegionGuideSummary, RegionAreaSummary } from '@services/areaService';
import '@styles/admin/adventure-location-manager.css';

// ── Types ──────────────────────────────────────────────────

type ViewLevel = 'landmasses' | 'regions' | 'areas' | 'editor';

interface SpecialEncounter {
  type: string;
  chance: number;
  description: string;
}

// The full area data shape from adminGetArea
interface AreaData {
  [key: string]: unknown;
  name?: string;
  description?: string;
  difficulty?: string;
  specialFeatures?: string[];
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
}

const WEATHER_OPTIONS = ['clear', 'rain', 'sunny', 'snow', 'sandstorm', 'hail', 'fog', 'thunderstorm', 'wind'];
const TERRAIN_OPTIONS = ['normal', 'electric', 'grassy', 'misty', 'psychic'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard', 'Extreme'];
const MONSTER_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

// ── CollapsibleSection ─────────────────────────────────────

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

// ── Breadcrumb ─────────────────────────────────────────────

interface BreadcrumbProps {
  viewLevel: ViewLevel;
  landmassName?: string;
  regionName?: string;
  areaName?: string;
  onNavigate: (level: ViewLevel) => void;
}

function Breadcrumb({ viewLevel, landmassName, regionName, areaName, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="alm__breadcrumb">
      <button type="button" onClick={() => onNavigate('landmasses')}>
        <i className="fas fa-globe"></i> World
      </button>
      {(viewLevel === 'regions' || viewLevel === 'areas' || viewLevel === 'editor') && landmassName && (
        <>
          <i className="fas fa-chevron-right"></i>
          <button type="button" onClick={() => onNavigate('regions')}>{landmassName}</button>
        </>
      )}
      {(viewLevel === 'areas' || viewLevel === 'editor') && regionName && (
        <>
          <i className="fas fa-chevron-right"></i>
          <button type="button" onClick={() => onNavigate('areas')}>{regionName}</button>
        </>
      )}
      {viewLevel === 'editor' && areaName && (
        <>
          <i className="fas fa-chevron-right"></i>
          <span>{areaName}</span>
        </>
      )}
    </nav>
  );
}

// ── Main Content ───────────────────────────────────────────

function AdventureLocationManagerContent() {
  useDocumentTitle('Adventure Location Manager');

  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('landmasses');
  const [selectedLandmass, setSelectedLandmass] = useState<{ id: string; name: string } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ id: string; name: string } | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Data state
  const [landmasses, setLandmasses] = useState<LandmassGuide[]>([]);
  const [regions, setRegions] = useState<RegionGuideSummary[]>([]);
  const [areas, setAreas] = useState<RegionAreaSummary[]>([]);
  const [areaData, setAreaData] = useState<AreaData | null>(null);
  const [areaName, setAreaName] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dirty state tracking
  const originalDataRef = useRef<string>('');

  // Confirm modal for unsaved changes
  const confirmModal = useConfirmModal();
  const pendingNavigationRef = useRef<ViewLevel | null>(null);

  const isDirty = useCallback(() => {
    if (!areaData) return false;
    return JSON.stringify(areaData) !== originalDataRef.current;
  }, [areaData]);

  // ── Data loading ───────────────────────────────────────

  useEffect(() => {
    if (viewLevel === 'landmasses') {
      setLoading(true);
      setError('');
      areaService.getWorldMapData()
        .then(data => setLandmasses(data.landmasses))
        .catch(err => setError(err.message || 'Failed to load landmasses'))
        .finally(() => setLoading(false));
    }
  }, [viewLevel]);

  useEffect(() => {
    if (viewLevel === 'regions' && selectedLandmass) {
      setLoading(true);
      setError('');
      areaService.getLandmassGuide(selectedLandmass.id)
        .then(data => setRegions(data.regionsData))
        .catch(err => setError(err.message || 'Failed to load regions'))
        .finally(() => setLoading(false));
    }
  }, [viewLevel, selectedLandmass]);

  useEffect(() => {
    if (viewLevel === 'areas' && selectedRegion) {
      setLoading(true);
      setError('');
      areaService.getRegionGuide(selectedRegion.id)
        .then(data => setAreas(data.areas))
        .catch(err => setError(err.message || 'Failed to load areas'))
        .finally(() => setLoading(false));
    }
  }, [viewLevel, selectedRegion]);

  useEffect(() => {
    if (viewLevel === 'editor' && selectedAreaId) {
      setLoading(true);
      setError('');
      setSaveStatus(null);
      areaService.adminGetArea(selectedAreaId)
        .then((data: AreaData & { name?: string }) => {
          const name = data.name ?? '';
          setAreaName(name);
          setAreaData(data);
          originalDataRef.current = JSON.stringify(data);
        })
        .catch(err => setError(err.message || 'Failed to load area'))
        .finally(() => setLoading(false));
    }
  }, [viewLevel, selectedAreaId]);

  // ── Navigation ─────────────────────────────────────────

  const navigateTo = useCallback((level: ViewLevel) => {
    if (viewLevel === 'editor' && isDirty()) {
      pendingNavigationRef.current = level;
      confirmModal.confirm(
        'You have unsaved changes. Are you sure you want to leave?',
        () => {
          const target = pendingNavigationRef.current!;
          pendingNavigationRef.current = null;
          performNavigation(target);
        },
        { title: 'Unsaved Changes', variant: 'warning', confirmText: 'Leave', cancelText: 'Stay' }
      );
      return;
    }
    performNavigation(level);
  }, [viewLevel, isDirty, confirmModal]);

  const performNavigation = (level: ViewLevel) => {
    setAreaData(null);
    setSaveStatus(null);
    setError('');
    if (level === 'landmasses') {
      setSelectedLandmass(null);
      setSelectedRegion(null);
      setSelectedAreaId(null);
    } else if (level === 'regions') {
      setSelectedRegion(null);
      setSelectedAreaId(null);
    } else if (level === 'areas') {
      setSelectedAreaId(null);
    }
    setViewLevel(level);
  };

  const selectLandmass = (id: string, name: string) => {
    setSelectedLandmass({ id, name });
    setViewLevel('regions');
  };

  const selectRegion = (id: string, name: string) => {
    setSelectedRegion({ id, name });
    setViewLevel('areas');
  };

  const selectArea = (id: string) => {
    setSelectedAreaId(id);
    setViewLevel('editor');
  };

  // ── Editor helpers ─────────────────────────────────────

  const updateArea = useCallback((patch: Partial<AreaData>) => {
    setAreaData(prev => prev ? { ...prev, ...patch } : prev);
    setSaveStatus(null);
  }, []);

  const handleSave = async () => {
    if (!areaData || !selectedAreaId) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const saved = await areaService.adminUpdateArea(selectedAreaId, areaData as Record<string, unknown>);
      originalDataRef.current = JSON.stringify(saved);
      setAreaData(saved);
      setSaveStatus({ type: 'success', message: 'Saved successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setSaveStatus({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="alm">
        <Breadcrumb viewLevel={viewLevel} landmassName={selectedLandmass?.name} regionName={selectedRegion?.name} areaName={areaName} onNavigate={navigateTo} />
        <div className="alm__loading"><i className="fas fa-spinner fa-spin"></i> Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alm">
        <Breadcrumb viewLevel={viewLevel} landmassName={selectedLandmass?.name} regionName={selectedRegion?.name} areaName={areaName} onNavigate={navigateTo} />
        <div className="alm__error"><i className="fas fa-exclamation-triangle"></i> {error}</div>
      </div>
    );
  }

  return (
    <div className="alm">
      <Breadcrumb viewLevel={viewLevel} landmassName={selectedLandmass?.name} regionName={selectedRegion?.name} areaName={areaName} onNavigate={navigateTo} />

      {/* Landmass List */}
      {viewLevel === 'landmasses' && (
        <table className="alm__entity-list">
          <thead>
            <tr>
              <th>Landmass</th>
              <th>Description</th>
              <th>Regions</th>
            </tr>
          </thead>
          <tbody>
            {landmasses.map(lm => (
              <tr key={lm.id} className="alm__entity-row" onClick={() => selectLandmass(lm.id, lm.name)}>
                <td>{lm.name}</td>
                <td className="alm__desc-snippet">{lm.description?.slice(0, 80)}{(lm.description?.length ?? 0) > 80 ? '...' : ''}</td>
                <td className="alm__count-cell">{lm.regions?.length ?? '—'}</td>
              </tr>
            ))}
            {landmasses.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-color-muted)', padding: '2rem' }}>No landmasses found</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Region List */}
      {viewLevel === 'regions' && (
        <table className="alm__entity-list">
          <thead>
            <tr>
              <th>Region</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {regions.map(r => (
              <tr key={r.id} className="alm__entity-row" onClick={() => selectRegion(r.id, r.name)}>
                <td>{r.name}</td>
                <td className="alm__desc-snippet">{r.description?.slice(0, 80)}{(r.description?.length ?? 0) > 80 ? '...' : ''}</td>
              </tr>
            ))}
            {regions.length === 0 && (
              <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-color-muted)', padding: '2rem' }}>No regions found</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Area List */}
      {viewLevel === 'areas' && (
        <table className="alm__entity-list">
          <thead>
            <tr>
              <th>Area</th>
              <th>Description</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            {areas.map(a => (
              <tr key={a.id} className="alm__entity-row" onClick={() => selectArea(a.id)}>
                <td>{a.name}</td>
                <td className="alm__desc-snippet">{a.description?.slice(0, 80)}{(a.description?.length ?? 0) > 80 ? '...' : ''}</td>
                <td>
                  <div className="alm__summary-badges">
                    {a.difficulty && (
                      <span className={`alm__badge alm__badge--${a.difficulty.toLowerCase()}`}>{a.difficulty}</span>
                    )}
                    {a.specialFeatures?.slice(0, 2).map(f => (
                      <span key={f} className="alm__badge">{f}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {areas.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-color-muted)', padding: '2rem' }}>No areas found</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Area Encounter Editor */}
      {viewLevel === 'editor' && areaData && (
        <div className="alm__editor">
          <div className="alm__editor-header">
            <h2>{areaName}</h2>
          </div>

          <div className="entity-form">
            {/* Battle Parameters */}
            <CollapsibleSection title="Battle Parameters" defaultOpen>
              <div className="map-form-row">
                <div className="form-group">
                  <label className="form-label">Weather</label>
                  <select className="form-input" value={areaData.battleParameters.weather} onChange={e => updateArea({ battleParameters: { ...areaData.battleParameters, weather: e.target.value } })}>
                    <option value="">—</option>
                    {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Terrain</label>
                  <select className="form-input" value={areaData.battleParameters.terrain} onChange={e => updateArea({ battleParameters: { ...areaData.battleParameters, terrain: e.target.value } })}>
                    <option value="">—</option>
                    {TERRAIN_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </CollapsibleSection>

            {/* Allowed Wild Types */}
            <CollapsibleSection title="Allowed Wild Types" defaultOpen>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-color-muted)', margin: '0 0 0.5rem' }}>
                Restrict the resulting types wild monsters can have. Leave all unchecked for no restriction.
              </p>
              <div className="alm__type-grid">
                {MONSTER_TYPES.map(type => {
                  const selected = areaData.allowedWildTypes ?? [];
                  const isChecked = selected.includes(type);
                  return (
                    <label key={type} className="form-label alm__type-checkbox">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = isChecked
                            ? selected.filter(t => t !== type)
                            : [...selected, type];
                          updateArea({ allowedWildTypes: next.length > 0 ? next : undefined });
                        }}
                      />
                      {' '}{type}
                    </label>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Monster Roller Parameters */}
            <CollapsibleSection title="Monster Roller Parameters" defaultOpen>
              {(() => {
                const mrp = areaData.monsterRollerParameters;
                return (
                  <>
                    <div className="form-group">
                      <label className="form-label">Species Types Options (comma-separated)</label>
                      <input className="form-input" value={(mrp.speciesTypesOptions ?? []).join(', ')} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, speciesTypesOptions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Include Stages (comma-separated)</label>
                      <input className="form-input" value={(mrp.includeStages ?? []).join(', ')} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, includeStages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Include Ranks (comma-separated)</label>
                      <input className="form-input" value={(mrp.includeRanks ?? []).join(', ')} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, includeRanks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
                    </div>
                    <div className="map-form-row">
                      <div className="form-group">
                        <label className="form-label">Species Min</label>
                        <input className="form-input" type="number" value={mrp.species_min ?? ''} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, species_min: e.target.value ? Number(e.target.value) : undefined } })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Species Max</label>
                        <input className="form-input" type="number" value={mrp.species_max ?? ''} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, species_max: e.target.value ? Number(e.target.value) : undefined } })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Types Min</label>
                        <input className="form-input" type="number" value={mrp.types_min ?? ''} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, types_min: e.target.value ? Number(e.target.value) : undefined } })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Types Max</label>
                        <input className="form-input" type="number" value={mrp.types_max ?? ''} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, types_max: e.target.value ? Number(e.target.value) : undefined } })} />
                      </div>
                    </div>
                    <div className="map-form-row">
                      <div className="form-group">
                        <label className="form-label">
                          <input type="checkbox" checked={mrp.enableLegendaries ?? false} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, enableLegendaries: e.target.checked } })} />
                          {' '}Enable Legendaries
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <input type="checkbox" checked={mrp.enableMythicals ?? false} onChange={e => updateArea({ monsterRollerParameters: { ...mrp, enableMythicals: e.target.checked } })} />
                          {' '}Enable Mythicals
                        </label>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CollapsibleSection>

            {/* Level & Agro Ranges */}
            <CollapsibleSection title="Level & Agro Ranges" defaultOpen>
              <div className="map-form-row">
                <div className="form-group">
                  <label className="form-label">Level Min</label>
                  <input className="form-input" type="number" value={areaData.levelRange.min} onChange={e => updateArea({ levelRange: { ...areaData.levelRange, min: Number(e.target.value) } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Level Max</label>
                  <input className="form-input" type="number" value={areaData.levelRange.max} onChange={e => updateArea({ levelRange: { ...areaData.levelRange, max: Number(e.target.value) } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Agro Min</label>
                  <input className="form-input" type="number" value={areaData.agroRange.min} onChange={e => updateArea({ agroRange: { ...areaData.agroRange, min: Number(e.target.value) } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Agro Max</label>
                  <input className="form-input" type="number" value={areaData.agroRange.max} onChange={e => updateArea({ agroRange: { ...areaData.agroRange, max: Number(e.target.value) } })} />
                </div>
              </div>
            </CollapsibleSection>

            {/* Welcome Messages */}
            <CollapsibleSection title="Welcome Messages" defaultOpen>
              <div className="form-group">
                <label className="form-label">Base Message</label>
                <textarea className="form-input" rows={2} value={areaData.welcomeMessages.base} onChange={e => updateArea({ welcomeMessages: { ...areaData.welcomeMessages, base: e.target.value } })} />
              </div>
              <div className="form-group">
                <label className="form-label">Variations (one per line)</label>
                <textarea className="form-input" rows={4} value={areaData.welcomeMessages.variations.join('\n')} onChange={e => updateArea({ welcomeMessages: { ...areaData.welcomeMessages, variations: e.target.value.split('\n').filter(Boolean) } })} />
              </div>
            </CollapsibleSection>

            {/* Item Requirements */}
            <CollapsibleSection title="Item Requirements">
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" checked={areaData.itemRequirements?.needsMissionMandate ?? false} onChange={e => updateArea({ itemRequirements: { ...areaData.itemRequirements, needsMissionMandate: e.target.checked } })} />
                  {' '}Needs Mission Mandate
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Item Required</label>
                <input className="form-input" value={areaData.itemRequirements?.itemRequired ?? ''} onChange={e => updateArea({ itemRequirements: { ...areaData.itemRequirements, itemRequired: e.target.value || undefined } })} />
              </div>
            </CollapsibleSection>

            {/* Special Encounters */}
            <CollapsibleSection title="Special Encounters">
              <ArrayFieldEditor<SpecialEncounter>
                label="Special Encounters"
                items={areaData.specialEncounters}
                onChange={items => updateArea({ specialEncounters: items })}
                createEmpty={() => ({ type: '', chance: 0, description: '' })}
                renderItem={(item, _idx, onChangeItem) => (
                  <div className="map-form-row">
                    <div className="form-group">
                      <input className="form-input" placeholder="Type" value={item.type} onChange={e => onChangeItem({ ...item, type: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <input className="form-input" type="number" placeholder="Chance" value={item.chance} onChange={e => onChangeItem({ ...item, chance: Number(e.target.value) })} />
                    </div>
                    <div className="form-group" style={{ flex: 2 }}>
                      <input className="form-input" placeholder="Description" value={item.description} onChange={e => onChangeItem({ ...item, description: e.target.value })} />
                    </div>
                  </div>
                )}
              />
            </CollapsibleSection>

            {/* Area Identity */}
            <CollapsibleSection title="Area Identity">
              <div className="map-form-row">
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-input" value={areaData.difficulty ?? ''} onChange={e => updateArea({ difficulty: e.target.value || undefined })}>
                    <option value="">—</option>
                    {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={4} value={areaData.description ?? ''} onChange={e => updateArea({ description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Special Features (comma-separated)</label>
                <input className="form-input" value={(areaData.specialFeatures ?? []).join(', ')} onChange={e => updateArea({ specialFeatures: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              </div>
            </CollapsibleSection>
          </div>

          {/* Save Bar */}
          <div className="alm__editor-actions">
            <button className="button primary" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Changes</>}
            </button>
            {saveStatus && (
              <span className={`alm__status alm__status--${saveStatus.type}`}>
                <i className={`fas ${saveStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i> {saveStatus.message}
              </span>
            )}
          </div>
        </div>
      )}

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
}

// ── Page wrapper ───────────────────────────────────────────

const AdventureLocationManagerPage = () => (
  <AdminRoute>
    <AdventureLocationManagerContent />
  </AdminRoute>
);

export default AdventureLocationManagerPage;
