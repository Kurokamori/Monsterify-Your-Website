import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AutocompleteInput, TabContainer } from '@components/common';
import type { AutocompleteOption } from '@components/common';
import type { Tab } from '@components/common/TabContainer';
import trainerService from '@services/trainerService';
import itemsService from '@services/itemsService';
import type { Item } from '@services/itemsService';
import type { Trainer } from '@components/trainers/types/Trainer';
import '@styles/admin/trainer-inventory-editor.css';

// ============================================================================
// Constants & Types
// ============================================================================

const INVENTORY_CATEGORIES = [
  'items',
  'balls',
  'berries',
  'pastries',
  'evolution',
  'eggs',
  'antiques',
  'helditems',
  'seals',
  'keyitems',
] as const;

type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

type InventoryData = Record<InventoryCategory, Record<string, number>>;

interface MassAddItemRow {
  itemName: string;
  category: InventoryCategory;
  quantity: number;
}

interface MassAddEntry {
  trainerId: number | null;
  trainerSearchValue: string;
  itemRows: MassAddItemRow[];
}

// ============================================================================
// Helpers
// ============================================================================

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function buildTrainerOptions(trainers: Trainer[]): AutocompleteOption[] {
  return trainers.map((t) => ({
    name: `${t.name}${t.player_display_name ? ` (${t.player_display_name})` : ''}`,
    value: t.id,
    matchNames: [t.name, t.player_display_name ?? '', t.player_username ?? ''].filter(Boolean),
  }));
}

function normalizeInventory(data: Record<string, unknown>): InventoryData {
  const result = {} as InventoryData;
  for (const cat of INVENTORY_CATEGORIES) {
    const raw = (data as Record<string, unknown>)[cat];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      result[cat] = raw as Record<string, number>;
    } else if (Array.isArray(raw)) {
      const map: Record<string, number> = {};
      for (const item of raw) {
        if (item && typeof item === 'object' && 'name' in item && 'quantity' in item) {
          map[(item as { name: string }).name] = (item as { quantity: number }).quantity;
        }
      }
      result[cat] = map;
    } else {
      result[cat] = {};
    }
  }
  return result;
}

// ============================================================================
// Single Trainer Editor
// ============================================================================

interface SingleEditorProps {
  trainers: Trainer[];
  trainerOptions: AutocompleteOption[];
}

