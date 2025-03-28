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
        const amount = reward.data.amount;

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
        const { name, quantity, category } = reward.data;

        // Add item to trainer's inventory
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