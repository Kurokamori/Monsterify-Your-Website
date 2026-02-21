import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { Modal } from '@components/common/Modal';
import { TypeBadge } from '@components/common/TypeBadge';
import { AttributeBadge } from '@components/common/AttributeBadge';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import { AutocompleteInput } from '@components/common/AutocompleteInput';
import type { AutocompleteOption } from '@components/common/AutocompleteInput';
import tradeService from '@services/tradeService';
import type {
  TradeTrainer,
  TradeMonster,
  TradeInventory,
  TradeItems,
} from '@services/tradeService';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';
import { extractErrorMessage } from '@utils/errorUtils';
import '@styles/town/activities.css';
import '@styles/town/trade-center.css';

const ITEM_CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'items', label: 'Items' },
  { key: 'balls', label: 'Balls' },
  { key: 'berries', label: 'Berries' },
  { key: 'pastries', label: 'Pastries' },
  { key: 'evolution', label: 'Evolution Items' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'antiques', label: 'Antiques' },
  { key: 'helditems', label: 'Held Items' },
  { key: 'seals', label: 'Seals' },
  { key: 'keyitems', label: 'Key Items' },
];

type TradeType = 'monsters' | 'items';

export default function TradeCenterPage() {
  useDocumentTitle('Trade Center');

  const { isAuthenticated, currentUser } = useAuth();

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trainers
  const [allTrainers, setAllTrainers] = useState<TradeTrainer[]>([]);
  const [userTrainers, setUserTrainers] = useState<TradeTrainer[]>([]);
  const [fromTrainerId, setFromTrainerId] = useState<string>('');
  const [toTrainerId, setToTrainerId] = useState<string>('');

  // Trade mode
  const [tradeType, setTradeType] = useState<TradeType>('monsters');

  // Monster state
  const [fromMonsters, setFromMonsters] = useState<TradeMonster[]>([]);
  const [toMonsters, setToMonsters] = useState<TradeMonster[]>([]);
  const [selectedFromMonsters, setSelectedFromMonsters] = useState<number[]>([]);
  const [selectedToMonsters, setSelectedToMonsters] = useState<number[]>([]);
  const [fromMonsterSearch, setFromMonsterSearch] = useState('');
  const [toMonsterSearch, setToMonsterSearch] = useState('');

  // Item state
  const [fromInventory, setFromInventory] = useState<TradeInventory>({});
  const [toInventory, setToInventory] = useState<TradeInventory>({});
  const [selectedFromItems, setSelectedFromItems] = useState<TradeItems>({});
  const [selectedToItems, setSelectedToItems] = useState<TradeItems>({});
  const [fromItemSearch, setFromItemSearch] = useState('');
  const [toItemSearch, setToItemSearch] = useState('');
  const [fromItemCategory, setFromItemCategory] = useState('all');
  const [toItemCategory, setToItemCategory] = useState('all');

  // Modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  // --- Data fetching ---

  const fetchInitialData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const trainers = await tradeService.getAvailableTrainers();
      setAllTrainers(trainers);

      const owned = trainers.filter(t => t.playerUserId === currentUser.discord_id);
      setUserTrainers(owned);

      if (owned.length > 0) {
        setFromTrainerId(String(owned[0].id));
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load trade center data. Please try again later.'));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, fetchInitialData]);

  const fetchTrainerData = useCallback(async (trainerId: string, side: 'from' | 'to', mode: TradeType) => {
    if (!trainerId) return;
    try {
      if (mode === 'monsters') {
        const monsters = await tradeService.getTrainerMonsters(trainerId);
        if (side === 'from') {
          setFromMonsters(monsters);
        } else {
          setToMonsters(monsters);
        }
      } else {
        const inventory = await tradeService.getTrainerInventory(trainerId);
        if (side === 'from') {
          setFromInventory(inventory);
        } else {
          setToInventory(inventory);
        }
      }
    } catch (err) {
      setError(extractErrorMessage(err, `Failed to load ${side} trainer data. Please try again.`));
    }
  }, []);

  useEffect(() => {
    if (fromTrainerId) {
      fetchTrainerData(fromTrainerId, 'from', tradeType);
    }
  }, [fromTrainerId, fetchTrainerData, tradeType]);

  useEffect(() => {
    if (toTrainerId) {
      fetchTrainerData(toTrainerId, 'to', tradeType);
    }
  }, [toTrainerId, fetchTrainerData, tradeType]);

  // --- Filtering (useMemo) ---

  const filteredFromMonsters = useMemo(() => {
    if (!fromMonsterSearch) return fromMonsters;
    const q = fromMonsterSearch.toLowerCase();
    return fromMonsters.filter(m => matchesMonsterSearch(m, q));
  }, [fromMonsters, fromMonsterSearch]);

  const filteredToMonsters = useMemo(() => {
    if (!toMonsterSearch) return toMonsters;
    const q = toMonsterSearch.toLowerCase();
    return toMonsters.filter(m => matchesMonsterSearch(m, q));
  }, [toMonsters, toMonsterSearch]);

  const filteredFromInventory = useMemo(() => {
    return filterInventory(fromInventory, fromItemSearch, fromItemCategory);
  }, [fromInventory, fromItemSearch, fromItemCategory]);

  const filteredToInventory = useMemo(() => {
    return filterInventory(toInventory, toItemSearch, toItemCategory);
  }, [toInventory, toItemSearch, toItemCategory]);

  // --- Handlers ---

  const handleTradeTypeChange = useCallback(async (newType: TradeType) => {
    setTradeType(newType);
    // Clear all selections and search state
    setSelectedFromMonsters([]);
    setSelectedToMonsters([]);
    setSelectedFromItems({});
    setSelectedToItems({});
    setFromMonsterSearch('');
    setToMonsterSearch('');
    setFromItemSearch('');
    setToItemSearch('');
    setFromItemCategory('all');
    setToItemCategory('all');
    // Clear stale data from previous mode
    if (newType === 'monsters') {
      setFromInventory({});
      setToInventory({});
    } else {
      setFromMonsters([]);
      setToMonsters([]);
    }
  }, []);

  const handleMonsterSelection = useCallback((monsterId: number, side: 'from' | 'to', selected: boolean) => {
    const setter = side === 'from' ? setSelectedFromMonsters : setSelectedToMonsters;
    setter(prev => selected ? [...prev, monsterId] : prev.filter(id => id !== monsterId));
  }, []);

  const handleItemSelection = useCallback((category: string, itemName: string, quantity: number, side: 'from' | 'to') => {
    const setter = side === 'from' ? setSelectedFromItems : setSelectedToItems;
    setter(prev => {
      const next = { ...prev };
      if (!next[category]) next[category] = {};
      if (quantity > 0) {
        next[category] = { ...next[category], [itemName]: quantity };
      } else {
        const filtered = Object.fromEntries(
          Object.entries(next[category]).filter(([key]) => key !== itemName)
        );
        if (Object.keys(filtered).length === 0) {
          delete next[category];
        } else {
          next[category] = filtered;
        }
      }
      return next;
    });
  }, []);

  const handleExecuteTrade = useCallback(async () => {
    if (!fromTrainerId || !toTrainerId) {
      setTradeError('Please select both trainers');
      return;
    }
    if (fromTrainerId === toTrainerId) {
      setTradeError('Cannot trade with the same trainer');
      return;
    }

    const hasFromMonsters = selectedFromMonsters.length > 0;
    const hasToMonsters = selectedToMonsters.length > 0;
    const hasFromItems = Object.values(selectedFromItems).some(cat => Object.keys(cat).length > 0);
    const hasToItems = Object.values(selectedToItems).some(cat => Object.keys(cat).length > 0);

    if (!hasFromMonsters && !hasToMonsters && !hasFromItems && !hasToItems) {
      setTradeError('Please select at least one item or monster to trade');
      return;
    }

    try {
      setExecuting(true);
      setTradeError(null);

      await tradeService.executeTrade({
        fromTrainerId: parseInt(fromTrainerId),
        toTrainerId: parseInt(toTrainerId),
        fromItems: tradeType === 'items' ? selectedFromItems : {},
        toItems: tradeType === 'items' ? selectedToItems : {},
        fromMonsters: tradeType === 'monsters' ? selectedFromMonsters : [],
        toMonsters: tradeType === 'monsters' ? selectedToMonsters : [],
      });

      setTradeSuccess(true);
      setSelectedFromMonsters([]);
      setSelectedToMonsters([]);
      setSelectedFromItems({});
      setSelectedToItems({});

      // Refresh trainer data
      if (fromTrainerId) fetchTrainerData(fromTrainerId, 'from', tradeType);
      if (toTrainerId) fetchTrainerData(toTrainerId, 'to', tradeType);
    } catch (err) {
      setTradeError(extractErrorMessage(err, 'Failed to execute trade. Please try again.'));
    } finally {
      setExecuting(false);
    }
  }, [fromTrainerId, toTrainerId, selectedFromMonsters, selectedToMonsters, selectedFromItems, selectedToItems, tradeType, fetchTrainerData]);

  const openTradeModal = useCallback(() => {
    setShowTradeModal(true);
    setTradeSuccess(false);
    setTradeError(null);
  }, []);

  const closeTradeModal = useCallback(() => {
    setShowTradeModal(false);
    setTradeSuccess(false);
    setTradeError(null);
  }, []);

  // --- Helper: get trainer name by id ---

  const getTrainerName = useCallback((id: string) => {
    const trainer = allTrainers.find(t => String(t.id) === id);
    return trainer?.name ?? 'Unknown';
  }, [allTrainers]);

  // --- Renders ---

  if (!isAuthenticated) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <div>
            <h1>Trade Center</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the trade center.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="activity-page">
        <LoadingSpinner message="Loading trade center..." />
      </div>
    );
  }

  if (error && !allTrainers.length) {
    return (
      <div className="activity-page">
        <ErrorMessage message={error} onRetry={fetchInitialData} />
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
      </div>

      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-exchange-alt"></i>
        </div>
        <div>
          <h1>Trade Center</h1>
          <p className="activity-page__description">
            Execute instant trades between trainers
          </p>
        </div>
      </div>

      <div className="activity-location__description">
        <p>
          Welcome to the Trade Center! Here you can execute instant trades between any trainers.
          Select trainers, choose what to trade, and the exchange happens immediately without waiting for approval.
        </p>
        <p>
          You can trade monsters or items between your own trainers or with other players' trainers.
          All trades are executed automatically and cannot be undone.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="trade-center">
        {/* Setup Header */}
        <div className="trade-center__setup-header">
          <h3>Setup Trade</h3>
          <button
            className="button primary no-flex"
            onClick={openTradeModal}
            disabled={!fromTrainerId || !toTrainerId}
          >
            <i className="fas fa-bolt"></i> Execute Trade
          </button>
        </div>

        {/* Trade Type Toggle */}
        <div className="trade-center__type-toggle">
          <label>Trade Type:</label>
          <div className="trade-center__type-buttons">
            <button
              className={`button filter ${tradeType === 'monsters' ? 'active' : ''}`}
              onClick={() => handleTradeTypeChange('monsters')}
            >
              <i className="fas fa-dragon"></i> Trade Monsters
            </button>
            <button
              className={`button filter ${tradeType === 'items' ? 'active' : ''}`}
              onClick={() => handleTradeTypeChange('items')}
            >
              <i className="fas fa-box"></i> Trade Items
            </button>
          </div>
        </div>

        {/* Trainer Selection using TrainerAutocomplete */}
        <div className="trade-center__trainer-row">
          <TrainerAutocomplete
            label="From Trainer:"
            selectedTrainerId={fromTrainerId}
            trainers={userTrainers}
            onSelect={(id) => setFromTrainerId(id ? String(id) : '')}
          />
          <div className="trade-center__arrow">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <TrainerAutocomplete
            label="To Trainer:"
            selectedTrainerId={toTrainerId}
            trainers={allTrainers}
            onSelect={(id) => setToTrainerId(id ? String(id) : '')}
          />
        </div>

        {/* Trade Content */}
        {fromTrainerId && toTrainerId && (
          <div className="trade-center__content">
            {tradeType === 'monsters' ? (
              <div className="trade-center__sides">
                <MonsterTradeSide
                  title={`From: ${getTrainerName(fromTrainerId)}`}
                  monsters={filteredFromMonsters}
                  selectedMonsters={selectedFromMonsters}
                  searchTerm={fromMonsterSearch}
                  onSearchChange={setFromMonsterSearch}
                  onToggle={(id, checked) => handleMonsterSelection(id, 'from', checked)}
                />
                <div className="trade-center__side-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
                <MonsterTradeSide
                  title={`To: ${getTrainerName(toTrainerId)}`}
                  monsters={filteredToMonsters}
                  selectedMonsters={selectedToMonsters}
                  searchTerm={toMonsterSearch}
                  onSearchChange={setToMonsterSearch}
                  onToggle={(id, checked) => handleMonsterSelection(id, 'to', checked)}
                />
              </div>
            ) : (
              <div className="trade-center__sides">
                <ItemTradeSide
                  title={`From: ${getTrainerName(fromTrainerId)}`}
                  inventory={filteredFromInventory}
                  selectedItems={selectedFromItems}
                  searchTerm={fromItemSearch}
                  onSearchChange={setFromItemSearch}
                  categoryFilter={fromItemCategory}
                  onCategoryChange={setFromItemCategory}
                  onQuantityChange={(cat, name, qty) => handleItemSelection(cat, name, qty, 'from')}
                />
                <div className="trade-center__side-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
                <ItemTradeSide
                  title={`To: ${getTrainerName(toTrainerId)}`}
                  inventory={filteredToInventory}
                  selectedItems={selectedToItems}
                  searchTerm={toItemSearch}
                  onSearchChange={setToItemSearch}
                  categoryFilter={toItemCategory}
                  onCategoryChange={setToItemCategory}
                  onQuantityChange={(cat, name, qty) => handleItemSelection(cat, name, qty, 'to')}
                />
              </div>
            )}
          </div>
        )}
        <div className="trade-center__setup-footer">
          <button
            className="button primary no-flex large"
            onClick={openTradeModal}
            disabled={!fromTrainerId || !toTrainerId}
          >
            <i className="fas fa-bolt"></i> Execute Trade
          </button>
        </div>
      </div>

      {/* Trade Execution Modal */}
      <Modal
        isOpen={showTradeModal}
        onClose={closeTradeModal}
        title={tradeSuccess ? 'Trade Executed Successfully!' : 'Execute Trade'}
      >
        {tradeSuccess ? (
          <div className="trade-center__success">
            <div className="trade-center__success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              The trade has been executed successfully! All items and monsters have been transferred automatically.
            </p>
            <button className="button primary" onClick={closeTradeModal}>
              Close
            </button>
          </div>
        ) : (
          <div className="trade-center__confirm">
            <p>Are you sure you want to execute this trade? This action cannot be undone.</p>
            {tradeError && (
              <div className="trade-center__error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{tradeError}</span>
              </div>
            )}
            <div className="trade-center__modal-actions">
              <button className="button secondary" onClick={closeTradeModal}>
                Cancel
              </button>
              <button
                className="button primary"
                onClick={handleExecuteTrade}
                disabled={executing}
              >
                {executing ? (
                  <><i className="fas fa-spinner fa-spin"></i> Executing...</>
                ) : (
                  'Execute Trade'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// --- Sub-components ---

interface MonsterTradeSideProps {
  title: string;
  monsters: TradeMonster[];
  selectedMonsters: number[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onToggle: (id: number, checked: boolean) => void;
}

function MonsterTradeSide({
  title,
  monsters,
  selectedMonsters,
  searchTerm,
  onSearchChange,
  onToggle,
}: MonsterTradeSideProps) {
  const monsterOptions: AutocompleteOption[] = useMemo(() => {
    const seen = new Set<string>();
    return monsters
      .filter(m => {
        if (seen.has(m.name)) return false;
        seen.add(m.name);
        return true;
      })
      .map(m => ({
        name: m.name,
        value: m.name,
        matchNames: [m.species1, m.species2, m.species3, m.type1, m.type2, m.type3, m.type4, m.type5]
          .filter((v): v is string => !!v),
      }));
  }, [monsters]);

  return (
    <div className="trade-center__side">
      <h4>{title}</h4>
      <div className="trade-center__search">
        <AutocompleteInput
          placeholder="Search monsters by name, species, or type..."
          value={searchTerm}
          onChange={onSearchChange}
          options={monsterOptions}
          onSelect={(option) => onSearchChange(option?.name ?? '')}
        />
      </div>
      <div className="trade-center__monster-list">
        {monsters.length === 0 ? (
          <p className="trade-center__empty">No monsters available</p>
        ) : (
          monsters.map(monster => (
            <label key={monster.id} className="trade-center__monster-item">
              <input
                type="checkbox"
                checked={selectedMonsters.includes(monster.id)}
                onChange={e => onToggle(monster.id, e.target.checked)}
              />
              <div className="trade-center__monster-info">
                <div className="trade-center__monster-header">
                  <span className="trade-center__monster-name">{monster.name}</span>
                  <span className="trade-center__monster-level">Lvl {monster.level ?? '?'}</span>
                </div>
                <div className="trade-center__monster-species">
                  {monster.species1}
                  {monster.species2 && ` · ${monster.species2}`}
                  {monster.species3 && ` · ${monster.species3}`}
                </div>
                <div className="trade-center__monster-badges">
                  {[monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
                    .filter(Boolean)
                    .map(type => (
                      <TypeBadge key={type} type={type!} />
                    ))}
                </div>
                {monster.attribute && (
                  <div className="trade-center__monster-badges">
                    <AttributeBadge attribute={monster.attribute} />
                  </div>
                )}
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

interface ItemTradeSideProps {
  title: string;
  inventory: TradeInventory;
  selectedItems: TradeItems;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  onQuantityChange: (category: string, itemName: string, quantity: number) => void;
}

function ItemTradeSide({
  title,
  inventory,
  selectedItems,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  onQuantityChange,
}: ItemTradeSideProps) {
  const itemOptions: AutocompleteOption[] = useMemo(() => {
    const names: AutocompleteOption[] = [];
    const seen = new Set<string>();
    for (const items of Object.values(inventory)) {
      for (const itemName of Object.keys(items)) {
        if (!seen.has(itemName)) {
          seen.add(itemName);
          names.push({ name: itemName, value: itemName });
        }
      }
    }
    return names;
  }, [inventory]);

  return (
    <div className="trade-center__side">
      <h4>{title}</h4>
      <div className="trade-center__item-filters">
        <AutocompleteInput
          placeholder="Search items by name..."
          value={searchTerm}
          onChange={onSearchChange}
          options={itemOptions}
          onSelect={(option) => onSearchChange(option?.name ?? '')}
        />
        <select
          value={categoryFilter}
          onChange={e => onCategoryChange(e.target.value)}
          className="form-input trade-center__category-select"
        >
          {ITEM_CATEGORIES.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="trade-center__item-list">
        {Object.entries(inventory).map(([category, items]) => {
          const itemEntries = Object.entries(items);
          if (itemEntries.length === 0) return null;
          return (
            <div key={category} className="trade-center__item-category">
              <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
              <div className="trade-center__item-rows">
                {itemEntries.map(([itemName, itemData]) => {
                  const quantity = typeof itemData === 'object' ? itemData.quantity : itemData;
                  const imageUrl = typeof itemData === 'object' && itemData.imageUrl
                    ? itemData.imageUrl
                    : getItemImageUrl({ name: itemName, category });

                  return (
                    <div key={itemName} className="trade-center__item-row">
                      <div className="trade-center__item-image">
                        <img
                          src={imageUrl}
                          alt={itemName}
                          onError={e => handleItemImageError(e, category)}
                        />
                      </div>
                      <div className="trade-center__item-info">
                        <span className="trade-center__item-name">{itemName}</span>
                        <span className="trade-center__item-qty">Available: {quantity}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={quantity}
                        value={selectedItems[category]?.[itemName] || 0}
                        onChange={e => onQuantityChange(category, itemName, parseInt(e.target.value) || 0)}
                        className="form-input trade-center__item-input"
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Utility functions ---

function matchesMonsterSearch(monster: TradeMonster, query: string): boolean {
  return (
    monster.name.toLowerCase().includes(query) ||
    monster.species1?.toLowerCase().includes(query) ||
    monster.species2?.toLowerCase().includes(query) ||
    monster.species3?.toLowerCase().includes(query) ||
    monster.type1?.toLowerCase().includes(query) ||
    monster.type2?.toLowerCase().includes(query) ||
    monster.type3?.toLowerCase().includes(query) ||
    monster.type4?.toLowerCase().includes(query) ||
    monster.type5?.toLowerCase().includes(query) ||
    false
  );
}

function filterInventory(
  inventory: TradeInventory,
  search: string,
  category: string,
): TradeInventory {
  const result: TradeInventory = {};
  const searchLower = search.toLowerCase();

  for (const [cat, items] of Object.entries(inventory)) {
    if (category !== 'all' && cat !== category) continue;

    if (search) {
      const filtered: typeof items = {};
      for (const [name, data] of Object.entries(items)) {
        if (name.toLowerCase().includes(searchLower)) {
          filtered[name] = data;
        }
      }
      if (Object.keys(filtered).length > 0) {
        result[cat] = filtered;
      }
    } else {
      result[cat] = items;
    }
  }

  return result;
}
