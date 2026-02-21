import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { TabContainer } from '@components/common/TabContainer';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import bossService from '@services/bossService';
import type { AdminBoss, AdminLeaderboardEntry } from '@services/bossService';
import '@styles/admin/boss-manager.css';

// ============================================================================
// Constants & Helpers
// ============================================================================

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

function getMonthLabel(month: number | null): string {
  return MONTHS.find(m => m.value === month)?.label ?? '—';
}

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function getHpColor(pct: number): string {
  if (pct > 60) return 'var(--success-color)';
  if (pct > 30) return '#e6a817';
  return 'var(--error-color)';
}

interface MonsterData {
  name: string;
  species: string[];
  types: string[];
  attribute: string;
}

const EMPTY_MONSTER_DATA: MonsterData = { name: '', species: [], types: [], attribute: '' };

function parseMonsterData(raw: Record<string, unknown> | null): MonsterData {
  if (!raw) return { ...EMPTY_MONSTER_DATA };
  return {
    name: (raw.name as string) || '',
    species: Array.isArray(raw.species) ? (raw.species as string[]) : [],
    types: Array.isArray(raw.types) ? (raw.types as string[]) : [],
    attribute: (raw.attribute as string) || '',
  };
}

function serializeMonsterData(data: MonsterData): Record<string, unknown> | null {
  if (!data.name && data.species.length === 0 && data.types.length === 0 && !data.attribute) {
    return null;
  }
  return {
    name: data.name || undefined,
    species: data.species.filter(Boolean),
    types: data.types.filter(Boolean),
    attribute: data.attribute || undefined,
  };
}

const EMPTY_BOSS_FORM = {
  name: '',
  description: '',
  image_url: '',
  total_hp: 1000,
  current_hp: 1000,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  status: 'active' as string,
};

// ============================================================================
// Monster Data Sub-Editor
// ============================================================================

