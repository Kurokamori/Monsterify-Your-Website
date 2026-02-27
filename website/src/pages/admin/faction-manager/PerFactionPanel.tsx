import { useState, useEffect, useCallback, Fragment } from 'react';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import factionAdminService from '@services/factionAdminService';
import itemsService from '@services/itemsService';
import type { Item } from '@services/itemsService';
import type {
  FactionRow,
  FactionTitleRow,
  FactionRelationshipRow,
  FactionStoreItemRow,
  FactionPromptRow,
  GiftItemDefinition,
} from '@services/factionAdminService';

interface PerFactionPanelProps {
  factions: FactionRow[];
  onFactionUpdated: () => void;
  statusMsg: { type: 'success' | 'error'; text: string } | null;
  setStatusMsg: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const RELATIONSHIP_TYPES = ['ally', 'enemy', 'neutral', 'rival', 'trade_partner'];

export default function PerFactionPanel({ factions, onFactionUpdated, statusMsg, setStatusMsg }: PerFactionPanelProps) {
  const confirmModal = useConfirmModal();
  const [selectedFactionId, setSelectedFactionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Section collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true, titles: false, relationships: false, store: false, prompts: false,
  });

  // Basic info form
  const [basicForm, setBasicForm] = useState({ name: '', description: '', banner_image: '', icon_image: '', color: '' });

  // Sub-resource data
  const [titles, setTitles] = useState<FactionTitleRow[]>([]);
  const [relationships, setRelationships] = useState<FactionRelationshipRow[]>([]);
  const [storeItems, setStoreItems] = useState<FactionStoreItemRow[]>([]);
  const [prompts, setPrompts] = useState<FactionPromptRow[]>([]);

