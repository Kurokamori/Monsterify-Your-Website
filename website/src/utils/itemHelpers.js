/**
 * Shared utility functions for berry and pastry item handling
 * Used by AdoptionCenter, MassEditModal, Bakery, and Apothecary components
 */

// Berry descriptions
export const BERRY_DESCRIPTIONS = {
  'Bugger Berry': 'Removes the first species of a mon with more than 1 species',
  'Mala Berry': 'Removes species 2 (if present)',
  'Merco Berry': 'Removes species 3 (if present)',
  'Patama Berry': 'Randomizes species 1',
  'Bluk Berry': 'Randomizes species 2 (if present)',
  'Nuevo Berry': 'Randomizes species 3 (if present)',
  'Azzuk Berry': 'Adds a new random species to species 2 (if not present)',
  'Mangus Berry': 'Adds a new random species to species 3 (if not present)',
  'Siron Berry': 'Removes type 1 (if more than 1 type)',
  'Lilan Berry': 'Removes type 2 (if present)',
  'Kham Berry': 'Removes type 3 (if present)',
  'Maizi Berry': 'Removes type 4 (if present)',
  'Fani Berry': 'Removes type 5 (if present)',
  'Miraca Berry': 'Randomizes type 1',
  'Cocon Berry': 'Randomizes type 2 (if present)',
  'Durian Berry': 'Randomizes type 3 (if present)',
  'Monel Berry': 'Randomizes type 4 (if present)',
  'Perep Berry': 'Randomizes type 5 (if present)',
  'Addish Berry': 'Adds type 2 (if not present)',
  'Sky Carrot Berry': 'Adds type 3 (if not present)',
  'Kembre Berry': 'Adds type 4 (if not present)',
  'Espara Berry': 'Adds type 5 (if not present)',
  'Datei Berry': 'Randomizes attribute',
  'Divest Berry': 'Splits a monster with multiple species into two monsters'
};

// Pastry descriptions
export const PASTRY_DESCRIPTIONS = {
  'Patama Pastry': 'Sets species 1',
  'Bluk Pastry': 'Sets species 2 (if present)',
  'Nuevo Pastry': 'Sets species 3 (if present)',
  'Azzuk Pastry': 'Adds a new species to species 2 (if not present)',
  'Mangus Pastry': 'Adds a new species to species 3 (if not present)',
  'Miraca Pastry': 'Sets type 1',
  'Cocon Pastry': 'Sets type 2 (if present)',
  'Durian Pastry': 'Sets type 3 (if present)',
  'Monel Pastry': 'Sets type 4 (if present)',
  'Perep Pastry': 'Sets type 5 (if present)',
  'Addish Pastry': 'Adds type 2 (if not present)',
  'Sky Carrot Pastry': 'Adds type 3 (if not present)',
  'Kembre Pastry': 'Adds type 4 (if not present)',
  'Espara Pastry': 'Adds type 5 (if not present)',
  'Datei Pastry': 'Sets attribute'
};

// Berries that require species selection (roll 10, pick 1)
export const SPECIES_ROLLING_BERRIES = [
  'Patama Berry', 'Bluk Berry', 'Nuevo Berry',
  'Azzuk Berry', 'Mangus Berry'
];

// Available types for type pastries
export const AVAILABLE_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy'
];

// Available attributes for attribute pastries
export const AVAILABLE_ATTRIBUTES = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable'];