function MonsterDataEditor({
  label,
  data,
  onChange,
}: {
  label: string;
  data: MonsterData;
  onChange: (data: MonsterData) => void;
}) {
  const updateField = (field: keyof MonsterData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const addToList = (field: 'species' | 'types', max: number) => {
    if (data[field].length < max) {
      updateField(field, [...data[field], '']);
    }
  };

  const removeFromList = (field: 'species' | 'types', index: number) => {
    updateField(field, data[field].filter((_, i) => i !== index));
  };

  const updateListItem = (field: 'species' | 'types', index: number, value: string) => {
    const updated = [...data[field]];
    updated[index] = value;
    updateField(field, updated);
  };

  return (
    <div className="boss-manager__reward-editor">
      <h4>{label}</h4>
      <div className="boss-manager__form-row">
        <div className="boss-manager__field boss-manager__field--grow">
          <label>Monster Name</label>
          <input
            type="text"
            value={data.name}
            onChange={e => updateField('name', e.target.value)}
            className="boss-manager__input"
            placeholder="e.g., Shadow Fenrir"
          />
        </div>
        <div className="boss-manager__field boss-manager__field--grow">
          <label>Attribute</label>
          <input
            type="text"
            value={data.attribute}
            onChange={e => updateField('attribute', e.target.value)}
            className="boss-manager__input"
            placeholder="e.g., Legendary"
          />
        </div>
      </div>

      {/* Species List */}
      <div className="boss-manager__field">
        <label>
          Species ({data.species.length}/3)
          {data.species.length < 3 && (
            <button
              type="button"
              className="boss-manager__add-btn"
              onClick={() => addToList('species', 3)}
            >
              <i className="fas fa-plus" /> Add
            </button>
          )}
        </label>
        <div className="boss-manager__list-inputs">
          {data.species.map((sp, i) => (
            <div key={i} className="boss-manager__list-row">
              <input
                type="text"
                value={sp}
                onChange={e => updateListItem('species', i, e.target.value)}
                className="boss-manager__input"
                placeholder={`Species ${i + 1}`}
              />
              <button
                type="button"
                className="boss-manager__remove-btn"
                onClick={() => removeFromList('species', i)}
                title="Remove"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          ))}
          {data.species.length === 0 && (
            <span className="boss-manager__muted">No species added</span>
          )}
        </div>
      </div>

      {/* Types List */}
      <div className="boss-manager__field">
        <label>
          Types ({data.types.length}/5)
          {data.types.length < 5 && (
            <button
              type="button"
              className="boss-manager__add-btn"
              onClick={() => addToList('types', 5)}
            >
              <i className="fas fa-plus" /> Add
            </button>
          )}
        </label>
        <div className="boss-manager__list-inputs">
          {data.types.map((t, i) => (
            <div key={i} className="boss-manager__list-row">
              <input
                type="text"
                value={t}
                onChange={e => updateListItem('types', i, e.target.value)}
                className="boss-manager__input"
                placeholder={`Type ${i + 1}`}
              />
              <button
                type="button"
                className="boss-manager__remove-btn"
                onClick={() => removeFromList('types', i)}
                title="Remove"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          ))}
          {data.types.length === 0 && (
            <span className="boss-manager__muted">No types added</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function BossManagerPage() {
  useDocumentTitle('Boss Manager');

  const [activeTab, setActiveTab] = useState('bosses');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const confirmModal = useConfirmModal();
  const [saving, setSaving] = useState(false);

  // ── Bosses state ────────────────────────────────────────────────
  const [bosses, setBosses] = useState<AdminBoss[]>([]);
  const [bossesLoading, setBossesLoading] = useState(true);
  const [editingBoss, setEditingBoss] = useState<AdminBoss | null>(null);
  const [creatingBoss, setCreatingBoss] = useState(false);
  const [bossForm, setBossForm] = useState(EMPTY_BOSS_FORM);
  const [rewardMonster, setRewardMonster] = useState<MonsterData>({ ...EMPTY_MONSTER_DATA });
  const [gruntMonster, setGruntMonster] = useState<MonsterData>({ ...EMPTY_MONSTER_DATA });
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // ── Damage state ────────────────────────────────────────────────
  const [selectedBossId, setSelectedBossId] = useState<number | ''>('');
  const [leaderboard, setLeaderboard] = useState<AdminLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [damageForm, setDamageForm] = useState({ userId: '', damageAmount: '' });
  const [applyingDamage, setApplyingDamage] = useState(false);

  // ── Data loading ────────────────────────────────────────────────

  const loadBosses = useCallback(async () => {
    setBossesLoading(true);
    try {
      const data = await bossService.adminGetAllBosses();
      setBosses(data);
      // Auto-select active boss for damage tab
      const active = data.find(b => b.status === 'active');
      if (active && selectedBossId === '') {
        setSelectedBossId(active.id);
      }
    } catch (err) {
      console.error('Failed to load bosses:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load bosses' });
    } finally {
      setBossesLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLeaderboard = useCallback(async (bossId: number) => {
    setLeaderboardLoading(true);
    try {
      const data = await bossService.adminGetLeaderboard(bossId, 100);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load leaderboard' });
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => { loadBosses(); }, [loadBosses]);

  useEffect(() => {
    if (selectedBossId !== '') loadLeaderboard(selectedBossId);
    else setLeaderboard([]);
  }, [selectedBossId, loadLeaderboard]);

  // ── Boss CRUD handlers ─────────────────────────────────────────

  const handleStartCreateBoss = () => {
    setEditingBoss(null);
    setBossForm({ ...EMPTY_BOSS_FORM });
    setRewardMonster({ ...EMPTY_MONSTER_DATA });
    setGruntMonster({ ...EMPTY_MONSTER_DATA });
    setImagePreviewError(false);
    setCreatingBoss(true);
    setStatusMsg(null);
  };

  const handleStartEditBoss = (boss: AdminBoss) => {
    setCreatingBoss(false);
    setEditingBoss(boss);
    setBossForm({
      name: boss.name,
      description: boss.description || '',
      image_url: boss.imageUrl || '',
      total_hp: boss.totalHp,
      current_hp: boss.currentHp,
      month: boss.month || new Date().getMonth() + 1,
      year: boss.year || new Date().getFullYear(),
      status: boss.status,
    });
    setRewardMonster(parseMonsterData(boss.rewardMonsterData));
    setGruntMonster(parseMonsterData(boss.gruntMonsterData));
    setImagePreviewError(false);
    setStatusMsg(null);
  };

  const handleCancelBossForm = () => {
    setCreatingBoss(false);
    setEditingBoss(null);
  };

  const handleSaveBoss = async () => {
    if (!bossForm.name.trim()) {
      setStatusMsg({ type: 'error', text: 'Boss name is required' });
      return;
    }
    if (bossForm.total_hp <= 0) {
      setStatusMsg({ type: 'error', text: 'Total HP must be greater than 0' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      const rewardData = serializeMonsterData(rewardMonster);
      const gruntData = serializeMonsterData(gruntMonster);

      if (editingBoss) {
        await bossService.adminUpdateBoss(editingBoss.id, {
          name: bossForm.name.trim(),
          description: bossForm.description.trim() || undefined,
          image_url: bossForm.image_url.trim() || undefined,
          total_hp: bossForm.total_hp,
          current_hp: bossForm.current_hp,
          month: bossForm.month,
          year: bossForm.year,
          status: bossForm.status,
          reward_monster_data: rewardData,
          grunt_monster_data: gruntData,
        });
        setStatusMsg({ type: 'success', text: 'Boss updated successfully' });
        setEditingBoss(null);
      } else {
        await bossService.adminCreateBoss({
          name: bossForm.name.trim(),
          description: bossForm.description.trim() || undefined,
          image_url: bossForm.image_url.trim() || undefined,
          total_hp: bossForm.total_hp,
          month: bossForm.month,
          year: bossForm.year,
          reward_monster_data: rewardData,
          grunt_monster_data: gruntData,
        });
        setStatusMsg({ type: 'success', text: 'Boss created successfully' });
        setCreatingBoss(false);
      }
      await loadBosses();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save boss') });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBoss = (boss: AdminBoss) => {
    confirmModal.confirmDanger(
      `Delete boss "${boss.name}"? This will remove all damage records and reward claims.`,
      async () => {
        setSaving(true);
        try {
          await bossService.adminDeleteBoss(boss.id);
          setStatusMsg({ type: 'success', text: 'Boss deleted' });
          if (editingBoss?.id === boss.id) setEditingBoss(null);
          if (selectedBossId === boss.id) {
            setSelectedBossId('');
            setLeaderboard([]);
          }
          await loadBosses();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete boss') });
        } finally {
          setSaving(false);
        }
      },
    );
  };

  // ── Damage handlers ─────────────────────────────────────────────

  const handleApplyDamage = async () => {
    if (selectedBossId === '') return;
    const userId = parseInt(damageForm.userId, 10);
    const damageAmount = parseInt(damageForm.damageAmount, 10);
    if (!userId || isNaN(userId)) {
      setStatusMsg({ type: 'error', text: 'Valid User ID is required' });
      return;
    }
    if (isNaN(damageAmount) || damageAmount === 0) {
      setStatusMsg({ type: 'error', text: 'Damage amount must be a non-zero number' });
      return;
    }

    setApplyingDamage(true);
    setStatusMsg(null);
    try {
      await bossService.adminAddDamage(selectedBossId, { userId, damageAmount });
      const verb = damageAmount > 0 ? 'Added' : 'Removed';
      setStatusMsg({ type: 'success', text: `${verb} ${Math.abs(damageAmount)} damage for user ${userId}` });
      setDamageForm({ userId: '', damageAmount: '' });
      await loadLeaderboard(selectedBossId);
      await loadBosses(); // Refresh HP
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to apply damage') });
    } finally {
      setApplyingDamage(false);
    }
  };

  // ── Status message ──────────────────────────────────────────────

  const renderStatus = () => {
    if (!statusMsg) return null;
    return (
      <div className={`boss-manager__status boss-manager__status--${statusMsg.type}`}>
        <i className={statusMsg.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
        <span>{statusMsg.text}</span>
        <button className="boss-manager__status-dismiss" onClick={() => setStatusMsg(null)}>
          <i className="fas fa-times" />
        </button>
      </div>
    );
  };

  // ── Bosses panel ────────────────────────────────────────────────

  const bossesPanel = (
    <div className="boss-manager__panel">
      <div className="boss-manager__toolbar">
        <span className="boss-manager__toolbar-info">
          {bosses.filter(b => b.status === 'active').length} active, {bosses.filter(b => b.status === 'defeated').length} defeated
        </span>
        <button className="button primary" onClick={handleStartCreateBoss} disabled={saving}>
          <i className="fas fa-plus" /> New Boss
        </button>
      </div>

      {renderStatus()}

      {/* Create / Edit Form */}
      {(creatingBoss || editingBoss) && (
        <div className="boss-manager__form-panel">
          <h3>{editingBoss ? `Edit Boss: ${editingBoss.name}` : 'Create New Boss'}</h3>

          {/* Basic Info */}
          <div className="boss-manager__form-row">
            <div className="boss-manager__field boss-manager__field--grow">
              <label>Name</label>
              <input
                type="text"
                value={bossForm.name}
                onChange={e => setBossForm(prev => ({ ...prev, name: e.target.value }))}
                className="boss-manager__input"
                placeholder="e.g., Shadow Fenrir"
              />
            </div>
            <div className="boss-manager__field">
              <label>Month</label>
              <select
                value={bossForm.month}
                onChange={e => setBossForm(prev => ({ ...prev, month: parseInt(e.target.value, 10) }))}
                className="boss-manager__input"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="boss-manager__field">
              <label>Year</label>
              <input
                type="number"
                value={bossForm.year}
                onChange={e => setBossForm(prev => ({ ...prev, year: parseInt(e.target.value, 10) || new Date().getFullYear() }))}
                className="boss-manager__input"
                min="2020"
                max="2099"
              />
            </div>
          </div>

          <div className="boss-manager__form-row">
            <div className="boss-manager__field">
              <label>Total HP</label>
              <input
                type="number"
                value={bossForm.total_hp}
                onChange={e => setBossForm(prev => ({ ...prev, total_hp: parseInt(e.target.value, 10) || 0 }))}
                className="boss-manager__input"
                min="1"
              />
            </div>
            {editingBoss && (
              <>
                <div className="boss-manager__field">
                  <label>Current HP</label>
                  <input
                    type="number"
                    value={bossForm.current_hp}
                    onChange={e => setBossForm(prev => ({ ...prev, current_hp: parseInt(e.target.value, 10) || 0 }))}
                    className="boss-manager__input"
                    min="0"
                  />
                </div>
                <div className="boss-manager__field">
                  <label>Status</label>
                  <select
                    value={bossForm.status}
                    onChange={e => setBossForm(prev => ({ ...prev, status: e.target.value }))}
                    className="boss-manager__input"
                  >
                    <option value="active">Active</option>
                    <option value="defeated">Defeated</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <div className="boss-manager__field boss-manager__field--full">
            <label>Description <span className="boss-manager__optional">(optional)</span></label>
            <textarea
              value={bossForm.description}
              onChange={e => setBossForm(prev => ({ ...prev, description: e.target.value }))}
              className="boss-manager__textarea"
              rows={3}
              placeholder="Boss description / flavor text..."
            />
          </div>

          {/* Image */}
          <div className="boss-manager__field boss-manager__field--full">
            <label>Image URL <span className="boss-manager__optional">(optional)</span></label>
            <input
              type="text"
              value={bossForm.image_url}
              onChange={e => {
                setBossForm(prev => ({ ...prev, image_url: e.target.value }));
                setImagePreviewError(false);
              }}
              className="boss-manager__input"
              placeholder="https://example.com/boss.png"
            />
          </div>
          {bossForm.image_url.trim() && (
            <div className="boss-manager__image-preview-container">
              {imagePreviewError ? (
                <div className="boss-manager__image-error">
                  <i className="fas fa-image" />
                  <span>Failed to load image</span>
                </div>
              ) : (
                <img
                  src={bossForm.image_url.trim()}
                  alt="Boss preview"
                  className="boss-manager__image-preview"
                  onError={() => setImagePreviewError(true)}
                />
              )}
            </div>
          )}

          {/* Reward Editors */}
          <MonsterDataEditor
            label="Winner Reward (Rank #1)"
            data={rewardMonster}
            onChange={setRewardMonster}
          />
          <MonsterDataEditor
            label="Participant Reward (All Others)"
            data={gruntMonster}
            onChange={setGruntMonster}
          />

          {/* Form Actions */}
          <div className="boss-manager__form-actions">
            <button className="button secondary" onClick={handleCancelBossForm} disabled={saving}>Cancel</button>
            <button className="button primary" onClick={handleSaveBoss} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save</>}
            </button>
          </div>
        </div>
      )}

      {/* Bosses Table */}
      {bossesLoading ? (
        <div className="boss-manager__loading">
          <i className="fas fa-spinner fa-spin" /> Loading bosses...
        </div>
      ) : bosses.length === 0 ? (
        <div className="boss-manager__empty">
          <i className="fas fa-dragon" />
          <p>No bosses found. Create one to get started.</p>
        </div>
      ) : (
        <>
          <div className="boss-manager__table-container">
            <table className="boss-manager__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Month/Year</th>
                  <th>HP</th>
                  <th>Status</th>
                  <th>Participants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bosses.map(boss => {
                  const hpPct = boss.totalHp > 0 ? (boss.currentHp / boss.totalHp) * 100 : 0;
                  return (
                    <tr key={boss.id} className={editingBoss?.id === boss.id ? 'boss-manager__row--active' : ''}>
                      <td className="boss-manager__id-cell">{boss.id}</td>
                      <td>
                        <div className="boss-manager__boss-name">
                          {boss.imageUrl && (
                            <img
                              src={boss.imageUrl}
                              alt=""
                              className="boss-manager__boss-thumb"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          {boss.name}
                        </div>
                      </td>
                      <td>{getMonthLabel(boss.month)} {boss.year}</td>
                      <td className="boss-manager__hp-cell">
                        <div className="boss-manager__hp-info">
                          <span>{boss.currentHp.toLocaleString()} / {boss.totalHp.toLocaleString()}</span>
                          <div className="boss-manager__hp-bar">
                            <div
                              className="boss-manager__hp-fill"
                              style={{ width: `${Math.min(100, hpPct)}%`, backgroundColor: getHpColor(hpPct) }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`boss-manager__status-badge boss-manager__status-badge--${boss.status}`}>
                          {boss.status}
                        </span>
                      </td>
                      <td>{boss.totalParticipants}</td>
                      <td className="boss-manager__actions-cell">
                        <button
                          className="button secondary sm"
                          onClick={() => handleStartEditBoss(boss)}
                          title="Edit boss"
                          disabled={saving}
                        >
                          <i className="fas fa-edit" />
                        </button>
                        <button
                          className="button secondary sm"
                          onClick={() => { setSelectedBossId(boss.id); setActiveTab('damage'); }}
                          title="Manage damage"
                        >
                          <i className="fas fa-crosshairs" />
                        </button>
                        <button
                          className="button danger sm"
                          onClick={() => handleDeleteBoss(boss)}
                          title="Delete boss"
                          disabled={saving}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="boss-manager__footer">
            <span className="boss-manager__count">{bosses.length} boss{bosses.length !== 1 ? 'es' : ''}</span>
          </div>
        </>
      )}
    </div>
  );

  // ── Damage panel ────────────────────────────────────────────────

  const selectedBoss = bosses.find(b => b.id === selectedBossId);

  const damagePanel = (
    <div className="boss-manager__panel">
      {/* Boss Selector */}
      <div className="boss-manager__toolbar">
        <div className="boss-manager__filters">
          <select
            value={selectedBossId}
            onChange={e => setSelectedBossId(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="boss-manager__select"
          >
            <option value="">Select a boss...</option>
            {bosses.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({getMonthLabel(b.month)} {b.year}) — {b.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {renderStatus()}

      {selectedBossId === '' ? (
        <div className="boss-manager__empty">
          <i className="fas fa-crosshairs" />
          <p>Select a boss above to manage damage.</p>
        </div>
      ) : (
        <>
          {/* Boss HP Summary */}
          {selectedBoss && (
            <div className="boss-manager__boss-summary">
              <div className="boss-manager__boss-summary-info">
                <strong>{selectedBoss.name}</strong>
                <span className={`boss-manager__status-badge boss-manager__status-badge--${selectedBoss.status}`}>
                  {selectedBoss.status}
                </span>
              </div>
              <div className="boss-manager__hp-info boss-manager__hp-info--large">
                <span>HP: {selectedBoss.currentHp.toLocaleString()} / {selectedBoss.totalHp.toLocaleString()}</span>
                <div className="boss-manager__hp-bar boss-manager__hp-bar--large">
                  <div
                    className="boss-manager__hp-fill"
                    style={{
                      width: `${Math.min(100, selectedBoss.totalHp > 0 ? (selectedBoss.currentHp / selectedBoss.totalHp) * 100 : 0)}%`,
                      backgroundColor: getHpColor(selectedBoss.totalHp > 0 ? (selectedBoss.currentHp / selectedBoss.totalHp) * 100 : 0),
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Manual Damage Adjustment */}
          <div className="boss-manager__damage-panel">
            <h3><i className="fas fa-wrench" /> Manual Damage Adjustment</h3>
            <p className="boss-manager__hint">
              Positive values add damage to the boss (decrease HP). Negative values remove damage (increase HP).
            </p>
            <div className="boss-manager__damage-input-row">
              <div className="boss-manager__field">
                <label>User ID</label>
                <input
                  type="number"
                  value={damageForm.userId}
                  onChange={e => setDamageForm(prev => ({ ...prev, userId: e.target.value }))}
                  className="boss-manager__input"
                  placeholder="e.g., 123"
                  min="1"
                />
              </div>
              <div className="boss-manager__field">
                <label>Damage Amount</label>
                <input
                  type="number"
                  value={damageForm.damageAmount}
                  onChange={e => setDamageForm(prev => ({ ...prev, damageAmount: e.target.value }))}
                  className="boss-manager__input"
                  placeholder="e.g., 10 or -5"
                />
              </div>
              <div className="boss-manager__field boss-manager__field--action">
                <button
                  className="button primary"
                  onClick={handleApplyDamage}
                  disabled={applyingDamage || !damageForm.userId || !damageForm.damageAmount}
                >
                  {applyingDamage ? <><i className="fas fa-spinner fa-spin" /> Applying...</> : <><i className="fas fa-gavel" /> Apply Damage</>}
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboardLoading ? (
            <div className="boss-manager__loading">
              <i className="fas fa-spinner fa-spin" /> Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="boss-manager__empty">
              <i className="fas fa-trophy" />
              <p>No damage recorded for this boss yet.</p>
            </div>
          ) : (
            <>
              <h3 className="boss-manager__section-title">
                <i className="fas fa-trophy" /> Damage Leaderboard
              </h3>
              <div className="boss-manager__table-container">
                <table className="boss-manager__table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>User</th>
                      <th>Total Damage</th>
                      <th>Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => (
                      <tr key={entry.userId}>
                        <td className="boss-manager__rank-cell">#{i + 1}</td>
                        <td>
                          {entry.username || `User ${entry.userId}`}
                          {entry.discordId && (
                            <span className="boss-manager__muted"> ({entry.discordId})</span>
                          )}
                        </td>
                        <td>{entry.totalDamage.toLocaleString()}</td>
                        <td>{entry.submissionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="boss-manager__footer">
                <span className="boss-manager__count">
                  {leaderboard.length} participant{leaderboard.length !== 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  // ── Tab definitions ─────────────────────────────────────────────

  const tabs = [
    {
      key: 'bosses',
      label: 'Bosses',
      icon: 'fas fa-dragon',
      badge: bosses.length,
      content: bossesPanel,
    },
    {
      key: 'damage',
      label: 'Damage',
      icon: 'fas fa-crosshairs',
      badge: selectedBoss ? leaderboard.length : undefined,
      content: damagePanel,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="main-container">
      <h1><i className="fas fa-dragon" /> Boss Manager</h1>
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />
      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
}