  // New row forms
  const [newTitle, setNewTitle] = useState({ titleName: '', standingRequirement: 0, isPositive: true });
  const [newRelationship, setNewRelationship] = useState({ relatedFactionId: 0, relationshipType: 'ally', standingModifier: 0 });
  const [newStoreItem, setNewStoreItem] = useState({ itemName: '', price: 0, standingRequirement: 0, isActive: true, itemCategory: '', titleId: 0 as number | null });
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '', modifier: 0, isActive: true });

  // Gift items editor
  const [editingGiftPromptId, setEditingGiftPromptId] = useState<number | null>(null);
  const [editingGiftItems, setEditingGiftItems] = useState<GiftItemDefinition[]>([]);

  // Item categories for store items
  const [itemCategories, setItemCategories] = useState<string[]>([]);
  const [categoryItems, setCategoryItems] = useState<Record<string, Item[]>>({});
  const [newStoreCategory, setNewStoreCategory] = useState('');

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Load item categories on mount
  useEffect(() => {
    itemsService.getCategories().then(setItemCategories).catch(console.error);
  }, []);

  const loadCategoryItems = async (category: string) => {
    if (categoryItems[category]) return;
    try {
      const resp = await itemsService.getItems({ category, limit: 500 });
      setCategoryItems(prev => ({ ...prev, [category]: resp.data || [] }));
    } catch (err) {
      console.error('Failed to load items for category:', err);
    }
  };

  const loadFactionData = useCallback(async (factionId: number) => {
    try {
      const [titlesData, relationshipsData, storeData, promptsData] = await Promise.all([
        factionAdminService.getTitles(factionId),
        factionAdminService.getRelationships(factionId),
        factionAdminService.getStoreItems(factionId),
        factionAdminService.getPromptsByFaction(factionId),
      ]);
      setTitles(titlesData);
      setRelationships(relationshipsData);
      setStoreItems(storeData);
      setPrompts(promptsData);
    } catch (err) {
      console.error('Failed to load faction data:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load faction data' });
    }
  }, [setStatusMsg]);

  useEffect(() => {
    if (selectedFactionId) {
      const faction = factions.find(f => f.id === selectedFactionId);
      if (faction) {
        setBasicForm({
          name: faction.name,
          description: faction.description || '',
          banner_image: faction.banner_image || '',
          icon_image: faction.icon_image || '',
          color: faction.color || '',
        });
        loadFactionData(selectedFactionId);
      }
    } else {
      setTitles([]);
      setRelationships([]);
      setStoreItems([]);
      setPrompts([]);
    }
  }, [selectedFactionId, factions, loadFactionData]);

  // ── Basic Info ───────────────────────────────────────────────

  const handleSaveBasicInfo = async () => {
    if (!selectedFactionId || !basicForm.name.trim()) {
      setStatusMsg({ type: 'error', text: 'Faction name is required' });
      return;
    }
    setSaving(true);
    try {
      await factionAdminService.updateFaction(selectedFactionId, {
        name: basicForm.name.trim(),
        description: basicForm.description.trim() || null,
        bannerImage: basicForm.banner_image.trim() || null,
        iconImage: basicForm.icon_image.trim() || null,
        color: basicForm.color.trim() || null,
      });
      setStatusMsg({ type: 'success', text: 'Faction updated' });
      onFactionUpdated();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update faction') });
    } finally {
      setSaving(false);
    }
  };

  // ── Titles ───────────────────────────────────────────────────

  const handleCreateTitle = async () => {
    if (!selectedFactionId || !newTitle.titleName.trim()) return;
    setSaving(true);
    try {
      const title = await factionAdminService.createTitle({
        factionId: selectedFactionId,
        titleName: newTitle.titleName.trim(),
        standingRequirement: newTitle.standingRequirement,
        isPositive: newTitle.isPositive,
      });
      setTitles(prev => [...prev, title].sort((a, b) => a.standing_requirement - b.standing_requirement));
      setNewTitle({ titleName: '', standingRequirement: 0, isPositive: true });
      setStatusMsg({ type: 'success', text: 'Title created' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to create title') });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTitle = async (titleId: number, data: { titleName?: string; standingRequirement?: number; isPositive?: boolean }) => {
    setSaving(true);
    try {
      const updated = await factionAdminService.updateTitle(titleId, data);
      setTitles(prev => prev.map(t => t.id === titleId ? updated : t));
      setStatusMsg({ type: 'success', text: 'Title updated' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update title') });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTitle = (titleId: number) => {
    confirmModal.confirmDanger('Delete this title?', async () => {
      try {
        await factionAdminService.deleteTitle(titleId);
        setTitles(prev => prev.filter(t => t.id !== titleId));
        setStatusMsg({ type: 'success', text: 'Title deleted' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete title') });
      }
    });
  };

  // ── Relationships ────────────────────────────────────────────

  const handleCreateRelationship = async () => {
    if (!selectedFactionId || !newRelationship.relatedFactionId) return;
    setSaving(true);
    try {
      const rel = await factionAdminService.createRelationship({
        factionId: selectedFactionId,
        relatedFactionId: newRelationship.relatedFactionId,
        relationshipType: newRelationship.relationshipType,
        standingModifier: newRelationship.standingModifier,
      });
      setRelationships(prev => [...prev, rel]);
      setNewRelationship({ relatedFactionId: 0, relationshipType: 'ally', standingModifier: 0 });
      setStatusMsg({ type: 'success', text: 'Relationship created' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to create relationship') });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRelationship = async (relId: number, data: { relatedFactionId?: number; relationshipType?: string; standingModifier?: number }) => {
    setSaving(true);
    try {
      const updated = await factionAdminService.updateRelationship(relId, data);
      setRelationships(prev => prev.map(r => r.id === relId ? updated : r));
      setStatusMsg({ type: 'success', text: 'Relationship updated' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update relationship') });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelationship = (relId: number) => {
    confirmModal.confirmDanger('Delete this relationship?', async () => {
      try {
        await factionAdminService.deleteRelationship(relId);
        setRelationships(prev => prev.filter(r => r.id !== relId));
        setStatusMsg({ type: 'success', text: 'Relationship deleted' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete relationship') });
      }
    });
  };

  // ── Store Items ──────────────────────────────────────────────

  const handleCreateStoreItem = async () => {
    if (!selectedFactionId || !newStoreItem.itemName.trim()) return;
    setSaving(true);
    try {
      const item = await factionAdminService.createStoreItem({
        factionId: selectedFactionId,
        itemName: newStoreItem.itemName.trim(),
        price: newStoreItem.price,
        standingRequirement: newStoreItem.standingRequirement,
        isActive: newStoreItem.isActive,
        itemCategory: newStoreItem.itemCategory || null,
        titleId: newStoreItem.titleId || null,
      });
      setStoreItems(prev => [...prev, item]);
      setNewStoreItem({ itemName: '', price: 0, standingRequirement: 0, isActive: true, itemCategory: '', titleId: null });
      setNewStoreCategory('');
      setStatusMsg({ type: 'success', text: 'Store item created' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to create store item') });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStoreItem = async (itemId: number, data: { itemName?: string; price?: number; standingRequirement?: number; isActive?: boolean; itemCategory?: string | null; titleId?: number | null }) => {
    setSaving(true);
    try {
      const updated = await factionAdminService.updateStoreItem(itemId, data);
      setStoreItems(prev => prev.map(i => i.id === itemId ? updated : i));
      setStatusMsg({ type: 'success', text: 'Store item updated' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update store item') });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStoreItem = (itemId: number) => {
    confirmModal.confirmDanger('Delete this store item?', async () => {
      try {
        await factionAdminService.deleteStoreItem(itemId);
        setStoreItems(prev => prev.filter(i => i.id !== itemId));
        setStatusMsg({ type: 'success', text: 'Store item deleted' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete store item') });
      }
    });
  };

  const handleToggleStoreItemActive = async (item: FactionStoreItemRow) => {
    const newActive = !item.is_active;
    setStoreItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newActive } : i));
    try {
      await factionAdminService.updateStoreItem(item.id, { isActive: newActive });
      setStatusMsg({ type: 'success', text: `Item ${newActive ? 'activated' : 'deactivated'}` });
    } catch (err) {
      setStoreItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: item.is_active } : i));
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to toggle store item') });
    }
  };

  // ── Prompts ────────────────────────────────────────────────

  const handleCreatePrompt = async () => {
    if (!selectedFactionId || !newPrompt.name.trim()) return;
    setSaving(true);
    try {
      const prompt = await factionAdminService.createPrompt({
        factionId: selectedFactionId,
        name: newPrompt.name.trim(),
        description: newPrompt.description.trim() || null,
        modifier: newPrompt.modifier,
        isActive: newPrompt.isActive,
      });
      setPrompts(prev => [...prev, prompt]);
      setNewPrompt({ name: '', description: '', modifier: 0, isActive: true });
      setStatusMsg({ type: 'success', text: 'Prompt created' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to create prompt') });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePrompt = async (promptId: number, data: { name?: string; description?: string | null; modifier?: number; isActive?: boolean; submissionGiftItems?: GiftItemDefinition[] | null }) => {
    setSaving(true);
    try {
      const updated = await factionAdminService.updatePrompt(promptId, data);
      setPrompts(prev => prev.map(p => p.id === promptId ? updated : p));
      setStatusMsg({ type: 'success', text: 'Prompt updated' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update prompt') });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePromptActive = async (prompt: FactionPromptRow) => {
    const newActive = !prompt.isActive;
    setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, isActive: newActive } : p));
    try {
      await factionAdminService.updatePrompt(prompt.id, { isActive: newActive });
      setStatusMsg({ type: 'success', text: `Prompt ${newActive ? 'activated' : 'deactivated'}` });
    } catch (err) {
      setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, isActive: prompt.isActive } : p));
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to toggle prompt') });
    }
  };

  const handleDeletePrompt = (promptId: number) => {
    confirmModal.confirmDanger('Delete this prompt?', async () => {
      try {
        await factionAdminService.deletePrompt(promptId);
        setPrompts(prev => prev.filter(p => p.id !== promptId));
        setStatusMsg({ type: 'success', text: 'Prompt deleted' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete prompt') });
      }
    });
  };

  // ── Render Helpers ───────────────────────────────────────────

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

  const renderSectionHeader = (key: string, title: string, icon: string, count?: number) => (
    <div className="faction-manager__section-header" onClick={() => toggleSection(key)}>
      <h3>
        <i className={`fas ${icon}`} /> {title}
        {count !== undefined && <span className="faction-manager__optional">({count})</span>}
      </h3>
      <i className={`fas fa-chevron-down faction-manager__section-toggle ${openSections[key] ? 'faction-manager__section-toggle--open' : ''}`} />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="faction-manager__panel">
      {/* Faction Selector */}
      <div className="faction-manager__toolbar">
        <div className="faction-manager__filters">
          <select
            value={selectedFactionId ?? ''}
            onChange={e => setSelectedFactionId(e.target.value ? parseInt(e.target.value) : null)}
            className="faction-manager__select"
          >
            <option value="">Select a faction...</option>
            {factions.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {renderStatus()}

      {!selectedFactionId ? (
        <div className="faction-manager__empty">
          <i className="fas fa-shield-alt" />
          <p>Select a faction above to manage its details.</p>
        </div>
      ) : (
        <>
          {/* Basic Info Section */}
          <div className="faction-manager__section">
            {renderSectionHeader('basic', 'Basic Info', 'fa-info-circle')}
            {openSections.basic && (
              <div className="faction-manager__section-body">
                <div className="faction-manager__form-row">
                  <div className="faction-manager__field faction-manager__field--grow">
                    <label>Name</label>
                    <input
                      type="text"
                      value={basicForm.name}
                      onChange={e => setBasicForm(prev => ({ ...prev, name: e.target.value }))}
                      className="faction-manager__input"
                    />
                  </div>
                  <div className="faction-manager__field">
                    <label>Color</label>
                    <div className="faction-manager__color-preview">
                      <input
                        type="color"
                        value={basicForm.color || '#666666'}
                        onChange={e => setBasicForm(prev => ({ ...prev, color: e.target.value }))}
                        className="faction-manager__color-input"
                      />
                      <input
                        type="text"
                        value={basicForm.color}
                        onChange={e => setBasicForm(prev => ({ ...prev, color: e.target.value }))}
                        className="faction-manager__input"
                        placeholder="#hex"
                        style={{ width: '100px' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="faction-manager__form-row">
                  <div className="faction-manager__field faction-manager__field--full">
                    <label>Description</label>
                    <textarea
                      value={basicForm.description}
                      onChange={e => setBasicForm(prev => ({ ...prev, description: e.target.value }))}
                      className="faction-manager__textarea"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="faction-manager__form-row">
                  <div className="faction-manager__field faction-manager__field--grow">
                    <label>Banner Image URL</label>
                    <input
                      type="text"
                      value={basicForm.banner_image}
                      onChange={e => setBasicForm(prev => ({ ...prev, banner_image: e.target.value }))}
                      className="faction-manager__input"
                      placeholder="https://..."
                    />
                    {basicForm.banner_image && (
                      <img src={basicForm.banner_image} alt="Banner" className="faction-manager__image-preview" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                  <div className="faction-manager__field faction-manager__field--grow">
                    <label>Icon Image URL</label>
                    <input
                      type="text"
                      value={basicForm.icon_image}
                      onChange={e => setBasicForm(prev => ({ ...prev, icon_image: e.target.value }))}
                      className="faction-manager__input"
                      placeholder="https://..."
                    />
                    {basicForm.icon_image && (
                      <img src={basicForm.icon_image} alt="Icon" className="faction-manager__image-preview" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                </div>
                <div className="faction-manager__form-actions">
                  <button className="button primary" onClick={handleSaveBasicInfo} disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save Basic Info</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Titles Section */}
          <div className="faction-manager__section">
            {renderSectionHeader('titles', 'Titles', 'fa-crown', titles.length)}
            {openSections.titles && (
              <div className="faction-manager__section-body" key={`titles-${selectedFactionId}`}>
                {titles.length > 0 && (
                  <div className="faction-manager__table-container">
                    <table className="faction-manager__table">
                      <thead>
                        <tr>
                          <th>Title Name</th>
                          <th>Standing Req.</th>
                          <th>Positive</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {titles.map(title => (
                          <tr key={title.id}>
                            <td>
                              <input
                                type="text"
                                defaultValue={title.name}
                                key={`name-${title.id}-${title.name}`}
                                onBlur={e => {
                                  if (e.target.value !== title.name) {
                                    handleUpdateTitle(title.id, { titleName: e.target.value });
                                  }
                                }}
                                style={{ minWidth: '150px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                defaultValue={title.standing_requirement}
                                key={`req-${title.id}-${title.standing_requirement}`}
                                onBlur={e => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val !== title.standing_requirement) {
                                    handleUpdateTitle(title.id, { standingRequirement: val });
                                  }
                                }}
                                style={{ width: '80px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={title.is_positive}
                                onChange={e => handleUpdateTitle(title.id, { isPositive: e.target.checked })}
                              />
                            </td>
                            <td className="faction-manager__actions-cell">
                              <button className="button danger sm" onClick={() => handleDeleteTitle(title.id)} title="Delete">
                                <i className="fas fa-trash" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="faction-manager__add-row">
                  <div className="faction-manager__field">
                    <label>Title Name</label>
                    <input
                      type="text"
                      value={newTitle.titleName}
                      onChange={e => setNewTitle(prev => ({ ...prev, titleName: e.target.value }))}
                      className="faction-manager__input"
                      placeholder="New title..."
                    />
                  </div>
                  <div className="faction-manager__field">
                    <label>Standing Req.</label>
                    <input
                      type="number"
                      value={newTitle.standingRequirement}
                      onChange={e => setNewTitle(prev => ({ ...prev, standingRequirement: parseInt(e.target.value) || 0 }))}
                      className="faction-manager__input"
                      style={{ width: '80px' }}
                    />
                  </div>
                  <div className="faction-manager__field">
                    <label className="faction-manager__checkbox-label">
                      <input
                        type="checkbox"
                        checked={newTitle.isPositive}
                        onChange={e => setNewTitle(prev => ({ ...prev, isPositive: e.target.checked }))}
                      />
                      Positive
                    </label>
                  </div>
                  <button className="button primary sm" onClick={handleCreateTitle} disabled={saving || !newTitle.titleName.trim()}>
                    <i className="fas fa-plus" /> Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Relationships Section */}
          <div className="faction-manager__section">
            {renderSectionHeader('relationships', 'Relationships', 'fa-handshake', relationships.length)}
            {openSections.relationships && (
              <div className="faction-manager__section-body" key={`rels-${selectedFactionId}`}>
                {relationships.length > 0 && (
                  <div className="faction-manager__table-container">
                    <table className="faction-manager__table">
                      <thead>
                        <tr>
                          <th>Related Faction</th>
                          <th>Type</th>
                          <th>Standing Modifier</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relationships.map(rel => (
                          <tr key={rel.id}>
                            <td>
                              <select
                                defaultValue={rel.related_faction_id}
                                key={`faction-${rel.id}-${rel.related_faction_id}`}
                                onChange={e => handleUpdateRelationship(rel.id, { relatedFactionId: parseInt(e.target.value) })}
                              >
                                {factions.filter(f => f.id !== selectedFactionId).map(f => (
                                  <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                defaultValue={rel.relationship_type}
                                key={`type-${rel.id}-${rel.relationship_type}`}
                                onChange={e => handleUpdateRelationship(rel.id, { relationshipType: e.target.value })}
                              >
                                {RELATIONSHIP_TYPES.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                defaultValue={rel.standing_modifier}
                                key={`mod-${rel.id}-${rel.standing_modifier}`}
                                onBlur={e => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val !== rel.standing_modifier) {
                                    handleUpdateRelationship(rel.id, { standingModifier: val });
                                  }
                                }}
                                style={{ width: '80px' }}
                              />
                            </td>
                            <td className="faction-manager__actions-cell">
                              <button className="button danger sm" onClick={() => handleDeleteRelationship(rel.id)} title="Delete">
                                <i className="fas fa-trash" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="faction-manager__add-row">
                  <div className="faction-manager__field">
                    <label>Faction</label>
                    <select
                      value={newRelationship.relatedFactionId}
                      onChange={e => setNewRelationship(prev => ({ ...prev, relatedFactionId: parseInt(e.target.value) || 0 }))}
                      className="faction-manager__input"
                    >
                      <option value={0}>Select...</option>
                      {factions.filter(f => f.id !== selectedFactionId).map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="faction-manager__field">
                    <label>Type</label>
                    <select
                      value={newRelationship.relationshipType}
                      onChange={e => setNewRelationship(prev => ({ ...prev, relationshipType: e.target.value }))}
                      className="faction-manager__input"
                    >
                      {RELATIONSHIP_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="faction-manager__field">
                    <label>Modifier</label>
                    <input
                      type="number"
                      value={newRelationship.standingModifier}
                      onChange={e => setNewRelationship(prev => ({ ...prev, standingModifier: parseInt(e.target.value) || 0 }))}
                      className="faction-manager__input"
                      style={{ width: '80px' }}
                    />
                  </div>
                  <button className="button primary sm" onClick={handleCreateRelationship} disabled={saving || !newRelationship.relatedFactionId}>
                    <i className="fas fa-plus" /> Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Store Items Section */}
          <div className="faction-manager__section">
            {renderSectionHeader('store', 'Store Items', 'fa-store', storeItems.length)}
            {openSections.store && (
              <div className="faction-manager__section-body" key={`store-${selectedFactionId}`}>
                {storeItems.length > 0 && (
                  <div className="faction-manager__table-container">
                    <table className="faction-manager__table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Item Name</th>
                          <th>Price</th>
                          <th>Required Title</th>
                          <th>Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeItems.map(item => (
                          <tr key={item.id}>
                            <td>
                              <span className="badge neutral sm">{item.item_category || 'general'}</span>
                            </td>
                            <td>
                              <input
                                type="text"
                                defaultValue={item.item_name}
                                key={`name-${item.id}-${item.item_name}`}
                                onBlur={e => {
                                  if (e.target.value !== item.item_name) {
                                    handleUpdateStoreItem(item.id, { itemName: e.target.value });
                                  }
                                }}
                                style={{ minWidth: '150px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                defaultValue={item.price}
                                key={`price-${item.id}-${item.price}`}
                                onBlur={e => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val !== item.price) {
                                    handleUpdateStoreItem(item.id, { price: val });
                                  }
                                }}
                                style={{ width: '80px' }}
                              />
                            </td>
                            <td>
                              <select
                                defaultValue={item.title_id ?? ''}
                                key={`title-${item.id}-${item.title_id}`}
                                onChange={e => {
                                  const val = e.target.value ? parseInt(e.target.value) : null;
                                  handleUpdateStoreItem(item.id, { titleId: val });
                                }}
                              >
                                <option value="">None</option>
                                {titles.map(t => (
                                  <option key={t.id} value={t.id}>{t.name} ({t.standing_requirement})</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <button
                                className="button secondary sm"
                                onClick={() => handleToggleStoreItemActive(item)}
                                title={item.is_active ? 'Deactivate' : 'Activate'}
                              >
                                <i className={`fas fa-${item.is_active ? 'eye' : 'eye-slash'}`} />
                              </button>
                            </td>
                            <td className="faction-manager__actions-cell">
                              <button className="button danger sm" onClick={() => handleDeleteStoreItem(item.id)} title="Delete">
                                <i className="fas fa-trash" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="faction-manager__add-row" style={{ flexWrap: 'wrap' }}>
                  <div className="faction-manager__field">
                    <label>Category</label>
                    <select
                      value={newStoreCategory}
                      onChange={e => {
                        const cat = e.target.value;
                        setNewStoreCategory(cat);
                        setNewStoreItem(prev => ({ ...prev, itemCategory: cat, itemName: '' }));
                        if (cat) loadCategoryItems(cat);
                      }}
                      className="faction-manager__input"
                    >
                      <option value="">Select category...</option>
                      {itemCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="faction-manager__field">
                    <label>Item</label>
                    <select
                      value={newStoreItem.itemName}
                      onChange={e => setNewStoreItem(prev => ({ ...prev, itemName: e.target.value }))}
                      className="faction-manager__input"
                      disabled={!newStoreCategory}
                    >
                      <option value="">Select item...</option>
                      {(categoryItems[newStoreCategory] || []).map(i => (
                        <option key={i.id} value={i.name}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="faction-manager__field">
                    <label>Price</label>
                    <input
                      type="number"
                      value={newStoreItem.price}
                      onChange={e => setNewStoreItem(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      className="faction-manager__input"
                      style={{ width: '80px' }}
                    />
                  </div>
                  <div className="faction-manager__field">
                    <label>Required Title</label>
                    <select
                      value={newStoreItem.titleId ?? ''}
                      onChange={e => setNewStoreItem(prev => ({ ...prev, titleId: e.target.value ? parseInt(e.target.value) : null }))}
                      className="faction-manager__input"
                    >
                      <option value="">None</option>
                      {titles.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.standing_requirement})</option>
                      ))}
                    </select>
                  </div>
                  <button className="button primary sm" onClick={handleCreateStoreItem} disabled={saving || !newStoreItem.itemName.trim()}>
                    <i className="fas fa-plus" /> Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prompts Section */}
          <div className="faction-manager__section">
            {renderSectionHeader('prompts', 'Prompts', 'fa-clipboard-list', prompts.length)}
            {openSections.prompts && (
              <div className="faction-manager__section-body" key={`prompts-${selectedFactionId}`}>
                {prompts.length > 0 && (
                  <div className="faction-manager__table-container">
                    <table className="faction-manager__table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Modifier</th>
                          <th>Gifts</th>
                          <th>Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prompts.map(prompt => (
                          <Fragment key={prompt.id}>
                            <tr>
                              <td>
                                <input
                                  type="text"
                                  defaultValue={prompt.name}
                                  key={`pname-${prompt.id}-${prompt.name}`}
                                  onBlur={e => {
                                    if (e.target.value !== prompt.name) {
                                      handleUpdatePrompt(prompt.id, { name: e.target.value });
                                    }
                                  }}
                                  style={{ minWidth: '150px' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  defaultValue={prompt.description || ''}
                                  key={`pdesc-${prompt.id}-${prompt.description}`}
                                  onBlur={e => {
                                    const newVal = e.target.value.trim() || null;
                                    if (newVal !== (prompt.description || null)) {
                                      handleUpdatePrompt(prompt.id, { description: newVal });
                                    }
                                  }}
                                  style={{ minWidth: '200px' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  defaultValue={prompt.modifier}
                                  key={`pmod-${prompt.id}-${prompt.modifier}`}
                                  onBlur={e => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val !== prompt.modifier) {
                                      handleUpdatePrompt(prompt.id, { modifier: val });
                                    }
                                  }}
                                  style={{ width: '80px' }}
                                />
                              </td>
                              <td>
                                <button
                                  className="button secondary sm"
                                  onClick={() => {
                                    if (editingGiftPromptId === prompt.id) {
                                      setEditingGiftPromptId(null);
                                    } else {
                                      setEditingGiftPromptId(prompt.id);
                                      setEditingGiftItems(prompt.submissionGiftItems ? [...prompt.submissionGiftItems] : []);
                                    }
                                  }}
                                  title="Edit gift items"
                                >
                                  <i className="fas fa-gift" /> {(prompt.submissionGiftItems?.length || 0) > 0 ? `${prompt.submissionGiftItems!.length} gifts` : '0'}
                                </button>
                              </td>
                              <td>
                                <button
                                  className="button secondary sm"
                                  onClick={() => handleTogglePromptActive(prompt)}
                                  title={prompt.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  <i className={`fas fa-${prompt.isActive ? 'eye' : 'eye-slash'}`} />
                                </button>
                              </td>
                              <td className="faction-manager__actions-cell">
                                <button className="button danger sm" onClick={() => handleDeletePrompt(prompt.id)} title="Delete">
                                  <i className="fas fa-trash" />
                                </button>
                              </td>
                            </tr>
                            {editingGiftPromptId === prompt.id && (
                              <tr key={`gift-editor-${prompt.id}`}>
                                <td colSpan={6}>
                                  <div style={{ padding: 'var(--spacing-small)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-small)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-small)' }}>
                                      <strong>Gift Item Definitions</strong>
                                      <div style={{ display: 'flex', gap: 'var(--spacing-xsmall)' }}>
                                        <button className="button secondary sm" onClick={() => setEditingGiftItems(prev => [...prev, { type: 'specific', items: [{ name: '', quantity: 1 }] }])}>
                                          + Specific
                                        </button>
                                        <button className="button secondary sm" onClick={() => setEditingGiftItems(prev => [...prev, { type: 'random_subset', items: [''], quantity: 1 }])}>
                                          + Random Subset
                                        </button>
                                        <button className="button secondary sm" onClick={() => setEditingGiftItems(prev => [...prev, { type: 'random_category', category: '', quantity: 1 }])}>
                                          + Random Category
                                        </button>
                                      </div>
                                    </div>
                                    {editingGiftItems.map((def, defIdx) => (
                                      <div key={defIdx} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-small)', padding: 'var(--spacing-xsmall)', marginBottom: 'var(--spacing-xsmall)', background: 'var(--bg-secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xsmall)' }}>
                                          <span className="badge neutral sm">{def.type === 'specific' ? 'Specific Items' : def.type === 'random_subset' ? 'Random from Subset' : 'Random from Category'}</span>
                                          <button className="button danger sm" onClick={() => setEditingGiftItems(prev => prev.filter((_, i) => i !== defIdx))} title="Remove">
                                            <i className="fas fa-times" />
                                          </button>
                                        </div>
                                        {def.type === 'specific' && (
                                          <div>
                                            {def.items.map((item, itemIdx) => (
                                              <div key={itemIdx} style={{ display: 'flex', gap: 'var(--spacing-xsmall)', alignItems: 'center', marginBottom: '4px' }}>
                                                <input
                                                  type="text" placeholder="Item name" value={item.name}
                                                  onChange={e => {
                                                    const updated = [...editingGiftItems] as GiftItemDefinition[];
                                                    const specific = updated[defIdx] as GiftItemDefinition & { type: 'specific'; items: { name: string; quantity: number }[] };
                                                    specific.items[itemIdx] = { ...specific.items[itemIdx]!, name: e.target.value };
                                                    setEditingGiftItems(updated);
                                                  }}
                                                  style={{ flex: 1 }}
                                                />
                                                <input
                                                  type="number" placeholder="Qty" value={item.quantity} min={1}
                                                  onChange={e => {
                                                    const updated = [...editingGiftItems] as GiftItemDefinition[];
                                                    const specific = updated[defIdx] as GiftItemDefinition & { type: 'specific'; items: { name: string; quantity: number }[] };
                                                    specific.items[itemIdx] = { ...specific.items[itemIdx]!, quantity: parseInt(e.target.value) || 1 };
                                                    setEditingGiftItems(updated);
                                                  }}
                                                  style={{ width: '60px' }}
                                                />
                                                <button className="button danger sm" onClick={() => {
                                                  const updated = [...editingGiftItems] as GiftItemDefinition[];
                                                  const specific = updated[defIdx] as GiftItemDefinition & { type: 'specific'; items: { name: string; quantity: number }[] };
                                                  specific.items = specific.items.filter((_, i) => i !== itemIdx);
                                                  setEditingGiftItems(updated);
                                                }}><i className="fas fa-minus" /></button>
                                              </div>
                                            ))}
                                            <button className="button secondary sm" style={{ marginTop: '4px' }} onClick={() => {
                                              const updated = [...editingGiftItems] as GiftItemDefinition[];
                                              const specific = updated[defIdx] as GiftItemDefinition & { type: 'specific'; items: { name: string; quantity: number }[] };
                                              specific.items = [...specific.items, { name: '', quantity: 1 }];
                                              setEditingGiftItems(updated);
                                            }}><i className="fas fa-plus" /> Add Item</button>
                                          </div>
                                        )}
                                        {def.type === 'random_subset' && (
                                          <div>
                                            <div style={{ marginBottom: '4px' }}>
                                              <label style={{ fontSize: 'var(--font-size-small)' }}>Pick quantity:</label>
                                              <input type="number" value={def.quantity} min={1}
                                                onChange={e => {
                                                  const updated = [...editingGiftItems] as GiftItemDefinition[];
                                                  (updated[defIdx] as GiftItemDefinition & { type: 'random_subset' }).quantity = parseInt(e.target.value) || 1;
                                                  setEditingGiftItems(updated);
                                                }}
                                                style={{ width: '60px', marginLeft: '4px' }}
                                              />
                                            </div>
                                            {def.items.map((itemName, itemIdx) => (
                                              <div key={itemIdx} style={{ display: 'flex', gap: 'var(--spacing-xsmall)', alignItems: 'center', marginBottom: '4px' }}>
                                                <input type="text" placeholder="Item name" value={itemName}
                                                  onChange={e => {
                                                    const updated = [...editingGiftItems] as GiftItemDefinition[];
                                                    const subset = updated[defIdx] as GiftItemDefinition & { type: 'random_subset'; items: string[] };
                                                    subset.items[itemIdx] = e.target.value;
                                                    setEditingGiftItems(updated);
                                                  }}
                                                  style={{ flex: 1 }}
                                                />
                                                <button className="button danger sm" onClick={() => {
                                                  const updated = [...editingGiftItems] as GiftItemDefinition[];
                                                  const subset = updated[defIdx] as GiftItemDefinition & { type: 'random_subset'; items: string[] };
                                                  subset.items = subset.items.filter((_, i) => i !== itemIdx);
                                                  setEditingGiftItems(updated);
                                                }}><i className="fas fa-minus" /></button>
                                              </div>
                                            ))}
                                            <button className="button secondary sm" style={{ marginTop: '4px' }} onClick={() => {
                                              const updated = [...editingGiftItems] as GiftItemDefinition[];
                                              const subset = updated[defIdx] as GiftItemDefinition & { type: 'random_subset'; items: string[] };
                                              subset.items = [...subset.items, ''];
                                              setEditingGiftItems(updated);
                                            }}><i className="fas fa-plus" /> Add Item</button>
                                          </div>
                                        )}
                                        {def.type === 'random_category' && (
                                          <div style={{ display: 'flex', gap: 'var(--spacing-xsmall)', alignItems: 'center' }}>
                                            <div className="faction-manager__field">
                                              <label style={{ fontSize: 'var(--font-size-small)' }}>Category</label>
                                              <select value={def.category}
                                                onChange={e => {
                                                  const updated = [...editingGiftItems] as GiftItemDefinition[];
                                                  (updated[defIdx] as GiftItemDefinition & { type: 'random_category' }).category = e.target.value;
                                                  setEditingGiftItems(updated);
                                                }}
                                              >
                                                <option value="">Select...</option>
                                                {itemCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                              </select>
                                            </div>
                                            <div className="faction-manager__field">
                                              <label style={{ fontSize: 'var(--font-size-small)' }}>Quantity</label>
                                              <input type="number" value={def.quantity} min={1}
                                                onChange={e => {
                                                  const updated = [...editingGiftItems] as GiftItemDefinition[];
                                                  (updated[defIdx] as GiftItemDefinition & { type: 'random_category' }).quantity = parseInt(e.target.value) || 1;
                                                  setEditingGiftItems(updated);
                                                }}
                                                style={{ width: '60px' }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xsmall)', marginTop: 'var(--spacing-small)' }}>
                                      <button className="button primary sm" onClick={async () => {
                                        await handleUpdatePrompt(prompt.id, { submissionGiftItems: editingGiftItems.length > 0 ? editingGiftItems : null });
                                        setEditingGiftPromptId(null);
                                      }} disabled={saving}>
                                        <i className="fas fa-save" /> Save Gifts
                                      </button>
                                      <button className="button secondary sm" onClick={() => setEditingGiftPromptId(null)}>
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="faction-manager__add-row">
                  <div className="faction-manager__field">
                    <label>Name</label>
                    <input
                      type="text"
                      value={newPrompt.name}
                      onChange={e => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                      className="faction-manager__input"
                      placeholder="Prompt name..."
                    />
                  </div>
                  <div className="faction-manager__field faction-manager__field--grow">
                    <label>Description</label>
                    <input
                      type="text"
                      value={newPrompt.description}
                      onChange={e => setNewPrompt(prev => ({ ...prev, description: e.target.value }))}
                      className="faction-manager__input"
                      placeholder="Optional description..."
                    />
                  </div>
                  <div className="faction-manager__field">
                    <label>Modifier</label>
                    <input
                      type="number"
                      value={newPrompt.modifier}
                      onChange={e => setNewPrompt(prev => ({ ...prev, modifier: parseInt(e.target.value) || 0 }))}
                      className="faction-manager__input"
                      style={{ width: '80px' }}
                    />
                  </div>
                  <button className="button primary sm" onClick={handleCreatePrompt} disabled={saving || !newPrompt.name.trim()}>
                    <i className="fas fa-plus" /> Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
}
