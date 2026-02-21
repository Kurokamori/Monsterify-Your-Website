import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { TabContainer } from '@components/common/TabContainer';
import { Pagination } from '@components/common/Pagination';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import townService from '@services/townService';
import type { LocationPrompt, LocationFlavor, PaginationInfo } from '@services/townService';
import '@styles/admin/town-activities-editor.css';

// ============================================================================
// Location & Activity Constants (mirrors backend location-constants.ts)
// ============================================================================

const LOCATIONS: Record<string, { label: string; activities: { id: string; label: string }[] }> = {
  pirates_dock: {
    label: "Pirate's Dock",
    activities: [
      { id: 'swab', label: 'Swab the Deck' },
      { id: 'fishing', label: 'Go Fishing' },
    ],
  },
  garden: {
    label: 'Garden',
    activities: [{ id: 'tend', label: 'Tend the Garden' }],
  },
  farm: {
    label: 'Farm',
    activities: [{ id: 'work', label: 'Work the Farm' }],
  },
  game_corner: {
    label: 'Game Corner',
    activities: [{ id: 'play', label: 'Play at the Game Corner' }],
  },
};

const LOCATION_KEYS = Object.keys(LOCATIONS);

function getLocationLabel(location: string): string {
  return LOCATIONS[location]?.label ?? location;
}

function getActivityLabel(location: string, activity: string): string {
  return LOCATIONS[location]?.activities.find(a => a.id === activity)?.label ?? activity;
}

function getActivitiesForLocation(location: string): { id: string; label: string }[] {
  return LOCATIONS[location]?.activities ?? [];
}

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// ============================================================================
// Main Component
// ============================================================================

