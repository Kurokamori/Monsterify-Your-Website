import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Modal from '../../../components/common/Modal';
import automatedTradeService from '../../../services/automatedTradeService';
import { getItemImageUrl, handleItemImageError } from '../../../utils/imageUtils';

const AutomatedTradeCenter = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [userTrainers, setUserTrainers] = useState([]);

  // Trade form state
  const [fromTrainerId, setFromTrainerId] = useState('');
  const [toTrainerId, setToTrainerId] = useState('');
  const [tradeType, setTradeType] = useState('monsters'); // 'monsters' or 'items'

  // Monster trade state
  const [fromMonsters, setFromMonsters] = useState([]);
  const [toMonsters, setToMonsters] = useState([]);
  const [selectedFromMonsters, setSelectedFromMonsters] = useState([]);
  const [selectedToMonsters, setSelectedToMonsters] = useState([]);

  // Item trade state
  const [fromInventory, setFromInventory] = useState({});
  const [toInventory, setToInventory] = useState({});
  const [selectedFromItems, setSelectedFromItems] = useState({});
  const [selectedToItems, setSelectedToItems] = useState({});

  // Item search and filter state
  const [fromItemSearchTerm, setFromItemSearchTerm] = useState('');
  const [toItemSearchTerm, setToItemSearchTerm] = useState('');
  const [fromItemCategoryFilter, setFromItemCategoryFilter] = useState('all');
  const [toItemCategoryFilter, setToItemCategoryFilter] = useState('all');
  const [filteredFromInventory, setFilteredFromInventory] = useState({});
  const [filteredToInventory, setFilteredToInventory] = useState({});

  // Modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState(null);
  const [executing, setExecuting] = useState(false);

  // Monster search state
  const [fromSearchTerm, setFromSearchTerm] = useState('');
  const [toSearchTerm, setToSearchTerm] = useState('');
  const [filteredFromMonsters, setFilteredFromMonsters] = useState([]);
  const [filteredToMonsters, setFilteredToMonsters] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [currentUser]);

  useEffect(() => {
    if (fromTrainerId) {
      fetchTrainerData(fromTrainerId, 'from');
    }
  }, [fromTrainerId]);

  useEffect(() => {
    if (toTrainerId) {
      fetchTrainerData(toTrainerId, 'to');
    }
  }, [toTrainerId]);

  // Filter from monsters based on search
  useEffect(() => {
    if (fromMonsters.length > 0 && fromSearchTerm) {
      const filtered = fromMonsters.filter(monster => {
        const searchLower = fromSearchTerm.toLowerCase();
        return (
          monster.name.toLowerCase().includes(searchLower) ||
          monster.species1?.toLowerCase().includes(searchLower) ||
          monster.species2?.toLowerCase().includes(searchLower) ||
          monster.species3?.toLowerCase().includes(searchLower) ||
          monster.type1?.toLowerCase().includes(searchLower) ||
          monster.type2?.toLowerCase().includes(searchLower) ||
          monster.type3?.toLowerCase().includes(searchLower) ||
          monster.type4?.toLowerCase().includes(searchLower) ||
          monster.type5?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredFromMonsters(filtered);
    } else {
      setFilteredFromMonsters(fromMonsters);
    }
  }, [fromMonsters, fromSearchTerm]);

  // Filter to monsters based on search
  useEffect(() => {
    if (toMonsters.length > 0 && toSearchTerm) {
      const filtered = toMonsters.filter(monster => {
        const searchLower = toSearchTerm.toLowerCase();
        return (
          monster.name.toLowerCase().includes(searchLower) ||
          monster.species1?.toLowerCase().includes(searchLower) ||
          monster.species2?.toLowerCase().includes(searchLower) ||
          monster.species3?.toLowerCase().includes(searchLower) ||
          monster.type1?.toLowerCase().includes(searchLower) ||
          monster.type2?.toLowerCase().includes(searchLower) ||
          monster.type3?.toLowerCase().includes(searchLower) ||
          monster.type4?.toLowerCase().includes(searchLower) ||
          monster.type5?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredToMonsters(filtered);
    } else {
      setFilteredToMonsters(toMonsters);
    }
  }, [toMonsters, toSearchTerm]);

  // Filter from inventory based on search and category
  useEffect(() => {
    if (Object.keys(fromInventory).length > 0) {
      const filtered = {};
      const searchLower = fromItemSearchTerm.toLowerCase();
      
      Object.entries(fromInventory).forEach(([category, items]) => {
        // Apply category filter
        if (fromItemCategoryFilter !== 'all' && category !== fromItemCategoryFilter) {
          return;
        }
        
        // Apply search filter
        if (fromItemSearchTerm) {
          const filteredItems = {};
          Object.entries(items).forEach(([itemName, itemData]) => {
            if (itemName.toLowerCase().includes(searchLower)) {
              filteredItems[itemName] = itemData;
            }
          });
          if (Object.keys(filteredItems).length > 0) {
            filtered[category] = filteredItems;
          }
        } else {
          filtered[category] = items;
        }
      });
      
      setFilteredFromInventory(filtered);
    } else {
      setFilteredFromInventory(fromInventory);
    }
  }, [fromInventory, fromItemSearchTerm, fromItemCategoryFilter]);

  // Filter to inventory based on search and category
  useEffect(() => {
    if (Object.keys(toInventory).length > 0) {
      const filtered = {};
      const searchLower = toItemSearchTerm.toLowerCase();
      
      Object.entries(toInventory).forEach(([category, items]) => {
        // Apply category filter
        if (toItemCategoryFilter !== 'all' && category !== toItemCategoryFilter) {
          return;
        }
        
        // Apply search filter
        if (toItemSearchTerm) {
          const filteredItems = {};
          Object.entries(items).forEach(([itemName, itemData]) => {
            if (itemName.toLowerCase().includes(searchLower)) {
              filteredItems[itemName] = itemData;
            }
          });
          if (Object.keys(filteredItems).length > 0) {
            filtered[category] = filteredItems;
          }
        } else {
          filtered[category] = items;
        }
      });
      
      setFilteredToInventory(filtered);
    } else {
      setFilteredToInventory(toInventory);
    }
  }, [toInventory, toItemSearchTerm, toItemCategoryFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser || !currentUser.id) {
        setError('You must be logged in to access the Automated Trade Center');
        return;
      }

      // Fetch all available trainers
      const trainersResponse = await automatedTradeService.getAvailableTrainers();
      setAvailableTrainers(trainersResponse.trainers || []);

      // Filter user's trainers
      const userOwnedTrainers = trainersResponse.trainers.filter(
        trainer => trainer.player_user_id === currentUser.discord_id
      );
      setUserTrainers(userOwnedTrainers);

      // Set default from trainer to user's first trainer
      if (userOwnedTrainers.length > 0) {
        setFromTrainerId(userOwnedTrainers[0].id);
      }

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load trade center data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainerData = async (trainerId, type, tradeMode = tradeType) => {
    try {
      if (tradeMode === 'monsters') {
        // Fetch trainer's monsters
        const monstersResponse = await automatedTradeService.getTrainerMonsters(trainerId);
        const monsters = monstersResponse.monsters || [];
        
        if (type === 'from') {
          setFromMonsters(monsters);
          setFilteredFromMonsters(monsters);
          // Clear inventory data when switching to monsters
          setFromInventory({});
          setFilteredFromInventory({});
        } else {
          setToMonsters(monsters);
          setFilteredToMonsters(monsters);
          // Clear inventory data when switching to monsters
          setToInventory({});
          setFilteredToInventory({});
        }
      } else {
        // Fetch trainer's inventory
        const inventoryResponse = await automatedTradeService.getTrainerInventory(trainerId);
        const inventory = inventoryResponse.inventory || {};
        
        if (type === 'from') {
          setFromInventory(inventory);
          setFilteredFromInventory(inventory);
          // Clear monster data when switching to items
          setFromMonsters([]);
          setFilteredFromMonsters([]);
        } else {
          setToInventory(inventory);
          setFilteredToInventory(inventory);
          // Clear monster data when switching to items
          setToMonsters([]);
          setFilteredToMonsters([]);
        }
      }
    } catch (err) {
      console.error(`Error fetching ${type} trainer data:`, err);
      setError(`Failed to load ${type} trainer data. Please try again.`);
    }
  };

  const handleTradeTypeChange = async (newType) => {
    setTradeType(newType);
    // Clear selections when switching trade types
    setSelectedFromMonsters([]);
    setSelectedToMonsters([]);
    setSelectedFromItems({});
    setSelectedToItems({});

    // Clear search terms and filters when switching modes
    setFromSearchTerm('');
    setToSearchTerm('');
    setFromItemSearchTerm('');
    setToItemSearchTerm('');
    setFromItemCategoryFilter('all');
    setToItemCategoryFilter('all');

    // Refetch data for current trainers if they exist
    try {
      if (fromTrainerId) {
        await fetchTrainerData(fromTrainerId, 'from', newType);
      }
      if (toTrainerId) {
        await fetchTrainerData(toTrainerId, 'to', newType);
      }
    } catch (err) {
      console.error('Error refetching trainer data after mode switch:', err);
    }
  };

  const handleMonsterSelection = (monsterId, type, selected) => {
    if (type === 'from') {
      setSelectedFromMonsters(prev =>
        selected
          ? [...prev, monsterId]
          : prev.filter(id => id !== monsterId)
      );
    } else {
      setSelectedToMonsters(prev =>
        selected
          ? [...prev, monsterId]
          : prev.filter(id => id !== monsterId)
      );
    }
  };

  const handleItemSelection = (category, itemName, quantity, type) => {
    if (type === 'from') {
      setSelectedFromItems(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [itemName]: quantity
        }
      }));
    } else {
      setSelectedToItems(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [itemName]: quantity
        }
      }));
    }
  };

  const handleExecuteTrade = async () => {
    if (!fromTrainerId || !toTrainerId) {
      setTradeError('Please select both trainers');
      return;
    }

    if (fromTrainerId === toTrainerId) {
      setTradeError('Cannot trade with the same trainer');
      return;
    }

    // Check if anything is selected for trade
    const hasFromItems = Object.keys(selectedFromItems).some(category =>
      Object.keys(selectedFromItems[category] || {}).length > 0
    );
    const hasToItems = Object.keys(selectedToItems).some(category =>
      Object.keys(selectedToItems[category] || {}).length > 0
    );
    const hasFromMonsters = selectedFromMonsters.length > 0;
    const hasToMonsters = selectedToMonsters.length > 0;

    if (!hasFromItems && !hasToItems && !hasFromMonsters && !hasToMonsters) {
      setTradeError('Please select at least one item or monster to trade');
      return;
    }

    try {
      setExecuting(true);
      setTradeError(null);

      const tradeData = {
        fromTrainerId: parseInt(fromTrainerId),
        toTrainerId: parseInt(toTrainerId),
        fromItems: tradeType === 'items' ? selectedFromItems : {},
        toItems: tradeType === 'items' ? selectedToItems : {},
        fromMonsters: tradeType === 'monsters' ? selectedFromMonsters : [],
        toMonsters: tradeType === 'monsters' ? selectedToMonsters : []
      };

      await automatedTradeService.executeAutomatedTrade(tradeData);

      setTradeSuccess(true);

      // Clear selections
      setSelectedFromMonsters([]);
      setSelectedToMonsters([]);
      setSelectedFromItems({});
      setSelectedToItems({});

      // Refresh trainer data
      if (fromTrainerId) {
        fetchTrainerData(fromTrainerId, 'from');
      }
      if (toTrainerId) {
        fetchTrainerData(toTrainerId, 'to');
      }

    } catch (err) {
      console.error('Error executing trade:', err);
      setTradeError(err.response?.data?.message || 'Failed to execute trade. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  const openTradeModal = () => {
    setShowTradeModal(true);
    setTradeSuccess(false);
    setTradeError(null);
  };

  const closeTradeModal = () => {
    setShowTradeModal(false);
    setTradeSuccess(false);
    setTradeError(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading automated trade center..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchInitialData}
      />
    );
  }

  return (
    <div className="location-container">
      <div className="location-header">
        <div className="location-icon-large">
          <i className="fas fa-exchange-alt"></i>
        </div>
        <div className="no-adventures">
          <h2>Automated Trade Center</h2>
          <p>Execute instant trades between trainers</p>
        </div>
      </div>

      <div className="location-content">
        <div className="town-location-description">
          <p>
            Welcome to the Automated Trade Center! Here you can execute instant trades between any trainers.
            Select trainers, choose what to trade, and the exchange happens immediately without waiting for approval.
          </p>
          <p>
            You can trade monsters or items between your own trainers or with other players' trainers.
            All trades are executed automatically and cannot be undone.
          </p>
        </div>

        <div className="trade-center-content">
          <div className="trade-form-section">
            <div className="section-header">
              <h3>Setup Trade</h3>
              <button
                className="button primary"
                onClick={openTradeModal}
                disabled={!fromTrainerId || !toTrainerId}
              >
                <i className="fas fa-bolt"></i> Execute Trade
              </button>
            </div>

            {/* Trade Type Selection */}
            <div className="trade-type-selection">
              <label>Trade Type:</label>
              <div className="trade-type-buttons">
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

            {/* Trainer Selection */}
            <div className="trainer-selection-row">
              <div className="shop-search">
                <label htmlFor="from-trainer">From Trainer:</label>
                <select
                  id="from-trainer"
                  value={fromTrainerId}
                  onChange={(e) => setFromTrainerId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select trainer</option>
                  {userTrainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} (Level {trainer.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="trade-arrow">
                <i className="fas fa-exchange-alt"></i>
              </div>

              <div className="shop-search">
                <label htmlFor="to-trainer">To Trainer:</label>
                <select
                  id="to-trainer"
                  value={toTrainerId}
                  onChange={(e) => setToTrainerId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select trainer</option>
                  {availableTrainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} (Level {trainer.level})
                      {trainer.player_user_id === currentUser.id ? ' - Your Trainer' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trade Content - Monsters or Items */}
            {fromTrainerId && toTrainerId && (
              <div className="trade-content">
                {tradeType === 'monsters' ? (
                  <div className="monster-trade-section">
                    <div className="trade-sides">
                      <div className="trade-side">
                        <h4>From: {availableTrainers.find(t => t.id == fromTrainerId)?.name}</h4>
                        <div className="form-input">
                          <input
                            type="text"
                            placeholder="Search monsters by name, species, or type..."
                            value={fromSearchTerm}
                            onChange={(e) => setFromSearchTerm(e.target.value)}
                            className="form-input"
                          />
                          <i className="fas fa-search search-icon"></i>
                        </div>
                        <div className="monster-list">
                          {filteredFromMonsters.length === 0 ? (
                            <p>No monsters available</p>
                          ) : (
                            filteredFromMonsters.map((monster) => (
                              <div key={monster.id} className="monster-item">
                                <label className="monster-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={selectedFromMonsters.includes(monster.id)}
                                    onChange={(e) => handleMonsterSelection(monster.id, 'from', e.target.checked)}
                                  />
                                  <div className="monster-info">
                                    <div className="tree-header">
                                      <span className="monster-name">{monster.name}</span>
                                      <span className="monster-level">Lvl {monster.level}</span>
                                    </div>
                                    <div className="monster-types">
                                      {monster.species1}
                                      {monster.species2 && ` • ${monster.species2}`}
                                      {monster.species3 && ` • ${monster.species3}`}
                                    </div>
                                    {(monster.type1 || monster.type2 || monster.type3 || monster.type4 || monster.type5) && (
                                      <div className="monster-types">
                                        {monster.type1 && <span className="type-badge type-1">{monster.type1}</span>}
                                        {monster.type2 && <span className="type-badge type-2">{monster.type2}</span>}
                                        {monster.type3 && <span className="type-badge type-3">{monster.type3}</span>}
                                        {monster.type4 && <span className="type-badge type-4">{monster.type4}</span>}
                                        {monster.type5 && <span className="type-badge type-5">{monster.type5}</span>}
                                      </div>
                                    )}
                                    {monster.attribute && (
                                      <div className="monster-types">
                                        <span className="attribute-badge">{monster.attribute}</span>
                                      </div>
                                    )}
                                  </div>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="trade-arrow-vertical">
                        <i className="fas fa-arrow-right"></i>
                      </div>

                      <div className="trade-side">
                        <h4>To: {availableTrainers.find(t => t.id == toTrainerId)?.name}</h4>
                        <div className="form-input">
                          <input
                            type="text"
                            placeholder="Search monsters by name, species, or type..."
                            value={toSearchTerm}
                            onChange={(e) => setToSearchTerm(e.target.value)}
                            className="form-input"
                          />
                          <i className="fas fa-search search-icon"></i>
                        </div>
                        <div className="monster-list">
                          {filteredToMonsters.length === 0 ? (
                            <p>No monsters available</p>
                          ) : (
                            filteredToMonsters.map((monster) => (
                              <div key={monster.id} className="monster-item">
                                <label className="monster-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={selectedToMonsters.includes(monster.id)}
                                    onChange={(e) => handleMonsterSelection(monster.id, 'to', e.target.checked)}
                                  />
                                  <div className="monster-info">
                                    <div className="tree-header">
                                      <span className="monster-name">{monster.name}</span>
                                      <span className="monster-level">Lvl {monster.level}</span>
                                    </div>
                                    <div className="monster-types">
                                      {monster.species1}
                                      {monster.species2 && ` • ${monster.species2}`}
                                      {monster.species3 && ` • ${monster.species3}`}
                                    </div>
                                    {(monster.type1 || monster.type2 || monster.type3 || monster.type4 || monster.type5) && (
                                      <div className="monster-types">
                                        {monster.type1 && <span className="type-badge type-1">{monster.type1}</span>}
                                        {monster.type2 && <span className="type-badge type-2">{monster.type2}</span>}
                                        {monster.type3 && <span className="type-badge type-3">{monster.type3}</span>}
                                        {monster.type4 && <span className="type-badge type-4">{monster.type4}</span>}
                                        {monster.type5 && <span className="type-badge type-5">{monster.type5}</span>}
                                      </div>
                                    )}
                                    {monster.attribute && (
                                      <div className="monster-types">
                                        <span className="attribute-badge">{monster.attribute}</span>
                                      </div>
                                    )}
                                  </div>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="item-trade-section">
                    <div className="trade-sides">
                      <div className="trade-side">
                        <h4>From: {availableTrainers.find(t => t.id == fromTrainerId)?.name}</h4>
                        <div className="step-header">
                          <div className="form-input">
                            <input
                              type="text"
                              placeholder="Search items by name..."
                              value={fromItemSearchTerm}
                              onChange={(e) => setFromItemSearchTerm(e.target.value)}
                              className="form-input"
                            />
                            <i className="fas fa-search search-icon"></i>
                          </div>
                          <div className="category-filter">
                            <select
                              value={fromItemCategoryFilter}
                              onChange={(e) => setFromItemCategoryFilter(e.target.value)}
                              className="form-input"
                            >
                              <option value="all">All Categories</option>
                              <option value="items">Items</option>
                              <option value="balls">Pokéballs</option>
                              <option value="berries">Berries</option>
                              <option value="pastries">Pastries</option>
                              <option value="evolution">Evolution Items</option>
                              <option value="eggs">Eggs</option>
                              <option value="antiques">Antiques</option>
                              <option value="helditems">Held Items</option>
                              <option value="seals">Seals</option>
                              <option value="keyitems">Key Items</option>
                            </select>
                          </div>
                        </div>
                        <div className="inventory-categories">
                          {Object.entries(filteredFromInventory).map(([category, items]) => (
                            Object.keys(items).length > 0 && (
                              <div key={category} className="inventory-category">
                                <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                                <div className="item-list">
                                  {Object.entries(items).map(([itemName, itemData]) => {
                                    // Handle both old format (quantity as value) and new format (object with quantity)
                                    const quantity = typeof itemData === 'object' ? itemData.quantity : itemData;
                                    const imageUrl = typeof itemData === 'object' && itemData.image_url 
                                      ? itemData.image_url 
                                      : getItemImageUrl({ name: itemName, category });
                                    
                                    return (
                                      <div key={itemName} className="item-row">
                                        <div className="item-image-container">
                                          <img
                                            src={imageUrl}
                                            alt={itemName}
                                            className="item-image"
                                            onError={(e) => handleItemImageError(e, category)}
                                          />
                                        </div>
                                        <div className="item-info">
                                          <span className="item-name">{itemName}</span>
                                          <span className="item-quantity">Available: {quantity}</span>
                                        </div>
                                        <input
                                          type="number"
                                          min="0"
                                          max={quantity}
                                          value={selectedFromItems[category]?.[itemName] || 0}
                                          onChange={(e) => handleItemSelection(category, itemName, parseInt(e.target.value) || 0, 'from')}
                                          className="form-input"
                                          placeholder="0"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>

                      <div className="trade-arrow-vertical">
                        <i className="fas fa-arrow-right"></i>
                      </div>

                      <div className="trade-side">
                        <h4>To: {availableTrainers.find(t => t.id == toTrainerId)?.name}</h4>
                        <div className="step-header">
                          <div className="form-input">
                            <input
                              type="text"
                              placeholder="Search items by name..."
                              value={toItemSearchTerm}
                              onChange={(e) => setToItemSearchTerm(e.target.value)}
                              className="form-input"
                            />
                            <i className="fas fa-search search-icon"></i>
                          </div>
                          <div className="category-filter">
                            <select
                              value={toItemCategoryFilter}
                              onChange={(e) => setToItemCategoryFilter(e.target.value)}
                              className="form-input"
                            >
                              <option value="all">All Categories</option>
                              <option value="items">Items</option>
                              <option value="balls">Pokéballs</option>
                              <option value="berries">Berries</option>
                              <option value="pastries">Pastries</option>
                              <option value="evolution">Evolution Items</option>
                              <option value="eggs">Eggs</option>
                              <option value="antiques">Antiques</option>
                              <option value="helditems">Held Items</option>
                              <option value="seals">Seals</option>
                              <option value="keyitems">Key Items</option>
                            </select>
                          </div>
                        </div>
                        <div className="inventory-categories">
                          {Object.entries(filteredToInventory).map(([category, items]) => (
                            Object.keys(items).length > 0 && (
                              <div key={category} className="inventory-category">
                                <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                                <div className="item-list">
                                  {Object.entries(items).map(([itemName, itemData]) => {
                                    // Handle both old format (quantity as value) and new format (object with quantity)
                                    const quantity = typeof itemData === 'object' ? itemData.quantity : itemData;
                                    const imageUrl = typeof itemData === 'object' && itemData.image_url 
                                      ? itemData.image_url 
                                      : getItemImageUrl({ name: itemName, category });
                                    
                                    return (
                                      <div key={itemName} className="item-row">
                                        <div className="item-image-container">
                                          <img
                                            src={imageUrl}
                                            alt={itemName}
                                            className="item-image"
                                            onError={(e) => handleItemImageError(e, category)}
                                          />
                                        </div>
                                        <div className="item-info">
                                          <span className="item-name">{itemName}</span>
                                          <span className="item-quantity">Available: {quantity}</span>
                                        </div>
                                        <input
                                          type="number"
                                          min="0"
                                          max={quantity}
                                          value={selectedToItems[category]?.[itemName] || 0}
                                          onChange={(e) => handleItemSelection(category, itemName, parseInt(e.target.value) || 0, 'to')}
                                          className="form-input"
                                          placeholder="0"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trade Execution Modal */}
      <Modal
        isOpen={showTradeModal}
        onClose={closeTradeModal}
        title={tradeSuccess ? "Trade Executed Successfully!" : "Execute Trade"}
      >
        {tradeSuccess ? (
          <div className="success-step">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              The trade has been executed successfully! All items and monsters have been transferred automatically.
            </p>
            <button
              className="button primary"
              onClick={closeTradeModal}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="trade-execution-form">
            <p>Are you sure you want to execute this trade? This action cannot be undone.</p>

            {tradeError && (
              <div className="trade-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{tradeError}</span>
              </div>
            )}

            <div className="trade-modal-actions">
              <button
                className="button secondary"
                onClick={closeTradeModal}
              >
                Cancel
              </button>
              <button
                className="button primary"
                onClick={handleExecuteTrade}
                disabled={executing}
              >
                {executing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Executing...
                  </>
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
};

export default AutomatedTradeCenter;
