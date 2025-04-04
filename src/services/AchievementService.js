const Achievement = require('../models/Achievement');
const TrainerAchievement = require('../models/TrainerAchievement');
const Trainer = require('../models/Trainer');
const pool = require('../db');
const MonsterRoller = require('../utils/MonsterRoller');

class AchievementService {
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
                    case 'item':
                        result = await this.giveItemReward(trainer, reward.value);
                        break;

                    case 'level':
                        result = await this.giveLevelReward(trainer, reward.value);
                        break;

                    case 'coin':
                        result = await this.giveCoinReward(trainer, reward.value);
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
     * Give static monster reward to trainer
     * @param {Object} trainer - The trainer object
     * @param {Object} monsterData - Monster data object
     */
    async giveStaticMonsterReward(trainer, monsterData) {
        try {
            // Create a new monster with the specified attributes
            const query = `
                INSERT INTO mons (
                    trainer_id, player_user_id, name, level,
                    species1, species2, species3,
                    type1, type2, type3, type4, type5,
                    attribute, is_achievement_reward
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            `;

            const values = [
                trainer.id,
                trainer.player_user_id,
                monsterData.name || 'Achievement Monster',
                monsterData.level || 1,
                monsterData.species && monsterData.species[0] ? monsterData.species[0] : null,
                monsterData.species && monsterData.species[1] ? monsterData.species[1] : null,
                monsterData.species && monsterData.species[2] ? monsterData.species[2] : null,
                monsterData.types && monsterData.types[0] ? monsterData.types[0] : null,
                monsterData.types && monsterData.types[1] ? monsterData.types[1] : null,
                monsterData.types && monsterData.types[2] ? monsterData.types[2] : null,
                monsterData.types && monsterData.types[3] ? monsterData.types[3] : null,
                monsterData.types && monsterData.types[4] ? monsterData.types[4] : null,
                monsterData.attribute || null,
                true
            ];

            const result = await pool.query(query, values);
            const monster = result.rows[0];

            return {
                type: 'monster_static',
                success: true,
                message: `Added monster ${monster.name} to trainer`,
                monster: {
                    id: monster.mon_id,
                    name: monster.name,
                    species: [monster.species1, monster.species2, monster.species3].filter(Boolean),
                    types: [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean),
                    attribute: monster.attribute,
                    level: monster.level
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
            const monsterRoller = new MonsterRoller();

            // Prepare monster data
            const monsterParams = {
                trainer_id: trainer.id,
                player_user_id: trainer.player_user_id,
                name: monsterData.name || 'Achievement Monster',
                level: monsterData.level || 1,
                species1: monsterData.species && monsterData.species[0] ? monsterData.species[0] : null,
                species2: monsterData.species && monsterData.species[1] ? monsterData.species[1] : null,
                species3: monsterData.species && monsterData.species[2] ? monsterData.species[2] : null,
                is_achievement_reward: true
            };

            // Roll random types if specified
            if (monsterData.random_types) {
                const typeCount = Math.floor(Math.random() * 3) + 1; // 1-3 types
                const types = await monsterRoller.rollTypes(typeCount);

                monsterParams.type1 = types[0] || null;
                monsterParams.type2 = types[1] || null;
                monsterParams.type3 = types[2] || null;
            } else if (monsterData.types) {
                monsterParams.type1 = monsterData.types[0] || null;
                monsterParams.type2 = monsterData.types[1] || null;
                monsterParams.type3 = monsterData.types[2] || null;
                monsterParams.type4 = monsterData.types[3] || null;
                monsterParams.type5 = monsterData.types[4] || null;
            }

            // Roll random attribute if specified
            if (monsterData.random_attribute) {
                monsterParams.attribute = await monsterRoller.rollAttribute();
            } else {
                monsterParams.attribute = monsterData.attribute || null;
            }

            // Create the monster
            const fields = Object.keys(monsterParams);
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
            const values = fields.map(field => monsterParams[field]);

            const query = `
                INSERT INTO mons (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await pool.query(query, values);
            const monster = result.rows[0];

            return {
                type: 'monster_set',
                success: true,
                message: `Added monster ${monster.name} to trainer`,
                monster: {
                    id: monster.mon_id,
                    name: monster.name,
                    species: [monster.species1, monster.species2, monster.species3].filter(Boolean),
                    types: [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean),
                    attribute: monster.attribute,
                    level: monster.level
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
     * @param {Object} monsterData - Monster data object with type_pool and attribute_pool
     */
    async giveRandomMonsterReward(trainer, monsterData) {
        try {
            const monsterRoller = new MonsterRoller();

            // Roll a completely random monster
            const monsterParams = {
                trainer_id: trainer.id,
                player_user_id: trainer.player_user_id,
                name: monsterData.name || 'Achievement Monster',
                level: monsterData.level || 1,
                is_achievement_reward: true
            };

            // Roll species (1-3)
            const speciesCount = Math.floor(Math.random() * 3) + 1;
            const species = await monsterRoller.rollSpecies(speciesCount);
            monsterParams.species1 = species[0] || null;
            monsterParams.species2 = species[1] || null;
            monsterParams.species3 = species[2] || null;

            // Roll types (1-5)
            const typeCount = Math.floor(Math.random() * 5) + 1;
            const typePool = monsterData.type_pool || null;
            const types = await monsterRoller.rollTypes(typeCount, typePool);
            monsterParams.type1 = types[0] || null;
            monsterParams.type2 = types[1] || null;
            monsterParams.type3 = types[2] || null;
            monsterParams.type4 = types[3] || null;
            monsterParams.type5 = types[4] || null;

            // Roll attribute
            const attributePool = monsterData.attribute_pool || null;
            monsterParams.attribute = await monsterRoller.rollAttribute(attributePool);

            // Create the monster
            const fields = Object.keys(monsterParams);
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
            const values = fields.map(field => monsterParams[field]);

            const query = `
                INSERT INTO mons (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await pool.query(query, values);
            const monster = result.rows[0];

            return {
                type: 'monster_random',
                success: true,
                message: `Added monster ${monster.name} to trainer`,
                monster: {
                    id: monster.mon_id,
                    name: monster.name,
                    species: [monster.species1, monster.species2, monster.species3].filter(Boolean),
                    types: [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean),
                    attribute: monster.attribute,
                    level: monster.level
                }
            };
        } catch (error) {
            console.error('Error giving random monster reward:', error);
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
}

module.exports = new AchievementService();
