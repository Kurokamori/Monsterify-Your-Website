import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import TrainerSelector from '../../../components/common/TrainerSelector';
import ItemCard from '../../../components/items/ItemCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import PurchaseModal from '../../../components/shop/PurchaseModal';
import ItemDetailModal from '../../../components/items/ItemDetailModal';
import '../../../styles/ShopStyles.css';


const ShopPage = () => {
  const { shopId } = useParams();
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerCurrency, setTrainerCurrency] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isItemDetailModalOpen, setIsItemDetailModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [berryFilters, setBerryFilters] = useState({
    type: false,
    species: false,
    randomize: false,
    remove: false,
    misc: false
  });
  const [pastryFilters, setPastryFilters] = useState({
    type: false,
    species: false,
    set: false,
    add: false,
    misc: false
  });
  const [sortByPrice, setSortByPrice] = useState('off');

  // Berry categorization
  const berryCategories = {
    type: [
      'Siron Berry', 'Lilan Berry', 'Kham Berry', 'Maizi Berry', 'Fani Berry',
      'Miraca Berry', 'Cocon Berry', 'Durian Berry', 'Monel Berry', 'Perep Berry',
      'Addish Berry', 'Sky Carrot Berry', 'Kembre Berry', 'Espara Berry'
    ],
    species: [
      'Bugger Berry', 'Mala Berry', 'Merco Berry', 'Patama Berry', 'Bluk Berry',
      'Nuevo Berry', 'Azzuk Berry', 'Mangus Berry'
    ],
    randomize: [
      'Patama Berry', 'Bluk Berry', 'Nuevo Berry', 'Miraca Berry', 'Cocon Berry',
      'Durian Berry', 'Monel Berry', 'Perep Berry', 'Datei Berry'
    ],
    remove: [
      'Bugger Berry', 'Mala Berry', 'Merco Berry', 'Siron Berry', 'Lilan Berry',
      'Kham Berry', 'Maizi Berry', 'Fani Berry'
    ],
    misc: [
      'Edenweiss', 'Forget-Me-Not', 'Datei Berry', 'Divest Berry'
    ]
  };

  // Pastry categorization
  const pastryCategories = {
    type: [
      'Miraca Pastry', 'Cocon Pastry', 'Durian Pastry', 'Monel Pastry', 'Perep Pastry',
      'Addish Pastry', 'Sky Carrot Pastry', 'Kembre Pastry', 'Espara Pastry'
    ],
    species: [
      'Patama Pastry', 'Bluk Pastry', 'Nuevo Pastry', 'Azzuk Pastry', 'Mangus Pastry'
    ],
    set: [
      'Patama Pastry', 'Bluk Pastry', 'Nuevo Pastry',
      'Miraca Pastry', 'Cocon Pastry', 'Durian Pastry', 'Monel Pastry', 'Perep Pastry',
      'Datei Pastry'
    ],
    add: [
      'Azzuk Pastry', 'Mangus Pastry',
      'Addish Pastry', 'Sky Carrot Pastry', 'Kembre Pastry', 'Espara Pastry'
    ],
    misc: [
      'Datei Pastry'
    ]
  };

  // Helper function to check if berry matches current filters
  const matchesBerryFilters = (itemName) => {
    const activeFilters = Object.keys(berryFilters).filter(key => berryFilters[key]);
    
    if (activeFilters.length === 0) return true;
    
    return activeFilters.every(filter => 
      berryCategories[filter] && berryCategories[filter].includes(itemName)
    );
  };

  // Handle berry filter toggle
  const toggleBerryFilter = (filterName) => {
    setBerryFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Helper function to check if pastry matches current filters
  const matchesPastryFilters = (itemName) => {
    const activeFilters = Object.keys(pastryFilters).filter(key => pastryFilters[key]);

    if (activeFilters.length === 0) return true;

    return activeFilters.every(filter =>
      pastryCategories[filter] && pastryCategories[filter].includes(itemName)
    );
  };

  // Handle pastry filter toggle
  const togglePastryFilter = (filterName) => {
    setPastryFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Check if this is the apothecary shop (for showing berry filters)
  const isApothecaryShop = shopId === 'apothecary';
  // Check if this is the bakery shop (for showing pastry filters)
  const isBakeryShop = shopId === 'bakery';

  // Clear search term when shop changes
  useEffect(() => {
    setSearchTerm('');
  }, [shopId]);

  // Fetch shop data
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch shop details
        const shopResponse = await api.get(`/shops/${shopId}`);
        setShop(shopResponse.data.data);

        // Fetch shop items
        const itemsResponse = await api.get(`/shops/${shopId}/items`);
        setItems(itemsResponse.data.data);
        setFilteredItems(itemsResponse.data.data);

      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Failed to load shop data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchShopData();
    } else {
      navigate('/login', { state: { from: `/town/shop/${shopId}` } });
    }
  }, [shopId, isAuthenticated, navigate]);

  // Filter items based on search term and berry/pastry filters
  useEffect(() => {
    let filtered = items;

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply berry filters if this is the apothecary shop
    if (isApothecaryShop) {
      filtered = filtered.filter(item => matchesBerryFilters(item.name));
    }

    // Apply pastry filters if this is the bakery shop
    if (isBakeryShop) {
      filtered = filtered.filter(item => matchesPastryFilters(item.name));
    }

    // Apply price sorting
    if (sortByPrice === 'asc') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortByPrice === 'desc') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, berryFilters, pastryFilters, isApothecaryShop, isBakeryShop, sortByPrice]);

  // Fetch trainer currency when trainer is selected
  useEffect(() => {
    const fetchTrainerCurrency = async () => {
      if (selectedTrainer) {
        try {
          const response = await api.get(`/trainers/${selectedTrainer}`);
          // Handle different response formats
          if (response.data && response.data.data && response.data.data.currency_amount !== undefined) {
            setTrainerCurrency(response.data.data.currency_amount);
          } else if (response.data && response.data.trainer && response.data.trainer.currency_amount !== undefined) {
            setTrainerCurrency(response.data.trainer.currency_amount);
          } else if (response.data && response.data.currency_amount !== undefined) {
            setTrainerCurrency(response.data.currency_amount);
          } else {
            console.log('Unexpected API response format:', response.data);
            setTrainerCurrency(0);
          }
        } catch (err) {
          console.error('Error fetching trainer currency:', err);
        }
      }
    };

    fetchTrainerCurrency();
  }, [selectedTrainer]);

  // Handle trainer selection
  const handleTrainerChange = (trainerId) => {
    setSelectedTrainer(trainerId);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort by price toggle
  const handleSortByPriceToggle = () => {
    setSortByPrice(prev => {
      if (prev === 'off') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'off';
    });
  };

  // Handle item detail click
  const handleItemDetailClick = (item) => {
    setSelectedItemForDetail(item);
    setIsItemDetailModalOpen(true);
  };

  // Handle item purchase click
  const handlePurchaseClick = (item) => {
    if (!selectedTrainer) {
      setPurchaseError('Please select a trainer first');
      return;
    }

    setSelectedItem(item);
    setPurchaseQuantity(1);
    setPurchaseError(null);
    setPurchaseSuccess(false);
    setIsPurchaseModalOpen(true);
  };

  // Handle purchase confirmation
  const handlePurchaseConfirm = async () => {
    if (!selectedTrainer || !selectedItem) {
      setPurchaseError('Invalid selection');
      return;
    }

    try {
      const response = await api.post(`/shops/${shopId}/purchase`, {
        trainer_id: selectedTrainer,
        item_id: selectedItem.item_id,
        quantity: purchaseQuantity
      });

      // Update trainer currency
      setTrainerCurrency(prev => prev - (selectedItem.price * purchaseQuantity));

      // Update item quantity in the list
      const updatedItems = items.map(item => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            current_quantity: response.data.data.remainingQuantity
          };
        }
        return item;
      });

      setItems(updatedItems);
      setPurchaseSuccess(true);
      setPurchaseError(null);

      // Close modal after a delay
      setTimeout(() => {
        setIsPurchaseModalOpen(false);
        setPurchaseSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error purchasing item:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to purchase item. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!shop) {
    return <ErrorMessage message="Shop not found" />;
  }

  return (
    <div className="shop-page">
      <div className="shop-header" style={{ backgroundImage: `url(${shop.banner_image})` }}>
        <div className="shop-header-content">
          <h1 className="shop-title">{shop.name}</h1>
          <p className="shop-description">{shop.description}</p>
        </div>
      </div>

      <div className="shop-flavor-text">
        <p>{shop.flavor_text || `Welcome to ${shop.name}! Browse our selection of items.`}</p>
      </div>

      <div className="shop-controls">
        <div className="trainer-selection">
          <TrainerSelector
            userId={currentUser?.discord_id}
            selectedTrainerId={selectedTrainer}
            onChange={handleTrainerChange}
          />
          {selectedTrainer && (
            <div className="trainer-currency">
              <span>Currency:</span>
              <span className="currency-amount">{trainerCurrency} <i className="fas fa-coins"></i></span>
            </div>
          )}
        </div>
      </div>
      <div className="shop-controls">
        <div className="shop-search">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button
            className={`sort-price-btn ${sortByPrice}`}
            onClick={handleSortByPriceToggle}
            title={
              sortByPrice === 'off' ? 'Sort by price' :
              sortByPrice === 'asc' ? 'Price: Low to High' :
              'Price: High to Low'
            }
          >
            Sort by Price
            {sortByPrice === 'asc' && <span className="sort-indicator">↑</span>}
            {sortByPrice === 'desc' && <span className="sort-indicator">↓</span>}
          </button>
        </div>
      </div>

      {/* Berry filters - only show for apothecary shop */}
      {isApothecaryShop && (
        <div className="berry-filters">
          <h4>Filter Berries by Type (stackable)</h4>
          <div className="filter-buttons">
            <button
              className={`button button-filter ${berryFilters.type ? 'active' : ''}`}
              onClick={() => toggleBerryFilter('type')}
            >
              Type
            </button>
            <button
              className={`button button-filter ${berryFilters.species ? 'active' : ''}`}
              onClick={() => toggleBerryFilter('species')}
            >
              Species
            </button>
            <button
              className={`button button-filter ${berryFilters.randomize ? 'active' : ''}`}
              onClick={() => toggleBerryFilter('randomize')}
            >
              Randomize
            </button>
            <button
              className={`button button-filter ${berryFilters.remove ? 'active' : ''}`}
              onClick={() => toggleBerryFilter('remove')}
            >
              Remove
            </button>
            <button
              className={`button button-filter ${berryFilters.misc ? 'active' : ''}`}
              onClick={() => toggleBerryFilter('misc')}
            >
              Misc
            </button>
            <button
              className="button button-filter reset"
              onClick={() => setBerryFilters({
                type: false,
                species: false,
                randomize: false,
                remove: false,
                misc: false
              })}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Pastry filters - only show for bakery shop */}
      {isBakeryShop && (
        <div className="pastry-filters">
          <h4>Filter Pastries by Type (stackable)</h4>
          <div className="filter-buttons">
            <button
              className={`button button-filter ${pastryFilters.type ? 'active' : ''}`}
              onClick={() => togglePastryFilter('type')}
            >
              Type
            </button>
            <button
              className={`button button-filter ${pastryFilters.species ? 'active' : ''}`}
              onClick={() => togglePastryFilter('species')}
            >
              Species
            </button>
            <button
              className={`button button-filter ${pastryFilters.set ? 'active' : ''}`}
              onClick={() => togglePastryFilter('set')}
            >
              Set
            </button>
            <button
              className={`button button-filter ${pastryFilters.add ? 'active' : ''}`}
              onClick={() => togglePastryFilter('add')}
            >
              Add
            </button>
            <button
              className={`button button-filter ${pastryFilters.misc ? 'active' : ''}`}
              onClick={() => togglePastryFilter('misc')}
            >
              Misc
            </button>
            <button
              className="button button-filter reset"
              onClick={() => setPastryFilters({
                type: false,
                species: false,
                set: false,
                add: false,
                misc: false
              })}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="no-items-message">
          <p>No items available in this shop at the moment.</p>
        </div>
      ) : (
        <div className="shop-items-grid">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={{
                ...item,
                image_url: item.image_url || '/images/items/default.png'
              }}
              onItemClick={handleItemDetailClick}
              onPurchaseClick={() => handlePurchaseClick(item)}
              disabled={!selectedTrainer || item.current_quantity <= 0}
              showPrice
              showPurchase
            />
          ))}
        </div>
      )}

      {isPurchaseModalOpen && selectedItem && (
        <PurchaseModal
          item={selectedItem}
          quantity={purchaseQuantity}
          setQuantity={setPurchaseQuantity}
          maxQuantity={Math.min(
            selectedItem.current_quantity,
            Math.floor(trainerCurrency / selectedItem.price)
          )}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => setIsPurchaseModalOpen(false)}
          error={purchaseError}
          success={purchaseSuccess}
        />
      )}

      <ItemDetailModal
        isOpen={isItemDetailModalOpen}
        onClose={() => setIsItemDetailModalOpen(false)}
        item={selectedItemForDetail}
      />
    </div>
  );
};

export default ShopPage;
