const express = require('express');
const router = express.Router();
const pool = require('../../db');
const Trainer = require('../../models/Trainer');
const Monster = require('../../models/Monster');
const MonsterRoller = require('../../utils/MonsterRoller');
const ItemService = require('../../utils/ItemService');

// Art submission endpoint
router.post('/', async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'You must be logged in to submit art'
            });
        }

        const {
            submissionType,
            title,
            artUrl,
            artType,
            totalLevels,
            manualEntry,
            calculatorType,
            participants,
            giftParticipants,
            totalGiftLevels,
            giftRecipientId
        } = req.body;

        // Validate required fields
        if (!title || !artUrl || (!participants && !giftParticipants) ||
            (participants && participants.length === 0 && (!giftParticipants || giftParticipants.length === 0))) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Art type level values for external submissions
        const artTypeLevels = {
            'sketch': 1,
            'sketch_set': 3,
            'line_art': 3,
            'rendered': 5,
            'polished': 7
        };

        // Determine total levels based on submission type
        let calculatedTotalLevels = 0;

        if (manualEntry) {
            // For manual entry, use the provided total levels
            calculatedTotalLevels = totalLevels;
        } else {
            // For external submissions, calculate based on art type
            if (!artType || !artTypeLevels[artType]) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid art type'
                });
            }

            calculatedTotalLevels = artTypeLevels[artType];
        }

        // Begin transaction
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Calculate rewards for each participant
            const calculationResults = {
                participants: []
            };

            // Process regular participants
            if (participants && participants.length > 0) {
                for (const participant of participants) {
                    const { trainerId, monsterId, levels, coins } = participant;

                    // Use the specified levels and coins
                    const participantLevels = levels || Math.floor(calculatedTotalLevels / participants.length);
                    const participantCoins = coins || participantLevels * 50;

                    // Get trainer
                    const trainerResult = await client.query(
                        'SELECT id, name, level FROM trainers WHERE id = $1',
                        [trainerId]
                    );

                    if (trainerResult.rows.length === 0) {
                        throw new Error(`Trainer with ID ${trainerId} not found`);
                    }

                    const trainer = trainerResult.rows[0];

                    // Process monster participant
                    if (monsterId) {
                        // Get monster
                        const monsterResult = await client.query(
                            'SELECT id, name, level FROM monsters WHERE id = $1',
                            [monsterId]
                        );

                        if (monsterResult.rows.length === 0) {
                            throw new Error(`Monster with ID ${monsterId} not found`);
                        }

                        const monster = monsterResult.rows[0];

                        // Add levels to monster
                        const newMonsterLevel = Math.min(monster.level + participantLevels, 100);
                        const excessLevels = monster.level + participantLevels - newMonsterLevel;
                        const excessCoins = excessLevels * 25; // 25 coins per excess level

                        await client.query(
                            'UPDATE monsters SET level = $1 WHERE id = $2',
                            [newMonsterLevel, monsterId]
                        );

                        // Add coins to trainer
                        await client.query(
                            'UPDATE trainers SET currency_amount = COALESCE(currency_amount, 0) + $1, total_earned_currency = COALESCE(total_earned_currency, 0) + $1 WHERE id = $2',
                            [participantCoins + excessCoins, trainerId]
                        );

                        // Add to calculation results
                        calculationResults.participants.push({
                            trainer,
                            monster,
                            levels: participantLevels,
                            actualLevels: newMonsterLevel - monster.level,
                            excessLevels,
                            coins: participantCoins + excessCoins
                        });
                    }
                    // Process trainer participant
                    else {
                        // Add levels to trainer
                        await client.query(
                            'UPDATE trainers SET level = level + $1 WHERE id = $2',
                            [participantLevels, trainerId]
                        );

                        // Add coins to trainer
                        await client.query(
                            'UPDATE trainers SET currency_amount = COALESCE(currency_amount, 0) + $1, total_earned_currency = COALESCE(total_earned_currency, 0) + $1 WHERE id = $2',
                            [participantCoins, trainerId]
                        );

                        // Add to calculation results
                        calculationResults.participants.push({
                            trainer,
                            levels: participantLevels,
                            coins: participantCoins
                        });
                    }
                }
            }

            // Process gift participants and gift levels
            let totalGiftLevelsToApply = 0;

            // Process gift participants if they exist
            if (giftParticipants && giftParticipants.length > 0) {
                for (const participant of giftParticipants) {
                    const { trainerId, monsterId, monsterName, levels } = participant;

                    // Calculate gift levels contribution (half of the levels, rounded up)
                    const giftLevelsContribution = Math.floor((levels + 1) / 2);
                    totalGiftLevelsToApply += giftLevelsContribution;

                    // Get trainer for the record
                    const trainerResult = await client.query(
                        'SELECT id, name, level FROM trainers WHERE id = $1',
                        [trainerId]
                    );

                    if (trainerResult.rows.length === 0) {
                        throw new Error(`Trainer with ID ${trainerId} not found`);
                    }

                    const trainer = trainerResult.rows[0];

                    // Add to calculation results for record-keeping
                    if (monsterId) {
                        // Get monster
                        const monsterResult = await client.query(
                            'SELECT id, name, level FROM monsters WHERE id = $1',
                            [monsterId]
                        );

                        if (monsterResult.rows.length === 0) {
                            throw new Error(`Monster with ID ${monsterId} not found`);
                        }

                        const monster = monsterResult.rows[0];

                        // Add to calculation results
                        calculationResults.participants.push({
                            trainer,
                            monster,
                            isGift: true,
                            giftLevelsContribution
                        });
                    } else {
                        // Add to calculation results
                        calculationResults.participants.push({
                            trainer,
                            isGift: true,
                            giftLevelsContribution
                        });
                    }
                }
            }

            // Add any additional gift levels from the form
            if (totalGiftLevels) {
                totalGiftLevelsToApply = totalGiftLevels;
            }

            // Process gift levels if there are any
            if (totalGiftLevelsToApply > 0 && giftRecipientId) {
                // Get gift recipient
                const recipientResult = await client.query(
                    'SELECT id, name, level FROM trainers WHERE id = $1',
                    [giftRecipientId]
                );

                if (recipientResult.rows.length === 0) {
                    throw new Error(`Gift recipient with ID ${giftRecipientId} not found`);
                }

                const recipient = recipientResult.rows[0];

                // Calculate gift rolls (1 roll per 5 levels)
                const giftRolls = Math.floor(totalGiftLevelsToApply / 5);

                // Initialize gift rewards
                const giftRewards = {
                    recipient,
                    levels: totalGiftLevelsToApply,
                    items: [],
                    monster: null
                };

                // Process gift rolls
                if (giftRolls > 0) {
                    // Determine if monster or items
                    const monsterRoll = Math.random() < 0.2; // 20% chance for monster

                    if (monsterRoll) {
                        // Roll a monster
                        const monsterRoller = new MonsterRoller();
                        const rolledMonster = await monsterRoller.rollMonster();

                        if (rolledMonster) {
                            // Create the monster for the recipient
                            const newMonster = await Monster.create({
                                trainer_id: giftRecipientId,
                                name: rolledMonster.name,
                                species: rolledMonster.species,
                                img_link: rolledMonster.img_link,
                                level: 1
                            });

                            giftRewards.monster = newMonster;
                        }
                    } else {
                        // Roll items
                        const itemCategories = ['BERRIES', 'PASTRIES', 'ITEMS', 'EVOLUTION', 'ANTIQUE', 'BALLS'];

                        for (let i = 0; i < giftRolls; i++) {
                            // Select random category
                            const category = itemCategories[Math.floor(Math.random() * itemCategories.length)];

                            // Roll item from category
                            const item = await ItemService.getRandomItemFromCategory(category);

                            if (item) {
                                // Add item to recipient's inventory
                                await ItemService.addItemToTrainer(giftRecipientId, item.name, 1);

                                // Add to gift rewards
                                giftRewards.items.push(item);
                            }
                        }
                    }
                }

                // Add gift levels to recipient
                await client.query(
                    'UPDATE trainers SET level = level + $1 WHERE id = $2',
                    [totalGiftLevelsToApply, giftRecipientId]
                );

                // Add gift rewards to calculation results
                calculationResults.giftRewards = giftRewards;
            }

            // Activity logging removed as the activity_log table doesn't exist

            // Process additional rewards (mission progress, garden points, boss damage)
            try {
                // Get the user ID from the session
                const userId = req.session.user.discord_id;

                // Import RewardSystem
                const RewardSystem = require('../../utils/RewardSystem');

                // Process additional rewards
                const additionalRewards = await RewardSystem.processAdditionalRewards(userId, 'art', {
                    artType,
                    levels: calculatedTotalLevels,
                    coins: calculatedTotalLevels * 50 // 50 coins per level
                });

                // Add additional rewards to the response
                calculationResults.additionalRewards = additionalRewards;
            } catch (error) {
                console.error('Error processing additional rewards:', error);
                // Continue without additional rewards if there's an error
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Art submission processed successfully',
                calculation: calculationResults,
                rewards: {
                    level_reward: calculatedTotalLevels,
                    coin_reward: calculatedTotalLevels * 50
                },
                additionalRewards: calculationResults.additionalRewards
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error processing art submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing art submission: ' + error.message
        });
    }
});

module.exports = router;
