/**
 * Seed script for creating initial achievements
 * Run with: node src/scripts/seed-achievements.js
 */

require('dotenv').config();
const pool = require('../db');
const Achievement = require('../models/Achievement');

// Run the seed function
seedAchievements().catch(err => {
    console.error('Error in seed script:', err);
    process.exit(1);
});

async function seedAchievements() {
    try {
        console.log('Starting achievement seeding...');

        // Ensure the achievements table exists
        await Achievement.createTableIfNotExists();

        // Create level achievements
        const levelAchievements = [];
        for (let level = 100; level <= 2000; level += 100) {
            levelAchievements.push({
                name: `Level ${level} Milestone`,
                description: `Reach trainer level ${level}`,
                category: 'level',
                requirement_type: 'level',
                requirement_value: level,
                icon: 'fas fa-level-up-alt',
                order: level / 100,
                rewards: [
                    {
                        type: 'coin',
                        value: level * 10
                    }
                ]
            });
        }

        // Create type collector achievements
        const types = [
            'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
            'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
            'Steel', 'Fairy'
        ];

        const typeCollectorAchievements = [];
        const typeCountThresholds = [1, 5, 10, 20, 100];

        types.forEach(type => {
            typeCountThresholds.forEach((count, index) => {
                typeCollectorAchievements.push({
                    name: `${type} Collector ${index + 1}`,
                    description: `Collect ${count} monsters with the ${type} type`,
                    category: 'type_collector',
                    requirement_type: 'type_count',
                    requirement_value: count,
                    requirement_subtype: type,
                    icon: 'fas fa-fire',
                    order: index,
                    rewards: [
                        {
                            type: 'coin',
                            value: count * 50
                        },
                        {
                            type: 'item',
                            value: `${type} Nurture Kit;EGGS;${Math.ceil(count / 5)}`
                        }
                    ]
                });
            });
        });

        // Create monster collector achievements
        const monsterCollectorAchievements = [];
        const monsterCountThresholds = [1, 5, 10, 20, 50, 100, 200, 500, 1000];

        monsterCountThresholds.forEach((count, index) => {
            monsterCollectorAchievements.push({
                name: `Monster Collector ${index + 1}`,
                description: `Collect ${count} monsters`,
                category: 'monster_collector',
                requirement_type: 'monster_count',
                requirement_value: count,
                icon: 'fas fa-dragon',
                order: index,
                rewards: [
                    {
                        type: 'coin',
                        value: count * 25
                    },
                    {
                        type: 'level',
                        value: Math.ceil(count / 20)
                    }
                ]
            });
        });

        // Create attribute collector achievements
        const attributes = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable', 'Variable'];
        const attributeCollectorAchievements = [];
        const attributeCountThresholds = [1, 5, 10, 20, 100];

        attributes.forEach(attribute => {
            attributeCountThresholds.forEach((count, index) => {
                attributeCollectorAchievements.push({
                    name: `${attribute} Collector ${index + 1}`,
                    description: `Collect ${count} monsters with the ${attribute} attribute`,
                    category: 'attribute_collector',
                    requirement_type: 'attribute_count',
                    requirement_value: count,
                    requirement_subtype: attribute,
                    icon: 'fas fa-gem',
                    order: index,
                    rewards: [
                        {
                            type: 'coin',
                            value: count * 40
                        }
                    ]
                });
            });
        });

        // Create currency earned achievements
        const currencyEarnedAchievements = [];
        const currencyEarnedThresholds = [1000, 10000, 100000, 1000000];

        currencyEarnedThresholds.forEach((amount, index) => {
            currencyEarnedAchievements.push({
                name: `Currency Earned ${index + 1}`,
                description: `Earn a total of ${amount.toLocaleString()} coins`,
                category: 'currency_earned',
                requirement_type: 'currency_earned',
                requirement_value: amount,
                icon: 'fas fa-coins',
                order: index,
                rewards: [
                    {
                        type: 'coin',
                        value: Math.floor(amount / 10)
                    }
                ]
            });
        });

        // Create currency spent achievements
        const currencySpentAchievements = [];
        const currencySpentThresholds = [1000, 10000, 100000, 1000000];

        currencySpentThresholds.forEach((amount, index) => {
            currencySpentAchievements.push({
                name: `Big Spender ${index + 1}`,
                description: `Spend a total of ${amount.toLocaleString()} coins`,
                category: 'currency_spent',
                requirement_type: 'currency_spent',
                requirement_value: amount,
                icon: 'fas fa-shopping-cart',
                order: index,
                rewards: [
                    {
                        type: 'coin',
                        value: Math.floor(amount / 20)
                    },
                    {
                        type: 'monster_random',
                        value: {
                            type_pool: ['Normal', 'Fire', 'Water', 'Electric', 'Grass'],
                            attribute_pool: ['Vaccine', 'Data', 'Virus']
                        }
                    }
                ]
            });
        });

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
