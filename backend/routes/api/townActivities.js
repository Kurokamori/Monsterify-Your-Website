const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const db = require('../../config/db');
const { buildRandomLimit, buildLimit } = require('../../utils/dbUtils');
const User = require('../../models/User');

/**
 * Get user settings for monster roller
 * @param {Object} user - User object
 * @returns {Object} User settings
 */
const getUserSettings = (user) => {
  // Default settings if user has no settings
  const defaultSettings = {
    pokemon: true,
    digimon: true,
    yokai: true,
    nexomon: true,
    pals: true,
    fakemon: true
  };

  // If user has monster_roller_settings, parse them
  if (user && user.monster_roller_settings) {
    try {
      // Check if settings is already an object
      let settings;
      if (typeof user.monster_roller_settings === 'object') {
        settings = user.monster_roller_settings;
      } else {
        settings = JSON.parse(user.monster_roller_settings);
      }
      return { ...defaultSettings, ...settings };
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

// Debug endpoint to check items in database
router.get('/debug/items', protect, async (req, res) => {
  try {
    const categories = await db.asyncAll('SELECT DISTINCT category FROM items ORDER BY category');
    const itemCount = await db.asyncGet('SELECT COUNT(*) as count FROM items');
    const sampleItems = await db.asyncAll('SELECT * FROM items LIMIT 10');

    res.json({
      success: true,
      data: {
        total_items: itemCount.count,
        categories: categories.map(c => c.category),
        sample_items: sampleItems
      }
    });
  } catch (error) {
    console.error('Error checking items:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking items',
      error: error.message
    });
  }
});

// Fallback location flavor text and images (used if database query fails)
const fallbackLocationFlavors = {
  pirates_dock: {
    swab: {
      image_url: 'https://i.imgur.com/RmKySNO.png',
      flavor_text: 'The deck is wet and slippery after last night\'s storm. The captain has ordered all hands to swab the deck until it shines. Grab a mop and get to work!'
    },
    fishing: {
      image_url: 'https://i.imgur.com/RmKySNO.png',
      flavor_text: 'The sea is calm today, perfect for fishing. The crew needs fresh fish for dinner. Grab a rod and see what you can catch!'
    }
  },
  garden: {
    tend: {
      image_url: 'https://i.imgur.com/Z5dNHXv.jpeg',
      flavor_text: 'The garden is full of beautiful plants that need your care. Some weeds have sprouted up, and the soil looks dry. Time to get your hands dirty!'
    }
  },
  farm: {
    work: {
      image_url: 'https://i.imgur.com/placeholder.jpg',
      flavor_text: 'The farm is bustling with activity. The crops need harvesting and the animals need feeding. Roll up your sleeves and get to work!'
    }
  }
};

// Fallback activity prompts (used if database query fails)
const fallbackActivityPrompts = {
  pirates_dock: {
    swab: [
      { id: 1, prompt_text: 'Swab the main deck until it shines like a new coin!' },
      { id: 2, prompt_text: 'Clean the captain\'s quarters and organize the navigation charts.' },
      { id: 3, prompt_text: 'Polish the brass railings and fixtures around the ship.' }
    ],
    fishing: [
      { id: 4, prompt_text: 'Catch at least three fish for the crew\'s dinner tonight.' },
      { id: 5, prompt_text: 'Try to catch a rare species that the cook has never seen before.' },
      { id: 6, prompt_text: 'Fish near the reef where the bigger catches are rumored to be.' }
    ]
  },
  garden: {
    tend: [
      { id: 7, prompt_text: 'Pull all the weeds and water the flower beds.' },
      { id: 8, prompt_text: 'Prune the rose bushes and fertilize the soil.' },
      { id: 9, prompt_text: 'Plant new seeds in the empty patches of the garden.' }
    ]
  },
  farm: {
    work: [
      { id: 10, prompt_text: 'Harvest the ripe vegetables from the fields.' },
      { id: 11, prompt_text: 'Feed and groom the farm animals.' },
      { id: 12, prompt_text: 'Repair the fence around the chicken coop.' }
    ]
  }
};

/**
 * Get location flavor from database
 * @param {string} location - Location identifier
 * @param {string} activity - Activity identifier
 * @returns {Promise<Object>} - Location flavor object
 */
async function getLocationFlavor(location, activity) {
  try {
    console.log(`Getting location flavor for location: ${location}, activity: ${activity}`);

    // Table creation removed for PostgreSQL compatibility
    // Tables should be created through proper migrations

    // Query the database for location flavor
    const params = [location];
    let query = `
      SELECT * FROM location_flavor
      WHERE location = $1
    `;
    query += buildLimit(1, params);

    const rows = await db.asyncAll(query, params);

    if (rows && rows.length > 0) {
      console.log(`Found flavor in database for ${location}:`, rows[0]);
      return {
        image_url: rows[0].image_url,
        flavor_text: rows[0].flavor_text
      };
    }

    // If no result from database, use fallback
    console.log(`No flavor found in database for ${location}, using fallback`);
    return fallbackLocationFlavors[location]?.[activity] || {
      image_url: 'https://i.imgur.com/placeholder.jpg',
      flavor_text: 'You begin your task, taking in the surroundings...'
    };
  } catch (error) {
    console.error('Error fetching location flavor:', error);
    // Return fallback if there's an error
    return fallbackLocationFlavors[location]?.[activity] || {
      image_url: 'https://i.imgur.com/placeholder.jpg',
      flavor_text: 'You begin your task, taking in the surroundings...'
    };
  }
}

/**
 * Get activity prompts from database
 * @param {string} location - Location identifier
 * @param {string} activity - Activity identifier
 * @returns {Promise<Array>} - Array of prompt objects
 */
async function getActivityPrompts(location, activity) {
  try {
    console.log(`Getting activity prompts for location: ${location}, activity: ${activity}`);

    // Table creation removed for PostgreSQL compatibility
    // Tables should be created through proper migrations

    // Query the database for activity prompts
    const query = `
      SELECT id, prompt_text, difficulty
      FROM location_prompts
      WHERE location = $1 AND activity = $2
    `;

    const rows = await db.asyncAll(query, [location, activity]);

    if (rows && rows.length > 0) {
      console.log(`Found ${rows.length} prompts in database for ${location}/${activity}`);
      return rows;
    }

    // If no results from database, use fallback
    console.log(`No prompts found in database for ${location}/${activity}, using fallback`);
    return fallbackActivityPrompts[location]?.[activity] || [
      { id: 999, prompt_text: 'Complete the activity to earn rewards.' }
    ];
  } catch (error) {
    console.error('Error fetching activity prompts:', error);
    // Return fallback if there's an error
    return fallbackActivityPrompts[location]?.[activity] || [
      { id: 999, prompt_text: 'Complete the activity to earn rewards.' }
    ];
  }
}

// In-memory storage for active sessions
const activeSessions = {};

/**
 * @route   POST /api/town/activities/start
 * @desc    Start a location activity
 * @access  Private
 */
router.post('/start', protect, async (req, res) => {
  try {
    const { location, activity } = req.body;
    const userId = req.user.discord_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!location || !activity) {
      return res.status(400).json({ success: false, message: 'Location and activity are required' });
    }

    // Check if the user already has an active session
    const userSessions = Object.values(activeSessions).filter(session =>
      session.user_id === userId && session.status === 'active'
    );

    if (userSessions.length > 0) {
      const activeSession = userSessions[0];
      return res.json({
        success: true,
        session_id: activeSession.session_id,
        redirect: `/town/activities/session/${activeSession.session_id}`
      });
    }

    // Get prompts from the database
    const prompts = await getActivityPrompts(location, activity);

    if (prompts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No prompts available for this location and activity'
      });
    }

    // Select a random prompt
    const randomPromptIndex = Math.floor(Math.random() * prompts.length);
    const prompt = prompts[randomPromptIndex];

    // Create a new session
    const sessionId = uuidv4();
    const session = {
      session_id: sessionId,
      user_id: userId,
      location,
      activity,
      prompt_id: prompt.id,
      difficulty: prompt.difficulty || 'normal',
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Store the session in memory
    activeSessions[sessionId] = session;

    // Try to store the session in the database for persistence
    try {
      // Check if we have a location_activity_sessions table (PostgreSQL compatible)
      let tableExists = false;
      try {
        if (require('../../utils/dbUtils').isPostgreSQL) {
          const result = await db.asyncGet(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'location_activity_sessions'"
          );
          tableExists = !!result;
        } else {
          const result = await db.asyncGet(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='location_activity_sessions'"
          );
          tableExists = !!result;
        }
      } catch (checkError) {
        console.log('Error checking for table existence:', checkError);
        tableExists = false;
      }

      if (tableExists) {
        // Insert the session into the database
        await db.asyncRun(
          `INSERT INTO location_activity_sessions
           (session_id, player_id, location, activity, prompt_id, difficulty, completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            sessionId,
            userId,
            location,
            activity,
            prompt.id,
            prompt.difficulty || 'normal',
            0
          ]
        );
        console.log('Session saved to database:', sessionId);
      } else {
        console.log('location_activity_sessions table does not exist - table creation should be handled by migrations');
        // Note: Table creation is commented out for PostgreSQL compatibility
        // Tables should be created through proper database migrations
      }
    } catch (dbError) {
      console.error('Error saving session to database:', dbError);
      // Continue with in-memory session if database save fails
    }

    res.json({
      success: true,
      session_id: sessionId,
      redirect: `/town/activities/session/${sessionId}`
    });
  } catch (error) {
    console.error('Error starting location activity:', error);
    res.status(500).json({ success: false, message: 'Failed to start activity' });
  }
});

/**
 * @route   GET /api/town/activities/session/:sessionId
 * @desc    Get session details
 * @access  Private
 */
router.get('/session/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.discord_id;

    console.log(`API: Fetching session details for session ID: ${sessionId}, user ID: ${userId}`);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // First try to get the session from memory
    let session = activeSessions[sessionId];
    let fromDatabase = false;

    // If not found in memory, try to get it from the database
    if (!session) {
      console.log(`API: Session ${sessionId} not found in memory, checking database...`);
      try {
        // Check if we have a location_activity_sessions table (PostgreSQL compatible)
        let tableExists = false;
        try {
          if (require('../../utils/dbUtils').isPostgreSQL) {
            const result = await db.asyncGet(
              "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'location_activity_sessions'"
            );
            tableExists = !!result;
          } else {
            const result = await db.asyncGet(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='location_activity_sessions'"
            );
            tableExists = !!result;
          }
        } catch (checkError) {
          console.log('Error checking for table existence:', checkError);
          tableExists = false;
        }

        if (tableExists) {
          // Try to get the session from the database
          const dbSession = await db.asyncGet(
            `SELECT * FROM location_activity_sessions WHERE session_id = $1`,
            [sessionId]
          );

          if (dbSession) {
            fromDatabase = true;
            console.log(`API: Session ${sessionId} found in database`);

            // Parse rewards if they exist
            let rewards = [];
            if (dbSession.rewards) {
              try {
                rewards = typeof dbSession.rewards === 'string'
                  ? JSON.parse(dbSession.rewards)
                  : dbSession.rewards;
              } catch (parseError) {
                console.error('Error parsing rewards JSON:', parseError);
                rewards = [];
              }
            }

            // Convert database session to memory session format
            session = {
              session_id: dbSession.session_id,
              user_id: dbSession.player_id,
              location: dbSession.location,
              activity: dbSession.activity,
              prompt_id: dbSession.prompt_id,
              status: dbSession.completed ? 'completed' : 'active',
              created_at: dbSession.created_at || dbSession.start_time,
              completed_at: dbSession.completed_at || dbSession.end_time,
              rewards: rewards
            };
          }
        }
      } catch (dbError) {
        console.error('Error fetching session from database:', dbError);
      }
    }

    if (!session) {
      console.log(`API: Session ${sessionId} not found in memory or database`);
      return res.status(404).json({
        success: false,
        message: 'Session not found or has expired',
        debug: { sessionId, userId, activeSessions: Object.keys(activeSessions) }
      });
    }

    // Get the prompt from the database
    let prompt;
    try {
      const prompts = await getActivityPrompts(session.location, session.activity);
      prompt = prompts.find(p => p.id === session.prompt_id);

      if (!prompt && prompts.length > 0) {
        // If we can't find the exact prompt, use the first one
        prompt = prompts[0];
      }
    } catch (promptError) {
      console.error('Error getting prompt:', promptError);
    }

    if (!prompt) {
      prompt = {
        id: session.prompt_id || 999,
        prompt_text: 'Complete the activity to earn rewards.',
        difficulty: 'normal'
      };
    }

    // Add the prompt difficulty to the session for reward generation
    session.difficulty = prompt.difficulty || 'normal';

    // Get the flavor from the database
    let flavor;
    try {
      flavor = await getLocationFlavor(session.location, session.activity);
    } catch (flavorError) {
      console.error('Error getting flavor:', flavorError);
    }

    if (!flavor) {
      flavor = {
        image_url: 'https://i.imgur.com/placeholder.jpg',
        flavor_text: 'You begin your task, taking in the surroundings...'
      };
    }

    console.log(`API: Successfully returning session ${sessionId} details`);

    res.json({
      success: true,
      session,
      prompt,
      flavor,
      debug: { fromDatabase, sessionId }
    });
  } catch (error) {
    console.error('Error getting session details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session details',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/town/activities/complete
 * @desc    Complete a location activity and generate rewards
 * @access  Private
 */
router.post('/complete', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.discord_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    // Get the session
    const session = activeSessions[sessionId];

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if the session belongs to the user
    if (session.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this session' });
    }

    // Check if the session is already completed
    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Session already completed' });
    }

    // Get the user's trainers for reward assignment
    let trainers = [];
    try {
      // Use the internal API to get the user's trainers
      const trainersResponse = await axios.get(`http://localhost:4890/api/trainers/user/${userId}`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });

      // Extract trainers from the response
      if (trainersResponse.data && trainersResponse.data.success && trainersResponse.data.data) {
        trainers = trainersResponse.data.data;
      } else if (trainersResponse.data && Array.isArray(trainersResponse.data)) {
        trainers = trainersResponse.data;
      } else if (trainersResponse.data && trainersResponse.data.trainers) {
        trainers = trainersResponse.data.trainers;
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
      // Continue with empty trainers array if there's an error
    }

    // Get user settings for monster rolling
    const userSettings = getUserSettings(req.user);

    // Generate rewards
    const rewards = await generateActivityRewards(session, trainers, userSettings);

    // Update session status
    session.status = 'completed';
    session.rewards = rewards;

    // Try to update the session in the database
    try {
      // Check if we have a location_activity_sessions table (PostgreSQL compatible)
      let tableExists = false;
      try {
        if (require('../../utils/dbUtils').isPostgreSQL) {
          const result = await db.asyncGet(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'location_activity_sessions'"
          );
          tableExists = !!result;
        } else {
          const result = await db.asyncGet(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='location_activity_sessions'"
          );
          tableExists = !!result;
        }
      } catch (checkError) {
        console.log('Error checking for table existence:', checkError);
        tableExists = false;
      }

      if (tableExists) {
        // Update the session in the database
        await db.asyncRun(
          `UPDATE location_activity_sessions
           SET completed = TRUE,
           rewards = $2
           WHERE session_id = $1`,
          [
            sessionId,
            JSON.stringify(rewards),
          ]
        );
        console.log('Session updated in database:', sessionId);
      }
    } catch (dbError) {
      console.error('Error updating session in database:', dbError);
      // Continue with in-memory session if database update fails
    }

    res.json({
      success: true,
      session,
      rewards
    });
  } catch (error) {
    console.error('Error completing activity:', error);
    res.status(500).json({ success: false, message: 'Failed to complete activity' });
  }
});

/**
 * @route   POST /api/town/activities/claim
 * @desc    Claim a reward from a completed activity
 * @access  Private
 */
router.post('/claim', protect, async (req, res) => {
  try {
    const { sessionId, rewardId, trainerId, monsterName } = req.body;
    const userId = req.user.discord_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!sessionId || !rewardId || !trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, reward ID, and trainer ID are required'
      });
    }

    // Log the monster name if provided
    if (monsterName) {
      console.log(`Monster name provided for reward ${rewardId}: ${monsterName}`);
    }

    console.log(`Claiming reward ${rewardId} from session ${sessionId} for trainer ${trainerId} (Discord user ID: ${userId})`);

    // Get the session
    const session = activeSessions[sessionId];

    if (!session) {
      console.log(`Session ${sessionId} not found in memory, checking database...`);
      // Try to get the session from the database
      try {
        const tableExists = await db.asyncGet(
          "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'location_activity_sessions'"
        );

        if (tableExists) {
          const dbSession = await db.asyncGet(
            `SELECT * FROM location_activity_sessions WHERE session_id = $1`,
            [sessionId]
          );

          if (dbSession) {
            console.log(`Session ${sessionId} found in database, loading into memory`);
            // Parse rewards if they exist
            let rewards = [];
            if (dbSession.rewards) {
              try {
                rewards = typeof dbSession.rewards === 'string'
                  ? JSON.parse(dbSession.rewards)
                  : dbSession.rewards;
              } catch (parseError) {
                console.error('Error parsing rewards JSON:', parseError);
                rewards = [];
              }
            }

            // Convert database session to memory session format
            activeSessions[sessionId] = {
              session_id: dbSession.session_id,
              user_id: dbSession.player_id,
              location: dbSession.location,
              activity: dbSession.activity,
              prompt_id: dbSession.prompt_id,
              status: dbSession.completed ? 'completed' : 'active',
              created_at: dbSession.start_time,
              completed_at: dbSession.end_time,
              rewards: rewards
            };
          }
        }
      } catch (dbError) {
        console.error('Error fetching session from database:', dbError);
      }
    }

    // Check again after potential database retrieval
    if (!activeSessions[sessionId]) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Get the session (now it should be in memory)
    const updatedSession = activeSessions[sessionId];

    // Check if the session belongs to the user
    if (updatedSession.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to claim rewards from this session' });
    }

    // Check if the session is completed
    if (updatedSession.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot claim rewards from an incomplete session' });
    }

    // Find the reward
    const rewardIndex = updatedSession.rewards.findIndex(reward => reward.id === rewardId);

    if (rewardIndex === -1) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    // Check if the reward is already claimed
    if (updatedSession.rewards[rewardIndex].claimed) {
      return res.status(400).json({ success: false, message: 'Reward already claimed' });
    }

    // No need to verify the trainer belongs to the user - this was already checked when the trainer was selected
    // in the frontend, and we're trusting the trainerId provided in the request

    // Process the reward based on type
    const reward = updatedSession.rewards[rewardIndex];

    try {
      console.log(`Processing reward of type: ${reward.type}`);

      // Process the reward based on its type
      switch (reward.type) {
        case 'coin':
          // Add coins to trainer
          await addCoinsToTrainer(trainerId, reward.reward_data.amount);
          console.log(`Added ${reward.reward_data.amount} coins to trainer ${trainerId}`);
          break;

        case 'item':
          // Add item to trainer inventory
          await addItemToTrainerInventory(trainerId, reward.reward_data.name, reward.reward_data.quantity);
          console.log(`Added ${reward.reward_data.quantity} ${reward.reward_data.name} to trainer ${trainerId}`);
          break;

        // Experience case removed - we only use level rewards now

        case 'level':
          // Add levels to trainer or monster
          if (reward.reward_data.isMonster) {
            // Get a random monster from the trainer
            const trainerMonsters = await getTrainerMonsters(trainerId);

            if (trainerMonsters && trainerMonsters.length > 0) {
              // Select a random monster
              const randomIndex = Math.floor(Math.random() * trainerMonsters.length);
              const monster = trainerMonsters[randomIndex];

              // Add levels to the monster
              await addLevelsToMonster(monster.id, reward.reward_data.levels);
              console.log(`Added ${reward.reward_data.levels} level(s) to monster ${monster.id} (${monster.name || 'Unnamed'}) owned by trainer ${trainerId}`);

              // Update the reward data with the monster info
              reward.reward_data.monster_id = monster.id;
              reward.reward_data.monster_name = monster.name || 'Unnamed';
            } else {
              console.log(`No monsters found for trainer ${trainerId}, adding levels to trainer instead`);
              await addLevelsToTrainer(trainerId, reward.reward_data.levels);
            }
          } else {
            await addLevelsToTrainer(trainerId, reward.reward_data.levels);
            console.log(`Added ${reward.reward_data.levels} level(s) to trainer ${trainerId}`);
          }
          break;

        case 'monster':
          // Check if we have rolled monster data to create (like starter roller)
          if (reward.reward_data.rolled_monster) {
            console.log(`Creating monster from rolled data: ${reward.reward_data.monster_name || 'Unnamed'}`);

            // Get the trainer data 
            const trainer = await db.asyncGet(`SELECT * FROM trainers WHERE id = $1`, [trainerId]);
            if (!trainer) {
              throw new Error(`Trainer with ID ${trainerId} not found`);
            }

            // Get user for player_user_id
            const user = await db.asyncGet(`SELECT * FROM users WHERE discord_id = $1`, [trainer.discord_user_id || trainer.player_user_id]);
            if (!user) {
              throw new Error('User not found');
            }

            // Prepare monster data for database insertion (like starter roller does)
            const rolledMonster = reward.reward_data.rolled_monster;
            let monsterData = {
              trainer_id: trainerId,
              player_user_id: user.discord_id,
              name: monsterName || rolledMonster.name || `New ${rolledMonster.monster_type} Monster`,
              level: reward.reward_data.level || 1,
              img_link: null, // Don't add the species image link to the image URL
            };

            // Map the monster data to the monsters table schema (like starter roller)
            monsterData = {
              ...monsterData,
              species1: rolledMonster.species1 || rolledMonster.name,
              species2: rolledMonster.species2 || null,
              species3: rolledMonster.species3 || null,
              type1: rolledMonster.type1 || '',
              type2: rolledMonster.type2 || null,
              type3: rolledMonster.type3 || null,
              type4: rolledMonster.type4 || null,
              type5: rolledMonster.type5 || null,
              attribute: rolledMonster.attribute || null
            };

            // Add monster-type specific fields (like starter roller)
            if (rolledMonster.monster_type === 'pokemon') {
              monsterData.mon_index = rolledMonster.ndex || null;
            }

            // Initialize monster with stats, moves, abilities, etc.
            const MonsterInitializer = require('../../utils/MonsterInitializer');
            const initializedMonster = await MonsterInitializer.initializeMonster(monsterData);

            // Create monster using the Monster model (which handles field filtering)
            const Monster = require('../../models/Monster');
            const newMonster = await Monster.create(initializedMonster);

            console.log(`Successfully created monster ${newMonster.id} for trainer ${trainerId}`);

            // Update the reward data with the monster info
            reward.reward_data.monster_id = newMonster.id;
            reward.reward_data.monster_name = newMonster.name || 'Unnamed';
            reward.reward_data.monster_species = newMonster.species1 || 'Unknown';
            reward.reward_data.monster_image = rolledMonster.image_url || null;
            
            // Ensure proper species images are maintained for fusion display
            reward.reward_data.species1_image = rolledMonster.species1_image || rolledMonster.image_url || null;
            reward.reward_data.species2_image = rolledMonster.species2_image || null;
            reward.reward_data.species3_image = rolledMonster.species3_image || null;
          } else if (reward.reward_data.monster_id) {
            // Legacy support for already created monsters
            console.log(`Using pre-created monster ${reward.reward_data.monster_id} (${reward.reward_data.monster_name || 'Unnamed'})`);

            // Get the trainer data to pass to the monster update
            const trainer = await db.asyncGet(`SELECT * FROM trainers WHERE id = $1`, [trainerId]);
            if (!trainer) {
              throw new Error(`Trainer with ID ${trainerId} not found`);
            }

            // If the user provided a custom name, update the monster's name
            if (monsterName && monsterName.trim() !== '') {
              try {
                await db.asyncRun(
                  `UPDATE monsters SET name = $1 WHERE id = $2`,
                  [monsterName.trim(), reward.reward_data.monster_id]
                );

                // Update the reward data with the new name
                reward.reward_data.monster_name = monsterName.trim();
                console.log(`Updated pre-rolled monster name to: ${monsterName.trim()}`);
              } catch (nameError) {
                console.error('Error updating monster name:', nameError);
                // Continue with the original name if there's an error
              }
            }

            // Assign the pre-rolled monster to the claiming trainer
            try {
              await db.asyncRun(
                `UPDATE monsters SET trainer_id = $1, player_user_id = $2 WHERE id = $3`,
                [trainerId, trainer.discord_user_id || trainer.player_user_id, reward.reward_data.monster_id]
              );
              console.log(`Updated monster ${reward.reward_data.monster_id} trainer to: ${trainerId}`);

              // Check if monster exists and get its current data
              const existingMonster = await db.asyncGet(
                `SELECT * FROM monsters WHERE id = $1`,
                [reward.reward_data.monster_id]
              );

              if (existingMonster) {
                console.log(`Monster ${reward.reward_data.monster_id} successfully assigned to trainer`);
                // Monster already exists and is initialized, just update the reward data
                reward.reward_data.monster_name = existingMonster.name || reward.reward_data.monster_name || 'Unnamed';
                reward.reward_data.monster_species = existingMonster.species1 || 'Unknown';
                reward.reward_data.monster_image = reward.reward_data.species_image_url || existingMonster.img_link || null;
              } else {
                console.log(`Monster ${reward.reward_data.monster_id} not found, may have been deleted`);
                // Monster doesn't exist, we'll need to roll a new one
                throw new Error('Pre-rolled monster not found');
              }
            } catch (trainerError) {
              console.error('Error assigning pre-rolled monster to trainer:', trainerError);
              // Fall back to rolling a new monster
              throw trainerError;
            }
          } else {
            // If the monster wasn't pre-rolled, roll it now
            console.log('Monster was not pre-rolled, rolling now...');

            // Get monster data from the reward
            const monsterParams = reward.reward_data.params || {};
            const monsterData = reward.reward_data.monster_data || {};

            try {
              // Call the monster roller API to generate a monster
              const rolledMonster = await rollMonsterForTrainer(
                trainerId,
                monsterData.level || monsterParams.level || 5,
                monsterData.allowed_types || monsterParams.allowed_types || null,
                monsterData.isLegendary || monsterParams.isLegendary || false,
                monsterName, // Pass the monster name if provided
                userId // Pass the Discord user ID for proper tracking
              );

              if (rolledMonster && rolledMonster.id) {
                console.log(`Successfully rolled monster ${rolledMonster.id} (${rolledMonster.name || 'Unnamed'}) for trainer ${trainerId}`);

                // Initialize the monster with proper stats and moves using the complete monster data
                const MonsterInitializer = require('../../utils/MonsterInitializer');
                const initializedMonster = await MonsterInitializer.initializeMonster(rolledMonster);
                console.log('Monster initialized:', initializedMonster);

                // Update the reward data with the monster info
                reward.reward_data.monster_id = initializedMonster.id;
                reward.reward_data.monster_name = initializedMonster.name || 'Unnamed';
                reward.reward_data.monster_species = initializedMonster.species1 || 'Unknown';
                reward.reward_data.monster_image = initializedMonster.img_link || null;

                // Add additional monster details for the card display
                reward.reward_data.species1 = initializedMonster.species1;
                reward.reward_data.species2 = initializedMonster.species2;
                reward.reward_data.species3 = initializedMonster.species3;
                reward.reward_data.type1 = initializedMonster.type1;
                reward.reward_data.type2 = initializedMonster.type2;
                reward.reward_data.type3 = initializedMonster.type3;
                reward.reward_data.attribute = initializedMonster.attribute;
                reward.reward_data.level = initializedMonster.level;
                reward.reward_data.monster_type = initializedMonster.monster_type;

                // Monster count is calculated dynamically in queries, no need to update a column
              } else {
                console.error(`Failed to roll monster for trainer ${trainerId}`);
                throw new Error('Monster roller failed to create a monster');
              }
            } catch (monsterError) {
              console.error('Error rolling monster:', monsterError);
              throw monsterError;
            }
          }
          break;

        default:
          console.log(`Unknown reward type: ${reward.type}`);
      }

      // Mark the reward as claimed
      updatedSession.rewards[rewardIndex] = {
        ...reward,
        claimed: true,
        claimed_by: trainerId,
        claimed_at: new Date().toISOString()
      };

      // Try to update the session in the database
      try {
        const tableExists = await db.asyncGet(
          "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'location_activity_sessions'"
        );

        if (tableExists) {
          await db.asyncRun(
            `UPDATE location_activity_sessions
             SET rewards = $2
             WHERE session_id = $1`,
            [
              sessionId,
              JSON.stringify(updatedSession.rewards),
            ]
          );
          console.log(`Updated session ${sessionId} rewards in database`);
        }
      } catch (dbError) {
        console.error('Error updating session rewards in database:', dbError);
        // Continue with in-memory session if database update fails
      }

      console.log(`Successfully claimed reward ${rewardId} for trainer ${trainerId}`);

      // Add debug information for monster rewards
      if (reward.type === 'monster') {
        console.log(`Monster reward details:
          Monster ID: ${reward.reward_data.monster_id}
          Monster Name: ${reward.reward_data.monster_name}
          Trainer ID: ${trainerId}
          Claimed: ${updatedSession.rewards[rewardIndex].claimed}
          Claimed By: ${updatedSession.rewards[rewardIndex].claimed_by}
        `);

        // Double-check that the monster exists in the database
        try {
          const monsterCheck = await db.asyncGet(
            `SELECT * FROM monsters WHERE id = $1`,
            [reward.reward_data.monster_id]
          );

          if (monsterCheck) {
            console.log(`Monster ${reward.reward_data.monster_id} exists in database with trainer_id: ${monsterCheck.trainer_id}`);
          } else {
            console.error(`Monster ${reward.reward_data.monster_id} NOT FOUND in database!`);
          }
        } catch (checkError) {
          console.error('Error checking monster in database:', checkError);
        }
      }

      res.json({
        success: true,
        reward: updatedSession.rewards[rewardIndex]
      });
    } catch (error) {
      console.error('Error processing reward:', error);
      res.status(500).json({ success: false, message: 'Failed to process reward' });
    }
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, message: 'Failed to claim reward' });
  }
});