function SingleTrainerEditor({ trainers, trainerOptions }: SingleEditorProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(null);
  const [currency, setCurrency] = useState<number>(0);
  const [currencyDelta, setCurrencyDelta] = useState('');
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<InventoryCategory>('items');
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  const selectedTrainer = trainers.find((t) => t.id === selectedTrainerId) ?? null;

  const fetchTrainerData = useCallback(async (trainerId: number) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const [invResponse, trainerData] = await Promise.all([
        trainerService.getTrainerInventory(trainerId),
        trainerService.getTrainer(trainerId),
      ]);
      const invData = (invResponse as unknown as { data: Record<string, unknown> }).data ?? invResponse;
      setInventory(normalizeInventory(invData as Record<string, unknown>));
      if (trainerData) setCurrency(trainerData.currency_amount);
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to fetch trainer data') });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback(
    (option: AutocompleteOption | null) => {
      if (option && option.value != null) {
        const id = Number(option.value);
        setSelectedTrainerId(id);
        fetchTrainerData(id);
      } else {
        setSelectedTrainerId(null);
        setInventory(null);
      }
    },
    [fetchTrainerData],
  );

  const handleCurrencyApply = useCallback(async () => {
    if (!selectedTrainerId) return;
    const amount = parseInt(currencyDelta, 10);
    if (isNaN(amount) || amount === 0) return;
    try {
      await trainerService.adminUpdateCurrency(selectedTrainerId, amount);
      const trainerData = await trainerService.getTrainer(selectedTrainerId);
      if (trainerData) setCurrency(trainerData.currency_amount);
      setCurrencyDelta('');
      setStatusMsg({ type: 'success', text: `Currency updated by ${amount}` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update currency') });
    }
  }, [selectedTrainerId, currencyDelta]);

  const handleUpdateItem = useCallback(
    async (category: InventoryCategory, itemName: string, quantity: number) => {
      if (!selectedTrainerId) return;
      try {
        await trainerService.updateTrainerInventoryItem(selectedTrainerId, category, itemName, quantity);
        await fetchTrainerData(selectedTrainerId);
      } catch (err) {
        setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update item') });
      }
    },
    [selectedTrainerId, fetchTrainerData],
  );

  const handleAddItem = useCallback(async () => {
    if (!selectedTrainerId || !newItemName.trim()) return;
    try {
      await trainerService.updateTrainerInventoryItem(
        selectedTrainerId,
        newItemCategory,
        newItemName.trim(),
        newItemQuantity,
      );
      await fetchTrainerData(selectedTrainerId);
      setNewItemName('');
      setNewItemQuantity(1);
      setStatusMsg({ type: 'success', text: `Added ${newItemName.trim()} to ${newItemCategory}` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to add item') });
    }
  }, [selectedTrainerId, newItemName, newItemCategory, newItemQuantity, fetchTrainerData]);

  return (
    <div className="inventory-editor__single">
      <div className="inventory-editor__search">
        <AutocompleteInput
          name="trainerSearch"
          placeholder="Search trainers..."
          value={searchValue}
          onChange={setSearchValue}
          options={trainerOptions}
          onSelect={handleSelect}
        />
      </div>

      {statusMsg && (
        <div className={`inventory-editor__status inventory-editor__status--${statusMsg.type}`}>
          {statusMsg.text}
        </div>
      )}

      {loading && <div className="inventory-editor__loading">Loading trainer data...</div>}

      {selectedTrainer && !loading && inventory && (
        <>
          <div className="card inventory-editor__currency-card">
            <div className="card__header">
              <h3>
                <i className="fas fa-coins" /> Currency — {selectedTrainer.name}
              </h3>
            </div>
            <div className="card__body">
              <div className="inventory-editor__currency-row">
                <span className="inventory-editor__currency-label">Current Balance:</span>
                <span className="inventory-editor__currency-value">{currency}</span>
              </div>
              <div className="inventory-editor__currency-row">
                <input
                  type="number"
                  className="input inventory-editor__currency-input"
                  placeholder="Amount to add/remove"
                  value={currencyDelta}
                  onChange={(e) => setCurrencyDelta(e.target.value)}
                />
                <button className="button primary" onClick={handleCurrencyApply}>
                  Apply
                </button>
              </div>
            </div>
          </div>

          <div className="card inventory-editor__inventory-card">
            <div className="card__header">
              <h3>
                <i className="fas fa-box-open" /> Inventory
              </h3>
            </div>
            <div className="card__body">
              {INVENTORY_CATEGORIES.map((cat) => {
                const items = inventory[cat];
                const entries = Object.entries(items).filter(([, qty]) => qty > 0);
                if (entries.length === 0) return null;
                return (
                  <div key={cat} className="inventory-editor__category">
                    <h4 className="inventory-editor__category-title">{cat}</h4>
                    <div className="inventory-editor__item-list">
                      {entries.map(([name, qty]) => (
                        <div key={name} className="inventory-editor__item-row">
                          <span className="inventory-editor__item-name">{name}</span>
                          <span className="inventory-editor__item-qty">{qty}</span>
                          <button
                            className="button sm"
                            onClick={() => handleUpdateItem(cat, name, qty - 1)}
                          >
                            <i className="fas fa-minus" />
                          </button>
                          <button
                            className="button sm"
                            onClick={() => handleUpdateItem(cat, name, qty + 1)}
                          >
                            <i className="fas fa-plus" />
                          </button>
                          <button
                            className="button sm danger"
                            onClick={() => handleUpdateItem(cat, name, 0)}
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {INVENTORY_CATEGORIES.every(
                (cat) => Object.entries(inventory[cat]).filter(([, qty]) => qty > 0).length === 0,
              ) && <p className="inventory-editor__empty">Inventory is empty.</p>}

              <div className="inventory-editor__add-item">
                <h4 className="inventory-editor__add-title">Add Item</h4>
                <div className="inventory-editor__add-row">
                  <input
                    type="text"
                    className="input"
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <select
                    className="select"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as InventoryCategory)}
                  >
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input inventory-editor__qty-input"
                    min={1}
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  />
                  <button className="button primary" onClick={handleAddItem}>
                    <i className="fas fa-plus" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Mass Add Tab
// ============================================================================

interface MassAddProps {
  trainerOptions: AutocompleteOption[];
}

function MassAddEditor({ trainerOptions }: MassAddProps) {
  const [entries, setEntries] = useState<MassAddEntry[]>([
    { trainerId: null, trainerSearchValue: '', itemRows: [{ itemName: '', category: 'items', quantity: 1 }] },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateEntry = useCallback((index: number, updates: Partial<MassAddEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...updates } : e)));
  }, []);

  const updateItemRow = useCallback((entryIndex: number, rowIndex: number, updates: Partial<MassAddItemRow>) => {
    setEntries((prev) =>
      prev.map((e, ei) =>
        ei === entryIndex
          ? { ...e, itemRows: e.itemRows.map((r, ri) => (ri === rowIndex ? { ...r, ...updates } : r)) }
          : e,
      ),
    );
  }, []);

  const addItemRow = useCallback((entryIndex: number) => {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === entryIndex
          ? { ...e, itemRows: [...e.itemRows, { itemName: '', category: 'items' as InventoryCategory, quantity: 1 }] }
          : e,
      ),
    );
  }, []);

  const removeItemRow = useCallback((entryIndex: number, rowIndex: number) => {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === entryIndex ? { ...e, itemRows: e.itemRows.filter((_, ri) => ri !== rowIndex) } : e,
      ),
    );
  }, []);

  const addEntry = useCallback(() => {
    setEntries((prev) => [
      ...prev,
      { trainerId: null, trainerSearchValue: '', itemRows: [{ itemName: '', category: 'items', quantity: 1 }] },
    ]);
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmitAll = useCallback(async () => {
    setSubmitting(true);
    setStatusMsg(null);
    let successCount = 0;
    let errorCount = 0;

    for (const entry of entries) {
      if (!entry.trainerId) {
        errorCount += entry.itemRows.length;
        continue;
      }
      for (const row of entry.itemRows) {
        if (!row.itemName.trim()) {
          errorCount++;
          continue;
        }
        try {
          await trainerService.updateTrainerInventoryItem(
            entry.trainerId,
            row.category,
            row.itemName.trim(),
            row.quantity,
          );
          successCount++;
        } catch {
          errorCount++;
        }
      }
    }

    setSubmitting(false);
    setStatusMsg({
      type: errorCount === 0 ? 'success' : 'error',
      text: `Completed: ${successCount} successful, ${errorCount} failed`,
    });
  }, [entries]);

  return (
    <div className="inventory-editor__mass">
      {statusMsg && (
        <div className={`inventory-editor__status inventory-editor__status--${statusMsg.type}`}>
          {statusMsg.text}
        </div>
      )}

      {entries.map((entry, entryIndex) => (
        <div key={entryIndex} className="card inventory-editor__mass-entry">
          <div className="card__header">
            <h4>Trainer Entry {entryIndex + 1}</h4>
            {entries.length > 1 && (
              <button className="button sm danger" onClick={() => removeEntry(entryIndex)}>
                <i className="fas fa-times" /> Remove
              </button>
            )}
          </div>
          <div className="card__body">
            <div className="inventory-editor__search">
              <AutocompleteInput
                name={`massTrainer_${entryIndex}`}
                placeholder="Search trainers..."
                value={entry.trainerSearchValue}
                onChange={(val) => updateEntry(entryIndex, { trainerSearchValue: val })}
                options={trainerOptions}
                onSelect={(option) =>
                  updateEntry(entryIndex, { trainerId: option ? Number(option.value) : null })
                }
              />
            </div>

            {entry.itemRows.map((row, rowIndex) => (
              <div key={rowIndex} className="inventory-editor__mass-item-row">
                <input
                  type="text"
                  className="input"
                  placeholder="Item name"
                  value={row.itemName}
                  onChange={(e) => updateItemRow(entryIndex, rowIndex, { itemName: e.target.value })}
                />
                <select
                  className="select"
                  value={row.category}
                  onChange={(e) =>
                    updateItemRow(entryIndex, rowIndex, { category: e.target.value as InventoryCategory })
                  }
                >
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="input inventory-editor__qty-input"
                  min={1}
                  value={row.quantity}
                  onChange={(e) =>
                    updateItemRow(entryIndex, rowIndex, {
                      quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                />
                {entry.itemRows.length > 1 && (
                  <button
                    className="button sm danger"
                    onClick={() => removeItemRow(entryIndex, rowIndex)}
                  >
                    <i className="fas fa-minus" />
                  </button>
                )}
              </div>
            ))}

            <button className="button secondary" onClick={() => addItemRow(entryIndex)}>
              <i className="fas fa-plus" /> Add Item Row
            </button>
          </div>
        </div>
      ))}

      <div className="inventory-editor__mass-actions">
        <button className="button secondary" onClick={addEntry}>
          <i className="fas fa-plus" /> Add Trainer Entry
        </button>
        <button className="button primary" onClick={handleSubmitAll} disabled={submitting}>
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Processing...
            </>
          ) : (
            <>
              <i className="fas fa-check" /> Submit All
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Bulk Add to All Trainers Tab
// ============================================================================

interface BulkAddAllProps {
  items: Item[];
}

function BulkAddToAllEditor({ items }: BulkAddAllProps) {
  const [itemSearchValue, setItemSearchValue] = useState('');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('items');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resultErrors, setResultErrors] = useState<string[]>([]);

  const itemOptions: AutocompleteOption[] = items.map((item) => ({
    name: item.name,
    value: item.name,
    description: item.category ?? '',
  }));

  const handleItemSelect = useCallback((option: AutocompleteOption | null) => {
    if (option) {
      setSelectedItemName(String(option.value ?? option.name));
      const matchedItem = items.find((i) => i.name === (option.value ?? option.name));
      if (matchedItem?.category) {
        const cat = matchedItem.category.toLowerCase() as InventoryCategory;
        if (INVENTORY_CATEGORIES.includes(cat)) {
          setCategory(cat);
        }
      }
    } else {
      setSelectedItemName('');
    }
  }, [items]);

  const handleSubmit = useCallback(async () => {
    const itemName = selectedItemName.trim() || itemSearchValue.trim();
    if (!itemName) return;

    setSubmitting(true);
    setStatusMsg(null);
    setResultErrors([]);

    try {
      const response = await trainerService.adminBulkAddItemToAllTrainers(itemName, quantity, category);
      const data = response.data;
      setStatusMsg({
        type: data.failed === 0 ? 'success' : 'error',
        text: response.message || `Added ${itemName} x${quantity} to ${data.success} trainers. ${data.failed} failed.`,
      });
      if (data.errors?.length > 0) {
        setResultErrors(data.errors);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to bulk add items') });
    } finally {
      setSubmitting(false);
    }
  }, [selectedItemName, itemSearchValue, quantity, category]);

  return (
    <div className="inventory-editor__bulk-all">
      <div className="card">
        <div className="card__header">
          <h3><i className="fas fa-globe" /> Add Item to All Trainers</h3>
        </div>
        <div className="card__body">
          <p className="inventory-editor__bulk-description">
            Select an item and quantity to add to <strong>every trainer</strong> in the system.
          </p>

          <div className="inventory-editor__bulk-form">
            <div className="inventory-editor__bulk-field">
              <label className="inventory-editor__bulk-label">Item</label>
              <AutocompleteInput
                name="bulkItemSearch"
                placeholder="Search items..."
                value={itemSearchValue}
                onChange={setItemSearchValue}
                options={itemOptions}
                onSelect={handleItemSelect}
              />
            </div>

            <div className="inventory-editor__bulk-field">
              <label className="inventory-editor__bulk-label">Category</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryCategory)}
              >
                {INVENTORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="inventory-editor__bulk-field">
              <label className="inventory-editor__bulk-label">Quantity</label>
              <input
                type="number"
                className="input inventory-editor__qty-input"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            <button
              className="button primary"
              onClick={handleSubmit}
              disabled={submitting || (!selectedItemName.trim() && !itemSearchValue.trim())}
            >
              {submitting ? (
                <><i className="fas fa-spinner fa-spin" /> Adding to all trainers...</>
              ) : (
                <><i className="fas fa-paper-plane" /> Add to All Trainers</>
              )}
            </button>
          </div>

          {statusMsg && (
            <div className={`inventory-editor__status inventory-editor__status--${statusMsg.type}`}>
              {statusMsg.text}
            </div>
          )}

          {resultErrors.length > 0 && (
            <div className="inventory-editor__bulk-errors">
              <h4>Errors:</h4>
              <ul>
                {resultErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

function TrainerInventoryEditorContent() {
  useDocumentTitle('Trainer Inventory Editor');

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainerOptions, setTrainerOptions] = useState<AutocompleteOption[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState('single');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainerResponse, itemsResponse] = await Promise.all([
          trainerService.getAllTrainers(),
          itemsService.getItems({ limit: 5000 }),
        ]);
        setTrainers(trainerResponse.trainers);
        setTrainerOptions(buildTrainerOptions(trainerResponse.trainers));
        setAllItems(itemsResponse.data ?? []);
      } catch (err) {
        setError(getAxiosError(err, 'Failed to load data'));
      }
    };
    fetchData();
  }, []);

  const tabs: Tab[] = [
    {
      key: 'single',
      label: 'Single Trainer',
      icon: 'fas fa-user',
      content: <SingleTrainerEditor trainers={trainers} trainerOptions={trainerOptions} />,
    },
    {
      key: 'mass',
      label: 'Mass Add',
      icon: 'fas fa-users',
      content: <MassAddEditor trainerOptions={trainerOptions} />,
    },
    {
      key: 'bulk-all',
      label: 'Bulk Add to All',
      icon: 'fas fa-globe',
      content: <BulkAddToAllEditor items={allItems} />,
    },
  ];

  return (
    <div className="inventory-editor">
      <div className="inventory-editor__header">
        <h1>
          <i className="fas fa-boxes-stacked" /> Trainer Inventory Editor
        </h1>
      </div>

      {error && <div className="inventory-editor__status inventory-editor__status--error">{error}</div>}

      <TabContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default function TrainerInventoryEditorPage() {
  return (
    <AdminRoute>
      <TrainerInventoryEditorContent />
    </AdminRoute>
  );
}
