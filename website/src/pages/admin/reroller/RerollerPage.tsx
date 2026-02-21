import { useState, useEffect, useCallback, useMemo, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import {
  AdminRoute,
  TabContainer,
  AutocompleteInput,
  FormInput,
  FormSelect,
  FormTextArea,
  Modal,
  ConfirmModal,
  useConfirmModal,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
  ActionButtonGroup,
  TypeBadge,
  AttributeBadge,
  BadgeGroup,
} from '@components/common';
import type { Tab, AutocompleteOption } from '@components/common';
import rerollerService from '@services/rerollerService';
import type { ItemCategory } from '@services/rerollerService';
import userService from '@services/userService';
import type { User } from '@services/userService';

// ── Types ─────────────────────────────────────────────────────────────

type RollType = 'monster' | 'item' | 'combined' | 'gift' | 'birthday';

interface RolledMonster {
  species1: string;
  species2?: string;
  species3?: string;
  species1_image?: string;
  species2_image?: string;
  species3_image?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  image_url?: string;
  index: number;
  [key: string]: unknown;
}

interface RolledItem {
  name: string;
  category: string;
  quantity: number;
  image_url?: string;
  index: number;
  [key: string]: unknown;
}

interface SessionData {
  id: number;
  token: string;
  rolledMonsters: RolledMonster[];
  rolledItems: RolledItem[];
  monsterClaimLimit: number | null;
  itemClaimLimit: number | null;
  [key: string]: unknown;
}

interface EditModalState {
  type: 'monster' | 'item';
  index: number;
  data: Record<string, unknown>;
}

// ── Constants ─────────────────────────────────────────────────────────

const ITEM_CATEGORIES: ItemCategory[] = rerollerService.getItemCategories();
const DEFAULT_CATEGORIES = ITEM_CATEGORIES.filter(c => c.default).map(c => c.value);
const DEFAULT_IMAGE = '/images/default_mon.png';
const DEFAULT_ITEM_IMAGE = '/images/items/default_item.png';

const CLAIM_LIMIT_OPTIONS = [
  { value: 'all', label: 'All (Unlimited)' },
  ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

// ── Helpers ───────────────────────────────────────────────────────────

function handleImageError(e: SyntheticEvent<HTMLImageElement>, fallback: string) {
  const img = e.currentTarget;
  if (img.src !== fallback) {
    img.src = fallback;
  }
}

function getMonsterTypes(monster: RolledMonster): string[] {
  return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
    .filter((t): t is string => Boolean(t));
}

function getSpeciesImages(monster: RolledMonster): { src: string; alt: string }[] {
  const images: { src: string; alt: string }[] = [];
  if (monster.species1_image && monster.species1) {
    images.push({ src: monster.species1_image, alt: monster.species1 });
  }
  if (monster.species2_image && monster.species2) {
    images.push({ src: monster.species2_image, alt: monster.species2 });
  }
  if (monster.species3_image && monster.species3) {
    images.push({ src: monster.species3_image, alt: monster.species3 });
  }
  return images;
}

function getMonsterDisplayName(monster: RolledMonster): string {
  const parts = [monster.species1, monster.species2, monster.species3].filter(Boolean);
  return parts.join(' / ');
}

function getAxiosError(err: unknown, fallback: string): string {
  const axiosMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (axiosMessage) return axiosMessage;
  if (err instanceof Error) return err.message;
  return fallback;
}

// ── Component ─────────────────────────────────────────────────────────

function RerollerContent() {
  useDocumentTitle('Reroller');

  // Roll type
  const [rollType, setRollType] = useState<RollType>('monster');

  // User selection
  const [users, setUsers] = useState<User[]>([]);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [userSearchValue, setUserSearchValue] = useState('');

  // Monster config
  const [monsterCount, setMonsterCount] = useState(1);

  // Item config
  const [itemCount, setItemCount] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Gift config
  const [giftLevels, setGiftLevels] = useState(10);

  // Claim limits
  const [monsterClaimLimit, setMonsterClaimLimit] = useState<number | null>(null);
  const [itemClaimLimit, setItemClaimLimit] = useState<number | null>(null);

  // Notes
  const [notes, setNotes] = useState('');

  // Results
  const [session, setSession] = useState<SessionData | null>(null);
  const [rolledMonsters, setRolledMonsters] = useState<RolledMonster[]>([]);
  const [rolledItems, setRolledItems] = useState<RolledItem[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const rerollAllConfirm = useConfirmModal();

  // ── User Fetch & Autocomplete ───────────────────────────────────────

  useEffect(() => {
    userService.getAllUsers()
      .then(setUsers)
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  const userOptions: AutocompleteOption[] = useMemo(() =>
    users.map(user => ({
      name: `${user.display_name || user.username} (${user.username})`,
      value: user.id,
      matchNames: [user.username, user.display_name ?? ''].filter(Boolean),
    })),
    [users]
  );

  const handleUserSelect = useCallback((option: AutocompleteOption | null) => {
    setTargetUserId(option?.value != null ? Number(option.value) : null);
  }, []);

  const targetUserName = useMemo(() => {
    if (!targetUserId) return 'the player';
    const user = users.find(u => u.id === targetUserId);
    return user?.display_name || user?.username || 'the player';
  }, [targetUserId, users]);

  // ── Category Toggles ───────────────────────────────────────────────

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleAllCategories = () => {
    setSelectedCategories(prev =>
      prev.length === DEFAULT_CATEGORIES.length ? [] : DEFAULT_CATEGORIES
    );
  };

  // Gift roll counts
  const giftCounts = rerollerService.calculateGiftCounts(giftLevels);

  // ── Session Handlers ────────────────────────────────────────────────

  const applySessionResponse = useCallback((data: SessionData) => {
    setSession(data);
    setRolledMonsters(data.rolledMonsters ?? []);
    setRolledItems(data.rolledItems ?? []);
  }, []);

  const handleGenerateRoll = async () => {
    if (!targetUserId) {
      setError('Please select a target user');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const sessionData: Record<string, unknown> = {
        rollType,
        targetUserId,
        notes,
      };

      if (rollType === 'monster') {
        sessionData.monsterCount = monsterCount;
        sessionData.monsterClaimLimit = monsterClaimLimit;
      } else if (rollType === 'item') {
        sessionData.itemCount = itemCount;
        sessionData.itemParams = { categories: selectedCategories };
        sessionData.itemClaimLimit = itemClaimLimit;
      } else if (rollType === 'combined') {
        sessionData.monsterCount = monsterCount;
        sessionData.itemCount = itemCount;
        sessionData.itemParams = { categories: selectedCategories };
        sessionData.monsterClaimLimit = monsterClaimLimit;
        sessionData.itemClaimLimit = itemClaimLimit;
      } else if (rollType === 'gift') {
        sessionData.giftLevels = giftLevels;
      }

      const response = await rerollerService.createSession(sessionData);
      applySessionResponse(response.data);
      setSuccess('Roll generated successfully!');
    } catch (err: unknown) {
      setError(getAxiosError(err, 'Failed to generate roll'));
    } finally {
      setLoading(false);
    }
  };

  const handleRerollAll = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const response = await rerollerService.rerollAll(session.id);
      applySessionResponse(response.data);
      setSuccess('All results rerolled!');
    } catch (err: unknown) {
      setError(getAxiosError(err, 'Failed to reroll'));
    } finally {
      setLoading(false);
    }
  };

  const handleRerollResult = async (type: 'monster' | 'item', index: number) => {
    if (!session) return;
    try {
      const response = await rerollerService.rerollResult(session.id, type, index);
      applySessionResponse(response.data);
    } catch (err: unknown) {
      setError(getAxiosError(err, 'Failed to reroll result'));
    }
  };

  const handleDeleteResult = async (type: 'monster' | 'item', index: number) => {
    if (!session) return;
    try {
      const response = await rerollerService.deleteResult(session.id, type, index);
      applySessionResponse(response.data);
    } catch (err: unknown) {
      setError(getAxiosError(err, 'Failed to delete result'));
    }
  };

  const handleSaveEdit = async () => {
    if (!session || !editModal) return;
    try {
      const response = await rerollerService.updateResult(
        session.id, editModal.type, editModal.index, editModal.data
      );
      applySessionResponse(response.data);
      setEditModal(null);
    } catch (err: unknown) {
      setError(getAxiosError(err, 'Failed to update result'));
    }
  };

  const handleUpdateClaimLimits = async () => {
    if (!session) return;
    try {
      await rerollerService.updateSession(session.id, { monsterClaimLimit, itemClaimLimit });
      setSuccess('Claim limits updated!');
    } catch (err: unknown) {
      setError(getAxiosError(err, 'Failed to update claim limits'));
    }
  };

  const copyLink = () => {
    if (!session) return;
    navigator.clipboard.writeText(rerollerService.buildClaimUrl(session.token));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const updateEditField = (field: string, value: unknown) => {
    if (!editModal) return;
    setEditModal({ ...editModal, data: { ...editModal.data, [field]: value } });
  };

  const adjustMonsterCount = (delta: number) =>
    setMonsterCount(prev => Math.max(1, Math.min(20, prev + delta)));

  const adjustItemCount = (delta: number) =>
    setItemCount(prev => Math.max(1, Math.min(20, prev + delta)));

  // ── Tabs ────────────────────────────────────────────────────────────

  const rollTypeTabs: Tab[] = [
    { key: 'monster', label: 'Monster', icon: 'fas fa-dragon' },
    { key: 'item', label: 'Item', icon: 'fas fa-box' },
    { key: 'combined', label: 'Combined', icon: 'fas fa-layer-group' },
    { key: 'gift', label: 'Gift', icon: 'fas fa-gift' },
    { key: 'birthday', label: 'Birthday', icon: 'fas fa-birthday-cake' },
  ].map(tab => ({ ...tab, content: null }));

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="container vertical gap-lg">
      {/* Header */}
      <div className="container justify-between align-center">
        <div>
          <h1><i className="fas fa-sync-alt"></i> Reroller</h1>
          <p className="text-muted">Create custom rolls for players and generate claim links</p>
        </div>
        <Link to="/admin/reroller/sessions" className="button secondary">
          <i className="fas fa-list"></i> View All Sessions
        </Link>
      </div>

      {/* Roll Type Tabs */}
      <TabContainer
        tabs={rollTypeTabs}
        activeTab={rollType}
        onTabChange={(key) => setRollType(key as RollType)}
        variant="pills"
        contentClassName="hidden"
      />

      {/* Messages */}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}

      <div className="container cols-2 gap-lg responsive">
        {/* ── Configuration Panel ──────────────────────────────────── */}
        <div className="card">
          <div className="card__header">
            <div className="card__header-content">
              <h2 className="card__title"><i className="fas fa-cog"></i> Configuration</h2>
            </div>
          </div>
          <div className="card__body container vertical gap-md p-md">
            {/* Target User - Autocomplete */}
            <AutocompleteInput
              name="targetUser"
              label="Target User"
              placeholder="Type to search users..."
              value={userSearchValue}
              onChange={setUserSearchValue}
              options={userOptions}
              onSelect={handleUserSelect}
              required
            />

            {/* Monster Config */}
            {(rollType === 'monster' || rollType === 'combined') && (
              <div className="container vertical gap-sm">
                <label className="form-label"><i className="fas fa-dragon"></i> Monster Count</label>
                <div className="container align-center gap-sm">
                  <button className="button secondary sm" onClick={() => adjustMonsterCount(-1)}>-</button>
                  <FormInput
                    name="monsterCount"
                    type="number"
                    value={monsterCount}
                    onChange={(e) => setMonsterCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    min={1}
                    max={20}
                  />
                  <button className="button secondary sm" onClick={() => adjustMonsterCount(1)}>+</button>
                  <span className="text-muted">monsters</span>
                </div>
              </div>
            )}

            {/* Item Config */}
            {(rollType === 'item' || rollType === 'combined') && (
              <div className="container vertical gap-sm">
                <label className="form-label"><i className="fas fa-box"></i> Item Count</label>
                <div className="container align-center gap-sm">
                  <button className="button secondary sm" onClick={() => adjustItemCount(-1)}>-</button>
                  <FormInput
                    name="itemCount"
                    type="number"
                    value={itemCount}
                    onChange={(e) => setItemCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    min={1}
                    max={20}
                  />
                  <button className="button secondary sm" onClick={() => adjustItemCount(1)}>+</button>
                  <span className="text-muted">items</span>
                </div>

                <label className="form-label">Categories</label>
                <div className="container flex-wrap gap-xs">
                  <button
                    className={`button filter sm ${selectedCategories.length === DEFAULT_CATEGORIES.length ? 'selected' : ''}`}
                    onClick={toggleAllCategories}
                  >
                    All Default
                  </button>
                  {ITEM_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      className={`button filter sm ${selectedCategories.includes(cat.value) ? 'selected' : ''}`}
                      onClick={() => toggleCategory(cat.value)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gift Config */}
            {rollType === 'gift' && (
              <FormInput
                name="giftLevels"
                label="Gift Levels"
                type="number"
                value={giftLevels}
                onChange={(e) => setGiftLevels(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                helpText={`Preview: ${giftCounts.monsterCount} monster(s), ${giftCounts.itemCount} item(s)`}
              />
            )}

            {/* Birthday Info */}
            {rollType === 'birthday' && (
              <div className="alert info">
                <p><strong>Birthday preset</strong> automatically rolls:</p>
                <ul>
                  <li><strong>10 Items</strong> - Random from all categories</li>
                  <li><strong>10 Monsters</strong> - Base stage only, no legendaries</li>
                </ul>
                <p className="text-muted">Uses the target user's monster table preferences.</p>
              </div>
            )}

            {/* Claim Limits */}
            {rollType !== 'gift' && rollType !== 'birthday' && (
              <div className="container vertical gap-sm">
                <label className="form-label"><i className="fas fa-lock"></i> Claim Limits</label>
                {(rollType === 'monster' || rollType === 'combined') && (
                  <FormSelect
                    name="monsterClaimLimit"
                    label="Monster Limit"
                    options={CLAIM_LIMIT_OPTIONS}
                    value={monsterClaimLimit === null ? 'all' : String(monsterClaimLimit)}
                    onChange={(e) => setMonsterClaimLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
                  />
                )}
                {(rollType === 'item' || rollType === 'combined') && (
                  <FormSelect
                    name="itemClaimLimit"
                    label="Item Limit"
                    options={CLAIM_LIMIT_OPTIONS}
                    value={itemClaimLimit === null ? 'all' : String(itemClaimLimit)}
                    onChange={(e) => setItemClaimLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
                  />
                )}
              </div>
            )}

            {/* Notes */}
            <FormTextArea
              name="notes"
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this roll..."
              rows={3}
            />

            {/* Actions */}
            <ActionButtonGroup align="start" gap="sm">
              <button
                className="button primary"
                onClick={handleGenerateRoll}
                disabled={loading || !targetUserId}
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin"></i> Generating...</>
                  : <><i className="fas fa-dice"></i> Generate Roll</>
                }
              </button>
              {session && (
                <button
                  className="button secondary"
                  onClick={() => rerollAllConfirm.confirm(
                    'Are you sure you want to reroll all results? This cannot be undone.',
                    handleRerollAll,
                    { title: 'Reroll All', confirmText: 'Reroll All', variant: 'warning' }
                  )}
                  disabled={loading}
                >
                  <i className="fas fa-sync-alt"></i> Reroll All
                </button>
              )}
            </ActionButtonGroup>
          </div>
        </div>

        {/* ── Results Panel ────────────────────────────────────────── */}
        <div className="card">
          <div className="card__header">
            <div className="card__header-content">
              <h2 className="card__title"><i className="fas fa-list-ul"></i> Results</h2>
            </div>
            {session && (
              <div className="card__header-action">
                <button className="button secondary sm" onClick={handleUpdateClaimLimits}>
                  <i className="fas fa-save"></i> Update Limits
                </button>
              </div>
            )}
          </div>
          <div className="card__body container vertical gap-lg p-md">
            {loading && <LoadingSpinner message="Generating rolls..." />}

            {!session && !loading && (
              <div className="container vertical center gap-md p-lg">
                <i className="fas fa-dice fa-3x text-muted"></i>
                <p className="text-muted">Configure the roll settings and click "Generate Roll" to see results</p>
              </div>
            )}

            {session && !loading && (
              <>
                {/* Monster Results */}
                {rolledMonsters.length > 0 && (
                  <div className="container vertical gap-sm">
                    <h3>
                      <i className="fas fa-dragon"></i> Monsters ({rolledMonsters.length})
                      {session.monsterClaimLimit && (
                        <span className="text-muted"> - Claim limit: {session.monsterClaimLimit}</span>
                      )}
                    </h3>
                    <div className="container flex-wrap gap-md">
                      {rolledMonsters.map((monster, index) => {
                        const types = getMonsterTypes(monster);
                        const speciesImages = getSpeciesImages(monster);
                        const primaryImage = monster.image_url || monster.species1_image || DEFAULT_IMAGE;

                        return (
                          <div key={index} className="reroller-result-card">
                            {/* Species images row */}
                            <div className="reroller-result-card__images">
                              {speciesImages.length > 0 ? (
                                speciesImages.map((img, i) => (
                                  <div key={i} className="reroller-result-card__species-img" title={img.alt}>
                                    <img
                                      src={img.src}
                                      alt={img.alt}
                                      onError={(e) => handleImageError(e, DEFAULT_IMAGE)}
                                    />
                                    <span className="reroller-result-card__species-label">{img.alt}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="reroller-result-card__species-img">
                                  <img
                                    src={primaryImage}
                                    alt={monster.species1}
                                    onError={(e) => handleImageError(e, DEFAULT_IMAGE)}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="reroller-result-card__info">
                              <h4 className="reroller-result-card__name">{getMonsterDisplayName(monster)}</h4>

                              {types.length > 0 && (
                                <BadgeGroup gap="xs" align="center">
                                  {types.map((type, i) => (
                                    <TypeBadge key={i} type={type} size="xs" />
                                  ))}
                                </BadgeGroup>
                              )}

                              {monster.attribute && (
                                <AttributeBadge attribute={monster.attribute} size="xs" />
                              )}
                            </div>

                            {/* Actions */}
                            <div className="reroller-result-card__actions">
                              <button
                                className="button secondary icon sm"
                                title="Edit"
                                onClick={() => setEditModal({ type: 'monster', index, data: { ...monster } })}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="button primary icon sm"
                                title="Reroll"
                                onClick={() => handleRerollResult('monster', index)}
                              >
                                <i className="fas fa-sync-alt"></i>
                              </button>
                              <button
                                className="button danger icon sm no-flex"
                                title="Delete"
                                onClick={() => handleDeleteResult('monster', index)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Item Results */}
                {rolledItems.length > 0 && (
                  <div className="container vertical gap-sm">
                    <h3>
                      <i className="fas fa-box"></i> Items ({rolledItems.length})
                      {session.itemClaimLimit && (
                        <span className="text-muted"> - Claim limit: {session.itemClaimLimit}</span>
                      )}
                    </h3>
                    <div className="container flex-wrap gap-md">
                      {rolledItems.map((item, index) => (
                        <div key={index} className="reroller-result-card reroller-result-card--item">
                          <div className="reroller-result-card__images">
                            <div className="reroller-result-card__species-img">
                              <img
                                src={item.image_url || DEFAULT_ITEM_IMAGE}
                                alt={item.name}
                                onError={(e) => handleImageError(e, DEFAULT_ITEM_IMAGE)}
                              />
                            </div>
                          </div>

                          <div className="reroller-result-card__info">
                            <h4 className="reroller-result-card__name">{item.name}</h4>
                            <span className="badge sm">{item.category}</span>
                            {item.quantity > 1 && (
                              <span className="text-muted">x{item.quantity}</span>
                            )}
                          </div>

                          <div className="reroller-result-card__actions">
                            <button
                              className="button secondary icon sm"
                              title="Edit"
                              onClick={() => setEditModal({ type: 'item', index, data: { ...item } })}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="button primary icon sm"
                              title="Reroll"
                              onClick={() => handleRerollResult('item', index)}
                            >
                              <i className="fas fa-sync-alt"></i>
                            </button>
                            <button
                              className="button danger icon sm no-flex"
                              title="Delete"
                              onClick={() => handleDeleteResult('item', index)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim Link */}
                <div className="container vertical gap-sm">
                  <h3><i className="fas fa-link"></i> Claim Link</h3>
                  <div className="container gap-sm align-center">
                    <input
                      type="text"
                      className="input"
                      value={rerollerService.buildClaimUrl(session.token)}
                      readOnly
                      style={{ flex: 1 }}
                    />
                    <button className="button success" onClick={copyLink}>
                      <i className={copiedLink ? 'fas fa-check' : 'fas fa-copy'}></i>
                      {copiedLink ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-muted">
                    Send this link to <strong>{targetUserName}</strong> to claim their rewards.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={`Edit ${editModal?.type === 'monster' ? 'Monster' : 'Item'}`}
        footer={
          <ActionButtonGroup align="end" gap="sm">
            <button className="button secondary" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="button primary" onClick={handleSaveEdit}>
              <i className="fas fa-save"></i> Save Changes
            </button>
          </ActionButtonGroup>
        }
      >
        {editModal?.type === 'monster' ? (
          <div className="container vertical gap-sm">
            <FormInput
              name="species1"
              label="Species 1"
              value={(editModal.data.species1 as string) || ''}
              onChange={(e) => updateEditField('species1', e.target.value)}
            />
            <FormInput
              name="species2"
              label="Species 2"
              value={(editModal.data.species2 as string) || ''}
              onChange={(e) => updateEditField('species2', e.target.value)}
            />
            <FormInput
              name="species3"
              label="Species 3"
              value={(editModal.data.species3 as string) || ''}
              onChange={(e) => updateEditField('species3', e.target.value)}
            />
            <FormInput
              name="type1"
              label="Type 1"
              value={(editModal.data.type1 as string) || ''}
              onChange={(e) => updateEditField('type1', e.target.value)}
            />
            <FormInput
              name="type2"
              label="Type 2"
              value={(editModal.data.type2 as string) || ''}
              onChange={(e) => updateEditField('type2', e.target.value)}
            />
            <FormInput
              name="attribute"
              label="Attribute"
              value={(editModal.data.attribute as string) || ''}
              onChange={(e) => updateEditField('attribute', e.target.value)}
            />
            <FormInput
              name="image_url"
              label="Image URL"
              value={(editModal.data.image_url as string) || ''}
              onChange={(e) => updateEditField('image_url', e.target.value)}
            />
          </div>
        ) : editModal?.type === 'item' ? (
          <div className="container vertical gap-sm">
            <FormInput
              name="itemName"
              label="Item Name"
              value={(editModal.data.name as string) || ''}
              onChange={(e) => updateEditField('name', e.target.value)}
            />
            <FormInput
              name="itemCategory"
              label="Category"
              value={(editModal.data.category as string) || ''}
              onChange={(e) => updateEditField('category', e.target.value)}
            />
            <FormInput
              name="itemQuantity"
              label="Quantity"
              type="number"
              value={(editModal.data.quantity as number) || 1}
              onChange={(e) => updateEditField('quantity', parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>
        ) : null}
      </Modal>

      <ConfirmModal {...rerollAllConfirm.modalProps} />
    </div>
  );
}

export default function RerollerPage() {
  return (
    <AdminRoute>
      <RerollerContent />
    </AdminRoute>
  );
}