/**
 * @route   GET /api/town/activities/pirates-dock/status
 * @desc    Get pirates dock status
 * @access  Private
 */
router.get('/pirates-dock/status', protect, async (req, res) => {
  try {
    const userId = req.user.discord_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check for active sessions
    let userSessions = Object.values(activeSessions).filter(session =>
      session.user_id === userId &&
      session.status === 'active' &&
      session.location === 'pirates_dock'
    );

    // If we found completed sessions in memory, remove them
    Object.keys(activeSessions).forEach(sessionId => {
      const session = activeSessions[sessionId];
      if (session.user_id === userId && session.status === 'completed') {
        delete activeSessions[sessionId];
      }
    });

    // Re-filter after cleanup
    userSessions = Object.values(activeSessions).filter(session =>
      session.user_id === userId &&
      session.status === 'active' &&
      session.location === 'pirates_dock'
    );

    const activeSession = userSessions.length > 0 ? userSessions[0] : null;

    // In a real implementation, you would check for cooldowns in the database
    // For now, we'll just return mock cooldowns
    res.json({
      success: true,
      active_session: activeSession,
      cooldown: {
        swab: { active: false, time_remaining: '' },
        fishing: { active: false, time_remaining: '' }
      }
    });
  } catch (error) {
    console.error('Error getting pirates dock status:', error);
    res.status(500).json({ success: false, message: 'Failed to get pirates dock status' });
  }
});