// Berry categories for filtering
export const BERRY_CATEGORIES = {
  species: [
    'Patama Berry', 'Bluk Berry', 'Nuevo Berry',
    'Azzuk Berry', 'Mangus Berry',
    'Bugger Berry', 'Mala Berry', 'Merco Berry'
  ],
  type: [
    'Siron Berry', 'Lilan Berry', 'Kham Berry', 'Maizi Berry', 'Fani Berry',
    'Miraca Berry', 'Cocon Berry', 'Durian Berry', 'Monel Berry', 'Perep Berry',
    'Addish Berry', 'Sky Carrot Berry', 'Kembre Berry', 'Espara Berry'
  ],
  randomize: [
    'Patama Berry', 'Bluk Berry', 'Nuevo Berry',
    'Miraca Berry', 'Cocon Berry', 'Durian Berry', 'Monel Berry', 'Perep Berry',
    'Datei Berry'
  ],
  add: [
    'Azzuk Berry', 'Mangus Berry',
    'Addish Berry', 'Sky Carrot Berry', 'Kembre Berry', 'Espara Berry'
  ],
  remove: [
    'Bugger Berry', 'Mala Berry', 'Merco Berry',
    'Siron Berry', 'Lilan Berry', 'Kham Berry', 'Maizi Berry', 'Fani Berry'
  ],
  misc: ['Datei Berry', 'Divest Berry']
};

// Pastry categories for filtering
export const PASTRY_CATEGORIES = {
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
  misc: ['Datei Pastry']
};

/**
 * Get berry description
 * @param {string} berryName - Name of the berry
 * @returns {string} - Description of the berry effect
 */
export const getBerryDescription = (berryName) => {
  return BERRY_DESCRIPTIONS[berryName] || 'Unknown effect';
};

/**
 * Get pastry description
 * @param {string} pastryName - Name of the pastry
 * @returns {string} - Description of the pastry effect
 */
export const getPastryDescription = (pastryName) => {
  return PASTRY_DESCRIPTIONS[pastryName] || 'Unknown effect';
};

/**
 * Check if a berry requires species selection
 * @param {string} berryName - Name of the berry
 * @returns {boolean} - True if species selection is required
 */
export const berryRequiresSpeciesSelection = (berryName) => {
  return SPECIES_ROLLING_BERRIES.includes(berryName);
};

/**
 * Get which species slot is affected by a berry
 * @param {string} berryName - Name of the berry
 * @returns {number} - Species slot number (1, 2, or 3)
 */
export const getSpeciesSlotAffected = (berryName) => {
  const slotMap = {
    'Patama Berry': 1,
    'Bluk Berry': 2,
    'Nuevo Berry': 3,
    'Azzuk Berry': 2,
    'Mangus Berry': 3
  };
  return slotMap[berryName] || 1;
};

/**
 * Check if a berry can be used on a specific monster
 * @param {string} berryName - Name of the berry
 * @param {Object} monster - Monster object
 * @returns {boolean} - True if the berry can be used
 */
export const canBerryBeUsedOnMonster = (berryName, monster) => {
  // Filter out Edenweiss and Forget-Me-Not
  if (berryName === 'Edenweiss' || berryName === 'Forget-Me-Not' || berryName === 'Edenwiess') {
    return false;
  }

  switch (berryName) {
    // Species removal berries - need multiple species
    case 'Bugger Berry':
      return !!monster.species2;
    case 'Mala Berry':
      return !!monster.species2;
    case 'Merco Berry':
      return !!monster.species3;

    // Species modification berries
    case 'Bluk Berry':
      return !!monster.species2;
    case 'Nuevo Berry':
      return !!monster.species3;

    // Species addition berries - proper progression
    case 'Azzuk Berry':
      return !monster.species2;
    case 'Mangus Berry':
      return !monster.species3 && !!monster.species2;

    // Type removal berries - need the specific type to exist
    case 'Siron Berry':
      return !!(monster.type2 || monster.type3 || monster.type4 || monster.type5);
    case 'Lilan Berry':
      return !!monster.type2;
    case 'Kham Berry':
      return !!monster.type3;
    case 'Maizi Berry':
      return !!monster.type4;
    case 'Fani Berry':
      return !!monster.type5;

    // Type modification berries - need the specific type to exist
    case 'Cocon Berry':
      return !!monster.type2;
    case 'Durian Berry':
      return !!monster.type3;
    case 'Monel Berry':
      return !!monster.type4;
    case 'Perep Berry':
      return !!monster.type5;

    // Type addition berries - proper progression
    case 'Addish Berry':
      return !monster.type2;
    case 'Sky Carrot Berry':
      return !monster.type3 && !!monster.type2;
    case 'Kembre Berry':
      return !monster.type4 && !!monster.type3;
    case 'Espara Berry':
      return !monster.type5 && !!monster.type4;

    // Other berries that can be used on any monster
    case 'Patama Berry':
    case 'Miraca Berry':
    case 'Datei Berry':
      return true;

    // Split berry - needs multiple species
    case 'Divest Berry':
      return !!monster.species2;

    default:
      return true;
  }
};

