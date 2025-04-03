const { validateReward } = require('../models/Reward');
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const Item = require('../models/Item');

class RewardProcessor {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Validates a reward before processing
     * @param {Object} reward The reward to validate
     * @returns {boolean} True if valid, throws error if invalid
     */
    validateReward(reward) {
        if (!validateReward(reward)) {
            throw new Error('Invalid reward structure');
        }

        if (reward.claimed) {
            throw new Error('Reward has already been claimed');
        }

        return true;
    }

    /**
     * Claims a single reward for a trainer
     * @param {Object} reward The reward to claim
     * @param {number} trainerId The trainer ID to claim for
     * @returns {Promise<Object>} Result of the claim operation
     */
    async claimReward(reward, trainerId) {
        try {
            // Start transaction
            await this.pool.query('BEGIN');

            // Validate reward
            this.validateReward(reward);

            // Get trainer
            const trainer = await Trainer.getById(trainerId);
            if (!trainer) {
                throw new Error(`Trainer ${trainerId} not found`);
            }

            let result;

            // Process based on reward type
            switch (reward.type) {
                case 'coin':
                    result = await this.processCoinReward(reward, trainer);
                    break;
                case 'item':
                    result = await this.processItemReward(reward, trainer);
                    break;
                case 'level':
                    result = await this.processLevelReward(reward, trainer);
                    break;
                case 'monster':
                    result = await this.processMonsterReward(reward, trainer);
                    break;
                default:
                    throw new Error(`Unknown reward type: ${reward.type}`);
            }

            // Log the claim
            await this.logRewardClaim(reward, trainerId);

            // Commit transaction
            await this.pool.query('COMMIT');

            return {
                success: true,
                message: result.message,
                trainerId: trainer.id,
                trainerName: trainer.name,
                ...result.data
            };
        } catch (error) {
            // Rollback on error
            await this.pool.query('ROLLBACK');
            console.error('Error claiming reward:', error);
            throw error;
        }
    }