/**
 * @route   GET /api/town/activities/garden/status
 * @desc    Get garden status
 * @access  Private
 */
router.get('/garden/status', protect, async (req, res) => {
  try {
    const userId = req.user.discord_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check for active sessions
    let userSessions = Object.values(activeSessions).filter(session =>
      session.user_id === userId &&
      session.status === 'active' &&
      session.location === 'garden'
    );

    // If we found completed sessions in memory, remove them
    Object.keys(activeSessions).forEach(sessionId => {
      const session = activeSessions[sessionId];
      if (session.user_id === userId && session.status === 'completed') {
        delete activeSessions[sessionId];
      }
    });

    // Re-filter after cleanup
    userSessions = Object.values(activeSessions).filter(session =>
      session.user_id === userId &&
      session.status === 'active' &&
      session.location === 'garden'
    );

    const activeSession = userSessions.length > 0 ? userSessions[0] : null;

    // In a real implementation, you would check for cooldowns in the database
    // For now, we'll just return mock cooldowns
    res.json({
      success: true,
      active_session: activeSession,
      cooldown: {
        tend: { active: false, time_remaining: '' }
      }
    });
  } catch (error) {
    console.error('Error getting garden status:', error);
    res.status(500).json({ success: false, message: 'Failed to get garden status' });
  }
});

