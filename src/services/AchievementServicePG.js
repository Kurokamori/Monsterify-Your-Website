const Achievement = require('../models/AchievementPG');
const TrainerAchievement = require('../models/TrainerAchievementPG');
const Trainer = require('../models/Trainer');
const pool = require('../db');

class AchievementServicePG {
    /**
     * Check and update all achievements for a trainer
     * @param {number} trainerId - The trainer's ID
     */
    async checkAllAchievements(trainerId) {
        try {
            const trainer = await Trainer.getById(trainerId);
            if (!trainer) {
                throw new Error('Trainer not found');
            }

            const achievements = await Achievement.getAll(false); // false = exclude hidden
            const results = [];

            for (const achievement of achievements) {
                const result = await this.checkAchievement(trainerId, achievement);
                if (result.updated) {
                    results.push(result);
                }
            }

            return results;
        } catch (error) {
            console.error('Error checking achievements:', error);
            throw error;
        }
    }

    /**
     * Check if a specific achievement is completed
     * @param {number} trainerId - The trainer's ID
     * @param {Object} achievement - The achievement object
     */
    async checkAchievement(trainerId, achievement) {
        try {
            let trainerAchievement = await TrainerAchievement.getByTrainerAndAchievement(
                trainerId,
                achievement.id
            );

            // Skip if already completed
            if (trainerAchievement && trainerAchievement.is_complete) {
                return {
                    achievement,
                    trainerAchievement,
                    updated: false
                };
            }

            // Check progress based on achievement type
            const progress = await this.calculateProgress(trainerId, achievement);
            const wasComplete = trainerAchievement ? trainerAchievement.is_complete : false;
            const oldProgress = trainerAchievement ? trainerAchievement.progress : 0;

            // Update progress in database
            trainerAchievement = await TrainerAchievement.updateProgress(
                trainerId,
                achievement.id,
                progress,
                achievement.requirement_value
            );

            return {
                achievement,
                trainerAchievement,
                updated: trainerAchievement.is_complete !== wasComplete || trainerAchievement.progress !== oldProgress
            };
        } catch (error) {
            console.error(`Error checking achievement ${achievement.name}:`, error);
            throw error;
        }
    }

    /**
     * Calculate progress for an achievement
     * @param {number} trainerId - The trainer's ID
     * @param {Object} achievement - The achievement object
     */
    async calculateProgress(trainerId, achievement) {
        const trainer = await Trainer.getById(trainerId);
        if (!trainer) {
            throw new Error('Trainer not found');
        }

        switch (achievement.requirement_type) {
            case 'level':
                return trainer.level || 0;

            case 'type_count':
                return await this.countMonstersByType(trainerId, achievement.requirement_subtype);

            case 'monster_count':
                return await this.countAllMonsters(trainerId);

            case 'attribute_count':
                return await this.countMonstersByAttribute(trainerId, achievement.requirement_subtype);

            case 'currency_earned':
                return trainer.total_earned_currency || 0;

            case 'currency_spent':
                const earned = trainer.total_earned_currency || 0;
                const current = trainer.currency_amount || 0;
                return earned - current;

            default:
                return 0;
        }
    }

    /**
     * Count monsters by type for a trainer
     * @param {number} trainerId - The trainer's ID
     * @param {string} type - The type to count
     */
    async countMonstersByType(trainerId, type) {
        if (!type) return 0;

        try {
            const query = `
                SELECT COUNT(*) FROM mons
                WHERE trainer_id = $1 AND
                (type1 = $2 OR type2 = $2 OR type3 = $2 OR type4 = $2 OR type5 = $2)
            `;

            const result = await pool.query(query, [trainerId, type]);
            return parseInt(result.rows[0].count) || 0;
        } catch (error) {
            console.error(`Error counting monsters by type ${type} for trainer ${trainerId}:`, error);
            return 0;
        }
    }

    /**
     * Count monsters by attribute for a trainer
     * @param {number} trainerId - The trainer's ID
     * @param {string} attribute - The attribute to count
     */
    async countMonstersByAttribute(trainerId, attribute) {
        if (!attribute) return 0;

        try {
            const query = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1 AND attribute = $2';
            const result = await pool.query(query, [trainerId, attribute]);
            return parseInt(result.rows[0].count) || 0;
        } catch (error) {
            console.error(`Error counting monsters by attribute ${attribute} for trainer ${trainerId}:`, error);
            return 0;
        }
    }

