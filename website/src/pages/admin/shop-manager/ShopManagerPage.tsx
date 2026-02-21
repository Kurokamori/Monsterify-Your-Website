import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { TabContainer } from '@components/common/TabContainer';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import shopService from '@services/shopService';
import type { ShopRow, ShopItemRow, VisibilityCondition } from '@services/shopService';
import '@styles/admin/shop-manager.css';

// ============================================================================
// Constants
// ============================================================================

const ITEM_CATEGORIES = [
  { value: 'balls', label: 'Balls' },
  { value: 'berries', label: 'Berries' },
  { value: 'pastries', label: 'Pastries' },
  { value: 'evolution', label: 'Evolution Items' },
  { value: 'helditems', label: 'Held Items' },
  { value: 'items', label: 'General Items' },
  { value: 'keyitems', label: 'Key Items' },
  { value: 'seals', label: 'Seals' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'antiques', label: 'Antiques' },
];

const ALL_SHOP_CATEGORIES = [
  ...ITEM_CATEGORIES,
  { value: 'ALL', label: 'All Items' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCategoryLabel(value: string | null): string {
  return ALL_SHOP_CATEGORIES.find(c => c.value === value)?.label ?? value ?? '—';
}

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const EMPTY_SHOP_FORM = {
  shop_id: '',
  name: '',
  description: '',
  flavor_text: '',
  banner_image: '',
  category: '',
  price_modifier: 1.0,
  is_constant: true,
  is_active: true,
};

const EMPTY_VISIBILITY: VisibilityCondition = {
  days_of_week: [],
  start_date: '',
  end_date: '',
  random_chance: 0,
  manually_enabled: true,
};

// ============================================================================
// Main Component
// ============================================================================

export default function ShopManagerPage() {
  useDocumentTitle('Shop Manager');

  const [activeTab, setActiveTab] = useState('shops');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const confirmModal = useConfirmModal();
  const [saving, setSaving] = useState(false);

  // ── Shops state ─────────────────────────────────────────────────
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopFilterCategory, setShopFilterCategory] = useState('all');
  const [editingShop, setEditingShop] = useState<ShopRow | null>(null);
  const [creatingShop, setCreatingShop] = useState(false);
  const [shopForm, setShopForm] = useState(EMPTY_SHOP_FORM);
  const [visibilityForm, setVisibilityForm] = useState<VisibilityCondition>({ ...EMPTY_VISIBILITY });
  const [bannerPreviewError, setBannerPreviewError] = useState(false);

  // ── Inventory state ─────────────────────────────────────────────
  const [selectedShopId, setSelectedShopId] = useState('');
  const [shopItems, setShopItems] = useState<ShopItemRow[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [stockForm, setStockForm] = useState({ category: '', count: 10, price_modifier: 1.0 });
  const [stocking, setStocking] = useState(false);

  // ── Data loading ────────────────────────────────────────────────

  const loadShops = useCallback(async () => {
    setShopsLoading(true);
    try {
      const data = await shopService.adminGetAllShops();
      setShops(data);
    } catch (err) {
      console.error('Failed to load shops:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load shops' });
    } finally {
      setShopsLoading(false);
    }
  }, []);

  const loadShopItems = useCallback(async (shopId: string) => {
    if (!shopId) return;
    setItemsLoading(true);
    try {
      const data = await shopService.adminGetShopItems(shopId);
      setShopItems(data);
    } catch (err) {
      console.error('Failed to load shop items:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load shop items' });
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => { loadShops(); }, [loadShops]);

  useEffect(() => {
    if (selectedShopId) loadShopItems(selectedShopId);
    else setShopItems([]);
  }, [selectedShopId, loadShopItems]);

  // ── Filtered shops ──────────────────────────────────────────────

  const filteredShops = useMemo(() => {
    if (shopFilterCategory === 'all') return shops;
    return shops.filter(s => s.category === shopFilterCategory);
  }, [shops, shopFilterCategory]);

  // ── Shop form helpers ───────────────────────────────────────────

  function parseVisibilityCondition(json: string | null): VisibilityCondition {
    if (!json) return { ...EMPTY_VISIBILITY };
    try {
      const c = JSON.parse(json) as VisibilityCondition;
      return {
        days_of_week: c.days_of_week || [],
        start_date: c.start_date || '',
        end_date: c.end_date || '',
        random_chance: c.random_chance || 0,
        manually_enabled: c.manually_enabled !== false,
      };
    } catch {
      return { ...EMPTY_VISIBILITY };
    }
  }

  function serializeVisibilityCondition(v: VisibilityCondition): string {
    const condition: VisibilityCondition = {};
    if (v.days_of_week && v.days_of_week.length > 0) condition.days_of_week = v.days_of_week;
    if (v.start_date && v.end_date) {
      condition.start_date = v.start_date;
      condition.end_date = v.end_date;
    }
    if (v.random_chance && v.random_chance > 0) condition.random_chance = v.random_chance;
    if (v.manually_enabled === false) condition.manually_enabled = false;
    return JSON.stringify(condition);
  }

  // ── Shop CRUD handlers ─────────────────────────────────────────

  const handleStartCreateShop = () => {
    setEditingShop(null);
    setShopForm({ ...EMPTY_SHOP_FORM });
    setVisibilityForm({ ...EMPTY_VISIBILITY });
    setBannerPreviewError(false);
    setCreatingShop(true);
    setStatusMsg(null);
  };

  const handleStartEditShop = (shop: ShopRow) => {
    setCreatingShop(false);
    setEditingShop(shop);
    setShopForm({
      shop_id: shop.shop_id,
      name: shop.name,
      description: shop.description || '',
      flavor_text: shop.flavor_text || '',
      banner_image: shop.banner_image || '',
      category: shop.category || '',
      price_modifier: shop.price_modifier,
      is_constant: shop.is_constant,
      is_active: shop.is_active,
    });
    setVisibilityForm(parseVisibilityCondition(shop.visibility_condition));
    setBannerPreviewError(false);
    setStatusMsg(null);
  };

  const handleCancelShopForm = () => {
    setCreatingShop(false);
    setEditingShop(null);
  };

  const handleSaveShop = async () => {
    if (!shopForm.name.trim()) {
      setStatusMsg({ type: 'error', text: 'Shop name is required' });
      return;
    }
    if (!shopForm.category) {
      setStatusMsg({ type: 'error', text: 'Category is required' });
      return;
    }
    if (creatingShop && !shopForm.shop_id.trim()) {
      setStatusMsg({ type: 'error', text: 'Shop ID is required' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      const visibilityCondition = !shopForm.is_constant
        ? serializeVisibilityCondition(visibilityForm)
        : undefined;

      if (editingShop) {
        await shopService.adminUpdateShop(editingShop.shop_id, {
          name: shopForm.name.trim(),
          description: shopForm.description.trim() || undefined,
          flavor_text: shopForm.flavor_text.trim() || undefined,
          banner_image: shopForm.banner_image.trim() || undefined,
          category: shopForm.category,
          price_modifier: shopForm.price_modifier,
          is_constant: shopForm.is_constant,
          is_active: shopForm.is_active,
          visibility_condition: visibilityCondition,
        });
        setStatusMsg({ type: 'success', text: 'Shop updated successfully' });
        setEditingShop(null);
      } else {
        await shopService.adminCreateShop({
          shop_id: shopForm.shop_id.trim(),
          name: shopForm.name.trim(),
          description: shopForm.description.trim() || undefined,
          flavor_text: shopForm.flavor_text.trim() || undefined,
          banner_image: shopForm.banner_image.trim() || undefined,
          category: shopForm.category,
          price_modifier: shopForm.price_modifier,
          is_constant: shopForm.is_constant,
          is_active: shopForm.is_active,
          visibility_condition: visibilityCondition,
        });
        setStatusMsg({ type: 'success', text: 'Shop created successfully' });
        setCreatingShop(false);
      }
      await loadShops();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save shop') });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShop = (shop: ShopRow) => {
    confirmModal.confirmDanger(
      `Delete shop "${shop.name}" (${shop.shop_id})? This will also remove all its items.`,
      async () => {
        setSaving(true);
        try {
          await shopService.adminDeleteShop(shop.shop_id);
          setStatusMsg({ type: 'success', text: 'Shop deleted' });
          if (editingShop?.shop_id === shop.shop_id) setEditingShop(null);
          if (selectedShopId === shop.shop_id) {
            setSelectedShopId('');
            setShopItems([]);
          }
          await loadShops();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete shop') });
        } finally {
          setSaving(false);
        }
      },
    );
  };

  const handleToggleShopActive = async (shop: ShopRow) => {
    const newActive = !shop.is_active;
    // Optimistic update
    setShops(prev => prev.map(s => s.shop_id === shop.shop_id ? { ...s, is_active: newActive } : s));
    try {
      await shopService.adminUpdateShop(shop.shop_id, {
        name: shop.name,
        category: shop.category || '',
        is_active: newActive,
      });
      setStatusMsg({ type: 'success', text: `Shop ${newActive ? 'activated' : 'deactivated'}` });
    } catch (err) {
      // Revert
      setShops(prev => prev.map(s => s.shop_id === shop.shop_id ? { ...s, is_active: shop.is_active } : s));
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to toggle shop status') });
    }
  };

  const handleVisibilityDayToggle = (dayIndex: number) => {
    setVisibilityForm(prev => {
      const days = prev.days_of_week || [];
      const updated = days.includes(dayIndex)
        ? days.filter(d => d !== dayIndex)
        : [...days, dayIndex].sort();
      return { ...prev, days_of_week: updated };
    });
  };

  // ── Inventory handlers ──────────────────────────────────────────

  const handleSelectShop = (shopId: string) => {
    setSelectedShopId(shopId);
    if (shopId) {
      const shop = shops.find(s => s.shop_id === shopId);
      if (shop) {
        setStockForm({
          category: shop.category || '',
          count: 10,
          price_modifier: shop.price_modifier,
        });
      }
    }
  };

  const handleGoToInventory = (shop: ShopRow) => {
    setSelectedShopId(shop.shop_id);
    setStockForm({
      category: shop.category || '',
      count: 10,
      price_modifier: shop.price_modifier,
    });
    setActiveTab('inventory');
  };

  const handleStockShop = async () => {
    if (!selectedShopId) return;
    setStocking(true);
    setStatusMsg(null);
    try {
      const data = await shopService.adminStockShop(selectedShopId, {
        category: stockForm.category || undefined,
        count: stockForm.count,
        price_modifier: stockForm.price_modifier,
      });
      setShopItems(data);
      setStatusMsg({ type: 'success', text: `Stocked ${data.length} items` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to stock shop') });
    } finally {
      setStocking(false);
    }
  };

  const handleUpdateItemQuantity = async (item: ShopItemRow, delta: number) => {
    const newQty = Math.max(0, (item.current_quantity ?? 0) + delta);
    // Optimistic update
    setShopItems(prev => prev.map(i => i.id === item.id ? { ...i, current_quantity: newQty } : i));
    try {
      await shopService.adminUpdateShopItem(item.shop_id, item.id, { current_quantity: newQty });
    } catch (err) {
      // Revert
      setShopItems(prev => prev.map(i => i.id === item.id ? { ...i, current_quantity: item.current_quantity } : i));
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update quantity') });
    }
  };

  const handleRemoveItem = (item: ShopItemRow) => {
    confirmModal.confirmDanger(
      `Remove "${item.name}" from this shop?`,
      async () => {
        try {
          await shopService.adminRemoveShopItem(item.shop_id, item.id);
          setShopItems(prev => prev.filter(i => i.id !== item.id));
          setStatusMsg({ type: 'success', text: 'Item removed' });
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to remove item') });
        }
      },
    );
  };

  // ── Status message ──────────────────────────────────────────────

  const renderStatus = () => {
    if (!statusMsg) return null;
    return (
      <div className={`shop-manager__status shop-manager__status--${statusMsg.type}`}>
        <i className={statusMsg.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
        <span>{statusMsg.text}</span>
        <button className="shop-manager__status-dismiss" onClick={() => setStatusMsg(null)}>
          <i className="fas fa-times" />
        </button>
      </div>
    );
  };

  // ── Shops panel ─────────────────────────────────────────────────

  const shopsPanel = (
    <div className="shop-manager__panel">
      {/* Toolbar */}
      <div className="shop-manager__toolbar">
        <div className="shop-manager__filters">
          <select
            value={shopFilterCategory}
            onChange={e => setShopFilterCategory(e.target.value)}
            className="shop-manager__select"
          >
            <option value="all">All Categories</option>
            {ALL_SHOP_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <button className="button primary" onClick={handleStartCreateShop} disabled={saving}>
          <i className="fas fa-plus" /> New Shop
        </button>
      </div>

      {renderStatus()}

      {/* Create / Edit Form */}
      {(creatingShop || editingShop) && (
        <div className="shop-manager__form-panel">
          <h3>{editingShop ? `Edit Shop: ${editingShop.name}` : 'Create New Shop'}</h3>

          {/* Basic Info */}
          <div className="shop-manager__form-row">
            <div className="shop-manager__field">
              <label>Shop ID</label>
              {editingShop ? (
                <input type="text" value={shopForm.shop_id} disabled className="shop-manager__input" />
              ) : (
                <input
                  type="text"
                  value={shopForm.shop_id}
                  onChange={e => setShopForm(prev => ({ ...prev, shop_id: e.target.value }))}
                  className="shop-manager__input"
                  placeholder="e.g., apothecary"
                />
              )}
            </div>
            <div className="shop-manager__field shop-manager__field--grow">
              <label>Name</label>
              <input
                type="text"
                value={shopForm.name}
                onChange={e => setShopForm(prev => ({ ...prev, name: e.target.value }))}
                className="shop-manager__input"
                placeholder="e.g., Apothecary"
              />
            </div>
            <div className="shop-manager__field">
              <label>Category</label>
              <select
                value={shopForm.category}
                onChange={e => setShopForm(prev => ({ ...prev, category: e.target.value }))}
                className="shop-manager__input"
              >
                <option value="">Select...</option>
                {ALL_SHOP_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="shop-manager__field">
              <label>Price Modifier</label>
              <input
                type="number"
                value={shopForm.price_modifier}
                onChange={e => setShopForm(prev => ({ ...prev, price_modifier: parseFloat(e.target.value) || 1.0 }))}
                className="shop-manager__input"
                step="0.1"
                min="0.1"
                max="10"
              />
            </div>
          </div>

          {/* Text Fields */}
          <div className="shop-manager__form-row">
            <div className="shop-manager__field shop-manager__field--grow">
              <label>Description <span className="shop-manager__optional">(optional)</span></label>
              <textarea
                value={shopForm.description}
                onChange={e => setShopForm(prev => ({ ...prev, description: e.target.value }))}
                className="shop-manager__textarea"
                rows={3}
                placeholder="Brief description of the shop"
              />
            </div>
            <div className="shop-manager__field shop-manager__field--grow">
              <label>Flavor Text <span className="shop-manager__optional">(optional)</span></label>
              <textarea
                value={shopForm.flavor_text}
                onChange={e => setShopForm(prev => ({ ...prev, flavor_text: e.target.value }))}
                className="shop-manager__textarea"
                rows={3}
                placeholder="Flavor text shown on the shop page"
              />
            </div>
          </div>

          {/* Banner Image */}
          <div className="shop-manager__field shop-manager__field--full">
            <label>Banner Image URL <span className="shop-manager__optional">(optional)</span></label>
            <input
              type="text"
              value={shopForm.banner_image}
              onChange={e => {
                setShopForm(prev => ({ ...prev, banner_image: e.target.value }));
                setBannerPreviewError(false);
              }}
              className="shop-manager__input"
              placeholder="https://example.com/banner.png"
            />
          </div>
          {shopForm.banner_image.trim() && (
            <div className="shop-manager__image-preview-container">
              {bannerPreviewError ? (
                <div className="shop-manager__image-error">
                  <i className="fas fa-image" />
                  <span>Failed to load image</span>
                </div>
              ) : (
                <img
                  src={shopForm.banner_image.trim()}
                  alt="Banner preview"
                  className="shop-manager__image-preview"
                  onError={() => setBannerPreviewError(true)}
                />
              )}
            </div>
          )}

          {/* Visibility Settings */}
          <div className="shop-manager__form-row">
            <label className="shop-manager__checkbox-label">
              <input
                type="checkbox"
                checked={shopForm.is_constant}
                onChange={e => setShopForm(prev => ({ ...prev, is_constant: e.target.checked }))}
              />
              Constant Shop <span className="shop-manager__optional">(always visible, sells all items from category)</span>
            </label>
            <label className="shop-manager__checkbox-label">
              <input
                type="checkbox"
                checked={shopForm.is_active}
                onChange={e => setShopForm(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              Active
            </label>
          </div>

          {/* Visibility Conditions (shown when not constant) */}
          {!shopForm.is_constant && (
            <div className="shop-manager__visibility-panel">
              <h4>Visibility Conditions</h4>
              <div className="shop-manager__field">
                <label>Days of Week</label>
                <div className="shop-manager__days-row">
                  {DAY_NAMES.map((day, i) => (
                    <label key={i} className="shop-manager__day-checkbox">
                      <input
                        type="checkbox"
                        checked={visibilityForm.days_of_week?.includes(i) || false}
                        onChange={() => handleVisibilityDayToggle(i)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <div className="shop-manager__form-row">
                <div className="shop-manager__field">
                  <label>Start Date <span className="shop-manager__optional">(optional)</span></label>
                  <input
                    type="date"
                    value={visibilityForm.start_date || ''}
                    onChange={e => setVisibilityForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="shop-manager__input"
                  />
                </div>
                <div className="shop-manager__field">
                  <label>End Date <span className="shop-manager__optional">(optional)</span></label>
                  <input
                    type="date"
                    value={visibilityForm.end_date || ''}
                    onChange={e => setVisibilityForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="shop-manager__input"
                  />
                </div>
                <div className="shop-manager__field">
                  <label>Random Chance <span className="shop-manager__optional">(0-1)</span></label>
                  <input
                    type="number"
                    value={visibilityForm.random_chance || 0}
                    onChange={e => setVisibilityForm(prev => ({ ...prev, random_chance: parseFloat(e.target.value) || 0 }))}
                    className="shop-manager__input"
                    step="0.1"
                    min="0"
                    max="1"
                  />
                </div>
              </div>
              <label className="shop-manager__checkbox-label">
                <input
                  type="checkbox"
                  checked={visibilityForm.manually_enabled !== false}
                  onChange={e => setVisibilityForm(prev => ({ ...prev, manually_enabled: e.target.checked }))}
                />
                Manually Enabled
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="shop-manager__form-actions">
            <button className="button secondary" onClick={handleCancelShopForm} disabled={saving}>Cancel</button>
            <button className="button primary" onClick={handleSaveShop} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save</>}
            </button>
          </div>
        </div>
      )}

      {/* Shops Table */}
      {shopsLoading ? (
        <div className="shop-manager__loading">
          <i className="fas fa-spinner fa-spin" /> Loading shops...
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="shop-manager__empty">
          <i className="fas fa-store" />
          <p>No shops found{shopFilterCategory !== 'all' ? ' for the selected category' : ''}.</p>
        </div>
      ) : (
        <>
          <div className="shop-manager__table-container">
            <table className="shop-manager__table">
              <thead>
                <tr>
                  <th>Shop ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Price Mod</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShops.map(shop => (
                  <tr key={shop.shop_id} className={editingShop?.shop_id === shop.shop_id ? 'shop-manager__row--active' : ''}>
                    <td className="shop-manager__id-cell">{shop.shop_id}</td>
                    <td>{shop.name}</td>
                    <td>
                      <span className="shop-manager__category-badge">
                        {getCategoryLabel(shop.category)}
                      </span>
                    </td>
                    <td>{shop.is_constant ? 'Constant' : 'Dynamic'}</td>
                    <td>{shop.price_modifier}x</td>
                    <td>
                      <span className={`shop-manager__status-badge shop-manager__status-badge--${shop.is_active ? 'active' : 'inactive'}`}>
                        {shop.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="shop-manager__actions-cell">
                      <button
                        className="button secondary sm"
                        onClick={() => handleStartEditShop(shop)}
                        title="Edit shop"
                        disabled={saving}
                      >
                        <i className="fas fa-edit" />
                      </button>
                      <button
                        className="button secondary sm"
                        onClick={() => handleGoToInventory(shop)}
                        title="Manage items"
                      >
                        <i className="fas fa-box" />
                      </button>
                      <button
                        className="button secondary sm"
                        onClick={() => handleToggleShopActive(shop)}
                        title={shop.is_active ? 'Deactivate' : 'Activate'}
                        disabled={saving}
                      >
                        <i className={`fas fa-${shop.is_active ? 'eye-slash' : 'eye'}`} />
                      </button>
                      <button
                        className="button danger sm"
                        onClick={() => handleDeleteShop(shop)}
                        title="Delete shop"
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
          <div className="shop-manager__footer">
            <span className="shop-manager__count">
              {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''}
              {shopFilterCategory !== 'all' && ' (filtered)'}
            </span>
          </div>
        </>
      )}
    </div>
  );

  // ── Inventory panel ─────────────────────────────────────────────

  const selectedShop = shops.find(s => s.shop_id === selectedShopId);

  const inventoryPanel = (
    <div className="shop-manager__panel">
      {/* Shop Selector */}
      <div className="shop-manager__toolbar">
        <div className="shop-manager__filters">
          <select
            value={selectedShopId}
            onChange={e => handleSelectShop(e.target.value)}
            className="shop-manager__select"
          >
            <option value="">Select a shop...</option>
            {shops.map(s => (
              <option key={s.shop_id} value={s.shop_id}>
                {s.name} ({s.shop_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {renderStatus()}

      {!selectedShopId ? (
        <div className="shop-manager__empty">
          <i className="fas fa-box-open" />
          <p>Select a shop above to manage its inventory.</p>
        </div>
      ) : (
        <>
          {/* Stock Shop Panel */}
          <div className="shop-manager__stock-panel">
            <h3>
              <i className="fas fa-boxes-stacked" /> Stock Shop
              {selectedShop && !selectedShop.is_constant && (
                <span className="shop-manager__optional"> (dynamic shop)</span>
              )}
            </h3>
            <div className="shop-manager__form-row">
              <div className="shop-manager__field">
                <label>Category</label>
                <select
                  value={stockForm.category}
                  onChange={e => setStockForm(prev => ({ ...prev, category: e.target.value }))}
                  className="shop-manager__input"
                >
                  <option value="">Shop default</option>
                  {ALL_SHOP_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="shop-manager__field">
                <label>Item Count</label>
                <input
                  type="number"
                  value={stockForm.count}
                  onChange={e => setStockForm(prev => ({ ...prev, count: parseInt(e.target.value) || 10 }))}
                  className="shop-manager__input"
                  min="1"
                  max="50"
                />
              </div>
              <div className="shop-manager__field">
                <label>Price Modifier</label>
                <input
                  type="number"
                  value={stockForm.price_modifier}
                  onChange={e => setStockForm(prev => ({ ...prev, price_modifier: parseFloat(e.target.value) || 1.0 }))}
                  className="shop-manager__input"
                  step="0.1"
                  min="0.1"
                  max="10"
                />
              </div>
              <div className="shop-manager__field shop-manager__field--action">
                <button className="button primary" onClick={handleStockShop} disabled={stocking}>
                  {stocking ? <><i className="fas fa-spinner fa-spin" /> Stocking...</> : <><i className="fas fa-cubes" /> Stock Shop</>}
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {itemsLoading ? (
            <div className="shop-manager__loading">
              <i className="fas fa-spinner fa-spin" /> Loading items...
            </div>
          ) : shopItems.length === 0 ? (
            <div className="shop-manager__empty">
              <i className="fas fa-box-open" />
              <p>No items in this shop. Use Stock Shop to add items.</p>
            </div>
          ) : (
            <>
              <div className="shop-manager__table-container">
                <table className="shop-manager__table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Rarity</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="shop-manager__item-thumb"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="shop-manager__item-thumb-placeholder">
                              <i className="fas fa-cube" />
                            </div>
                          )}
                        </td>
                        <td>{item.name}</td>
                        <td>{getCategoryLabel(item.category)}</td>
                        <td>{item.rarity || <span className="shop-manager__muted">—</span>}</td>
                        <td>{item.price}</td>
                        <td>
                          <div className="shop-manager__quantity-control">
                            <button
                              className="shop-manager__qty-btn"
                              onClick={() => handleUpdateItemQuantity(item, -1)}
                              disabled={(item.current_quantity ?? 0) <= 0}
                            >
                              −
                            </button>
                            <span className="shop-manager__qty-value">
                              {item.current_quantity ?? '∞'}
                            </span>
                            <button
                              className="shop-manager__qty-btn"
                              onClick={() => handleUpdateItemQuantity(item, 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            className="button danger sm"
                            onClick={() => handleRemoveItem(item)}
                            title="Remove item"
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="shop-manager__footer">
                <span className="shop-manager__count">
                  {shopItems.length} item{shopItems.length !== 1 ? 's' : ''}
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
      key: 'shops',
      label: 'Shops',
      icon: 'fas fa-store',
      badge: shops.length,
      content: shopsPanel,
    },
    {
      key: 'inventory',
      label: 'Inventory',
      icon: 'fas fa-box-open',
      badge: selectedShopId ? shopItems.length : undefined,
      content: inventoryPanel,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="main-container">
      <h1><i className="fas fa-store" /> Shop Manager</h1>
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