/**
 * @route   GET /api/town/activities/farm/status
 * @desc    Get farm status
 * @access  Private
 */
router.get('/farm/status', protect, async (req, res) => {
  try {
    const userId = req.user.discord_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check for active sessions
    let userSessions = Object.values(activeSessions).filter(session =>
      session.user_id === userId &&
      session.status === 'active' &&
      session.location === 'farm'
    );

    // If we found completed sessions in memory, remove them
    Object.keys(activeSessions).forEach(sessionId => {
      const session = activeSessions[sessionId];
      if (session.user_id === userId && session.status === 'completed') {
        delete activeSessions[sessionId];
      }
    });

    // Re-filter after cleanup
    userSessions = Object.values(activeSessions).filter(session =>
      session.user_id === userId &&
      session.status === 'active' &&
      session.location === 'farm'
    );

    const activeSession = userSessions.length > 0 ? userSessions[0] : null;

    // In a real implementation, you would check for cooldowns in the database
    // For now, we'll just return mock cooldowns
    res.json({
      success: true,
      active_session: activeSession,
      cooldown: {
        work: { active: false, time_remaining: '' }
      }
    });
  } catch (error) {
    console.error('Error getting farm status:', error);
    res.status(500).json({ success: false, message: 'Failed to get farm status' });
  }
});

/**
 * Generate rewards for a completed activity
 * @param {Object} session - Activity session
 * @param {Array} trainers - User's trainers
 * @returns {Promise<Array>} Generated rewards
 */
