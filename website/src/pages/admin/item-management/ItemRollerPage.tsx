import { useState, useEffect, useMemo, useCallback, type SyntheticEvent } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import {
  AdminRoute,
  AutocompleteInput,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
} from '@components/common';
import type { AutocompleteOption } from '@components/common';
import itemsService from '@services/itemsService';
import type { Item } from '@services/itemsService';
import trainerService from '@services/trainerService';

// ── Types ─────────────────────────────────────────────────────────────

interface RolledItem extends Item {
  quantity: number;
}

interface CategoryOption {
  value: string;
  label: string;
}

// ── Constants ─────────────────────────────────────────────────────────

const ITEM_CATEGORIES: CategoryOption[] = [
  { value: 'items', label: 'General Items' },
  { value: 'balls', label: 'Balls' },
  { value: 'berries', label: 'Berries' },
  { value: 'pastries', label: 'Pastries' },
  { value: 'evolution', label: 'Evolution Items' },
  { value: 'helditems', label: 'Held Items' },
  { value: 'seals', label: 'Seals' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'antiques', label: 'Antiques' },
  { value: 'keyitems', label: 'Key Items' },
];

const DEFAULT_ENABLED = new Set(
  ITEM_CATEGORIES.filter(c => c.value !== 'keyitems').map(c => c.value)
);

const DEFAULT_ITEM_IMAGE = '/images/items/default_item.png';

// ── Helpers ───────────────────────────────────────────────────────────

function handleImageError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== DEFAULT_ITEM_IMAGE) {
    img.src = DEFAULT_ITEM_IMAGE;
  }
}

function getAxiosError(err: unknown, fallback: string): string {
  const axiosMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (axiosMessage) return axiosMessage;
  if (err instanceof Error) return err.message;
  return fallback;
}

// ── Component ─────────────────────────────────────────────────────────

