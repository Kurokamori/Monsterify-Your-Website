/**
 * Enum for reward types
 * @readonly
 * @enum {string}
 */
const RewardType = {
    COIN: 'coin',
    ITEM: 'item',
    LEVEL: 'level',
    MONSTER: 'monster'
};

/**
 * Enum for reward rarities
 * @readonly
 * @enum {string}
 */
const Rarity = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

/**
 * Interface for coin reward data
 * @typedef {Object} CoinRewardData
 * @property {number} amount - Amount of coins
 */

/**
 * Interface for item reward data
 * @typedef {Object} ItemRewardData
 * @property {string} name - Item name
 * @property {string} description - Item description
 * @property {number} quantity - Quantity of items
 * @property {string} category - Item category (e.g., 'berries', 'balls', etc.)
 */

/**
 * Interface for level reward data
 * @typedef {Object} LevelRewardData
 * @property {number} levels - Number of levels to award
 * @property {boolean} isMonster - True if for monster, false if for trainer
 * @property {string} [monsterName] - Name of monster (if monster level up)
 * @property {boolean} [trainerLevelUp] - True if trainer level up
 * @property {string} [title] - Title for the reward
 */

/**
 * Interface for monster reward data
 * @typedef {Object} MonsterRewardData
 * @property {string} species - Primary species
 * @property {string} [species2] - Secondary species (for fusions)
 * @property {string} [species3] - Tertiary species (for triple fusions)
 * @property {number} level - Starting level
 * @property {string} type - Primary type
 * @property {string} [type2] - Secondary type
 * @property {string} [type3] - Third type
 * @property {string} [type4] - Fourth type
 * @property {string} [type5] - Fifth type
 * @property {string} [attribute] - Monster attribute
 */

/**
 * Union type for all reward data types
 * @typedef {CoinRewardData|ItemRewardData|LevelRewardData|MonsterRewardData} RewardData
 */

/**
 * Interface for reward assignment
 * @typedef {Object} RewardAssignment
 * @property {number} id - Trainer ID
 * @property {string} name - Trainer name
 */

/**
 * Interface for complete reward object
 * @typedef {Object} Reward
 * @property {string} id - Unique identifier for the reward
 * @property {RewardType} type - Type of reward
 * @property {Rarity} rarity - Rarity of the reward
 * @property {RewardData} data - Reward-specific data
 * @property {boolean} [claimed] - Whether reward has been claimed
 * @property {RewardAssignment} [assignedTo] - Assignment tracking
 */

module.exports = {
    RewardType,
    Rarity,
    // Export validation helper functions
    isValidRewardType: (type) => Object.values(RewardType).includes(type),
    isValidRarity: (rarity) => Object.values(Rarity).includes(rarity),
    validateReward: (reward) => {
        if (!reward || typeof reward !== 'object') return false;
        if (!reward.id || typeof reward.id !== 'string') return false;
        if (!isValidRewardType(reward.type)) return false;
        if (!isValidRarity(reward.rarity)) return false;
        if (!reward.data || typeof reward.data !== 'object') return false;
        
        // Type-specific validation
        switch (reward.type) {
            case RewardType.COIN:
                return typeof reward.data.amount === 'number' && reward.data.amount > 0;
            case RewardType.ITEM:
                return typeof reward.data.name === 'string' && 
                       typeof reward.data.quantity === 'number' && 
                       typeof reward.data.category === 'string';
            case RewardType.LEVEL:
                return typeof reward.data.levels === 'number' && 
                       typeof reward.data.isMonster === 'boolean' &&
                       reward.data.levels > 0;
            case RewardType.MONSTER:
                return typeof reward.data.species === 'string' && 
                       typeof reward.data.level === 'number' && 
                       typeof reward.data.type === 'string';
            default:
                return false;
        }
    }
};