    /**
     * Count all monsters for a trainer
     * @param {number} trainerId - The trainer's ID
     */
    async countAllMonsters(trainerId) {
        try {
            const query = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1';
            const result = await pool.query(query, [trainerId]);
            return parseInt(result.rows[0].count) || 0;
        } catch (error) {
            console.error(`Error counting all monsters for trainer ${trainerId}:`, error);
            return 0;
        }
    }

    /**
     * Claim rewards for a completed achievement
     * @param {number} trainerId - The trainer's ID
     * @param {number} achievementId - The achievement ID
     */
    async claimReward(trainerId, achievementId) {
        try {
            const trainerAchievement = await TrainerAchievement.getByTrainerAndAchievement(trainerId, achievementId);

            if (!trainerAchievement) {
                throw new Error('Achievement not found for this trainer');
            }

            if (!trainerAchievement.is_complete) {
                throw new Error('Achievement is not complete');
            }

            if (trainerAchievement.is_claimed) {
                throw new Error('Achievement rewards already claimed');
            }

            const achievement = await Achievement.getById(achievementId);
            if (!achievement) {
                throw new Error('Achievement not found');
            }

            const trainer = await Trainer.getById(trainerId);
            if (!trainer) {
                throw new Error('Trainer not found');
            }

            // Process rewards
            const rewardResults = await this.processRewards(trainer, achievement.rewards);

            // Mark as claimed
            await TrainerAchievement.markClaimed(trainerId, achievementId);

            return {
                success: true,
                message: 'Rewards claimed successfully',
                rewards: rewardResults
            };
        } catch (error) {
            console.error('Error claiming rewards:', error);
            throw error;
        }
    }

    /**
     * Process rewards for an achievement
     * @param {Object} trainer - The trainer object
     * @param {Array} rewards - Array of reward objects
     */
    async processRewards(trainer, rewards) {
        const results = [];

        // Ensure rewards is an array
        const rewardsArray = Array.isArray(rewards) ? rewards : [rewards];

        for (const reward of rewardsArray) {
            let result = {
                type: reward.type,
                success: true,
                message: ''
            };

            try {
                switch (reward.type) {
                    case 'coin':
                        result = await this.giveCoinReward(trainer, reward.value);
                        break;

                    case 'level':
                        result = await this.giveLevelReward(trainer, reward.value);
                        break;

                    case 'item':
                        result = await this.giveItemReward(trainer, reward.value);
                        break;

                    case 'monster_static':
                        result = await this.giveStaticMonsterReward(trainer, reward.value);
                        break;

                    case 'monster_set':
                        result = await this.giveSetMonsterReward(trainer, reward.value);
                        break;

                    case 'monster_random':
                        result = await this.giveRandomMonsterReward(trainer, reward.value);
                        break;

                    default:
                        result.message = `Reward type ${reward.type} not implemented yet`;
                        break;
                }
            } catch (error) {
                result.success = false;
                result.message = error.message;
            }

            results.push(result);
        }

        return results;
    }

    /**
     * Give coin reward to trainer
     * @param {Object} trainer - The trainer object
     * @param {number} coins - Number of coins to add
     */
    async giveCoinReward(trainer, coins) {
        try {
            const coinsToAdd = parseInt(coins) || 0;

            // Add coins
            const newCurrencyAmount = (trainer.currency_amount || 0) + coinsToAdd;
            const newTotalEarned = (trainer.total_earned_currency || 0) + coinsToAdd;

            // Update trainer currency
            const query = `
                UPDATE trainers
                SET currency_amount = $1, total_earned_currency = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING currency_amount
            `;

            const result = await pool.query(query, [newCurrencyAmount, newTotalEarned, trainer.id]);
            const updatedBalance = result.rows[0].currency_amount;

            return {
                type: 'coin',
                success: true,
                message: `Added ${coinsToAdd} coins to trainer`,
                coins: coinsToAdd,
                new_balance: updatedBalance
            };
        } catch (error) {
            console.error('Error giving coin reward:', error);
            throw error;
        }
    }