    /**
     * Claims multiple rewards for a trainer
     * @param {Array} rewards Array of rewards to claim
     * @param {number} trainerId The trainer ID to claim for
     * @returns {Promise<Array>} Results of all claim operations
     */
    async claimMultipleRewards(rewards, trainerId) {
        const results = [];

        // Start transaction
        await this.pool.query('BEGIN');

        try {
            for (const reward of rewards) {
                try {
                    const result = await this.claimReward(reward, trainerId);
                    results.push({
                        rewardId: reward.id,
                        success: true,
                        ...result
                    });
                } catch (error) {
                    results.push({
                        rewardId: reward.id,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Commit transaction
            await this.pool.query('COMMIT');

            return results;
        } catch (error) {
            // Rollback on error
            await this.pool.query('ROLLBACK');
            console.error('Error claiming multiple rewards:', error);
            throw error;
        }
    }

    /**
     * Process coin reward
     * @private
     */
    async processCoinReward(reward, trainer) {
        console.log('Processing coin reward:', JSON.stringify(reward, null, 2));

        // Extract coin amount from different possible structures
        let amount = 0;

        // First try direct amount property
        if (reward.amount && typeof reward.amount === 'number') {
            amount = reward.amount;
            console.log('Using direct amount property for coin reward');
        }
        // Then try data.amount
        else if (reward.data && reward.data.amount && typeof reward.data.amount === 'number') {
            amount = reward.data.amount;
            console.log('Using data.amount for coin reward');
        }
        // Then try reward_data.amount
        else if (reward.reward_data && reward.reward_data.amount && typeof reward.reward_data.amount === 'number') {
            amount = reward.reward_data.amount;
            console.log('Using reward_data.amount for coin reward');
        }
        // Then try quantity as a fallback
        else if (reward.quantity && typeof reward.quantity === 'number') {
            amount = reward.quantity;
            console.log('Using quantity as fallback for coin reward');
        }
        // Then try data.quantity as a fallback
        else if (reward.data && reward.data.quantity && typeof reward.data.quantity === 'number') {
            amount = reward.data.quantity;
            console.log('Using data.quantity as fallback for coin reward');
        }

        console.log(`Extracted coin amount: ${amount}`);

        if (amount <= 0) {
            console.warn('Invalid or zero coin amount:', amount);
            amount = 10; // Default to 10 coins as a fallback
            console.log('Using default amount of 10 coins');
        }

        // Update trainer currency
        const updatedTrainer = {
            ...trainer,
            currency_amount: trainer.currency_amount + amount,
            total_earned_currency: trainer.total_earned_currency + amount
        };

        await Trainer.update(trainer.id, updatedTrainer);

        return {
            message: `Added ${amount} coins to ${trainer.name}`,
            data: { amount }
        };
    }

    /**
     * Process item reward
     * @private
     */
    async processItemReward(reward, trainer) {
        console.log('Processing item reward:', JSON.stringify(reward, null, 2));

        // Extract item data, handling different reward structures
        let name, quantity, category;

        // Special handling for berry rewards
        if (reward.id && reward.id.startsWith('berry-')) {
            console.log('Berry reward detected, using special handling');

            // For berry rewards, first try direct properties
            if (reward.name) {
                name = reward.name;
                quantity = reward.quantity || 1;
                category = 'inv_BERRIES'; // Force the correct category for berries
                console.log('Using direct properties for berry reward');
            }
            // Then try reward_data
            else if (reward.reward_data && reward.reward_data.name) {
                name = reward.reward_data.name;
                quantity = reward.reward_data.quantity || 1;
                category = 'inv_BERRIES'; // Force the correct category for berries
                console.log('Using reward_data for berry reward');
            }
            // Then try data
            else if (reward.data && reward.data.name) {
                name = reward.data.name;
                quantity = reward.data.quantity || 1;
                category = 'inv_BERRIES'; // Force the correct category for berries
                console.log('Using data for berry reward');
            }
            else {
                // Default berry name if all else fails
                name = 'Berry';
                quantity = 1;
                category = 'inv_BERRIES';
                console.log('Using default values for berry reward');
            }
        }
        // Normal handling for non-berry rewards
        else {
            // First try direct properties (highest priority)
            if (reward.name) {
                name = reward.name;
                quantity = reward.quantity || 1;
                category = reward.category || 'general';
                console.log('Using direct properties for item reward');
            }
            // Then try reward_data (second priority)
            else if (reward.reward_data && reward.reward_data.name) {
                name = reward.reward_data.name;
                quantity = reward.reward_data.quantity || 1;
                category = reward.reward_data.category || 'general';
                console.log('Using reward_data for item reward');
            }
            // Then try data (third priority)
            else if (reward.data && reward.data.name) {
                name = reward.data.name;
                quantity = reward.data.quantity || 1;
                category = reward.data.category || 'general';
                console.log('Using data for item reward');
            }
            // Then try nested reward_data (fourth priority)
            else if (reward.data && reward.data.reward_data && reward.data.reward_data.name) {
                name = reward.data.reward_data.name;
                quantity = reward.data.reward_data.quantity || 1;
                category = reward.data.reward_data.category || 'general';
                console.log('Using nested reward_data for item reward');
            }
            // If all else fails, try to extract from any property
            else {
                // Try to find any property that might contain the name
                for (const key in reward) {
                    if (typeof reward[key] === 'object' && reward[key] !== null) {
                        if (reward[key].name) {
                            name = reward[key].name;
                            quantity = reward[key].quantity || 1;
                            category = reward[key].category || 'general';
                            console.log(`Found item data in property: ${key}`);
                            break;
                        }
                    }
                }
            }
        }

        console.log(`Extracted item data: name=${name}, quantity=${quantity}, category=${category}`);

        if (!name) {
            console.error('Failed to extract item name from reward:', JSON.stringify(reward, null, 2));
            throw new Error('Invalid item name');
        }

        // Add the inv_ prefix if it's not already there
        if (!category.startsWith('inv_')) {
            category = `inv_${category}`;
            console.log(`Added inv_ prefix to category: ${category}`);
        }

        // Add item to trainer's inventory
        console.log(`Adding item to trainer's inventory: trainerId=${trainer.id}, category=${category}, name=${name}, quantity=${quantity}`);
        await Trainer.updateInventoryItem(
            trainer.id,
            category,
            name,
            quantity
        );

        return {
            message: `Added ${quantity} ${name}(s) to ${trainer.name}'s inventory`,
            data: { name, quantity, category }
        };
    }

    /**
     * Process level reward
     * @private
     */
    async processLevelReward(reward, trainer) {
        const { levels, isMonster, monId } = reward.data;

        if (isMonster && monId) {
            // Level up specific monster
            const monster = await Monster.getById(monId);
            if (!monster || monster.trainer_id !== trainer.id) {
                throw new Error('Invalid monster for level reward');
            }

            // Update monster level and stats
            const updatedMonster = await Monster.levelUp(monId, levels);

            return {
                message: `${monster.name} gained ${levels} level(s)`,
                data: {
                    monsterLevelUp: true,
                    monsterName: monster.name,
                    levels
                }
            };
        } else {
            // Level up trainer
            const updatedTrainer = {
                ...trainer,
                level: trainer.level + levels
            };

            await Trainer.update(trainer.id, updatedTrainer);

            return {
                message: `${trainer.name} gained ${levels} trainer level(s)`,
                data: {
                    trainerLevelUp: true,
                    levels
                }
            };
        }
    }

    /**
     * Process monster reward
     * @private
     */
    async processMonsterReward(reward, trainer) {
        const monsterData = {
            ...reward.data,
            trainer_id: trainer.id,
            box_number: 1 // Put in first box by default
        };

        const monster = await Monster.create(monsterData);

        return {
            message: `Added ${monster.name} to ${trainer.name}'s collection`,
            data: { monsterId: monster.mon_id }
        };
    }

    /**
     * Log reward claim to database
     * @private
     */
    async logRewardClaim(reward, trainerId) {
        const query = `
            INSERT INTO reward_claims (
                reward_id,
                reward_type,
                trainer_id,
                claimed_at,
                reward_data
            ) VALUES ($1, $2, $3, NOW(), $4)
        `;

        await this.pool.query(query, [
            reward.id,
            reward.type,
            trainerId,
            JSON.stringify(reward.data)
        ]);
    }
}

module.exports = RewardProcessor;