async function generateActivityRewards(session, trainers = [], userSettings = {}) {
  const rewards = [];

  // Function to get a random trainer ID from the user's trainers
  const getRandomTrainerId = () => {
    if (!trainers || trainers.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * trainers.length);
    return trainers[randomIndex].id;
  };

  // Base coin amount depends on the location and activity
  let baseCoinAmount = 50; // Default
  let itemChance = 0.75; // Default 75% chance
  let levelChance = 0.5; // Default 50% chance (replacing experience chance)
  let monsterChance = 0.05; // Default 5% chance
  let itemCategory = null; // Specific item category
  let allowedMonsterTypes = null; // Allowed monster types
  let legendaryChance = 0; // Chance for legendary monsters
  let guaranteedMonster = false; // Flag to guarantee a monster reward
  let difficulty = 'normal'; // Default difficulty

  // Get the prompt difficulty if available
  if (session && session.difficulty) {
    difficulty = session.difficulty;
    console.log(`Activity difficulty: ${difficulty}`);
  }

  // Customize rewards based on location and activity
  if (session) {
    if (session.location === 'pirates_dock') {
      if (session.activity === 'swab') {
        baseCoinAmount = 60;
        itemChance = 0.8;
        itemCategory = 'any'; // Any item except key_items
        allowedMonsterTypes = null; // Default monster roll parameters
      } else if (session.activity === 'fishing') {
        baseCoinAmount = 70;
        monsterChance = 0.15; // Higher chance for monsters when fishing
        itemCategory = null; // Any item
        allowedMonsterTypes = ['Water', 'Ice', 'Dark']; // Only water, ice, and dark types

        // Hard fishing tasks always guarantee at least one monster
        if (difficulty === 'hard') {
          guaranteedMonster = true;
          console.log('Hard fishing task - guaranteeing a monster reward');
        }
      }
    } else if (session.location === 'garden') {
      baseCoinAmount = 55;
      levelChance = 0.6; // Higher chance for levels in garden (was expChance)
      itemCategory = 'berries'; // Only berry items
      allowedMonsterTypes = ['Grass', 'Bug', 'Ground', 'Normal']; // Only grass, bug, ground, and normal types
    } else if (session.location === 'farm') {
      baseCoinAmount = 65;
      itemChance = 0.85; // Higher chance for items in farm
      itemCategory = 'eggs'; // Only egg items
      monsterChance = 0.1; // Higher chance for monsters in farm
      allowedMonsterTypes = null; // Any monster type
    } else if (session.location === 'game_corner') {
      baseCoinAmount = 100; // Higher base coin amount
      itemChance = 0.9; // Very high chance for items
      monsterChance = 0.2; // Higher chance for monsters
      legendaryChance = 0.001; // 0.1% chance for legendary Pokémon
      itemCategory = 'any_except_key'; // Any item except keyitems
    }
  }

  // Generate coin reward (always included)
  rewards.push({
    id: `coin-${uuidv4()}`,
    type: 'coin',
    reward_type: 'coin',
    rarity: 'common',
    reward_data: {
      amount: Math.floor(Math.random() * 50) + baseCoinAmount, // baseCoinAmount to baseCoinAmount+50 coins
      title: 'Coins'
    },
    assigned_to: getRandomTrainerId(),
    claimed: false
  });

  // Generate item reward
  if (Math.random() < itemChance) {
    try {
      // Get items from database based on location and category
      let itemsFromDb = [];
      let rarity = 'uncommon';
      let categoryFilter = '';

      // Determine category filter based on location and activity
      if (itemCategory === 'berries') {
        categoryFilter = 'berries';
      } else if (itemCategory === 'eggs') {
        categoryFilter = 'eggs';
        rarity = 'rare';
      } else if (itemCategory === 'any_except_key') {
        // Any category except keyitems
        categoryFilter = 'NOT keyitems';
      } else if (session) {
        if (session.location === 'pirates_dock' && session.activity === 'fishing') {
          categoryFilter = 'items';
          rarity = Math.random() < 0.2 ? 'rare' : 'uncommon';
        } else if (session.location === 'garden') {
          categoryFilter = 'berries'; // Garden should give berries
        } else if (session.location === 'farm') {
          categoryFilter = 'eggs'; // Farm should give eggs
          rarity = Math.random() < 0.3 ? 'rare' : 'uncommon';
        }
      }

      // Query the database for items based on category and rarity
      let query = '';
      let params = [];

      if (categoryFilter === 'NOT keyitems') {
        // Special case for excluding key items
        query = `
          SELECT * FROM items
          WHERE "category" != 'keyitems'
        `;
        query += buildRandomLimit(20, params);
      } else if (categoryFilter) {
        // Filter by category
        // Add parameters first, then build the query with correct parameter indices
        params.push(categoryFilter, rarity);
        query = `
          SELECT * FROM items
          WHERE "category" = $1
          AND "rarity" = $2
        `;
        query += buildRandomLimit(10, params);
      } else {
        // No specific category, get random items
        query = `
          SELECT * FROM items
        `;
        query += buildRandomLimit(15, params);
      }

      // Execute the query
      console.log(`Executing item query: ${query} with params:`, params);
      itemsFromDb = await db.asyncAll(query, params);
      console.log(`Found ${itemsFromDb ? itemsFromDb.length : 0} items in database for category: ${categoryFilter}`);

      // If no items found in database, fall back to hardcoded items
      if (!itemsFromDb || itemsFromDb.length === 0) {
        console.log(`No items found in database for category: ${categoryFilter}, falling back to hardcoded items`);
        fallbackToHardcodedItems();
        return;
      }

      // Select a random item from the results
      const randomItem = itemsFromDb[Math.floor(Math.random() * itemsFromDb.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items

      // Use the item's rarity from the database if available
      if (randomItem.rarity) {
        rarity = randomItem.rarity;
      }

      // Add the item to rewards
      rewards.push({
        id: `item-${uuidv4()}`,
        type: 'item',
        reward_type: 'item',
        rarity: rarity,
        reward_data: {
          name: randomItem.name,
          quantity: quantity,
          title: `${quantity} ${randomItem.name}${quantity > 1 ? 's' : ''}`,
          description: randomItem.description || `A ${randomItem.name} from your adventure.`,
          image_url: randomItem.image_url || null,
          category: randomItem.category || 'items',
          effect: randomItem.effect || null
        },
        assigned_to: getRandomTrainerId(),
        claimed: false
      });

      console.log(`Added item reward: ${quantity} ${randomItem.name} (${rarity})`);
    } catch (error) {
      console.error('Error getting items from database:', error);
      // Fall back to hardcoded items if there's an error
      fallbackToHardcodedItems();
    }
  }

  // Fallback function for item rewards
  function fallbackToHardcodedItems() {
    // Different items based on location and category (hardcoded fallback)
    let items = ['Potion', 'Super Potion', 'Pokeball', 'Great Ball', 'Berry'];
    let rarity = 'uncommon';

    if (itemCategory === 'berries') {
      items = ['Oran Berry', 'Sitrus Berry', 'Pecha Berry', 'Cheri Berry', 'Leppa Berry', 'Lum Berry'];
    } else if (itemCategory === 'eggs') {
      items = ['Pokemon Egg', 'Mystery Egg', 'Rare Egg', 'Fossil Egg'];
      rarity = 'rare';
    } else if (itemCategory === 'any_except_key') {
      // Expanded item list excluding key items
      items = [
        'Potion', 'Super Potion', 'Hyper Potion', 'Max Potion', 'Full Restore',
        'Pokeball', 'Great Ball', 'Ultra Ball', 'Timer Ball', 'Dusk Ball',
        'Oran Berry', 'Sitrus Berry', 'Lum Berry', 'Rare Candy', 'PP Up',
        'Protein', 'Calcium', 'Iron', 'Zinc', 'Carbos', 'HP Up'
      ];
    } else if (session) {
      if (session.location === 'pirates_dock' && session.activity === 'fishing') {
        items = ['Water Stone', 'Fishing Rod', 'Net Ball', 'Dive Ball', 'Pearl', 'Mystic Water'];
        rarity = Math.random() < 0.2 ? 'rare' : 'uncommon';
      } else if (session.location === 'garden') {
        items = ['Miracle Seed', 'Berry', 'Leaf Stone', 'Mulch', 'Grass Gem', 'Rose Incense'];
      } else if (session.location === 'farm') {
        items = ['Moo Moo Milk', 'Fresh Water', 'Egg', 'Sweet Honey', 'Wool', 'Lucky Egg'];
        rarity = Math.random() < 0.3 ? 'rare' : 'uncommon';
      }
    }

    const randomItem = items[Math.floor(Math.random() * items.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items

    rewards.push({
      id: `item-${uuidv4()}`,
      type: 'item',
      reward_type: 'item',
      rarity: rarity,
      reward_data: {
        name: randomItem,
        quantity: quantity,
        title: `${quantity} ${randomItem}${quantity > 1 ? 's' : ''}`
      },
      assigned_to: getRandomTrainerId(),
      claimed: false
    });

    console.log(`Added fallback item reward: ${quantity} ${randomItem} (${rarity})`);
  }

  // Generate level reward
  if (Math.random() < levelChance) {
    const levels = Math.floor(Math.random() * 2) + 1; // 1-2 levels
    const isMonsterLevel = Math.random() > 1; // 30% chance it's for a monster, 70% for trainer

    rewards.push({
      id: `level-${uuidv4()}`,
      type: 'level',
      reward_type: 'level',
      rarity: 'uncommon',
      reward_data: {
        levels: levels,
        isMonster: isMonsterLevel,
        title: `${levels} Level${levels > 1 ? 's' : ''} ${isMonsterLevel ? 'for Monster' : 'for Trainer'}`
      },
      assigned_to: getRandomTrainerId(),
      claimed: false
    });
  }

  // Generate monster reward - either by chance or guaranteed for hard fishing tasks
  if (guaranteedMonster || Math.random() < monsterChance) {
    // Determine monster rarity
    let rarity = 'uncommon';
    let level = Math.floor(Math.random() * 10); // Level 5-15

    // Check for legendary chance (only for Game Corner)
    const isLegendary = session && session.location === 'game_corner' && Math.random() < legendaryChance;

    // For hard fishing tasks, increase the chance of rare monsters
    if (guaranteedMonster && Math.random() < 0.4) {
      rarity = 'rare';
      level = Math.floor(Math.random() * 5); // Level 10-25 for rare monsters
    } else if (isLegendary) {
      rarity = 'legendary';
      level = Math.floor(Math.random() * 5); // Level 40-60 for legendaries
    } else if (Math.random() < 0.2) {
      rarity = 'rare';
      level = Math.floor(Math.random() * 5); // Level 10-25 for rare monsters
    }

    // Different monster parameters based on location
    let monsterParams = {
      level: level,
      isLegendary: isLegendary,
      // Only set allowed_types, not specific species
      allowed_types: allowedMonsterTypes
    };

    let monsterTitle = 'Mystery Monster';

    if (session) {
      if (session.location === 'pirates_dock' && session.activity === 'fishing') {
        monsterTitle = guaranteedMonster ? 'Rare Water Monster' : 'Water Monster';
      } else if (session.location === 'garden') {
        monsterTitle = 'Grass Monster';
      } else if (session.location === 'farm') {
        monsterTitle = 'Farm Monster';
      } else if (session.location === 'game_corner') {
        monsterTitle = isLegendary ? 'Legendary Monster' : 'Game Corner Monster';
      }
    }

    // Create a pre-rolled monster data object with the necessary fields
    const monsterData = {
      // Basic monster data
      level: level,
      // Type restrictions - only restrict types, not species
      allowed_types: allowedMonsterTypes,
      // Rarity settings
      isLegendary: isLegendary,
      // Additional settings for the monster roller
      max_species: 2,
      max_types: 3,
      base_stage_only: true,
      digimon_ranks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C']
    };

    // Roll the monster BEFORE pushing the reward
    try {
      console.log(`Pre-rolling monster for reward with params:`, monsterParams);

      // Import the MonsterRoller class
      const MonsterRoller = require('../../models/MonsterRoller');
      
      // Transform userSettings to match MonsterRoller expected format
      const transformedUserSettings = {};
      if (userSettings) {
        Object.keys(userSettings).forEach(key => {
          transformedUserSettings[`${key}_enabled`] = userSettings[key];
        });
      }
      
      const monsterRoller = new MonsterRoller({
        seed: Date.now().toString(),
        userSettings: transformedUserSettings
      });

      // Roll a monster using the same method as starter roller
      const rollerParams = {
        tables: monsterRoller.enabledTables,
        // Only roll base stage or doesn't evolve (like starter roller)
        includeStages: ['Base Stage', 'Doesn\'t Evolve'],
        // No legendaries or mythicals for regular rewards
        legendary: isLegendary,
        mythical: false,
        // For Digimon, only roll Baby I, Baby II, and Child
        // For Yokai, only roll E, D, and C ranks (early stages)
        includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
        // Quantity settings
        species_min: 1,
        species_max: 2, // Max 2 species
        types_min: 1,
        types_max: 2  // Allow 1-2 types instead of forcing 3
      };

      // Add type restrictions if specified (use speciesTypesOptions for type filtering)
      if (allowedMonsterTypes && Array.isArray(allowedMonsterTypes) && allowedMonsterTypes.length > 0) {
        // Use speciesTypesOptions to restrict types, not includeTypes
        rollerParams.speciesTypesOptions = allowedMonsterTypes;
      }

      console.log('Rolling monster with params:', rollerParams);

      // Roll 1 monster using rollMany (like starter roller does)
      const rolledMonsters = await monsterRoller.rollMany(rollerParams, 1);
      
      if (!rolledMonsters || rolledMonsters.length === 0) {
        throw new Error('No monsters found with the given parameters');
      }
      
      const rolledMonster = rolledMonsters[0];

      if (rolledMonster) {
        console.log(`Successfully pre-rolled monster for reward: ${rolledMonster.name || 'Unnamed'} (${rolledMonster.monster_type})`);
        console.log('Rolled monster data:', rolledMonster);
        console.log('Monster image_url:', rolledMonster.image_url);
        console.log('Monster species1_image:', rolledMonster.species1_image);
        console.log('Monster species1:', rolledMonster.species1);

        // Add the rolled monster to the reward (don't create in DB yet, like starter roller)
        rewards.push({
          id: `monster-${uuidv4()}`,
          type: 'monster',
          reward_type: 'monster',
          rarity: rarity,
          reward_data: {
            params: monsterParams,
            level: level,
            title: monsterTitle,
            // Store the rolled monster data for later creation
            rolled_monster: rolledMonster,
            monster_name: rolledMonster.name || 'Unnamed',
            monster_species: rolledMonster.species1 || rolledMonster.name || 'Unknown',
            monster_image: rolledMonster.image_url || null, // Primary display image
            species1: rolledMonster.species1 || rolledMonster.name,
            species2: rolledMonster.species2 || null,
            species3: rolledMonster.species3 || null,
            type1: rolledMonster.type1 || '',
            type2: rolledMonster.type2 || null,
            type3: rolledMonster.type3 || null,
            attribute: rolledMonster.attribute || null,
            monster_type: rolledMonster.monster_type,
            // Include species image URLs for proper fusion display (like MonsterCard expects)
            species_image_url: rolledMonster.image_url || null, // Primary species image
            species1_image: rolledMonster.species1_image || rolledMonster.image_url || null,
            species2_image: rolledMonster.species2_image || null,
            species3_image: rolledMonster.species3_image || null,
            // Debug info
            debug_all_images: {
              image_url: rolledMonster.image_url,
              species1_image: rolledMonster.species1_image,
              species2_image: rolledMonster.species2_image
            }
          },
          assigned_to: null, // Will be assigned when claimed
          claimed: false
        });

        // Log if this was a guaranteed monster
        if (guaranteedMonster) {
          console.log('Added guaranteed pre-rolled monster reward for hard fishing task');
        }
      } else {
        // Fallback to the old method if monster rolling fails
        console.error('Failed to pre-roll monster, falling back to standard reward');
        fallbackMonsterReward();
      }
    } catch (error) {
      console.error('Error pre-rolling monster for reward:', error);
      // Fallback to the old method if there's an error
      fallbackMonsterReward();
    }

    // Fallback function to use if pre-rolling fails
    function fallbackMonsterReward() {
      rewards.push({
        id: `monster-${uuidv4()}`,
        type: 'monster',
        reward_type: 'monster',
        rarity: rarity,
        reward_data: {
          params: monsterParams,
          level: level,
          title: monsterTitle,
          // Add the monster data for the roller
          monster_data: monsterData
        },
        assigned_to: getRandomTrainerId(),
        claimed: false
      });
    }
  }

  return rewards;
}

/**
 * Add coins to a trainer
 * @param {string} trainerId - Trainer ID
 * @param {number} amount - Amount of coins to add
 * @returns {Promise<void>}
 */
async function addCoinsToTrainer(trainerId, amount) {
  try {
    // First, get the current trainer data
    const getTrainerQuery = `
      SELECT * FROM trainers
      WHERE id = $1
    `;

    const trainer = await db.asyncGet(getTrainerQuery, [trainerId]);

    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Calculate new currency value
    const currentCurrency = trainer.currency_amount || 0;
    const newCurrency = currentCurrency + amount;
    const totalEarnedCurrency = trainer.total_earned_currency || 0;
    const newTotalEarnedCurrency = totalEarnedCurrency + amount;

    // Update the trainer's currency
    const updateQuery = `
      UPDATE trainers
      SET currency_amount = $1, total_earned_currency = $2
      WHERE id = $3
    `;

    await db.asyncRun(updateQuery, [newCurrency, newTotalEarnedCurrency, trainerId]);

    console.log(`Added ${amount} coins to trainer ${trainerId}. New balance: ${newCurrency}`);
  } catch (error) {
    console.error('Error adding coins to trainer:', error);
    throw error;
  }
}

/**
 * Add item to trainer inventory
 * @param {string} trainerId - Trainer ID
 * @param {string} itemName - Item name
 * @param {number} quantity - Quantity to add
 * @returns {Promise<void>}
 */
async function addItemToTrainerInventory(trainerId, itemName, quantity) {
  try {
    // First, get the current trainer inventory
    const getInventoryQuery = `
      SELECT * FROM trainer_inventory
      WHERE trainer_id = $1
    `;

    const inventory = await db.asyncGet(getInventoryQuery, [trainerId]);

    if (!inventory) {
      // Create a new inventory entry if it doesn't exist
      const createInventoryQuery = `
        INSERT INTO trainer_inventory (trainer_id, items)
        VALUES ($1, $2)
      `;

      const initialItems = JSON.stringify({ [itemName]: quantity });
      await db.asyncRun(createInventoryQuery, [trainerId, initialItems]);

      console.log(`Created new inventory for trainer ${trainerId} with ${quantity} ${itemName}`);
      return;
    }

    // Parse the existing items JSON
    let items = {};
    try {
      items = JSON.parse(inventory.items || '{}');
    } catch (e) {
      console.error('Error parsing inventory items:', e);
      items = {};
    }

    // Update the item quantity
    items[itemName] = (items[itemName] || 0) + quantity;

    // Update the inventory
    const updateInventoryQuery = `
      UPDATE trainer_inventory
      SET items = $1
      WHERE trainer_id = $2
    `;

    await db.asyncRun(updateInventoryQuery, [JSON.stringify(items), trainerId]);

    console.log(`Added ${quantity} ${itemName} to trainer ${trainerId}'s inventory`);
  } catch (error) {
    console.error('Error adding item to trainer inventory:', error);
    throw error;
  }
}

// Experience function removed - we only use level rewards now

/**
 * Add levels to a trainer
 * @param {string} trainerId - Trainer ID
 * @param {number} levels - Number of levels to add
 * @returns {Promise<void>}
 */
async function addLevelsToTrainer(trainerId, levels) {
  try {
    // First, get the current trainer data
    const getTrainerQuery = `
      SELECT * FROM trainers
      WHERE id = $1
    `;

    const trainer = await db.asyncGet(getTrainerQuery, [trainerId]);

    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Calculate new level value
    const currentLevel = trainer.level || 1;
    const newLevel = currentLevel + levels;

    // Update the trainer's level
    const updateQuery = `
      UPDATE trainers
      SET level = $1
      WHERE id = $2
    `;

    await db.asyncRun(updateQuery, [newLevel, trainerId]);

    console.log(`Added ${levels} level(s) to trainer ${trainerId}. New level: ${newLevel}`);
  } catch (error) {
    console.error('Error adding levels to trainer:', error);
    throw error;
  }
}

/**
 * Get monsters for a trainer
 * @param {string} trainerId - Trainer ID
 * @returns {Promise<Array>} - Array of monsters
 */
async function getTrainerMonsters(trainerId) {
  try {
    // Query the database for monsters owned by this trainer
    const query = `
      SELECT * FROM monsters
      WHERE trainer_id = $1
    `;

    const monsters = await db.asyncAll(query, [trainerId]);
    return monsters || [];
  } catch (error) {
    console.error(`Error getting monsters for trainer ${trainerId}:`, error);
    return [];
  }
}

/**
 * Add levels to a monster
 * @param {string} monsterId - Monster ID
 * @param {number} levels - Number of levels to add
 * @returns {Promise<Object>} - Updated monster data
 */
async function addLevelsToMonster(monsterId, levels) {
  try {
    // Use the MonsterInitializer to level up the monster with proper mechanics
    const MonsterInitializer = require('../../utils/MonsterInitializer');

    // Level up the monster with proper stat calculation, EVs, friendship, and move learning
    const updatedMonster = await MonsterInitializer.levelUpMonster(monsterId, levels);

    console.log(`Successfully leveled up monster ${monsterId} to level ${updatedMonster.level} with proper stats, EVs, friendship, and moves`);
    return updatedMonster;
  } catch (error) {
    console.error(`Error adding levels to monster ${monsterId}:`, error);
    throw error;
  }
}

/**
 * Roll a monster for a trainer using the monster roller
 * @param {string} trainerId - Trainer ID
 * @param {number} level - Monster level
 * @param {Array} allowedTypes - Allowed monster types
 * @param {boolean} isLegendary - Whether the monster can be legendary
 * @param {string} customName - Custom name for the monster
 * @param {string} discordUserId - Discord user ID of the player
 * @returns {Promise<Object>} - The created monster
 */
/**
 * Roll a monster for a trainer using the monster roller
 * @param {string} trainerId - Trainer ID
 * @param {number} level - Monster level
 * @param {Array} allowedTypes - Allowed monster types
 * @param {boolean} isLegendary - Whether the monster can be legendary
 * @param {string} customName - Custom name for the monster
 * @param {string} discordUserId - Discord user ID of the player
 * @returns {Promise<Object>} - The created monster
 */
async function rollMonsterForTrainer(trainerId, level = 5, allowedTypes = null, isLegendary = false, customName = null, discordUserId = null) {
  try {
    console.log(`Rolling monster for trainer ${trainerId}, level ${level}, types ${JSON.stringify(allowedTypes)}, legendary ${isLegendary}, name ${customName || 'auto'}, discord ID ${discordUserId || 'none'}`);

    // Get the trainer data to pass to the monster roller
    const trainer = await db.asyncGet(`SELECT * FROM trainers WHERE id = $1`, [trainerId]);

    if (!trainer) {
      throw new Error(`Trainer with ID ${trainerId} not found`);
    }

    // Get user settings for monster roller
    let userSettings = {};
    try {
      if (discordUserId) {
        const userQuery = `SELECT monster_roller_settings FROM users WHERE discord_id = $1`;
        const user = await db.asyncGet(userQuery, [discordUserId]);
        if (user && user.monster_roller_settings) {
          try {
            userSettings = JSON.parse(user.monster_roller_settings);
            console.log(`Loaded user settings for monster roller: ${JSON.stringify(userSettings)}`);
          } catch (e) {
            console.error('Error parsing user monster roller settings:', e);
          }
        }
      }
    } catch (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      // Continue with default settings if there's an error
    }

    // Prepare monster roller parameters (like starter roller)
    const rollerParams = {
      tables: ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals'],
      // Only roll base stage or doesn't evolve (like starter roller)
      includeStages: ['Base Stage', 'Doesn\'t Evolve'],
      // No legendaries or mythicals for regular rewards
      legendary: isLegendary,
      mythical: false,
      // For Digimon, only roll Baby I, Baby II, and Child
      // For Yokai, only roll E, D, and C ranks (early stages)
      includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
      // Quantity settings
      species_min: 1,
      species_max: 2, // Max 2 species
      types_min: 1,
      types_max: 2  // Allow 1-2 types instead of forcing 3
    };

    // Add type restrictions if specified (use speciesTypesOptions for type filtering)
    if (allowedTypes && Array.isArray(allowedTypes) && allowedTypes.length > 0) {
      // Use speciesTypesOptions to restrict types, not includeTypes
      rollerParams.speciesTypesOptions = allowedTypes;
    }

    // Try to use the MonsterRoller API first
    try {
      console.log('Calling MonsterRoller API with params:', JSON.stringify(rollerParams));

      // Import the MonsterRoller class
      const MonsterRoller = require('../../models/MonsterRoller');
      
      // Transform userSettings to match MonsterRoller expected format
      const transformedUserSettings = {};
      if (userSettings) {
        Object.keys(userSettings).forEach(key => {
          transformedUserSettings[`${key}_enabled`] = userSettings[key];
        });
      }
      
      const monsterRoller = new MonsterRoller({
        seed: Date.now().toString(),
        userSettings: transformedUserSettings
      });

      console.log('Rolling monster with params:', rollerParams);

      // Roll 1 monster using rollMany (like starter roller does)
      const rolledMonsters = await monsterRoller.rollMany(rollerParams, 1);
      
      if (!rolledMonsters || rolledMonsters.length === 0) {
        throw new Error('No monsters found with the given parameters');
      }
      
      const rolledMonster = rolledMonsters[0];

      if (rolledMonster && rolledMonster.id) {
        console.log(`Successfully rolled monster via API: ${JSON.stringify(rolledMonster)}`);

        // Prepare monster data for database insertion (like starter roller does)
        let monsterData = {
          trainer_id: trainerId,
          player_user_id: discordUserId,
          name: customName || rolledMonster.name || `New ${rolledMonster.monster_type} Monster`,
          level: level,
          img_link: null, // Don't add the species image link to the image URL
        };

        // Map the monster data to the monsters table schema (like starter roller)
        monsterData = {
          ...monsterData,
          species1: rolledMonster.species1 || rolledMonster.name,
          species2: rolledMonster.species2 || null,
          species3: rolledMonster.species3 || null,
          type1: rolledMonster.type1 || '',
          type2: rolledMonster.type2 || null,
          type3: rolledMonster.type3 || null,
          type4: rolledMonster.type4 || null,
          type5: rolledMonster.type5 || null,
          attribute: rolledMonster.attribute || null
        };

        // Add monster-type specific fields (like starter roller)
        if (rolledMonster.monster_type === 'pokemon') {
          monsterData.mon_index = rolledMonster.ndex || null;
        }

        // Initialize monster with stats, moves, abilities, etc.
        const initializedMonster = await MonsterInitializer.initializeMonster(monsterData);

        // Create monster using the Monster model (which handles field filtering)
        const Monster = require('../../models/Monster');
        const newMonster = await Monster.create(initializedMonster);

        console.log(`Successfully created monster ${newMonster.id} for trainer ${trainerId}`);

        return newMonster;
      }

      console.log('MonsterRoller API did not return a valid monster, falling back to direct implementation');
    } catch (apiError) {
      console.error('Error using MonsterRoller API:', apiError);
      console.log('Falling back to direct implementation');
    }

    // Fallback: Direct implementation if the API fails
    try {
      console.log('Using direct implementation for monster rolling');

      // Create a new monster in the database
      const newMonsterId = await db.asyncGet(`SELECT MAX(id) + 1 as next_id FROM monsters`);
      const monsterId = newMonsterId ? newMonsterId.next_id : 1;

      // Use custom name if provided, otherwise generate a random name
      let monsterName;
      if (customName && customName.trim() !== '') {
        monsterName = customName.trim();
      } else {
        const names = ['Sparky', 'Bubbles', 'Leafy', 'Shadow', 'Fluffy', 'Rocky', 'Zappy', 'Frosty'];
        monsterName = names[Math.floor(Math.random() * names.length)];
      }
      console.log(`Using name for monster: ${monsterName}`);

      // Generate random species and types based on allowed types
      let species = 'Unknown';
      let type1 = 'Normal';
      let type2 = null;
      let type3 = null;

      // Determine how many types to generate (1-3)
      const numTypes = Math.floor(Math.random() * 3) + 1;

      if (allowedTypes && Array.isArray(allowedTypes) && allowedTypes.length > 0) {
        // Select random types from allowed types
        const selectedTypes = [];
        for (let i = 0; i < numTypes && i < allowedTypes.length; i++) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * allowedTypes.length);
          } while (selectedTypes.includes(allowedTypes[randomIndex]));

          selectedTypes.push(allowedTypes[randomIndex]);
        }

        // Assign types
        if (selectedTypes.length > 0) {
          type1 = selectedTypes[0].charAt(0).toUpperCase() + selectedTypes[0].slice(1);
        }
        if (selectedTypes.length > 1) {
          type2 = selectedTypes[1].charAt(0).toUpperCase() + selectedTypes[1].slice(1);
        }
        if (selectedTypes.length > 2) {
          type3 = selectedTypes[2].charAt(0).toUpperCase() + selectedTypes[2].slice(1);
        }

        // Map types to species - only use the primary type for species selection
        const typeSpeciesMap = {
          'water': ['Squirtle', 'Totodile', 'Mudkip', 'Froakie', 'Piplup'],
          'fire': ['Charmander', 'Cyndaquil', 'Torchic', 'Chimchar', 'Fennekin'],
          'grass': ['Bulbasaur', 'Chikorita', 'Treecko', 'Turtwig', 'Snivy'],
          'electric': ['Pikachu', 'Elekid', 'Mareep', 'Shinx', 'Helioptile'],
          'ice': ['Spheal', 'Snorunt', 'Swinub', 'Vanillite', 'Bergmite'],
          'dark': ['Poochyena', 'Houndour', 'Zorua', 'Pawniard', 'Deino'],
          'bug': ['Caterpie', 'Weedle', 'Scyther', 'Heracross', 'Larvesta'],
          'ground': ['Diglett', 'Sandshrew', 'Cubone', 'Phanpy', 'Trapinch'],
          'normal': ['Eevee', 'Teddiursa', 'Aipom', 'Meowth', 'Rattata']
        };

        // Pick a random species for the primary type
        const typeSpecies = typeSpeciesMap[type1.toLowerCase()] || ['Unknown'];
        species = typeSpecies[Math.floor(Math.random() * typeSpecies.length)];
      } else if (isLegendary) {
        // Legendary species
        const legendaries = ['Articuno', 'Zapdos', 'Moltres', 'Mewtwo', 'Lugia', 'Ho-Oh', 'Kyogre', 'Groudon', 'Rayquaza'];
        species = legendaries[Math.floor(Math.random() * legendaries.length)];

        // Legendary types
        const legendaryTypes = ['Psychic', 'Fire', 'Water', 'Electric', 'Ice', 'Dragon'];
        type1 = legendaryTypes[Math.floor(Math.random() * legendaryTypes.length)];

        // 50% chance for a second type
        if (Math.random() > 0.5) {
          let secondType;
          do {
            secondType = legendaryTypes[Math.floor(Math.random() * legendaryTypes.length)];
          } while (secondType === type1);
          type2 = secondType;
        }
      }

      // Generate random stats based on level
      const baseStats = 50;
      const statMultiplier = level / 5;
      const hp = Math.floor(baseStats + (Math.random() * 20) * statMultiplier);
      const atk = Math.floor(baseStats + (Math.random() * 20) * statMultiplier);
      const def = Math.floor(baseStats + (Math.random() * 20) * statMultiplier);
      const spa = Math.floor(baseStats + (Math.random() * 20) * statMultiplier);
      const spd = Math.floor(baseStats + (Math.random() * 20) * statMultiplier);
      const spe = Math.floor(baseStats + (Math.random() * 20) * statMultiplier);

      // Random friendship, gender, nature, characteristic
      const friendship = Math.floor(Math.random() * 70) + 30;
      const genders = ['Male', 'Female', 'Unknown'];
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const natures = ['Adamant', 'Brave', 'Bold', 'Relaxed', 'Modest', 'Quiet', 'Calm', 'Sassy', 'Timid', 'Hasty', 'Jolly', 'Naive'];
      const nature = natures[Math.floor(Math.random() * natures.length)];
      const characteristics = ['Likes to run', 'Proud of its power', 'Highly curious', 'Mischievous', 'Somewhat vain', 'Alert to sounds'];
      const characteristic = characteristics[Math.floor(Math.random() * characteristics.length)];

      // Note: Monster type is determined by the species data, not stored separately

      // Insert the new monster
      const insertQuery = `
        INSERT INTO monsters (
          id, name, species1, type1, type2, type3, level, trainer_id, discord_user_id, player_user_id,
          hp_total, atk_total, def_total, spa_total, spd_total, spe_total,
          friendship, gender, nature, characteristic
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `;

      await db.asyncRun(insertQuery, [
        monsterId, monsterName, species, type1, type2, type3, level, trainerId, discordUserId, discordUserId,
        hp, atk, def, spa, spd, spe,
        friendship, gender, nature, characteristic
      ]);

      console.log(`Created monster with ID ${monsterId}, name ${monsterName}, species ${species}, types ${type1}/${type2}/${type3}`);

      // Initialize the monster with proper stats and moves
      const MonsterInitializer = require('../../utils/MonsterInitializer');
      const initializedMonster = await MonsterInitializer.initializeMonster(monsterId);
      console.log('Directly created monster initialized:', initializedMonster);

      // Monster count is calculated dynamically in queries, no need to update a column

      // Return the initialized monster
      return initializedMonster;
    } catch (internalError) {
      console.error('Error in direct monster creation:', internalError);
      throw internalError;
    }
  } catch (error) {
    console.error('Error rolling monster for trainer:', error);
    throw error;
  }
}

/**
 * @route   POST /api/town/activities/clear-session
 * @desc    Clear completed session for user
 * @access  Private
 */
router.post('/clear-session', protect, async (req, res) => {
  try {
    const userId = req.user.discord_id;
    const { location } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Clear all completed sessions for this user and location
    Object.keys(activeSessions).forEach(sessionId => {
      const session = activeSessions[sessionId];
      if (session.user_id === userId && 
          (session.status === 'completed' || (location && session.location === location))) {
        delete activeSessions[sessionId];
        console.log(`Cleared session ${sessionId} for user ${userId}`);
      }
    });

    res.json({
      success: true,
      message: 'Sessions cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to clear sessions' });
  }
});

module.exports = router;