function ItemRollerContent() {
  useDocumentTitle('Item Roller');

  // Config
  const [quantity, setQuantity] = useState(5);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(new Set(DEFAULT_ENABLED));

  // Results
  const [rolledItems, setRolledItems] = useState<RolledItem[]>([]);
  const [rolling, setRolling] = useState(false);

  // Trainers
  const [trainerOptions, setTrainerOptions] = useState<AutocompleteOption[]>([]);

  // Assignment
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [trainerSearchValue, setTrainerSearchValue] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<{ id: number; name: string } | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignResults, setAssignResults] = useState<Map<number, 'success' | 'error'>>(new Map());

  // UI
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Fetch trainers on mount ───────────────────────────────────────

  useEffect(() => {
    trainerService.getAllTrainers()
      .then(response => {
        const options: AutocompleteOption[] = response.trainers.map(t => ({
          name: `${t.name}${t.player_display_name ? ` (${t.player_display_name})` : ''}`,
          value: t.id,
          matchNames: [t.name, t.nickname ?? '', t.player_display_name ?? '', t.player_username ?? ''].filter(Boolean),
        }));
        setTrainerOptions(options);
      })
      .catch(err => console.error('Error fetching trainers:', err));
  }, []);

  // ── Category helpers ──────────────────────────────────────────────

  const toggleCategory = useCallback((value: string) => {
    setEnabledCategories(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    setEnabledCategories(new Set(ITEM_CATEGORIES.map(c => c.value)));
  }, []);

  const deselectAllCategories = useCallback(() => {
    setEnabledCategories(new Set());
  }, []);

  // ── Roll handler ──────────────────────────────────────────────────

  const handleRoll = useCallback(async () => {
    if (enabledCategories.size === 0) {
      setError('Select at least one category');
      return;
    }

    setRolling(true);
    setError(null);
    setSuccess(null);
    setSelectedCardIndex(null);
    setAssignResults(new Map());

    try {
      const result = await itemsService.rollItems({
        categories: [...enabledCategories],
        quantity,
      });
      setRolledItems(result.data as RolledItem[]);
    } catch (err: unknown) {
      setError(getAxiosError(err, 'Failed to roll items'));
    } finally {
      setRolling(false);
    }
  }, [enabledCategories, quantity]);

  // ── Assignment handler ────────────────────────────────────────────

  const handleCardClick = useCallback((index: number) => {
    if (assignResults.has(index)) return;
    setSelectedCardIndex(prev => prev === index ? null : index);
    setTrainerSearchValue('');
    setSelectedTrainer(null);
  }, [assignResults]);

  const handleTrainerSelect = useCallback((option: AutocompleteOption | null) => {
    if (option) {
      setSelectedTrainer({ id: Number(option.value), name: option.name });
    } else {
      setSelectedTrainer(null);
    }
  }, []);

  const handleGiveItem = useCallback(async () => {
    if (selectedCardIndex === null || !selectedTrainer) return;

    const item = rolledItems[selectedCardIndex];
    if (!item) return;

    setAssigning(true);
    setError(null);

    try {
      await itemsService.addItemToTrainer(
        selectedTrainer.id,
        item.name,
        item.quantity || 1,
        item.category || 'items',
      );

      setAssignResults(prev => new Map(prev).set(selectedCardIndex, 'success'));
      setSuccess(`${item.name} given to ${selectedTrainer.name}`);
      setSelectedCardIndex(null);
      setTrainerSearchValue('');
      setSelectedTrainer(null);
    } catch (err: unknown) {
      setAssignResults(prev => new Map(prev).set(selectedCardIndex, 'error'));
      setError(getAxiosError(err, 'Failed to give item'));
    } finally {
      setAssigning(false);
    }
  }, [selectedCardIndex, selectedTrainer, rolledItems]);

  const handleCancelAssign = useCallback(() => {
    setSelectedCardIndex(null);
    setTrainerSearchValue('');
    setSelectedTrainer(null);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────

  const adjustQuantity = useCallback((delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(20, prev + delta)));
  }, []);

  const categoryLabel = useMemo(() => {
    if (enabledCategories.size === ITEM_CATEGORIES.length) return 'All categories';
    if (enabledCategories.size === 0) return 'No categories';
    return `${enabledCategories.size} categories`;
  }, [enabledCategories]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="container vertical gap-lg">
      {/* Header */}
      <div>
        <h1><i className="fas fa-dice"></i> Item Roller</h1>
        <p className="text-muted">Roll random items and optionally assign them to trainers</p>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}

      {/* Config Panel */}
      <div className="card">
        <div className="card__header">
          <div className="card__header-content">
            <h2 className="card__title"><i className="fas fa-cog"></i> Configuration</h2>
          </div>
        </div>
        <div className="card__body container vertical gap-md p-md">
          {/* Quantity */}
          <div className="container vertical gap-sm">
            <label className="form-label"><i className="fas fa-hashtag"></i> Quantity</label>
            <div className="container align-center gap-sm">
              <button className="button secondary sm" onClick={() => adjustQuantity(-1)}>-</button>
              <input
                type="number"
                className="input item-roller__quantity-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                min={1}
                max={20}
              />
              <button className="button secondary sm" onClick={() => adjustQuantity(1)}>+</button>
              <span className="text-muted">items</span>
            </div>
          </div>

          {/* Categories */}
          <div className="container vertical gap-sm">
            <label className="form-label"><i className="fas fa-tags"></i> Categories ({categoryLabel})</label>
            <div className="container flex-wrap gap-xs">
              <button className="button filter sm" onClick={selectAllCategories}>Select All</button>
              <button className="button filter sm" onClick={deselectAllCategories}>Deselect All</button>
            </div>
            <div className="item-roller__categories">
              {ITEM_CATEGORIES.map(cat => (
                <label key={cat.value} className="item-roller__category-checkbox">
                  <input
                    type="checkbox"
                    checked={enabledCategories.has(cat.value)}
                    onChange={() => toggleCategory(cat.value)}
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Roll Button */}
          <button
            className="button primary"
            onClick={handleRoll}
            disabled={rolling || enabledCategories.size === 0}
          >
            {rolling
              ? <><i className="fas fa-spinner fa-spin"></i> Rolling...</>
              : <><i className="fas fa-dice"></i> Roll Items</>
            }
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="card__header">
          <div className="card__header-content">
            <h2 className="card__title"><i className="fas fa-box-open"></i> Results</h2>
          </div>
          {rolledItems.length > 0 && (
            <div className="card__header-action">
              <span className="text-muted">{rolledItems.length} items rolled</span>
            </div>
          )}
        </div>
        <div className="card__body p-md">
          {rolling && <LoadingSpinner message="Rolling items..." />}

          {!rolling && rolledItems.length === 0 && (
            <div className="container vertical center gap-md p-lg">
              <i className="fas fa-box fa-3x text-muted"></i>
              <p className="text-muted">Configure the roll settings and click "Roll Items" to see results</p>
            </div>
          )}

          {!rolling && rolledItems.length > 0 && (
            <div className="item-roller__grid">
              {rolledItems.map((item, index) => {
                const isSelected = selectedCardIndex === index;
                const result = assignResults.get(index);

                return (
                  <div
                    key={index}
                    className={`item-roller__card${isSelected ? ' item-roller__card--selected' : ''}${result === 'success' ? ' item-roller__card--success' : ''}${result === 'error' ? ' item-roller__card--error' : ''}`}
                    onClick={() => !isSelected && handleCardClick(index)}
                  >
                    {/* Card Content */}
                    <div className="item-roller__card-image">
                      <img
                        src={item.image_url || DEFAULT_ITEM_IMAGE}
                        alt={item.name}
                        onError={handleImageError}
                      />
                    </div>
                    <div className="item-roller__card-info">
                      <h4 className="item-roller__card-name">{item.name}</h4>
                      <span className="badge sm">{item.category}</span>
                      <div className="item-roller__card-meta">
                        {item.rarity && <span className="text-muted">{item.rarity}</span>}
                        {(item.quantity ?? 1) > 1 && <span className="text-muted">x{item.quantity}</span>}
                      </div>
                    </div>

                    {/* Success indicator */}
                    {result === 'success' && (
                      <div className="item-roller__card-status item-roller__card-status--success">
                        <i className="fas fa-check-circle"></i> Assigned
                      </div>
                    )}

                    {/* Error indicator */}
                    {result === 'error' && (
                      <div className="item-roller__card-status item-roller__card-status--error">
                        <i className="fas fa-exclamation-circle"></i> Failed
                      </div>
                    )}

                    {/* Assignment UI */}
                    {isSelected && (
                      <div className="item-roller__assign" onClick={e => e.stopPropagation()}>
                        <AutocompleteInput
                          name="trainerSearch"
                          placeholder="Search trainers..."
                          value={trainerSearchValue}
                          onChange={setTrainerSearchValue}
                          options={trainerOptions}
                          onSelect={handleTrainerSelect}
                        />
                        <div className="container gap-xs">
                          <button
                            className="button success sm"
                            disabled={!selectedTrainer || assigning}
                            onClick={handleGiveItem}
                          >
                            {assigning
                              ? <><i className="fas fa-spinner fa-spin"></i> Giving...</>
                              : <><i className="fas fa-gift"></i> Give</>
                            }
                          </button>
                          <button className="button secondary sm" onClick={handleCancelAssign}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Click hint for unassigned cards */}
                    {!result && !isSelected && (
                      <div className="item-roller__card-hint">
                        <i className="fas fa-user-plus"></i> Click to assign
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ItemRollerPage() {
  return (
    <AdminRoute>
      <ItemRollerContent />
    </AdminRoute>
  );
}
