/**
 * Seed script for creating initial achievements
 * Run with: node src/scripts/seed-initial-achievements.js
 */

require('dotenv').config();
const pool = require('../db');
const Achievement = require('../models/AchievementPG');
const TrainerAchievement = require('../models/TrainerAchievementPG');

async function seedAchievements() {
    try {
        console.log('Starting achievement seeding...');

        // Ensure the achievements table exists
        await Achievement.createTableIfNotExists();
        await TrainerAchievement.createTableIfNotExists();

        // Level achievements (every 100 levels from 1-2000)
        const levelAchievements = [];
        for (let level = 100; level <= 2000; level += 100) {
            levelAchievements.push({
                name: `Level ${level} Trainer`,
                description: `Reach level ${level} as a trainer`,
                category: 'level',
                requirement_type: 'level',
                requirement_value: level,
                icon: 'fas fa-level-up-alt',
                rewards: [
                    {
                        type: 'coin',
                        value: level * 10
                    },
                    {
                        type: 'item',
                        value: {
                            name: level % 500 === 0 ? 'Rare Candy' : 'Candy',
                            category: 'ITEMS',
                            amount: Math.floor(level / 100)
                        }
                    }
                ],
                order: level / 100
            });
        }

        // Type collector achievements
        const types = [
            'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 
            'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 
            'Steel', 'Fairy'
        ];

        const typeCollectorAchievements = [];
        const typeCollectionLevels = [1, 5, 10, 20, 100];

        types.forEach(type => {
            typeCollectionLevels.forEach((count, index) => {
                typeCollectorAchievements.push({
                    name: `${type} Collector ${index + 1}`,
                    description: `Collect ${count} monsters with the ${type} type`,
                    category: 'type_collector',
                    requirement_type: 'type_count',
                    requirement_value: count,
                    requirement_subtype: type,
                    icon: 'fas fa-fire',
                    rewards: [
                        {
                            type: 'coin',
                            value: count * 50
                        },
                        {
                            type: 'item',
                            value: {
                                name: count >= 20 ? 'Type Essence' : 'Type Fragment',
                                category: 'ITEMS',
                                amount: Math.ceil(count / 5)
                            }
                        }
                    ],
                    order: index
                });
            });
        });

        // Monster collector achievements
        const monsterCollectorAchievements = [
            {
                name: 'Monster Collector I',
                description: 'Collect 10 monsters',
                category: 'monster_collector',
                requirement_type: 'monster_count',
                requirement_value: 10,
                icon: 'fas fa-dragon',
                rewards: [
                    {
                        type: 'coin',
                        value: 500
                    },
                    {
                        type: 'item',
                        value: {
                            name: 'Poké Ball',
                            category: 'BALLS',
                            amount: 5
                        }
                    }
                ],
                order: 1
            },
            {
                name: 'Monster Collector II',
                description: 'Collect 50 monsters',
                category: 'monster_collector',
                requirement_type: 'monster_count',
                requirement_value: 50,
                icon: 'fas fa-dragon',
                rewards: [
                    {
                        type: 'coin',
                        value: 2500
                    },
                    {
                        type: 'item',
                        value: {
                            name: 'Great Ball',
                            category: 'BALLS',
                            amount: 5
                        }
                    }
                ],
                order: 2
            },
            {
                name: 'Monster Collector III',
                description: 'Collect 100 monsters',
                category: 'monster_collector',
                requirement_type: 'monster_count',
                requirement_value: 100,
                icon: 'fas fa-dragon',
                rewards: [
                    {
                        type: 'coin',
                        value: 5000
                    },
                    {
                        type: 'item',
                        value: {
                            name: 'Ultra Ball',
                            category: 'BALLS',
                            amount: 5
                        }
                    }
                ],
                order: 3
            },
            {
                name: 'Monster Collector IV',
                description: 'Collect 500 monsters',
                category: 'monster_collector',
                requirement_type: 'monster_count',
                requirement_value: 500,
                icon: 'fas fa-dragon',
                rewards: [
                    {
                        type: 'coin',
                        value: 25000
                    },
                    {
                        type: 'monster_random',
                        value: {
                            name: 'Collector\'s Prize',
                            level: 50
                        }
                    }
                ],
                order: 4
            },
            {
                name: 'Monster Collector V',
                description: 'Collect 1000 monsters',
                category: 'monster_collector',
                requirement_type: 'monster_count',
                requirement_value: 1000,
                icon: 'fas fa-dragon',
                rewards: [
                    {
                        type: 'coin',
                        value: 50000
                    },
                    {
                        type: 'monster_random',
                        value: {
                            name: 'Master Collector\'s Prize',
                            level: 100
                        }
                    }
                ],
                order: 5
            }
        ];

        // Attribute collector achievements
        const attributes = [
            'Brave', 'Calm', 'Careful', 'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly',
            'Lax', 'Lonely', 'Mild', 'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky',
            'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid'
        ];

        const attributeCollectorAchievements = [];
        const attributeCollectionLevels = [1, 5, 10, 20, 100];

        attributes.forEach(attribute => {
            attributeCollectionLevels.forEach((count, index) => {
                attributeCollectorAchievements.push({
                    name: `${attribute} Collector ${index + 1}`,
                    description: `Collect ${count} monsters with the ${attribute} attribute`,
                    category: 'attribute_collector',
                    requirement_type: 'attribute_count',
                    requirement_value: count,
                    requirement_subtype: attribute,
                    icon: 'fas fa-star',
                    rewards: [
                        {
                            type: 'coin',
                            value: count * 50
                        },
                        {
                            type: 'item',
                            value: {
                                name: count >= 20 ? 'Attribute Essence' : 'Attribute Fragment',
                                category: 'ITEMS',
                                amount: Math.ceil(count / 5)
                            }
                        }
                    ],
                    order: index
                });
            });
        });

        // Currency earned achievements
        const currencyEarnedAchievements = [
            {
                name: 'Currency Collector I',
                description: 'Earn a total of 1,000 coins',
                category: 'currency_earned',
                requirement_type: 'currency_earned',
                requirement_value: 1000,
                icon: 'fas fa-coins',
                rewards: [
                    {
                        type: 'item',
                        value: {
                            name: 'Amulet Coin',
                            category: 'HELDITEMS',
                            amount: 1
                        }
                    }
                ],
                order: 1
            },
            {
                name: 'Currency Collector II',
                description: 'Earn a total of 10,000 coins',
                category: 'currency_earned',
                requirement_type: 'currency_earned',
                requirement_value: 10000,
                icon: 'fas fa-coins',
                rewards: [
                    {
                        type: 'item',
                        value: {
                            name: 'Lucky Egg',
                            category: 'HELDITEMS',
                            amount: 1
                        }
                    }
                ],
                order: 2
            },
            {
                name: 'Currency Collector III',
                description: 'Earn a total of 100,000 coins',
                category: 'currency_earned',
                requirement_type: 'currency_earned',
                requirement_value: 100000,
                icon: 'fas fa-coins',
                rewards: [
                    {
                        type: 'level',
                        value: 5
                    },
                    {
                        type: 'item',
                        value: {
                            name: 'Exp. Share',
                            category: 'HELDITEMS',
                            amount: 1
                        }
                    }
                ],
                order: 3
            },
            {
                name: 'Currency Collector IV',
                description: 'Earn a total of 1,000,000 coins',
                category: 'currency_earned',
                requirement_type: 'currency_earned',
                requirement_value: 1000000,
                icon: 'fas fa-coins',
                rewards: [
                    {
                        type: 'level',
                        value: 10
                    },
                    {
                        type: 'monster_random',
                        value: {
                            name: 'Golden Prize',
                            level: 50
                        }
                    }
                ],
                order: 4
            }
        ];

        // Currency spent achievements
        const currencySpentAchievements = [
            {
                name: 'Big Spender I',
                description: 'Spend a total of 1,000 coins',
                category: 'currency_spent',
                requirement_type: 'currency_spent',
                requirement_value: 1000,
                icon: 'fas fa-shopping-cart',
                rewards: [
                    {
                        type: 'coin',
                        value: 100
                    }
                ],
                order: 1
            },
            {
                name: 'Big Spender II',
                description: 'Spend a total of 10,000 coins',
                category: 'currency_spent',
                requirement_type: 'currency_spent',
                requirement_value: 10000,
                icon: 'fas fa-shopping-cart',
                rewards: [
                    {
                        type: 'coin',
                        value: 1000
                    }
                ],
                order: 2
            },
            {
                name: 'Big Spender III',
                description: 'Spend a total of 100,000 coins',
                category: 'currency_spent',
                requirement_type: 'currency_spent',
                requirement_value: 100000,
                icon: 'fas fa-shopping-cart',
                rewards: [
                    {
                        type: 'coin',
                        value: 10000
                    }
                ],
                order: 3
            },
            {
                name: 'Big Spender IV',
                description: 'Spend a total of 1,000,000 coins',
                category: 'currency_spent',
                requirement_type: 'currency_spent',
                requirement_value: 1000000,
                icon: 'fas fa-shopping-cart',
                rewards: [
                    {
                        type: 'coin',
                        value: 100000
                    }
                ],
                order: 4
            }
        ];

        // Combine all achievements
        const allAchievements = [
            ...levelAchievements,
            ...typeCollectorAchievements,
            ...monsterCollectorAchievements,
            ...attributeCollectorAchievements,
            ...currencyEarnedAchievements,
            ...currencySpentAchievements
        ];

        // Insert achievements into the database
        console.log(`Preparing to seed ${allAchievements.length} achievements...`);

        // Use a transaction for better performance and atomicity
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Clear existing achievements
            await client.query('DELETE FROM achievements');
            
            // Insert new achievements
            for (const achievement of allAchievements) {
                await client.query(`
                    INSERT INTO achievements (
                        name, description, category, requirement_type, requirement_value,
                        requirement_subtype, icon, rewards, is_hidden, is_secret, "order"
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    achievement.name,
                    achievement.description,
                    achievement.category,
                    achievement.requirement_type,
                    achievement.requirement_value,
                    achievement.requirement_subtype || null,
                    achievement.icon || 'fas fa-trophy',
                    JSON.stringify(achievement.rewards),
                    achievement.is_hidden || false,
                    achievement.is_secret || false,
                    achievement.order || 0
                ]);
            }

            await client.query('COMMIT');
            console.log(`Successfully seeded ${allAchievements.length} achievements`);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error seeding achievements:', error);
            throw error;
        } finally {
            client.release();
        }

        console.log('Achievement seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error in seed script:', error);
        process.exit(1);
    }
}

seedAchievements();
