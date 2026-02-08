import React, { useState, useEffect } from 'react';
import { getItemImageUrl, handleItemImageError } from '../../utils/imageUtils';
import itemsApi from '../../services/itemsApi';

/**
 * Enhanced Monster Details Component for Berry/Pastry Usage
 * Displays comprehensive monster information and item effects
 */
const EnhancedMonsterDetails = ({
  monster,
  itemName,
  itemType, // 'berry' or 'pastry'
  itemEffect,
  showItemInfo = true
}) => {
  const [itemData, setItemData] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);

  // Fetch item data from database when itemName changes
  useEffect(() => {
    const fetchItemData = async () => {
      if (!itemName || !showItemInfo) return;

      try {
        setItemLoading(true);
        // Search for the item by exact name match
        const response = await itemsApi.getItems({ search: itemName, limit: 50 });

        if (response.data && response.data.length > 0) {
          // Look for exact name match first
          const foundItem = response.data.find(item =>
            item.name.toLowerCase() === itemName.toLowerCase()
          );

          if (foundItem) {
            setItemData(foundItem);
          }
        }
      } catch (error) {
        console.error('Error fetching item data:', error);
        // Don't set error state, just use fallback
      } finally {
        setItemLoading(false);
      }
    };

    fetchItemData();
  }, [itemName, showItemInfo]);
  // Berry effects mapping
  const berryEffects = {
    'Bugger Berry': 'Removes the first species of a mon with more than 1 species',
    'Mala Berry': 'Remove Species 2 (if present)',
    'Merco Berry': 'Remove Species 3 (if present)',
    'Patama Berry': 'Randomize Species 1',
    'Bluk Berry': 'Randomize Species 2 (if present)',
    'Nuevo Berry': 'Randomize Species 3 (if present)',
    'Azzuk Berry': 'Add a new random species to Species 2 (cannot roll fusions) (if not present)',
    'Mangus Berry': 'Add a new random species to Species 2 (cannot roll fusions) (if not present)',
    'Miraca Berry': 'Randomize Type 1',
    'Lilan Berry': 'Remove Type 2 (if present)',
    'Cocon Berry': 'Randomize Type 2 (if present)',
    'Kham Berry': 'Remove Type 3 (if present)',
    'Durian Berry': 'Randomize Type 3 (if present)',
    'Maizi Berry': 'Remove Type 4 (if present)',
    'Monel Berry': 'Randomize Type 4 (if present)',
    'Fani Berry': 'Remove Type 5 (if present)',
    'Perep Berry': 'Randomize Type 5 (if present)',
    'Addish Berry': 'Add Type 2 (if not present)',
    'Sky Carrot Berry': 'Add Type 3 (if not present)',
    'Kembre Berry': 'Add Type 4 (if not present)',
    'Espara Berry': 'Add Type 5 (if not present)',
    'Datei Berry': 'Randomize Attribute',
    'Forget-Me-Not': 'Allows you to reroll anything, from berry rolls to egg rolls to prompt rolls...',
    'Edenweiss': 'Allows you to pick two Pokémon from a single roll.'
  };

  // Pastry effects mapping
  const pastryEffects = {
    'Patama Pastry': 'Set Species 1 to a predetermined species',
    'Bluk Pastry': 'Set Species 2 to a predetermined species (if present)',
    'Nuevo Pastry': 'Set Species 3 to a predetermined species (if present)',
    'Azzuk Pastry': 'Add a specific species to Species 2 (cannot roll fusions) (if not present)',
    'Mangus Pastry': 'Add a specific species to Species 2 (cannot roll fusions) (if not present)',
    'Miraca Pastry': 'Set Type 1 to a predetermined type',
    'Cocon Pastry': 'Set Type 2 to a predetermined type (if present)',
    'Durian Pastry': 'Set Type 3 to a predetermined type (if present)',
    'Monel Pastry': 'Set Type 4 to a predetermined type (if present)',
    'Perep Pastry': 'Set Type 5 to a predetermined type (if present)',
    'Addish Pastry': 'Add a predetermined Type 2 (if not present)',
    'Sky Carrot Pastry': 'Add a predetermined Type 3 (if not present)',
    'Kembre Pastry': 'Add a predetermined Type 4 (if not present)',
    'Espara Pastry': 'Add a predetermined Type 5 (if not present)',
    'Datei Pastry': 'Set Attribute to a predetermined value'
  };

  // Get the effect description
  const getItemEffect = () => {
    if (itemEffect) return itemEffect;
    if (itemType === 'berry') return berryEffects[itemName];
    if (itemType === 'pastry') return pastryEffects[itemName];
    return 'Unknown effect';
  };

  // Format species display
  const formatSpecies = () => {
    if (!monster) return 'Unknown';
    const species = [];
    if (monster.species1 && monster.species1.trim()) species.push(monster.species1.trim());
    if (monster.species2 && monster.species2.trim()) species.push(monster.species2.trim());
    if (monster.species3 && monster.species3.trim()) species.push(monster.species3.trim());
    return species.length > 0 ? species.join(' + ') : 'Unknown';
  };

  // Format types display
  const formatTypes = () => {
    if (!monster) return 'Unknown';
    const types = [];
    if (monster.type1 && monster.type1.trim()) types.push(monster.type1.trim());
    if (monster.type2 && monster.type2.trim()) types.push(monster.type2.trim());
    if (monster.type3 && monster.type3.trim()) types.push(monster.type3.trim());
    if (monster.type4 && monster.type4.trim()) types.push(monster.type4.trim());
    if (monster.type5 && monster.type5.trim()) types.push(monster.type5.trim());
    return types.length > 0 ? types.join(' / ') : 'Unknown';
  };

  // Early return if no monster data
  if (!monster) {
    console.log('No monster data provided to EnhancedMonsterDetails');
    return (
      <div className="monster-details">
        <div className="item-info-section">
          <h3 className="section-title">Monster Information</h3>
          <p>No monster data available.</p>
        </div>
      </div>
    );
  }



  return (
    <div className="monster-details">
      {/* Monster Information Section */}
      <div className="item-info-section">
        <h3 className="section-title">Monster Information</h3>
        <div className="monster-info-grid">
          <div className="info-item">
            <span className="info-label">Name:</span>
            <span className="info-value monster-name">{monster.name}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Species:</span>
            <span className="info-value">{formatSpecies()}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Types:</span>
            <span className="info-value type-tags">
              {formatTypes()}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">Attribute:</span>
            <span className="info-value attribute-display">
              {monster.attribute || 'None'}
            </span>
          </div>

          
          {monster.level && (
            <div className="info-item">
              <span className="info-label">Level:</span>
              <span className="info-value">{monster.level}</span>
            </div>
          )}
        </div>
      </div>

      {/* Item Information Section */}
      {showItemInfo && itemName && (
        <div className="item-info-section">
          <h3 className="section-title">
            {itemType === 'berry' ? 'Berry' : 'Pastry'} Information
          </h3>
          <div className="item-info-content">
            <div className="item-header">
              <div className="item-icon">
                {itemLoading ? (
                  <div className="item-loading">Loading...</div>
                ) : (
                  <img
                    src={itemData ? getItemImageUrl(itemData) : getItemImageUrl({ name: itemName, category: itemType === 'berry' ? 'berries' : 'pastries' })}
                    alt={itemName}
                    onError={(e) => handleItemImageError(e, itemType === 'berry' ? 'berries' : 'pastries')}
                  />
                )}
              </div>
              <span className="item-name">{itemName}</span>
            </div>
            <div className="item-effect">
              <span className="effect-label">Effect:</span>
              <span className="effect-description">{getItemEffect()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMonsterDetails;