    /**
     * Give level reward to trainer
     * @param {Object} trainer - The trainer object
     * @param {number} levels - Number of levels to add
     */
    async giveLevelReward(trainer, levels) {
        try {
            const levelsToAdd = parseInt(levels) || 1;

            // Add levels
            const newLevel = (trainer.level || 1) + levelsToAdd;

            // Update trainer level
            const query = `
                UPDATE trainers
                SET level = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING level
            `;

            const result = await pool.query(query, [newLevel, trainer.id]);
            const updatedLevel = result.rows[0].level;

            return {
                type: 'level',
                success: true,
                message: `Added ${levelsToAdd} levels to trainer`,
                levels: levelsToAdd,
                new_level: updatedLevel
            };
        } catch (error) {
            console.error('Error giving level reward:', error);
            throw error;
        }
    }

    /**
     * Give item reward to trainer
     * @param {Object} trainer - The trainer object
     * @param {string|Object} itemValue - Item value string (format: "Item Name;category;amount") or object
     */
    async giveItemReward(trainer, itemValue) {
        try {
            // Parse item value
            let itemName, category, amount;

            if (typeof itemValue === 'string' && itemValue.includes(';')) {
                [itemName, category, amount] = itemValue.split(';');
                amount = parseInt(amount) || 1;
            } else if (typeof itemValue === 'object' && itemValue !== null) {
                itemName = itemValue.name;
                category = itemValue.category || 'ITEMS';
                amount = itemValue.amount || 1;
            } else {
                itemName = itemValue;
                category = 'ITEMS';
                amount = 1;
            }

            // Get current inventory
            const inventoryField = `inv_${category.toLowerCase()}`;
            let inventory = trainer[inventoryField] || '{}';

            // Parse inventory JSON
            if (typeof inventory === 'string') {
                try {
                    inventory = JSON.parse(inventory);
                } catch (e) {
                    inventory = {};
                }
            }

            // Add item to inventory
            if (inventory[itemName]) {
                inventory[itemName] += amount;
            } else {
                inventory[itemName] = amount;
            }

            // Update trainer inventory
            const query = `
                UPDATE trainers
                SET ${inventoryField} = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            await pool.query(query, [JSON.stringify(inventory), trainer.id]);

            return {
                type: 'item',
                success: true,
                message: `Added ${amount} ${itemName} to inventory`,
                item: {
                    name: itemName,
                    category: category,
                    amount: amount
                }
            };
        } catch (error) {
            console.error('Error giving item reward:', error);
            throw error;
        }
    }

    /**
     * Get all achievements with progress for a trainer
     * @param {number} trainerId - The trainer's ID
     */
    async getTrainerAchievements(trainerId) {
        try {
            // Get all non-hidden achievements
            const achievements = await Achievement.getAll(false); // false = exclude hidden

            // Get all trainer achievements
            const trainerAchievements = await TrainerAchievement.getByTrainerId(trainerId);

            // Create a map of trainer achievements by achievement ID for faster lookup
            const trainerAchievementMap = {};
            trainerAchievements.forEach(ta => {
                trainerAchievementMap[ta.achievement_id] = ta;
            });

            // Map achievements to include progress
            const achievementsWithProgress = achievements.map(achievement => {
                const trainerAchievement = trainerAchievementMap[achievement.id] || {
                    progress: 0,
                    is_complete: false,
                    is_claimed: false
                };

                return {
                    id: achievement.id,
                    name: achievement.name,
                    description: achievement.description,
                    category: achievement.category,
                    icon: achievement.icon,
                    requirement_type: achievement.requirement_type,
                    requirement_value: achievement.requirement_value,
                    requirement_subtype: achievement.requirement_subtype,
                    is_secret: achievement.is_secret,
                    rewards: achievement.rewards,
                    progress: trainerAchievement.progress || 0,
                    is_complete: trainerAchievement.is_complete || false,
                    is_claimed: trainerAchievement.is_claimed || false,
                    completed_at: trainerAchievement.completed_at,
                    claimed_at: trainerAchievement.claimed_at
                };
            });

            // Group achievements by category
            const groupedAchievements = this.groupAchievementsByCategory(achievementsWithProgress);

            return groupedAchievements;
        } catch (error) {
            console.error('Error getting trainer achievements:', error);
            throw error;
        }
    }

    /**
     * Group achievements by category
     * @param {Array} achievements - Array of achievement objects
     */
    groupAchievementsByCategory(achievements) {
        const grouped = {};

        // Define category display names
        const categoryNames = {
            'level': 'Trainer Level',
            'type_collector': 'Type Collector',
            'monster_collector': 'Monster Collector',
            'attribute_collector': 'Attribute Collector',
            'currency_earned': 'Currency Earned',
            'currency_spent': 'Currency Spent',
            'custom': 'Special Achievements'
        };

        // Group achievements
        achievements.forEach(achievement => {
            const category = achievement.category;

            if (!grouped[category]) {
                grouped[category] = {
                    name: categoryNames[category] || category,
                    achievements: []
                };
            }

            grouped[category].achievements.push(achievement);
        });

        return grouped;
    }

    /**
     * Get achievement by ID
     * @param {number} achievementId - Achievement ID
     */
    async getAchievementById(achievementId) {
        try {
            const achievement = await Achievement.getById(achievementId);
            return achievement;
        } catch (error) {
            console.error(`Error getting achievement ${achievementId}:`, error);
            throw error;
        }
    }

    /**
     * Get all achievements (for admin interface)
     */
    async getAllAchievements() {
        try {
            const achievements = await Achievement.getAll(true); // true = include hidden
            return achievements;
        } catch (error) {
            console.error('Error getting all achievements:', error);
            throw error;
        }
    }

    /**
     * Create a new achievement
     * @param {Object} achievementData - Achievement data
     */
    async createAchievement(achievementData) {
        try {
            const achievement = await Achievement.create(achievementData);
            return achievement;
        } catch (error) {
            console.error('Error creating achievement:', error);
            throw error;
        }
    }

    /**
     * Update an achievement
     * @param {number} achievementId - Achievement ID
     * @param {Object} achievementData - Updated achievement data
     */
    async updateAchievement(achievementId, achievementData) {
        try {
            const achievement = await Achievement.update(achievementId, achievementData);

            if (!achievement) {
                throw new Error('Achievement not found');
            }

            return achievement;
        } catch (error) {
            console.error('Error updating achievement:', error);
            throw error;
        }
    }

    /**
     * Delete an achievement
     * @param {number} achievementId - Achievement ID
     */
    async deleteAchievement(achievementId) {
        try {
            // Delete the achievement
            const deleted = await Achievement.delete(achievementId);

            if (!deleted) {
                throw new Error('Achievement not found');
            }

            // Delete all trainer achievements for this achievement
            // This should be handled by the ON DELETE CASCADE constraint

            return { success: true, message: 'Achievement deleted successfully' };
        } catch (error) {
            console.error('Error deleting achievement:', error);
            throw error;
        }
    }

    /**
     * Give static monster reward to trainer (specific monster with predefined attributes)
     * @param {Object} trainer - The trainer object
     * @param {Object} monsterData - Monster data object
     */
    async giveStaticMonsterReward(trainer, monsterData) {
        try {
            const Monster = require('../models/Monster');

            // Prepare monster data
            const monsterParams = {
                trainer_id: trainer.id,
                name: monsterData.name || 'Achievement Monster',
                where_met: 'Achievement Reward',
                level: monsterData.level || 1,
                species1: monsterData.species1 || monsterData.species && monsterData.species[0] || 'Unknown',
                species2: monsterData.species2 || monsterData.species && monsterData.species[1] || null,
                species3: monsterData.species3 || monsterData.species && monsterData.species[2] || null,
                type1: monsterData.type1 || monsterData.types && monsterData.types[0] || 'Normal',
                type2: monsterData.type2 || monsterData.types && monsterData.types[1] || null,
                type3: monsterData.type3 || monsterData.types && monsterData.types[2] || null,
                type4: monsterData.type4 || monsterData.types && monsterData.types[3] || null,
                type5: monsterData.type5 || monsterData.types && monsterData.types[4] || null,
                attribute: monsterData.attribute || 'Data',
                box_number: 1
            };

            // Add default moveset to prevent initialization errors
            monsterParams.moveset = JSON.stringify(['Tackle', 'Growl']);

            // Add additional required fields that might be missing
            monsterParams.gender = monsterParams.gender || 'Male';
            monsterParams.nature = monsterParams.nature || 'Hardy';
            monsterParams.characteristic = monsterParams.characteristic || 'Likes to run';
            monsterParams.friendship = monsterParams.friendship || 70;

            // Add stats to prevent initialization errors
            monsterParams.hp_iv = monsterParams.hp_iv || Math.floor(Math.random() * 32);
            monsterParams.atk_iv = monsterParams.atk_iv || Math.floor(Math.random() * 32);
            monsterParams.def_iv = monsterParams.def_iv || Math.floor(Math.random() * 32);
            monsterParams.spa_iv = monsterParams.spa_iv || Math.floor(Math.random() * 32);
            monsterParams.spd_iv = monsterParams.spd_iv || Math.floor(Math.random() * 32);
            monsterParams.spe_iv = monsterParams.spe_iv || Math.floor(Math.random() * 32);

            // Calculate base stats
            const baseValue = 20 + Math.floor(monsterParams.level * 2.5);
            monsterParams.hp_total = monsterParams.hp_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.atk_total = monsterParams.atk_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.def_total = monsterParams.def_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spa_total = monsterParams.spa_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spd_total = monsterParams.spd_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spe_total = monsterParams.spe_total || baseValue + Math.floor(Math.random() * 10);

            // Initialize EVs
            monsterParams.hp_ev = monsterParams.hp_ev || 0;
            monsterParams.atk_ev = monsterParams.atk_ev || 0;
            monsterParams.def_ev = monsterParams.def_ev || 0;
            monsterParams.spa_ev = monsterParams.spa_ev || 0;
            monsterParams.spd_ev = monsterParams.spd_ev || 0;
            monsterParams.spe_ev = monsterParams.spe_ev || 0;

            // Set acquisition date
            monsterParams.date_met = monsterParams.date_met || new Date().toISOString().split('T')[0];

            // Log the monster parameters in a more readable format
            console.log('Creating static monster with params:', JSON.stringify(monsterParams, null, 2));

            // Create the monster
            let monster;
            try {
                monster = await Monster.create(monsterParams);

                if (!monster) {
                    throw new Error('Monster.create returned null or undefined');
                }
            } catch (createError) {
                console.error('Error creating static monster:', createError);
                throw new Error(`Failed to create static monster: ${createError.message}`);
            }

            return {
                type: 'monster_static',
                success: true,
                message: `Created static monster ${monster.name} (Level ${monster.level})`,
                monster: {
                    id: monster.id,
                    name: monster.name,
                    level: monster.level,
                    species1: monster.species1,
                    species2: monster.species2,
                    species3: monster.species3,
                    type1: monster.type1,
                    type2: monster.type2,
                    type3: monster.type3,
                    type4: monster.type4,
                    type5: monster.type5,
                    attribute: monster.attribute
                }
            };
        } catch (error) {
            console.error('Error giving static monster reward:', error);
            throw error;
        }
    }

    /**
     * Give set monster reward to trainer (specific species, random types)
     * @param {Object} trainer - The trainer object
     * @param {Object} monsterData - Monster data object
     */
    async giveSetMonsterReward(trainer, monsterData) {
        try {
            const Monster = require('../models/Monster');
            const MonsterRoller = require('../utils/MonsterRoller');

            // Ensure species is properly formatted
            let species = [];
            if (monsterData.species && Array.isArray(monsterData.species)) {
                species = monsterData.species.filter(s => s); // Filter out empty values
            } else if (monsterData.species && typeof monsterData.species === 'string') {
                species = [monsterData.species];
            } else if (monsterData.species1) {
                species = [monsterData.species1];
            } else {
                species = ['Pokemon']; // Default fallback
            }

            // Prepare monster data with specified species
            const rollerOptions = {
                overrideParams: {
                    species: species
                }
            };

            // Roll a monster with the specified species
            let rolledMonster;
            try {
                rolledMonster = await MonsterRoller.rollOne(rollerOptions);
            } catch (rollError) {
                console.error('Error rolling monster:', rollError);
                // Create a fallback monster if rolling fails
                rolledMonster = {
                    species1: species[0] || 'Pokemon',
                    type1: 'Normal',
                    attribute: 'Data'
                };
            }

            // Check if rolledMonster is null or undefined and provide fallback
            if (!rolledMonster) {
                console.warn('Monster roller returned null or undefined, using fallback monster');
                rolledMonster = {
                    species1: species[0] || 'Pokemon',
                    type1: 'Normal',
                    attribute: 'Data'
                };
            }

            // Create the monster with the rolled data
            const monsterParams = {
                trainer_id: trainer.id,
                name: monsterData.name || 'Achievement Monster',
                where_met: 'Achievement Reward',
                level: monsterData.level || 1,
                species1: rolledMonster.species1 || species[0] || 'Pokemon',
                species2: rolledMonster.species2 || monsterData.species2 || null,
                species3: rolledMonster.species3 || monsterData.species3 || null,
                type1: rolledMonster.type1 || 'Normal',
                type2: rolledMonster.type2 || null,
                type3: rolledMonster.type3 || null,
                type4: rolledMonster.type4 || null,
                type5: rolledMonster.type5 || null,
                attribute: rolledMonster.attribute || monsterData.attribute || 'Data',
                box_number: 1
            };

            // Add default moveset to prevent initialization errors
            monsterParams.moveset = JSON.stringify(['Tackle', 'Growl']);

            // Add additional required fields that might be missing
            monsterParams.gender = monsterParams.gender || 'Male';
            monsterParams.nature = monsterParams.nature || 'Hardy';
            monsterParams.characteristic = monsterParams.characteristic || 'Likes to run';
            monsterParams.friendship = monsterParams.friendship || 70;

            // Add stats to prevent initialization errors
            monsterParams.hp_iv = monsterParams.hp_iv || Math.floor(Math.random() * 32);
            monsterParams.atk_iv = monsterParams.atk_iv || Math.floor(Math.random() * 32);
            monsterParams.def_iv = monsterParams.def_iv || Math.floor(Math.random() * 32);
            monsterParams.spa_iv = monsterParams.spa_iv || Math.floor(Math.random() * 32);
            monsterParams.spd_iv = monsterParams.spd_iv || Math.floor(Math.random() * 32);
            monsterParams.spe_iv = monsterParams.spe_iv || Math.floor(Math.random() * 32);

            // Calculate base stats
            const baseValue = 20 + Math.floor(monsterParams.level * 2.5);
            monsterParams.hp_total = monsterParams.hp_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.atk_total = monsterParams.atk_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.def_total = monsterParams.def_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spa_total = monsterParams.spa_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spd_total = monsterParams.spd_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spe_total = monsterParams.spe_total || baseValue + Math.floor(Math.random() * 10);

            // Initialize EVs
            monsterParams.hp_ev = monsterParams.hp_ev || 0;
            monsterParams.atk_ev = monsterParams.atk_ev || 0;
            monsterParams.def_ev = monsterParams.def_ev || 0;
            monsterParams.spa_ev = monsterParams.spa_ev || 0;
            monsterParams.spd_ev = monsterParams.spd_ev || 0;
            monsterParams.spe_ev = monsterParams.spe_ev || 0;

            // Set acquisition date
            monsterParams.date_met = monsterParams.date_met || new Date().toISOString().split('T')[0];

            // Log the monster parameters in a more readable format
            console.log('Creating set monster with params:', JSON.stringify(monsterParams, null, 2));

            // Create the monster
            let monster;
            try {
                monster = await Monster.create(monsterParams);

                if (!monster) {
                    throw new Error('Monster.create returned null or undefined');
                }
            } catch (createError) {
                console.error('Error creating set monster:', createError);
                throw new Error(`Failed to create set monster: ${createError.message}`);
            }

            return {
                type: 'monster_set',
                success: true,
                message: `Created set monster ${monster.name} (Level ${monster.level})`,
                monster: {
                    id: monster.id,
                    name: monster.name,
                    level: monster.level,
                    species1: monster.species1,
                    species2: monster.species2,
                    species3: monster.species3,
                    type1: monster.type1,
                    type2: monster.type2,
                    type3: monster.type3,
                    type4: monster.type4,
                    type5: monster.type5,
                    attribute: monster.attribute
                }
            };
        } catch (error) {
            console.error('Error giving set monster reward:', error);
            throw error;
        }
    }

    /**
     * Give random monster reward to trainer
     * @param {Object} trainer - The trainer object
     * @param {Object} monsterData - Monster data object with optional filters
     */
    async giveRandomMonsterReward(trainer, monsterData) {
        try {
            const Monster = require('../models/Monster');
            const MonsterRoller = require('../utils/MonsterRoller');
            const MonsterService = require('../utils/MonsterService');

            // Prepare roller options with any provided filters
            const rollerOptions = {
                overrideParams: {
                    minSpecies: monsterData.minSpecies || 1,
                    maxSpecies: monsterData.maxSpecies || 3,
                    minType: monsterData.minType || 1,
                    maxType: monsterData.maxType || 5
                },
                filters: monsterData.filters || {}
            };

            // Roll a completely random monster
            let rolledMonster;
            try {
                rolledMonster = await MonsterService.rollOne(rollerOptions);
            } catch (rollError) {
                console.error('Error rolling monster:', rollError);
                // Create a fallback monster if rolling fails
                rolledMonster = {
                    species1: 'Pokemon',
                    type1: 'Normal',
                    attribute: 'Data'
                };
            }

            // Check if rolledMonster is null or undefined and provide fallback
            if (!rolledMonster) {
                console.warn('Monster roller returned null or undefined, using fallback monster');
                rolledMonster = {
                    species1: 'Pokemon',
                    type1: 'Normal',
                    attribute: 'Data'
                };
            }

            // Create the monster with the rolled data
            const monsterParams = {
                trainer_id: trainer.id,
                name: monsterData.name || 'Achievement Monster',
                where_met: 'Achievement Reward',
                level: monsterData.level || 1,
                species1: rolledMonster.species1 || 'Pokemon',
                species2: rolledMonster.species2 || null,
                species3: rolledMonster.species3 || null,
                type1: rolledMonster.type1 || 'Normal',
                type2: rolledMonster.type2 || null,
                type3: rolledMonster.type3 || null,
                type4: rolledMonster.type4 || null,
                type5: rolledMonster.type5 || null,
                attribute: rolledMonster.attribute || 'Data',
                box_number: 1
            };

            // Add default moveset to prevent initialization errors
            monsterParams.moveset = JSON.stringify(['Tackle', 'Growl']);

            // Add additional required fields that might be missing
            monsterParams.gender = monsterParams.gender || 'Male';
            monsterParams.nature = monsterParams.nature || 'Hardy';
            monsterParams.characteristic = monsterParams.characteristic || 'Likes to run';
            monsterParams.friendship = monsterParams.friendship || 70;

            // Add stats to prevent initialization errors
            monsterParams.hp_iv = monsterParams.hp_iv || Math.floor(Math.random() * 32);
            monsterParams.atk_iv = monsterParams.atk_iv || Math.floor(Math.random() * 32);
            monsterParams.def_iv = monsterParams.def_iv || Math.floor(Math.random() * 32);
            monsterParams.spa_iv = monsterParams.spa_iv || Math.floor(Math.random() * 32);
            monsterParams.spd_iv = monsterParams.spd_iv || Math.floor(Math.random() * 32);
            monsterParams.spe_iv = monsterParams.spe_iv || Math.floor(Math.random() * 32);

            // Calculate base stats
            const baseValue = 20 + Math.floor(monsterParams.level * 2.5);
            monsterParams.hp_total = monsterParams.hp_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.atk_total = monsterParams.atk_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.def_total = monsterParams.def_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spa_total = monsterParams.spa_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spd_total = monsterParams.spd_total || baseValue + Math.floor(Math.random() * 10);
            monsterParams.spe_total = monsterParams.spe_total || baseValue + Math.floor(Math.random() * 10);

            // Initialize EVs
            monsterParams.hp_ev = monsterParams.hp_ev || 0;
            monsterParams.atk_ev = monsterParams.atk_ev || 0;
            monsterParams.def_ev = monsterParams.def_ev || 0;
            monsterParams.spa_ev = monsterParams.spa_ev || 0;
            monsterParams.spd_ev = monsterParams.spd_ev || 0;
            monsterParams.spe_ev = monsterParams.spe_ev || 0;

            // Set acquisition date
            monsterParams.date_met = monsterParams.date_met || new Date().toISOString().split('T')[0];

            // Log the monster parameters in a more readable format
            console.log('Creating random monster with params:', JSON.stringify(monsterParams, null, 2));

            // Create the monster
            let monster;
            try {
                monster = await Monster.create(monsterParams);

                if (!monster) {
                    throw new Error('Monster.create returned null or undefined');
                }
            } catch (createError) {
                console.error('Error creating monster:', createError);
                throw new Error(`Failed to create monster: ${createError.message}`);
            }

            return {
                type: 'monster_random',
                success: true,
                message: `Created random monster ${monster.name} (Level ${monster.level})`,
                monster: {
                    id: monster.id,
                    name: monster.name,
                    level: monster.level,
                    species1: monster.species1,
                    species2: monster.species2,
                    species3: monster.species3,
                    type1: monster.type1,
                    type2: monster.type2,
                    type3: monster.type3,
                    type4: monster.type4,
                    type5: monster.type5,
                    attribute: monster.attribute
                }
            };
        } catch (error) {
            console.error('Error giving random monster reward:', error);
            throw error;
        }
    }
}

module.exports = new AchievementServicePG();