export default function TownActivitiesEditorPage() {
  useDocumentTitle('Town Activities Editor');

  const [activeTab, setActiveTab] = useState('prompts');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const confirmModal = useConfirmModal();

  // ── Prompts state ─────────────────────────────────────────────────
  const [prompts, setPrompts] = useState<LocationPrompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [promptsPagination, setPromptsPagination] = useState<PaginationInfo>({ page: 1, totalPages: 1, total: 0 });
  const [promptFilterLocation, setPromptFilterLocation] = useState('all');
  const [promptFilterActivity, setPromptFilterActivity] = useState('all');
  const [editingPrompt, setEditingPrompt] = useState<LocationPrompt | null>(null);
  const [creatingPrompt, setCreatingPrompt] = useState(false);
  const [promptForm, setPromptForm] = useState({
    location: 'pirates_dock',
    activity: 'swab',
    prompt_text: '',
    difficulty: '',
  });
  const [saving, setSaving] = useState(false);

  // ── Flavors state ─────────────────────────────────────────────────
  const [flavors, setFlavors] = useState<LocationFlavor[]>([]);
  const [flavorsLoading, setFlavorsLoading] = useState(true);
  const [flavorsPagination, setFlavorsPagination] = useState<PaginationInfo>({ page: 1, totalPages: 1, total: 0 });
  const [flavorFilterLocation, setFlavorFilterLocation] = useState('all');
  const [editingFlavor, setEditingFlavor] = useState<LocationFlavor | null>(null);
  const [creatingFlavor, setCreatingFlavor] = useState(false);
  const [flavorForm, setFlavorForm] = useState({
    location: 'pirates_dock',
    image_url: '',
    flavor_text: '',
  });
  const [imageError, setImageError] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────

  const loadPrompts = useCallback(async (page = 1) => {
    setPromptsLoading(true);
    try {
      const res = await townService.adminGetPrompts(page, 200);
      setPrompts(res.prompts);
      setPromptsPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load prompts' });
    } finally {
      setPromptsLoading(false);
    }
  }, []);

  const loadFlavors = useCallback(async (page = 1) => {
    setFlavorsLoading(true);
    try {
      const res = await townService.adminGetFlavors(page, 200);
      setFlavors(res.flavors);
      setFlavorsPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load flavors:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load flavors' });
    } finally {
      setFlavorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
    loadFlavors();
  }, [loadPrompts, loadFlavors]);

  // ── Filtered data ─────────────────────────────────────────────────

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      if (promptFilterLocation !== 'all' && p.location !== promptFilterLocation) return false;
      if (promptFilterActivity !== 'all' && p.activity !== promptFilterActivity) return false;
      return true;
    });
  }, [prompts, promptFilterLocation, promptFilterActivity]);

  const availableActivities = useMemo(() => {
    if (promptFilterLocation === 'all') {
      return LOCATION_KEYS.flatMap(loc => LOCATIONS[loc].activities);
    }
    return getActivitiesForLocation(promptFilterLocation);
  }, [promptFilterLocation]);

  const filteredFlavors = useMemo(() => {
    if (flavorFilterLocation === 'all') return flavors;
    return flavors.filter(f => f.location === flavorFilterLocation);
  }, [flavors, flavorFilterLocation]);

  // ── Prompt CRUD handlers ──────────────────────────────────────────

  const handleStartCreatePrompt = () => {
    setEditingPrompt(null);
    setPromptForm({ location: 'pirates_dock', activity: 'swab', prompt_text: '', difficulty: '' });
    setCreatingPrompt(true);
    setStatusMsg(null);
  };

  const handleStartEditPrompt = (prompt: LocationPrompt) => {
    setCreatingPrompt(false);
    setEditingPrompt(prompt);
    setPromptForm({
      location: prompt.location,
      activity: prompt.activity,
      prompt_text: prompt.prompt_text,
      difficulty: prompt.difficulty || '',
    });
    setStatusMsg(null);
  };

  const handleCancelPromptForm = () => {
    setCreatingPrompt(false);
    setEditingPrompt(null);
  };

  const handleSavePrompt = async () => {
    if (!promptForm.prompt_text.trim()) {
      setStatusMsg({ type: 'error', text: 'Prompt text is required' });
      return;
    }
    setSaving(true);
    setStatusMsg(null);
    try {
      if (editingPrompt) {
        await townService.adminUpdatePrompt(editingPrompt.id, {
          prompt_text: promptForm.prompt_text.trim(),
          difficulty: promptForm.difficulty.trim() || null,
        });
        setStatusMsg({ type: 'success', text: 'Prompt updated successfully' });
        setEditingPrompt(null);
      } else {
        await townService.adminCreatePrompt({
          location: promptForm.location,
          activity: promptForm.activity,
          prompt_text: promptForm.prompt_text.trim(),
          ...(promptForm.difficulty.trim() && { difficulty: promptForm.difficulty.trim() }),
        });
        setStatusMsg({ type: 'success', text: 'Prompt created successfully' });
        setCreatingPrompt(false);
      }
      await loadPrompts();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save prompt') });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = (prompt: LocationPrompt) => {
    confirmModal.confirmDanger(
      `Delete prompt #${prompt.id} from ${getLocationLabel(prompt.location)} - ${getActivityLabel(prompt.location, prompt.activity)}?`,
      async () => {
        setSaving(true);
        try {
          await townService.adminDeletePrompt(prompt.id);
          setStatusMsg({ type: 'success', text: 'Prompt deleted' });
          if (editingPrompt?.id === prompt.id) setEditingPrompt(null);
          await loadPrompts();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete prompt') });
        } finally {
          setSaving(false);
        }
      },
    );
  };

  // When create form location changes, reset activity to first available
  const handlePromptFormLocationChange = (location: string) => {
    const activities = getActivitiesForLocation(location);
    setPromptForm(prev => ({
      ...prev,
      location,
      activity: activities[0]?.id || '',
    }));
  };

  // When filter location changes, reset activity filter
  const handlePromptFilterLocationChange = (location: string) => {
    setPromptFilterLocation(location);
    setPromptFilterActivity('all');
  };

  // ── Flavor CRUD handlers ──────────────────────────────────────────

  const handleStartCreateFlavor = () => {
    setEditingFlavor(null);
    setFlavorForm({ location: 'pirates_dock', image_url: '', flavor_text: '' });
    setCreatingFlavor(true);
    setImageError(false);
    setStatusMsg(null);
  };

  const handleStartEditFlavor = (flavor: LocationFlavor) => {
    setCreatingFlavor(false);
    setEditingFlavor(flavor);
    setFlavorForm({
      location: flavor.location,
      image_url: flavor.image_url || '',
      flavor_text: flavor.flavor_text || '',
    });
    setImageError(false);
    setStatusMsg(null);
  };

  const handleCancelFlavorForm = () => {
    setCreatingFlavor(false);
    setEditingFlavor(null);
  };

  const handleSaveFlavor = async () => {
    if (!flavorForm.flavor_text.trim() && !flavorForm.image_url.trim()) {
      setStatusMsg({ type: 'error', text: 'At least an image URL or flavor text is required' });
      return;
    }
    setSaving(true);
    setStatusMsg(null);
    try {
      if (editingFlavor) {
        await townService.adminUpdateFlavor(editingFlavor.id, {
          image_url: flavorForm.image_url.trim() || null,
          flavor_text: flavorForm.flavor_text.trim() || null,
        });
        setStatusMsg({ type: 'success', text: 'Flavor updated successfully' });
        setEditingFlavor(null);
      } else {
        await townService.adminCreateFlavor({
          location: flavorForm.location,
          ...(flavorForm.image_url.trim() && { image_url: flavorForm.image_url.trim() }),
          ...(flavorForm.flavor_text.trim() && { flavor_text: flavorForm.flavor_text.trim() }),
        });
        setStatusMsg({ type: 'success', text: 'Flavor created successfully' });
        setCreatingFlavor(false);
      }
      await loadFlavors();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save flavor') });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFlavor = (flavor: LocationFlavor) => {
    confirmModal.confirmDanger(
      `Delete flavor #${flavor.id} from ${getLocationLabel(flavor.location)}?`,
      async () => {
        setSaving(true);
        try {
          await townService.adminDeleteFlavor(flavor.id);
          setStatusMsg({ type: 'success', text: 'Flavor deleted' });
          if (editingFlavor?.id === flavor.id) setEditingFlavor(null);
          await loadFlavors();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete flavor') });
        } finally {
          setSaving(false);
        }
      },
    );
  };

  // ── Status message component ──────────────────────────────────────

  const renderStatus = () => {
    if (!statusMsg) return null;
    return (
      <div className={`activities-editor__status activities-editor__status--${statusMsg.type}`}>
        <i className={statusMsg.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
        <span>{statusMsg.text}</span>
        <button className="activities-editor__status-dismiss" onClick={() => setStatusMsg(null)}>
          <i className="fas fa-times" />
        </button>
      </div>
    );
  };

  // ── Prompts panel ─────────────────────────────────────────────────

  const promptsPanel = (
    <div className="activities-editor__panel">
      {/* Toolbar */}
      <div className="activities-editor__toolbar">
        <div className="activities-editor__filters">
          <select
            value={promptFilterLocation}
            onChange={e => handlePromptFilterLocationChange(e.target.value)}
            className="activities-editor__select"
          >
            <option value="all">All Locations</option>
            {LOCATION_KEYS.map(key => (
              <option key={key} value={key}>{LOCATIONS[key].label}</option>
            ))}
          </select>
          <select
            value={promptFilterActivity}
            onChange={e => setPromptFilterActivity(e.target.value)}
            className="activities-editor__select"
          >
            <option value="all">All Activities</option>
            {availableActivities.map(a => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>
        <button className="button primary" onClick={handleStartCreatePrompt} disabled={saving}>
          <i className="fas fa-plus" /> New Prompt
        </button>
      </div>

      {renderStatus()}

      {/* Create / Edit Form */}
      {(creatingPrompt || editingPrompt) && (
        <div className="activities-editor__form-panel">
          <h3>{editingPrompt ? `Edit Prompt #${editingPrompt.id}` : 'Create New Prompt'}</h3>
          <div className="activities-editor__form-row">
            <div className="activities-editor__field">
              <label>Location</label>
              {editingPrompt ? (
                <input type="text" value={getLocationLabel(promptForm.location)} disabled className="activities-editor__input" />
              ) : (
                <select
                  value={promptForm.location}
                  onChange={e => handlePromptFormLocationChange(e.target.value)}
                  className="activities-editor__input"
                >
                  {LOCATION_KEYS.map(key => (
                    <option key={key} value={key}>{LOCATIONS[key].label}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="activities-editor__field">
              <label>Activity</label>
              {editingPrompt ? (
                <input type="text" value={getActivityLabel(promptForm.location, promptForm.activity)} disabled className="activities-editor__input" />
              ) : (
                <select
                  value={promptForm.activity}
                  onChange={e => setPromptForm(prev => ({ ...prev, activity: e.target.value }))}
                  className="activities-editor__input"
                >
                  {getActivitiesForLocation(promptForm.location).map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="activities-editor__field">
              <label>Difficulty <span className="activities-editor__optional">(optional)</span></label>
              <input
                type="text"
                value={promptForm.difficulty}
                onChange={e => setPromptForm(prev => ({ ...prev, difficulty: e.target.value }))}
                className="activities-editor__input"
                placeholder="e.g., easy, medium, hard"
              />
            </div>
          </div>
          <div className="activities-editor__field activities-editor__field--full">
            <label>Prompt Text</label>
            <textarea
              value={promptForm.prompt_text}
              onChange={e => setPromptForm(prev => ({ ...prev, prompt_text: e.target.value }))}
              className="activities-editor__textarea"
              rows={4}
              placeholder="Enter the activity prompt text..."
            />
          </div>
          <div className="activities-editor__form-actions">
            <button className="button secondary" onClick={handleCancelPromptForm} disabled={saving}>Cancel</button>
            <button className="button primary" onClick={handleSavePrompt} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save</>}
            </button>
          </div>
        </div>
      )}

      {/* Prompts Table */}
      {promptsLoading ? (
        <div className="activities-editor__loading">
          <i className="fas fa-spinner fa-spin" /> Loading prompts...
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="activities-editor__empty">
          <i className="fas fa-pen-fancy" />
          <p>No prompts found{promptFilterLocation !== 'all' ? ' for the selected filters' : ''}.</p>
        </div>
      ) : (
        <>
          <div className="activities-editor__table-container">
            <table className="activities-editor__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Location</th>
                  <th>Activity</th>
                  <th>Prompt Text</th>
                  <th>Difficulty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrompts.map(prompt => (
                  <tr key={prompt.id} className={editingPrompt?.id === prompt.id ? 'activities-editor__row--active' : ''}>
                    <td className="activities-editor__id-cell">{prompt.id}</td>
                    <td>
                      <span className="activities-editor__location-badge">
                        {getLocationLabel(prompt.location)}
                      </span>
                    </td>
                    <td>{getActivityLabel(prompt.location, prompt.activity)}</td>
                    <td className="activities-editor__text-cell">
                      <span className="activities-editor__prompt-text">{prompt.prompt_text}</span>
                    </td>
                    <td>{prompt.difficulty || <span className="activities-editor__muted">—</span>}</td>
                    <td className="activities-editor__actions-cell">
                      <button
                        className="button secondary sm"
                        onClick={() => handleStartEditPrompt(prompt)}
                        title="Edit prompt"
                        disabled={saving}
                      >
                        <i className="fas fa-edit" />
                      </button>
                      <button
                        className="button danger sm"
                        onClick={() => handleDeletePrompt(prompt)}
                        title="Delete prompt"
                        disabled={saving}
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="activities-editor__footer">
            <span className="activities-editor__count">
              {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}
              {promptFilterLocation !== 'all' && ' (filtered)'}
            </span>
            {promptsPagination.totalPages > 1 && (
              <Pagination
                currentPage={promptsPagination.page}
                totalPages={promptsPagination.totalPages}
                onPageChange={(page) => loadPrompts(page)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );

  // ── Flavors panel ─────────────────────────────────────────────────

  const flavorsPanel = (
    <div className="activities-editor__panel">
      {/* Toolbar */}
      <div className="activities-editor__toolbar">
        <div className="activities-editor__filters">
          <select
            value={flavorFilterLocation}
            onChange={e => setFlavorFilterLocation(e.target.value)}
            className="activities-editor__select"
          >
            <option value="all">All Locations</option>
            {LOCATION_KEYS.map(key => (
              <option key={key} value={key}>{LOCATIONS[key].label}</option>
            ))}
          </select>
        </div>
        <button className="button primary" onClick={handleStartCreateFlavor} disabled={saving}>
          <i className="fas fa-plus" /> New Flavor
        </button>
      </div>

      {renderStatus()}

      {/* Create / Edit Form */}
      {(creatingFlavor || editingFlavor) && (
        <div className="activities-editor__form-panel">
          <h3>{editingFlavor ? `Edit Flavor #${editingFlavor.id}` : 'Create New Flavor'}</h3>
          <div className="activities-editor__form-row">
            <div className="activities-editor__field">
              <label>Location</label>
              {editingFlavor ? (
                <input type="text" value={getLocationLabel(flavorForm.location)} disabled className="activities-editor__input" />
              ) : (
                <select
                  value={flavorForm.location}
                  onChange={e => setFlavorForm(prev => ({ ...prev, location: e.target.value }))}
                  className="activities-editor__input"
                >
                  {LOCATION_KEYS.map(key => (
                    <option key={key} value={key}>{LOCATIONS[key].label}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="activities-editor__field activities-editor__field--grow">
              <label>Image URL <span className="activities-editor__optional">(optional)</span></label>
              <input
                type="text"
                value={flavorForm.image_url}
                onChange={e => {
                  setFlavorForm(prev => ({ ...prev, image_url: e.target.value }));
                  setImageError(false);
                }}
                className="activities-editor__input"
                placeholder="https://example.com/image.png"
              />
            </div>
          </div>
          {flavorForm.image_url.trim() && (
            <div className="activities-editor__image-preview-container">
              {imageError ? (
                <div className="activities-editor__image-error">
                  <i className="fas fa-image" />
                  <span>Failed to load image</span>
                </div>
              ) : (
                <img
                  src={flavorForm.image_url.trim()}
                  alt="Preview"
                  className="activities-editor__image-preview"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          )}
          <div className="activities-editor__field activities-editor__field--full">
            <label>Flavor Text <span className="activities-editor__optional">(optional)</span></label>
            <textarea
              value={flavorForm.flavor_text}
              onChange={e => setFlavorForm(prev => ({ ...prev, flavor_text: e.target.value }))}
              className="activities-editor__textarea"
              rows={4}
              placeholder="Enter the flavor text for this location..."
            />
          </div>
          <div className="activities-editor__form-actions">
            <button className="button secondary" onClick={handleCancelFlavorForm} disabled={saving}>Cancel</button>
            <button className="button primary" onClick={handleSaveFlavor} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save</>}
            </button>
          </div>
        </div>
      )}

      {/* Flavors Cards */}
      {flavorsLoading ? (
        <div className="activities-editor__loading">
          <i className="fas fa-spinner fa-spin" /> Loading flavors...
        </div>
      ) : filteredFlavors.length === 0 ? (
        <div className="activities-editor__empty">
          <i className="fas fa-palette" />
          <p>No flavors found{flavorFilterLocation !== 'all' ? ' for the selected location' : ''}.</p>
        </div>
      ) : (
        <>
          <div className="activities-editor__cards">
            {filteredFlavors.map(flavor => (
              <div key={flavor.id} className={`activities-editor__card ${editingFlavor?.id === flavor.id ? 'activities-editor__card--active' : ''}`}>
                <div className="activities-editor__card-header">
                  <span className="activities-editor__location-badge">
                    {getLocationLabel(flavor.location)}
                  </span>
                  <span className="activities-editor__card-id">#{flavor.id}</span>
                </div>
                {flavor.image_url ? (
                  <div className="activities-editor__card-image-wrapper">
                    <img
                      src={flavor.image_url}
                      alt={`${getLocationLabel(flavor.location)} flavor`}
                      className="activities-editor__card-image"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('activities-editor__hidden');
                      }}
                    />
                    <div className="activities-editor__card-placeholder activities-editor__hidden">
                      <i className="fas fa-image" />
                    </div>
                  </div>
                ) : (
                  <div className="activities-editor__card-placeholder">
                    <i className="fas fa-image" />
                  </div>
                )}
                <div className="activities-editor__card-body">
                  <p className="activities-editor__card-text">
                    {flavor.flavor_text || <span className="activities-editor__muted">No flavor text</span>}
                  </p>
                </div>
                <div className="activities-editor__card-actions">
                  <button
                    className="button secondary sm"
                    onClick={() => handleStartEditFlavor(flavor)}
                    disabled={saving}
                  >
                    <i className="fas fa-edit" /> Edit
                  </button>
                  <button
                    className="button danger sm"
                    onClick={() => handleDeleteFlavor(flavor)}
                    disabled={saving}
                  >
                    <i className="fas fa-trash" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="activities-editor__footer">
            <span className="activities-editor__count">
              {filteredFlavors.length} flavor{filteredFlavors.length !== 1 ? 's' : ''}
              {flavorFilterLocation !== 'all' && ' (filtered)'}
            </span>
            {flavorsPagination.totalPages > 1 && (
              <Pagination
                currentPage={flavorsPagination.page}
                totalPages={flavorsPagination.totalPages}
                onPageChange={(page) => loadFlavors(page)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );

  // ── Tab definitions ───────────────────────────────────────────────

  const tabs = [
    {
      key: 'prompts',
      label: 'Prompts',
      icon: 'fas fa-pen-fancy',
      badge: promptsPagination.total,
      content: promptsPanel,
    },
    {
      key: 'flavors',
      label: 'Flavors',
      icon: 'fas fa-palette',
      badge: flavorsPagination.total,
      content: flavorsPanel,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="main-container">
      <h1><i className="fas fa-tasks" /> Town Activities Editor</h1>
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
