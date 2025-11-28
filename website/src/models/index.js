/**
 * Data models for the application
 * These are TypeScript interfaces that define the shape of our data
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} display_name - Display name
 * @property {string} email - Email address
 * @property {string} discord_id - Discord ID
 * @property {string} role - User role (user, admin, moderator)
 * @property {string} created_at - Creation date
 * @property {string} last_login - Last login date
 * @property {Object} settings - User settings
 */

/**
 * @typedef {Object} Trainer
 * @property {number} id - Trainer ID
 * @property {string} name - Trainer name
 * @property {string} avatar_url - Avatar URL
 * @property {number} level - Trainer level
 * @property {number} experience - Current experience
 * @property {number} next_level_exp - Experience needed for next level
 * @property {number} monsters_count - Number of monsters
 * @property {number} badges_count - Number of badges
 * @property {number} coins - Number of coins
 * @property {string} join_date - Join date
 * @property {string} last_active - Last active date
 * @property {Object} stats - Trainer statistics
 * @property {string} bio - Trainer biography
 * @property {string} favorite_type - Favorite monster type
 * @property {number} user_id - User ID
 */

/**
 * @typedef {Object} Monster
 * @property {number} id - Monster ID
 * @property {string} name - Monster name
 * @property {string} species - Monster species
 * @property {string} source - Monster source (Pokemon, Digimon, etc.)
 * @property {string} image_path - Image URL
 * @property {number} level - Monster level
 * @property {string[]} types - Monster types
 * @property {string|null} attribute - Monster attribute (for Digimon-like monsters)
 * @property {string} description - Monster description
 * @property {string} height - Monster height
 * @property {string} weight - Monster weight
 * @property {string} category - Monster category
 * @property {string[]} abilities - Monster abilities
 * @property {Object} stats - Monster stats
 * @property {string[]} evolutions - Evolution chain
 * @property {string} habitat - Monster habitat
 * @property {string} rarity - Monster rarity
 * @property {string} artist - Artist name
 * @property {string} artist_caption - Artist caption
 * @property {number} trainer_id - Trainer ID
 * @property {number} box_number - Box number
 * @property {number} box_position - Position in box
 * @property {string} gender - Monster gender
 * @property {number} friendship - Friendship level
 * @property {string} nature - Monster nature
 * @property {Object[]} moves - Monster moves
 */

/**
 * @typedef {Object} Submission
 * @property {number} id - Submission ID
 * @property {string} type - Submission type (monster, location, etc.)
 * @property {string} name - Submission name
 * @property {string} description - Submission description
 * @property {string} image_url - Image URL
 * @property {string} status - Submission status (pending, approved, rejected)
 * @property {string} submitted_date - Submission date
 * @property {string|null} feedback - Feedback from moderators
 * @property {number} user_id - User ID
 * @property {number} trainer_id - Trainer ID
 * @property {Object} rewards - Submission rewards
 */

/**
 * @typedef {Object} Adventure
 * @property {number} id - Adventure ID
 * @property {string} title - Adventure title
 * @property {string} description - Adventure description
 * @property {string} status - Adventure status (active, completed, cancelled)
 * @property {number} creator_id - Creator ID
 * @property {number} max_encounters - Maximum number of encounters
 * @property {number} current_encounter_count - Current number of encounters
 * @property {boolean} is_custom - Whether the adventure is custom
 * @property {string} created_at - Creation date
 * @property {string} updated_at - Last update date
 * @property {Object[]} participants - Adventure participants
 * @property {Object[]} encounters - Adventure encounters
 */

/**
 * @typedef {Object} Boss
 * @property {number} id - Boss ID
 * @property {string} name - Boss name
 * @property {string} image_path - Image URL
 * @property {number} level - Boss level
 * @property {string} difficulty - Boss difficulty
 * @property {string} element - Boss element
 * @property {string} description - Boss description
 * @property {string[]} weaknesses - Boss weaknesses
 * @property {string[]} resistances - Boss resistances
 * @property {number} max_health - Maximum health
 * @property {number} current_hp - Current health
 * @property {Object[]} rewards - Boss rewards
 * @property {string} start_date - Start date
 * @property {string} end_date - End date
 */

/**
 * @typedef {Object} RollParameters
 * @property {string[]} enabledTypes - Enabled monster types
 * @property {string[]} [forcedTypes] - Forced monster types
 * @property {string[]} [excludedTypes] - Excluded monster types
 * @property {number} [minTypes] - Minimum number of types
 * @property {number} [maxTypes] - Maximum number of types
 * @property {string[]} [forcedSpecies] - Forced species
 * @property {string[]} [excludedSpecies] - Excluded species
 * @property {string[]} [speciesPool] - Species pool
 * @property {boolean} [fusionForced] - Whether fusion is forced
 * @property {string} [forcedAttribute] - Forced attribute
 * @property {string[]} [attributePool] - Attribute pool
 * @property {number} [rarityBoost] - Rarity boost
 * @property {boolean} [legendaryEnabled] - Whether legendary monsters are enabled
 * @property {boolean} [mythicalEnabled] - Whether mythical monsters are enabled
 * @property {number} userId - User ID
 * @property {string} context - Roll context (starter, adoption, event, item, breeding)
 */

export {};
