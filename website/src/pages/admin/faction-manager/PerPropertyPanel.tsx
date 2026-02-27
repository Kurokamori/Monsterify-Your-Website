import { useState, useEffect, useCallback } from 'react';
import factionAdminService from '@services/factionAdminService';
import type { FactionRow } from '@services/factionAdminService';

interface PerPropertyPanelProps {
  factions: FactionRow[];
  onFactionUpdated: () => void;
  statusMsg: { type: 'success' | 'error'; text: string } | null;
  setStatusMsg: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

type PropertyKey = 'name' | 'description' | 'banner_image' | 'icon_image' | 'color';

const PROPERTIES: { key: PropertyKey; label: string; type: 'text' | 'textarea' | 'color' }[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'banner_image', label: 'Banner Image', type: 'text' },
  { key: 'icon_image', label: 'Icon Image', type: 'text' },
  { key: 'color', label: 'Color', type: 'color' },
];

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function PerPropertyPanel({ factions, onFactionUpdated, statusMsg, setStatusMsg }: PerPropertyPanelProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyKey>('name');
  const [values, setValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const propertyConfig = PROPERTIES.find(p => p.key === selectedProperty)!;

  // Initialize values from factions
  const syncValues = useCallback(() => {
    const initial: Record<number, string> = {};
    for (const f of factions) {
      initial[f.id] = (f[selectedProperty] as string) || '';
    }
    setValues(initial);
    setDirty(false);
  }, [factions, selectedProperty]);

  useEffect(() => {
    syncValues();
  }, [syncValues]);

  const handleValueChange = (factionId: number, value: string) => {
    setValues(prev => ({ ...prev, [factionId]: value }));
    setDirty(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const updates = factions.map(f => ({
        id: f.id,
        value: values[f.id]?.trim() || null,
      }));
      await factionAdminService.bulkUpdateProperty(selectedProperty, updates);
      setStatusMsg({ type: 'success', text: `Updated "${propertyConfig.label}" for ${updates.length} factions` });
      setDirty(false);
      onFactionUpdated();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save changes') });
    } finally {
      setSaving(false);
    }
  };

  const renderStatus = () => {
    if (!statusMsg) return null;
    return (
      <div className={`faction-manager__status faction-manager__status--${statusMsg.type}`}>
        <i className={statusMsg.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
        <span>{statusMsg.text}</span>
        <button className="faction-manager__status-dismiss" onClick={() => setStatusMsg(null)}>
          <i className="fas fa-times" />
        </button>
      </div>
    );
  };

  return (
    <div className="faction-manager__panel">
      {/* Toolbar */}
      <div className="faction-manager__toolbar">
        <div className="faction-manager__filters">
          <label style={{ fontWeight: 600, fontSize: 'var(--font-size-small)', color: 'var(--text-color)' }}>
            Property:
          </label>
          <select
            value={selectedProperty}
            onChange={e => setSelectedProperty(e.target.value as PropertyKey)}
            className="faction-manager__select"
          >
            {PROPERTIES.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-small)' }}>
          {dirty && (
            <button className="button secondary" onClick={syncValues} disabled={saving}>
              <i className="fas fa-undo" /> Reset
            </button>
          )}
          <button className="button primary" onClick={handleSaveAll} disabled={saving || !dirty}>
            {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save All</>}
          </button>
        </div>
      </div>

      {renderStatus()}

      {/* Property Grid */}
      {factions.length === 0 ? (
        <div className="faction-manager__empty">
          <i className="fas fa-shield-alt" />
          <p>No factions found.</p>
        </div>
      ) : (
        <div className="faction-manager__property-grid">
          {factions.map(faction => (
            <div key={faction.id} className="faction-manager__property-row">
              <div className="faction-manager__property-label">
                {faction.color && (
                  <span className="faction-manager__color-swatch" style={{ backgroundColor: faction.color }} />
                )}
                {faction.name}
              </div>
              <div className="faction-manager__property-value">
                {propertyConfig.type === 'textarea' ? (
                  <textarea
                    value={values[faction.id] || ''}
                    onChange={e => handleValueChange(faction.id, e.target.value)}
                    rows={2}
                    placeholder={`${propertyConfig.label}...`}
                  />
                ) : propertyConfig.type === 'color' ? (
                  <div className="faction-manager__color-preview">
                    <input
                      type="color"
                      value={values[faction.id] || '#666666'}
                      onChange={e => handleValueChange(faction.id, e.target.value)}
                      className="faction-manager__color-input"
                    />
                    <input
                      type="text"
                      value={values[faction.id] || ''}
                      onChange={e => handleValueChange(faction.id, e.target.value)}
                      placeholder="#hex"
                      style={{ width: '120px' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 'var(--spacing-small)', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={values[faction.id] || ''}
                      onChange={e => handleValueChange(faction.id, e.target.value)}
                      placeholder={`${propertyConfig.label}...`}
                    />
                    {(selectedProperty === 'banner_image' || selectedProperty === 'icon_image') && values[faction.id] && (
                      <img
                        src={values[faction.id]}
                        alt="Preview"
                        className="faction-manager__image-preview"
                        style={{ maxHeight: '40px' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="faction-manager__footer">
        <span className="faction-manager__count">{factions.length} faction{factions.length !== 1 ? 's' : ''}</span>
        {dirty && <span style={{ color: 'var(--warning-color)', fontSize: 'var(--font-size-small)' }}>Unsaved changes</span>}
      </div>
    </div>
  );
}