/**
 * Check if a pastry can be used on a specific monster
 * @param {string} pastryName - Name of the pastry
 * @param {Object} monster - Monster object
 * @returns {boolean} - True if the pastry can be used
 */
export const canPastryBeUsedOnMonster = (pastryName, monster) => {
  switch (pastryName) {
    // Species modification pastries
    case 'Bluk Pastry':
      return !!monster.species2;
    case 'Nuevo Pastry':
      return !!monster.species3;

    // Species addition pastries - proper progression
    case 'Azzuk Pastry':
      return !monster.species2;
    case 'Mangus Pastry':
      return !monster.species3 && !!monster.species2;

    // Type modification pastries - need the specific type to exist
    case 'Cocon Pastry':
      return !!monster.type2;
    case 'Durian Pastry':
      return !!monster.type3;
    case 'Monel Pastry':
      return !!monster.type4;
    case 'Perep Pastry':
      return !!monster.type5;

    // Type addition pastries - proper progression
    case 'Addish Pastry':
      return !monster.type2;
    case 'Sky Carrot Pastry':
      return !monster.type3 && !!monster.type2;
    case 'Kembre Pastry':
      return !monster.type4 && !!monster.type3;
    case 'Espara Pastry':
      return !monster.type5 && !!monster.type4;

    // Pastries that can be used on any monster
    case 'Patama Pastry':
    case 'Miraca Pastry':
    case 'Datei Pastry':
      return true;

    default:
      return true;
  }
};

/**
 * Get the value type required for a pastry
 * @param {string} pastryName - Name of the pastry
 * @returns {string} - 'species', 'type', 'attribute', or 'none'
 */
export const getPastryValueType = (pastryName) => {
  const speciesPastries = ['Patama Pastry', 'Bluk Pastry', 'Nuevo Pastry', 'Azzuk Pastry', 'Mangus Pastry'];
  const typePastries = [
    'Miraca Pastry', 'Cocon Pastry', 'Durian Pastry', 'Monel Pastry', 'Perep Pastry',
    'Addish Pastry', 'Sky Carrot Pastry', 'Kembre Pastry', 'Espara Pastry'
  ];
  const attributePastries = ['Datei Pastry'];

  if (speciesPastries.includes(pastryName)) return 'species';
  if (typePastries.includes(pastryName)) return 'type';
  if (attributePastries.includes(pastryName)) return 'attribute';
  return 'none';
};

/**
 * Get available options for a pastry based on its type
 * @param {string} pastryName - Name of the pastry
 * @returns {string[]} - Array of available options
 */
export const getPastryOptions = (pastryName) => {
  const valueType = getPastryValueType(pastryName);
  switch (valueType) {
    case 'type':
      return AVAILABLE_TYPES;
    case 'attribute':
      return AVAILABLE_ATTRIBUTES;
    default:
      return [];
  }
};

/**
 * Format monster species for display
 * @param {Object} monster - Monster object
 * @returns {string} - Formatted species string
 */
export const formatMonsterSpecies = (monster) => {
  const species = [monster.species1, monster.species2, monster.species3].filter(Boolean);
  return species.join(' + ');
};

/**
 * Get all types from a monster
 * @param {Object} monster - Monster object
 * @returns {string[]} - Array of types
 */
export const getMonsterTypes = (monster) => {
  return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean);
};

/**
 * Get all species from a monster
 * @param {Object} monster - Monster object
 * @returns {string[]} - Array of species
 */
export const getMonsterSpecies = (monster) => {
  return [monster.species1, monster.species2, monster.species3].filter(Boolean);
};
