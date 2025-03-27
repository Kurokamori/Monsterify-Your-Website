/**
 * API Client for the Art Submission Calculator
 *
 * This module provides functions to fetch data from the server API.
 */

class ApiClient {
    /**
     * Fetch all trainers for the current user
     * @returns {Promise<Array>} Array of trainer objects
     */
    static async fetchUserTrainers() {
        try {
            console.log('ApiClient: Sending request to /api/user/trainers');
            const response = await fetch('/api/user/trainers');
            console.log('ApiClient: Received response from /api/user/trainers', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('ApiClient: Error response from /api/user/trainers:', errorText);
                throw new Error(`Failed to fetch trainers: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('ApiClient: Parsed trainer data:', data);

            // Check if we got valid data
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.warn('ApiClient: No trainers found in response');
            } else {
                console.log(`ApiClient: Successfully loaded ${data.length} trainers`);
            }

            return data;
        } catch (error) {
            console.error('ApiClient: Error fetching trainers:', error);
            throw new Error(`Failed to fetch trainers: ${error.message}`);
        }
    }

    /**
     * Fetch monsters for a specific trainer
     * @param {number} trainerId - The ID of the trainer
     * @returns {Promise<Array>} Array of monster objects
     */
    static async fetchTrainerMonsters(trainerId) {
        try {
            console.log(`ApiClient: Sending request to /api/trainers/${trainerId}/monsters`);
            const response = await fetch(`/api/trainers/${trainerId}/monsters`);
            console.log(`ApiClient: Received response from /api/trainers/${trainerId}/monsters`, response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`ApiClient: Error response from /api/trainers/${trainerId}/monsters:`, errorText);
                throw new Error(`Failed to fetch monsters: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`ApiClient: Parsed monster data for trainer ${trainerId}:`, data);

            // Check if we got valid data
            if (!data || !Array.isArray(data)) {
                console.warn(`ApiClient: Invalid monster data format for trainer ${trainerId}`);
            } else if (data.length === 0) {
                console.log(`ApiClient: No monsters found for trainer ${trainerId}`);
            } else {
                console.log(`ApiClient: Successfully loaded ${data.length} monsters for trainer ${trainerId}`);
            }

            return data;
        } catch (error) {
            console.error(`ApiClient: Error fetching monsters for trainer ${trainerId}:`, error);
            throw new Error(`Failed to fetch monsters for trainer ${trainerId}: ${error.message}`);
        }
    }

    /**
     * Fetch all trainers and their monsters
     * @returns {Promise<Object>} Object with trainers and monsters arrays
     */
    static async fetchAllTrainersAndMonsters() {
        try {
            console.log('ApiClient: Fetching user trainers...');
            let trainers = [];

            try {
                trainers = await this.fetchUserTrainers();
                console.log('ApiClient: Successfully fetched trainers:', trainers);
            } catch (trainerError) {
                console.error('ApiClient: Failed to fetch trainers:', trainerError.message);
                throw new Error(`Failed to fetch trainers: ${trainerError.message}`);
            }

            if (!trainers || trainers.length === 0) {
                console.warn('ApiClient: No trainers found, returning empty data');
                return { trainers: [], monsters: [], error: 'No trainers found' };
            }

            // For each trainer, fetch their monsters
            console.log('ApiClient: Fetching monsters for each trainer...');
            const monstersPromises = trainers.map(trainer => {
                console.log(`ApiClient: Fetching monsters for trainer ${trainer.id} (${trainer.name})`);
                return this.fetchTrainerMonsters(trainer.id)
                    .then(monsters => {
                        console.log(`ApiClient: Successfully fetched ${monsters?.length || 0} monsters for trainer ${trainer.id}`);
                        return { trainerId: trainer.id, monsters: monsters || [] };
                    })
                    .catch(error => {
                        console.error(`ApiClient: Error fetching monsters for trainer ${trainer.id}:`, error.message);
                        // Return empty monsters array for this trainer but don't fail the whole operation
                        return { trainerId: trainer.id, monsters: [] };
                    });
            });

            const monstersResults = await Promise.all(monstersPromises);
            console.log('ApiClient: All monster fetch operations completed');

            // Flatten the monsters array
            const monsters = monstersResults.reduce((allMonsters, result) => {
                if (!result.monsters || result.monsters.length === 0) {
                    return allMonsters;
                }

                return allMonsters.concat(
                    result.monsters.map(monster => {
                        const trainerName = trainers.find(t => t.id === result.trainerId)?.name || 'Unknown Trainer';
                        return {
                            ...monster,
                            trainer_id: result.trainerId,
                            trainer_name: trainerName
                        };
                    })
                );
            }, []);

            console.log(`ApiClient: Successfully loaded ${trainers.length} trainers and ${monsters.length} monsters`);
            return { trainers, monsters };
        } catch (error) {
            console.error('ApiClient: Error fetching trainers and monsters:', error.message);
            // Return an error object that the calculator can use to show a meaningful message
            return {
                trainers: [],
                monsters: [],
                error: `Failed to load trainers and monsters: ${error.message}`
            };
        }
    }

    /**
     * Apply levels to a trainer
     * @param {number} trainerId - The ID of the trainer
     * @param {number} levels - The number of levels to add
     * @param {number} coins - The number of coins to add
     * @returns {Promise<Object>} Updated trainer object
     */
    static async applyLevelsToTrainer(trainerId, levels, coins) {
        try {
            const response = await fetch(`/api/trainers/${trainerId}/apply-levels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ levels, coins })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to apply levels to trainer');
            }

            return await response.json();
        } catch (error) {
            console.error('Error applying levels to trainer:', error);
            throw error;
        }
    }

    /**
     * Apply levels to a monster
     * @param {number} monsterId - The ID of the monster
     * @param {number} levels - The number of levels to add
     * @param {number} coins - The number of coins to add to the trainer
     * @returns {Promise<Object>} Updated monster object
     */
    static async applyLevelsToMonster(monsterId, levels, coins) {
        try {
            const response = await fetch(`/api/monsters/${monsterId}/apply-levels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ levels, coins })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to apply levels to monster');
            }

            return await response.json();
        } catch (error) {
            console.error('Error applying levels to monster:', error);
            throw error;
        }
    }

    /**
     * Check if there are multiple monsters with the same name
     * @param {string} monsterName - The name to check
     * @param {Array} monsters - Array of monster objects
     * @returns {Array} Array of matching monsters
     */
    static findMonstersByName(monsterName, monsters) {
        return monsters.filter(monster =>
            monster.name.toLowerCase() === monsterName.toLowerCase());
    }

    /**
     * Find trainers by name
     * @param {string} trainerName - The name to check
     * @param {Array} trainers - Array of trainer objects
     * @returns {Array} Array of matching trainers
     */
    static findTrainersByName(trainerName, trainers) {
        return trainers.filter(trainer =>
            trainer.name.toLowerCase() === trainerName.toLowerCase());
    }

    /**
     * Level up a trainer by name
     * @param {string} trainerName - The name of the trainer to level up
     * @param {number} levels - The number of levels to add
     * @returns {Promise<Object>} Updated trainer object or error object
     */
    static async levelUpTrainerByName(trainerName, levels) {
        try {
            console.log(`ApiClient: Leveling up trainer ${trainerName} by ${levels} levels`);

            // Validate input
            if (!trainerName || trainerName.trim() === '') {
                throw new Error('Trainer name is required');
            }

            if (isNaN(levels) || levels <= 0) {
                throw new Error('Levels must be a positive number');
            }

            // Calculate coins (50 per level)
            const coins = levels * 50;

            // Fetch all trainers to find the one with the matching name
            const { trainers } = await this.fetchAllTrainersAndMonsters();

            if (!trainers || trainers.length === 0) {
                throw new Error('No trainers found. Please create a trainer first.');
            }

            // Find trainers with matching name
            const matchingTrainers = this.findTrainersByName(trainerName, trainers);

            if (matchingTrainers.length === 0) {
                throw new Error(`No trainer found with name "${trainerName}"`);
            }

            if (matchingTrainers.length > 1) {
                throw new Error(`Multiple trainers found with name "${trainerName}". Please be more specific.`);
            }

            // We have exactly one match
            const trainer = matchingTrainers[0];

            // Apply levels to the trainer
            const result = await this.applyLevelsToTrainer(trainer.id, levels, coins);

            return {
                success: true,
                trainer: result,
                message: `Successfully added ${levels} levels to ${trainerName}. New level: ${result.level}`
            };
        } catch (error) {
            console.error(`ApiClient: Error leveling up trainer ${trainerName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Level up a monster by name
     * @param {string} monsterName - The name of the monster to level up
     * @param {number} levels - The number of levels to add
     * @returns {Promise<Object>} Updated monster object or error object
     */
    static async levelUpMonsterByName(monsterName, levels) {
        try {
            console.log(`ApiClient: Leveling up monster ${monsterName} by ${levels} levels`);

            // Validate input
            if (!monsterName || monsterName.trim() === '') {
                throw new Error('Monster name is required');
            }

            if (isNaN(levels) || levels <= 0) {
                throw new Error('Levels must be a positive number');
            }

            // Calculate coins (50 per level)
            const coins = levels * 50;

            // Fetch all monsters to find the one with the matching name
            const { monsters } = await this.fetchAllTrainersAndMonsters();

            if (!monsters || monsters.length === 0) {
                throw new Error('No monsters found. Please create a monster first.');
            }

            // Find monsters with matching name
            const matchingMonsters = this.findMonstersByName(monsterName, monsters);

            if (matchingMonsters.length === 0) {
                throw new Error(`No monster found with name "${monsterName}"`);
            }

            if (matchingMonsters.length > 1) {
                throw new Error(`Multiple monsters found with name "${monsterName}". Please be more specific.`);
            }

            // We have exactly one match
            const monster = matchingMonsters[0];

            // Apply levels to the monster
            const result = await this.applyLevelsToMonster(monster.id, levels, coins);

            return {
                success: true,
                monster: result,
                message: `Successfully added ${levels} levels to ${monsterName}. New level: ${result.level}`
            };
        } catch (error) {
            console.error(`ApiClient: Error leveling up monster ${monsterName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Submit artwork with level assignments
     * @param {string} artworkUrl - URL to the artwork
     * @param {Array} levelAssignments - Array of objects with character names and level amounts
     * @returns {Promise<Object>} Result of the submission
     */
    static async submitArtwork(artworkUrl, levelAssignments) {
        try {
            console.log('ApiClient: Submitting artwork with level assignments');
            console.log('ApiClient: Artwork URL:', artworkUrl);
            console.log('ApiClient: Level assignments:', levelAssignments);

            // First, load trainers and monsters to match names
            const { trainers, monsters } = await this.fetchAllTrainersAndMonsters();

            if (!trainers || trainers.length === 0) {
                throw new Error('No trainers found. Please create a trainer first.');
            }

            // Process each level assignment
            const processedAssignments = [];
            const errors = [];
            let totalCoins = 0;

            for (const assignment of levelAssignments) {
                const { name, levels } = assignment;

                // Skip if no name or levels
                if (!name || !levels) {
                    continue;
                }

                // Calculate coins (50 per level)
                const coins = levels * 50;
                totalCoins += coins;

                // Try to find matching monster or trainer
                const matchingMonsters = this.findMonstersByName(name, monsters);
                const matchingTrainers = trainers.filter(trainer =>
                    trainer.name.toLowerCase() === name.toLowerCase());

                if (matchingMonsters.length === 1) {
                    // Exactly one monster match
                    const monster = matchingMonsters[0];
                    try {
                        const result = await this.applyLevelsToMonster(monster.id, levels, coins);
                        processedAssignments.push({
                            type: 'monster',
                            name: monster.name,
                            levels,
                            coins,
                            success: true,
                            result
                        });
                    } catch (error) {
                        errors.push(`Failed to apply levels to monster ${monster.name}: ${error.message}`);
                        processedAssignments.push({
                            type: 'monster',
                            name: monster.name,
                            levels,
                            coins,
                            success: false,
                            error: error.message
                        });
                    }
                } else if (matchingTrainers.length === 1) {
                    // Exactly one trainer match
                    const trainer = matchingTrainers[0];
                    try {
                        const result = await this.applyLevelsToTrainer(trainer.id, levels, coins);
                        processedAssignments.push({
                            type: 'trainer',
                            name: trainer.name,
                            levels,
                            coins,
                            success: true,
                            result
                        });
                    } catch (error) {
                        errors.push(`Failed to apply levels to trainer ${trainer.name}: ${error.message}`);
                        processedAssignments.push({
                            type: 'trainer',
                            name: trainer.name,
                            levels,
                            coins,
                            success: false,
                            error: error.message
                        });
                    }
                } else if (matchingMonsters.length > 1) {
                    // Multiple monster matches
                    errors.push(`Multiple monsters found with name "${name}". Please be more specific.`);
                    processedAssignments.push({
                        type: 'monster',
                        name,
                        levels,
                        coins,
                        success: false,
                        error: 'Multiple matches found'
                    });
                } else if (matchingTrainers.length > 1) {
                    // Multiple trainer matches
                    errors.push(`Multiple trainers found with name "${name}". Please be more specific.`);
                    processedAssignments.push({
                        type: 'trainer',
                        name,
                        levels,
                        coins,
                        success: false,
                        error: 'Multiple matches found'
                    });
                } else {
                    // No matches
                    errors.push(`No trainer or monster found with name "${name}".`);
                    processedAssignments.push({
                        type: 'unknown',
                        name,
                        levels,
                        coins,
                        success: false,
                        error: 'No matches found'
                    });
                }
            }

            // Return the results
            return {
                artworkUrl,
                totalCoins,
                assignments: processedAssignments,
                errors: errors.length > 0 ? errors : null,
                success: errors.length === 0
            };
        } catch (error) {
            console.error('ApiClient: Error submitting artwork:', error);
            throw new Error(`Failed to submit artwork: ${error.message}`);
        }
    }
}
