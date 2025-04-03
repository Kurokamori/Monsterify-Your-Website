// Location activity routes

// Import required models
const LocationTaskPrompt = require('./models/LocationTaskPrompt');
const LocationReward = require('./models/LocationReward');
const LocationActivitySession = require('./models/LocationActivitySession');
const Trainer = require('./models/Trainer');
const Monster = require('./models/Monster');
const pool = require('./db');
const RewardSystem = require('./utils/RewardSystem');
const GardenHarvest = require('./models/GardenHarvest');

// Add this at the top of the file with other imports
const locationColors = {
  garden: 'green',
  farm: 'orange',
  pirates_dock_fishing: 'blue',
  pirates_dock_swab: 'blue',
  // Add other locations as needed
};

// Export a function that takes the app instance
module.exports = function(app) {

// Garden - Tend Garden route
app.get('/town/visit/garden/tend', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get the user's Discord ID
    const discordUserId = req.session.user.discord_id || req.session.user.id;

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(discordUserId);
    if (!trainers || trainers.length === 0) {
      return res.redirect('/town/visit/garden?message=You need at least one trainer to tend the garden!&messageType=error');
    }

    // Use the first trainer
    const trainer = trainers[0];

    // Check if the user has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(discordUserId);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, redirect to it
      const activeSession = activeSessions[0];
      return res.redirect(`/town/visit/activity-session/${activeSession.session_id}`);
    }

    // Render the garden tend view
    res.render('town/garden/tend', {
      title: 'Tend Garden',
      trainer,
      location: 'garden',
      activity: 'tend',
      welcomeImage: 'https://i.imgur.com/Z5dNHXv.jpeg',
      welcomeText: 'Welcome to the garden! The plants need your care and attention. Help tend to them and you might find something interesting growing among the leaves.'
    });
  } catch (error) {
    console.error('Error loading tend garden page:', error);
    res.status(500).render('error', {
      message: 'Error loading tend garden page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});


// Farm - Work Farm route
app.get('/town/visit/farm/work', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, redirect to it
      const activeSession = activeSessions[0];
      return res.redirect(`/town/visit/activity-session/${activeSession.session_id}`);
    }

    // Render the farm work view
    res.render('town/farm/work', {
      title: 'Work the Farm',
      trainer,
      location: 'farm',
      activity: 'work',
      welcomeImage: 'https://i.imgur.com/fztdYkJ.png',
      welcomeText: 'Welcome to the farm! There\'s always work to be done here, from feeding animals to tending crops. Roll up your sleeves and get to work!'
    });
  } catch (error) {
    console.error('Error loading work farm page:', error);
    res.status(500).render('error', {
      message: 'Error loading work farm page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});


// Pirates Dock - Swab Deck route
app.get('/town/visit/pirates_dock/swab', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, redirect to it
      const activeSession = activeSessions[0];
      return res.redirect(`/town/visit/activity-session/${activeSession.session_id}`);
    }

    // Render the swab deck view
    res.render('town/pirates_dock/swab', {
      title: 'Swab the Deck',
      trainer,
      location: 'pirates_dock_swab',
      activity: 'swab',
      welcomeImage: 'https://i.imgur.com/RmKySNO.png',
      welcomeText: "Ahoy there! The deck needs a good swabbing after last night's storm. Grab a mop and help the crew keep the ship shipshape!"
    });
  } catch (error) {
    console.error('Error loading swab deck page:', error);
    res.status(500).render('error', {
      message: 'Error loading swab deck page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});


// Pirates Dock - Go Fishing route
app.get('/town/visit/pirates_dock/fishing', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, redirect to it
      const activeSession = activeSessions[0];
      return res.redirect(`/town/visit/activity-session/${activeSession.session_id}`);
    }

    // Render the fishing view
    res.render('town/pirates_dock/fishing', {
      title: 'Go Fishing',
      trainer,
      location: 'pirates_dock_fishing',
      activity: 'fishing',
      welcomeImage: 'https://i.imgur.com/RmKySNO.png',
      welcomeText: 'The sea is calm today, perfect for fishing! Grab a rod and see what you can catch. Who knows what might be lurking beneath the waves?'
    });
  } catch (error) {
    console.error('Error loading fishing page:', error);
    res.status(500).render('error', {
      message: 'Error loading fishing page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});


// Start activity session route
app.post('/town/visit/start-activity', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { location, activity } = req.body;

    if (!location || !activity) {
      return res.status(400).json({ success: false, message: 'Location and activity are required' });
    }

    // Get the user's Discord ID
    const discordUserId = req.session.user.discord_id || req.session.user.id;

    // Check if the user has an active session (using null for trainer_id to indicate it's a player activity)
    const activeSessions = await LocationActivitySession.getActiveForPlayer(discordUserId);

    if (activeSessions && activeSessions.length > 0) {
      // If there's an active session, return its ID
      const activeSession = activeSessions[0];
      return res.json({
        success: true,
        session_id: activeSession.session_id,
        redirect: `/town/visit/activity-session/${activeSession.session_id}`
      });
    }

    // Get a random task prompt for the location
    const prompt = await LocationTaskPrompt.getRandomForLocation(location);

    if (!prompt) {
      return res.status(404).json({ success: false, message: 'No prompts found for this location' });
    }

    // Generate a random duration between 20 and 120 minutes (capped at 120)
    let durationMinutes = Math.floor(Math.random() * 101) + 20; // 20 to 120 minutes
    durationMinutes = Math.min(durationMinutes, 120); // Ensure it doesn't exceed 120 minutes

    // Create a new activity session with player_id instead of trainer_id for garden activities
    const session = await LocationActivitySession.create({
      player_id: discordUserId,  // Use player_id for garden activities
      location,
      activity,
      prompt_id: prompt.prompt_id,
      duration_minutes: durationMinutes
    });

    console.log(`Created new activity session: ${JSON.stringify(session)}`);

    // Return the session ID and redirect URL
    res.json({
      success: true,
      session_id: session.session_id,
      redirect: `/town/visit/activity-session/${session.session_id}`
    });
  } catch (error) {
    console.error('Error starting activity session:', error);
    res.status(500).json({ success: false, message: 'Error starting activity session' });
  }
});


// Activity session route
app.get('/town/visit/activity-session/:sessionId', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { sessionId } = req.params;

    // Get the session
    const session = await LocationActivitySession.getById(sessionId);

    if (!session) {
      return res.status(404).render('error', {
        message: 'Activity session not found',
        error: { status: 404 },
        title: 'Error'
      });
    }

    // Check if the session belongs to the current user
    const discordUserId = req.session.user.discord_id || req.session.user.id;
    if (session.player_id !== discordUserId) {
      return res.status(403).render('error', {
        message: 'You do not have permission to view this session',
        error: { status: 403 },
        title: 'Error'
      });
    }

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the session is completed
    if (session.completed) {
      // If completed, show the rewards
      let rewards = [];
      try {
        console.log('Session rewards type:', typeof session.rewards);
        console.log('Session rewards value:', session.rewards);

        // Check if session.rewards is already an object or a JSON string
        if (typeof session.rewards === 'string') {
          console.log('Parsing rewards from string');
          rewards = JSON.parse(session.rewards);
        } else if (Array.isArray(session.rewards)) {
          console.log('Using rewards array directly');
          rewards = session.rewards;
        } else if (typeof session.rewards === 'object' && session.rewards !== null) {
          console.log('Using rewards object directly');
          rewards = session.rewards;
        }

        console.log('Parsed rewards:', JSON.stringify(rewards, null, 2));
      } catch (error) {
        console.error('Error parsing session rewards:', error);
      }

      // Process rewards to ensure they have the correct format
      const processedRewards = rewards.map(reward => {
        // Ensure reward has both reward_type and type
        if (!reward.reward_type && reward.type) {
          reward.reward_type = reward.type;
        } else if (!reward.type && reward.reward_type) {
          reward.type = reward.reward_type;
        }

        // Ensure reward has both reward_data and data
        if (!reward.reward_data && reward.data) {
          reward.reward_data = reward.data;
        } else if (!reward.data && reward.reward_data) {
          reward.data = reward.reward_data;
        }

        // For coin rewards, ensure amount is properly set
        if (reward.reward_type === 'coin' || reward.type === 'coin') {
          const coinData = reward.reward_data || reward.data || {};
          if (typeof coinData.amount === 'number') {
            // Make sure amount is accessible directly
            reward.amount = coinData.amount;
          } else if (coinData.amount && typeof coinData.amount === 'object') {
            // If amount is a range, pick a random value
            const min = coinData.amount.min || 50;
            const max = coinData.amount.max || 150;
            const randomAmount = Math.floor(Math.random() * (max - min + 1)) + min;
            reward.amount = randomAmount;
            reward.reward_data.amount = randomAmount;
            reward.data.amount = randomAmount;
          }
        }

        return reward;
      });

      console.log('Processed rewards for template:', JSON.stringify(processedRewards, null, 2));

      return res.render('town/activity_completed', {
        title: 'Activity Completed',
        trainer,
        session,
        rewards: processedRewards,
        activityUrl: '/town/visit/'
      });
    }

    // Calculate time remaining
    const startTime = new Date(session.start_time);
    const endTime = new Date(startTime.getTime() + (session.duration_minutes * 60 * 1000));
    const now = new Date();
    const timeRemaining = Math.max(0, endTime - now);
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));

    // Render the activity session view
    const color = locationColors[session.location] || 'blue'; // Default to blue if location not found
    res.render('town/activity_session', {
      title: 'Activity Session',
      trainer,
      session,
      minutesRemaining,
      endTime: endTime.toISOString(),
      color
    });
  } catch (error) {
    console.error('Error loading activity session page:', error);
    res.status(500).render('error', {
      message: 'Error loading activity session page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});


// API endpoint for claiming activity rewards
app.post('/api/activity/claim-reward', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
  }

  try {
    const { rewardId, rewardType, trainerId = 'random', sessionId } = req.body;

    if (!rewardId || !rewardType || !sessionId) {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    if (!trainers || trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'No trainers found for this user' });
    }

    // Get the session
    const session = await LocationActivitySession.getById(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Activity session not found' });
    }

    // Log the session for debugging
    console.log('Session found:', {
      session_id: session.session_id,
      rewards_type: typeof session.rewards,
      rewards_is_null: session.rewards === null,
      rewards_length: session.rewards ? (typeof session.rewards === 'string' ? session.rewards.length : Object.keys(session.rewards).length) : 0
    });

    // Check if the session belongs to the current user
    const discordUserId = req.session.user.discord_id || req.session.user.id;
    if (session.player_id !== discordUserId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to claim these rewards' });
    }

    // Get the rewards from the session
    let rewards = [];

    if (Array.isArray(session.rewards)) {
      rewards = session.rewards;
    } else if (typeof session.rewards === 'string') {
      try {
        rewards = JSON.parse(session.rewards);
      } catch (error) {
        console.error('Error parsing session rewards:', error);
      }
    } else if (typeof session.rewards === 'object' && session.rewards !== null) {
      rewards = session.rewards;
    }

    console.log('Parsed rewards:', typeof rewards, Array.isArray(rewards) ? rewards.length : 'not an array');

    // Find the reward
    const rewardIndex = rewards.findIndex(r => {
      // Check different possible ID properties
      const rewardIdStr = rewardId.toString();
      return (
        (r.reward_id && r.reward_id.toString() === rewardIdStr) ||
        (r.id && r.id.toString() === rewardIdStr)
      );
    });

    if (rewardIndex === -1) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    const reward = rewards[rewardIndex];

    // Check if the reward is already claimed
    if (reward.claimed) {
      return res.status(400).json({ success: false, message: 'Reward already claimed' });
    }

    // Select a trainer
    let selectedTrainer;
    if (trainerId === 'random') {
      // Randomly select a trainer
      const randomIndex = Math.floor(Math.random() * trainers.length);
      selectedTrainer = trainers[randomIndex];
    } else {
      // Find the specified trainer
      selectedTrainer = trainers.find(t => t.id.toString() === trainerId.toString());
      if (!selectedTrainer) {
        return res.status(404).json({ success: false, message: 'Trainer not found' });
      }
    }

    // Process the reward based on type
    if (rewardType === 'monster') {
      // Create a new monster for the trainer
      const monsterData = reward.reward_data;

      // Use the Monster model to create a new monster
      const newMonster = await Monster.create({
        trainer_id: selectedTrainer.id,
        species: monsterData.species || 'Unknown',
        species2: monsterData.species2 || null,
        species3: monsterData.species3 || null,
        type: monsterData.type || monsterData.type1 || 'Normal',
        type2: monsterData.type2 || null,
        type3: monsterData.type3 || null,
        type4: monsterData.type4 || null,
        type5: monsterData.type5 || null,
        attribute: monsterData.attribute || 'Data',
        level: monsterData.level || 1,
        nickname: null, // Will be set by user later
        image_url: monsterData.image_url || null
      });

      // Mark the reward as claimed
      rewards[rewardIndex].claimed = true;
      rewards[rewardIndex].claimed_by = selectedTrainer.id;
      rewards[rewardIndex].monster_id = newMonster.id;

    } else if (rewardType === 'item') {
      // Add the item to the trainer's inventory
      const itemData = reward.reward_data;
      const category = itemData.category || 'misc';
      const quantity = itemData.quantity || 1;

      // Get the trainer's inventory
      const inventoryQuery = `
        SELECT inv_${category} FROM trainers WHERE id = $1
      `;

      const inventoryResult = await pool.query(inventoryQuery, [selectedTrainer.id]);
      const inventory = inventoryResult.rows[0][`inv_${category}`] || [];

      // Add the item to the inventory
      const itemExists = inventory.findIndex(item => item.id === itemData.id);

      if (itemExists !== -1) {
        // Update existing item quantity
        inventory[itemExists].quantity += quantity;
      } else {
        // Add new item
        inventory.push({
          id: itemData.id,
          name: itemData.name,
          description: itemData.description,
          quantity: quantity,
          image: itemData.image || null
        });
      }

      // Update the trainer's inventory
      const updateQuery = `
        UPDATE trainers
        SET inv_${category} = $1
        WHERE id = $2
      `;

      await pool.query(updateQuery, [JSON.stringify(inventory), selectedTrainer.id]);

      // Mark the reward as claimed
      rewards[rewardIndex].claimed = true;
      rewards[rewardIndex].claimed_by = selectedTrainer.id;

    } else if (rewardType === 'coin') {
      // Add coins to the trainer's balance
      const coinAmount = reward.reward_data.amount || 0;

      await Trainer.update(selectedTrainer.id, {
        coins: selectedTrainer.coins + coinAmount
      });

      // Mark the reward as claimed
      rewards[rewardIndex].claimed = true;
      rewards[rewardIndex].claimed_by = selectedTrainer.id;

    } else if (rewardType === 'level') {
      // Handle level rewards
      const levelData = reward.reward_data;

      if (levelData.trainerLevelUp) {
        // Level up the trainer
        const levelsGained = levelData.levels || 1;

        await Trainer.update(selectedTrainer.id, {
          level: selectedTrainer.level + levelsGained
        });
      } else if (levelData.monsterId) {
        // Level up a specific monster
        const monsterId = levelData.monsterId;
        const levelsGained = levelData.levels || 1;

        // Get the monster
        const monster = await Monster.getById(monsterId);

        if (!monster) {
          return res.status(404).json({ success: false, message: 'Monster not found' });
        }

        // Check if the monster belongs to the trainer
        if (monster.trainer_id !== selectedTrainer.id) {
          return res.status(403).json({ success: false, message: 'This monster does not belong to the selected trainer' });
        }

        // Level up the monster
        await Monster.update(monsterId, {
          level: monster.level + levelsGained
        });
      }

      // Mark the reward as claimed
      rewards[rewardIndex].claimed = true;
      rewards[rewardIndex].claimed_by = selectedTrainer.id;
    }

    // Update the session with the updated rewards
    await pool.query(
      'UPDATE location_activity_sessions SET rewards = $1 WHERE session_id = $2',
      [JSON.stringify(rewards), sessionId]
    );

    // Return success with trainer info
    res.json({
      success: true,
      message: 'Reward claimed successfully',
      trainerName: selectedTrainer.name,
      trainerId: selectedTrainer.id
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, message: 'Error claiming reward: ' + error.message });
  }
});

// API endpoint for claiming all activity rewards
app.post('/api/activity/claim-all-rewards', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
  }

  try {
    const { rewards, trainerId = 'random', sessionId } = req.body;

    if (!rewards || !Array.isArray(rewards) || rewards.length === 0 || !sessionId) {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    if (!trainers || trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'No trainers found for this user' });
    }

    // Get the session
    const session = await LocationActivitySession.getById(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Activity session not found' });
    }

    // Check if the session belongs to the current user
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to claim these rewards' });
    }

    // Get the session rewards
    const sessionRewards = JSON.parse(session.rewards);

    // Process each reward
    const results = [];
    for (const reward of rewards) {
      // Find the reward in the session
      const rewardIndex = sessionRewards.findIndex(r => r.reward_id.toString() === reward.id.toString());

      if (rewardIndex === -1) {
        results.push({
          id: reward.id,
          type: reward.type,
          success: false,
          message: 'Reward not found'
        });
        continue;
      }

      const sessionReward = sessionRewards[rewardIndex];

      // Check if already claimed
      if (sessionReward.claimed) {
        results.push({
          id: reward.id,
          type: reward.type,
          success: false,
          message: 'Reward already claimed'
        });
        continue;
      }

      // Select a trainer
      let selectedTrainer;
      if (trainerId === 'random') {
        // Randomly select a trainer
        const randomIndex = Math.floor(Math.random() * trainers.length);
        selectedTrainer = trainers[randomIndex];
      } else {
        // Find the specified trainer
        selectedTrainer = trainers.find(t => t.id.toString() === trainerId.toString());
        if (!selectedTrainer) {
          results.push({
            id: reward.id,
            type: reward.type,
            success: false,
            message: 'Trainer not found'
          });
          continue;
        }
      }

      try {
        // Process based on reward type
        if (reward.type === 'monster') {
          // Create a new monster
          const monsterData = sessionReward.reward_data;

          const newMonster = await Monster.create({
            trainer_id: selectedTrainer.id,
            species: monsterData.species || 'Unknown',
            species2: monsterData.species2 || null,
            species3: monsterData.species3 || null,
            type: monsterData.type || monsterData.type1 || 'Normal',
            type2: monsterData.type2 || null,
            type3: monsterData.type3 || null,
            type4: monsterData.type4 || null,
            type5: monsterData.type5 || null,
            attribute: monsterData.attribute || 'Data',
            level: monsterData.level || 1,
            nickname: null
          });

          // Mark as claimed
          sessionRewards[rewardIndex].claimed = true;
          sessionRewards[rewardIndex].claimed_by = selectedTrainer.id;
          sessionRewards[rewardIndex].monster_id = newMonster.id;

        } else if (reward.type === 'item') {
          // Add item to inventory
          const itemData = sessionReward.reward_data;
          const category = itemData.category || 'misc';
          const quantity = itemData.quantity || 1;

          // Get inventory
          const inventoryQuery = `
            SELECT inv_${category} FROM trainers WHERE id = $1
          `;

          const inventoryResult = await pool.query(inventoryQuery, [selectedTrainer.id]);
          const inventory = inventoryResult.rows[0][`inv_${category}`] || [];

          // Add item
          const itemExists = inventory.findIndex(item => item.id === itemData.id);

          if (itemExists !== -1) {
            inventory[itemExists].quantity += quantity;
          } else {
            inventory.push({
              id: itemData.id,
              name: itemData.name,
              description: itemData.description,
              quantity: quantity,
              image: itemData.image || null
            });
          }

          // Update inventory
          const updateQuery = `
            UPDATE trainers
            SET inv_${category} = $1
            WHERE id = $2
          `;

          await pool.query(updateQuery, [JSON.stringify(inventory), selectedTrainer.id]);

          // Mark as claimed
          sessionRewards[rewardIndex].claimed = true;
          sessionRewards[rewardIndex].claimed_by = selectedTrainer.id;

        } else if (reward.type === 'coin') {
          // Add coins
          const coinAmount = sessionReward.reward_data.amount || 0;

          await Trainer.update(selectedTrainer.id, {
            currency_amount: (selectedTrainer.currency_amount || 0) + coinAmount,
            total_earned_currency: (selectedTrainer.total_earned_currency || 0) + coinAmount
          });

          // Mark as claimed
          sessionRewards[rewardIndex].claimed = true;
          sessionRewards[rewardIndex].claimed_by = selectedTrainer.id;

        } else if (reward.type === 'level') {
          // Handle level rewards
          const levelData = sessionReward.reward_data;

          if (levelData.trainerLevelUp) {
            // Level up trainer
            const levelsGained = levelData.levels || 1;

            await Trainer.update(selectedTrainer.id, {
              level: selectedTrainer.level + levelsGained
            });
          } else if (levelData.monsterId) {
            // Level up monster
            const monsterId = levelData.monsterId;
            const levelsGained = levelData.levels || 1;

            const monster = await Monster.getById(monsterId);

            if (!monster) {
              throw new Error('Monster not found');
            }

            if (monster.trainer_id !== selectedTrainer.id) {
              throw new Error('Monster does not belong to trainer');
            }

            await Monster.update(monsterId, {
              level: monster.level + levelsGained
            });
          }

          // Mark as claimed
          sessionRewards[rewardIndex].claimed = true;
          sessionRewards[rewardIndex].claimed_by = selectedTrainer.id;
        }

        // Add success result
        results.push({
          id: reward.id,
          type: reward.type,
          success: true,
          message: 'Reward claimed successfully',
          trainerName: selectedTrainer.name,
          trainerId: selectedTrainer.id
        });

      } catch (error) {
        console.error(`Error processing reward ${reward.id}:`, error);
        results.push({
          id: reward.id,
          type: reward.type,
          success: false,
          message: error.message
        });
      }
    }

    // Update the session with the updated rewards
    await pool.query(
      'UPDATE location_activity_sessions SET rewards = $1 WHERE session_id = $2',
      [JSON.stringify(sessionRewards), sessionId]
    );

    // Check if all rewards were processed successfully
    const allSuccessful = results.every(result => result.success);

    res.json({
      success: allSuccessful,
      message: allSuccessful ? 'All rewards claimed successfully' : 'Some rewards failed to process',
      claimedRewards: results
    });
  } catch (error) {
    console.error('Error claiming all rewards:', error);
    res.status(500).json({ success: false, message: 'Error claiming rewards: ' + error.message });
  }
});

// Activity rewards route
app.get('/town/rewards', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { source, session_id } = req.query;

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Get all trainers for the user (for reward assignment)
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    // If source is activity, get rewards from the completed session
    if (source === 'activity' && session_id) {
      // Get the session
      const session = await LocationActivitySession.getById(session_id);

      if (!session) {
        return res.status(404).render('error', {
          message: 'Activity session not found',
          error: { status: 404 },
          title: 'Error'
        });
      }

      // Check if the session belongs to the current user
      const discordUserId = req.session.user.discord_id || req.session.user.id;
      if (session.player_id !== discordUserId) {
        return res.status(403).render('error', {
          message: 'You do not have permission to view these rewards',
          error: { status: 403 },
          title: 'Error'
        });
      }

      // Check if the session is completed
      if (!session.completed) {
        return res.redirect(`/town/visit/activity-session/${session_id}`);
      }

      // Get the rewards from the session
      let sessionRewards = [];

      if (Array.isArray(session.rewards)) {
        sessionRewards = session.rewards;
      } else if (typeof session.rewards === 'string') {
        try {
          sessionRewards = JSON.parse(session.rewards);
        } catch (error) {
          console.error('Error parsing session rewards:', error);
        }
      } else if (typeof session.rewards === 'object' && session.rewards !== null) {
        sessionRewards = session.rewards;
      }

      console.log('Session rewards:', typeof sessionRewards, Array.isArray(sessionRewards) ? sessionRewards.length : 'not an array');

      // Format rewards for the view
      const formattedRewards = sessionRewards.map(reward => {
        // Create a formatted reward object
        const formattedReward = {
          id: reward.reward_id,
          type: reward.reward_type,
          rarity: reward.rarity,
          data: typeof reward.reward_data === 'string' ? JSON.parse(reward.reward_data) : reward.reward_data
        };

        // Add icon based on reward type
        switch (reward.reward_type) {
          case 'monster':
            formattedReward.icon = 'fas fa-dragon';
            break;
          case 'item':
            formattedReward.icon = 'fas fa-box';
            break;
          case 'coin':
            formattedReward.icon = 'fas fa-coins';
            break;
          case 'level':
            formattedReward.icon = 'fas fa-level-up-alt';
            break;
          default:
            formattedReward.icon = 'fas fa-gift';
        }

        return formattedReward;
      });

      // Render the rewards view
      return res.render('town/rewards', {
        title: 'Activity Rewards',
        pageTitle: `${session.activity.charAt(0).toUpperCase() + session.activity.slice(1)} Rewards`,
        pageSubtitle: `You've earned the following rewards for completing your ${session.activity} task:`,
        rewards: formattedRewards,
        trainers,
        allowTrainerSelection: true,
        showClaimAllButton: true,
        source: 'activity',
        returnUrl: `/town/visit`,
        returnButtonText: 'Return to Town'
      });
    }

    // Default rewards view (if no source or session_id provided)
    res.render('town/rewards', {
      title: 'Rewards',
      pageTitle: 'Rewards',
      pageSubtitle: 'You\'ve earned the following rewards:',
      rewards: [],
      trainers,
      allowTrainerSelection: true,
      showClaimAllButton: false,
      returnUrl: '/town/visit',
      returnButtonText: 'Return to Town'
    });
  } catch (error) {
    console.error('Error loading rewards page:', error);
    res.status(500).render('error', {
      message: 'Error loading rewards page',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Complete activity session route
app.post('/town/visit/complete-activity', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    // Get the session
    const session = await LocationActivitySession.getById(session_id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Activity session not found' });
    }

    // Check if the session belongs to the current user
    const discordUserId = req.session.user.discord_id || req.session.user.id;
    if (session.player_id !== discordUserId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to complete this session' });
    }

    // Check if the session is already completed
    if (session.completed) {
      return res.json({
        success: true,
        already_completed: true,
        redirect: `/town/visit/activity-session/${session_id}`
      });
    }

    // Get random rewards for the location
    // Number of rewards based on difficulty
    let rewardCount = 1;
    if (session.difficulty === 'normal') rewardCount = 2;
    if (session.difficulty === 'hard') rewardCount = 3;

    let rewards = await LocationReward.getRandomForLocation(session.location, rewardCount);

    // Ensure rewards have proper format
    rewards = rewards.map(reward => {
      // Make sure reward has a reward_id
      if (!reward.reward_id) {
        reward.reward_id = reward.id || Date.now() + Math.floor(Math.random() * 1000);
      }
      if (!reward.id) {
        reward.id = reward.reward_id;
      }

      // Make sure reward_data is an object
      if (typeof reward.reward_data === 'string') {
        try {
          reward.reward_data = JSON.parse(reward.reward_data);
        } catch (e) {
          console.error('Error parsing reward data:', e);
          reward.reward_data = { amount: 100 }; // Default fallback
        }
      } else if (reward.reward_data === null) {
        reward.reward_data = { amount: 100 }; // Default fallback for null
      }

      // Make sure reward has both data and reward_data properties
      if (!reward.data) {
        reward.data = { ...reward.reward_data };
      }

      // Make sure reward has both type and reward_type properties
      if (!reward.type && reward.reward_type) {
        reward.type = reward.reward_type;
      } else if (!reward.reward_type && reward.type) {
        reward.reward_type = reward.type;
      } else if (!reward.type && !reward.reward_type) {
        reward.type = 'generic';
        reward.reward_type = 'generic';
      }

      // For coin rewards, ensure amount is properly set
      if (reward.reward_type === 'coin' || reward.type === 'coin') {
        if (!reward.reward_data || typeof reward.reward_data !== 'object') {
          reward.reward_data = { amount: 100 };
          reward.data = { amount: 100 };
        } else if (!reward.reward_data.amount) {
          reward.reward_data.amount = 100;
          reward.data.amount = 100;
        } else if (typeof reward.reward_data.amount === 'object') {
          // If amount is a range, pick a random value
          const min = reward.reward_data.amount.min || 50;
          const max = reward.reward_data.amount.max || 150;
          const randomAmount = Math.floor(Math.random() * (max - min + 1)) + min;
          reward.reward_data.amount = randomAmount;
          reward.data.amount = randomAmount;
        }

        // Add amount directly to the reward object for easy access
        reward.amount = reward.reward_data.amount;

        // Add title for display
        reward.data.title = `${reward.data.amount} Coins`;
        reward.reward_data.title = `${reward.reward_data.amount} Coins`;
      }

      // For monster rewards, ensure species is properly set
      if (reward.reward_type === 'monster' || reward.type === 'monster') {
        if (!reward.reward_data.species && !reward.data.species) {
          reward.reward_data.species = ['Pokemon'];
          reward.data.species = ['Pokemon'];
        }
      }

      // For item rewards, ensure name is properly set
      if (reward.reward_type === 'item' || reward.type === 'item') {
        if (!reward.reward_data.name && !reward.data.name) {
          reward.reward_data.name = 'Unknown Item';
          reward.data.name = 'Unknown Item';
        }
      }

      return reward;
    });

    // Complete the session with rewards
    const completedSession = await LocationActivitySession.complete(session_id, rewards);

    // We don't need to format rewards anymore since we're using the original rewards
    // Just log them for debugging
    console.log('Rewards being saved to session:', JSON.stringify(rewards, null, 2));

    // Return success and redirect to rewards view
    res.json({
      success: true,
      redirect: `/town/rewards?source=activity&session_id=${session_id}`
    });
  } catch (error) {
    console.error('Error completing activity session:', error);
    res.status(500).json({ success: false, message: 'Error completing activity session' });
  }
});


// Claim reward route
app.post('/api/claim-reward', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'You must be logged in' });
  }

  try {
    const { reward_id, reward_type, session_id } = req.body;

    if (!reward_id || !reward_type || !session_id) {
      return res.status(400).json({ success: false, message: 'Reward ID, reward type, and session ID are required' });
    }

    // Get the session
    const session = await LocationActivitySession.getById(session_id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Activity session not found' });
    }

    // Check if the session belongs to the current user
    const discordUserId = req.session.user.discord_id || req.session.user.id;
    if (session.player_id !== discordUserId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to claim rewards from this session' });
    }

    // Check if the session is completed
    if (!session.completed) {
      return res.status(400).json({ success: false, message: 'Cannot claim rewards from an incomplete session' });
    }

    // Get the rewards from the session
    let rewards;
    try {
      // Check if session.rewards is already an object or a JSON string
      if (typeof session.rewards === 'string') {
        rewards = JSON.parse(session.rewards);
      } else if (typeof session.rewards === 'object') {
        rewards = session.rewards;
      } else {
        rewards = [];
      }
    } catch (error) {
      console.error('Error parsing session rewards:', error);
      rewards = [];
    }

    // Find the reward
    const rewardIndex = rewards.findIndex(r => r.reward_id == reward_id);

    if (rewardIndex === -1) {
      return res.status(404).json({ success: false, message: 'Reward not found in this session' });
    }

    const reward = rewards[rewardIndex];

    // Check if the reward type matches
    if (reward.reward_type !== reward_type) {
      return res.status(400).json({ success: false, message: 'Reward type mismatch' });
    }

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Process the reward based on type
    if (reward_type === 'monster') {
      // Add the monster to the trainer's team
      const monsterData = reward.reward_data;

      // Extract species information
      let speciesList = [];
      let monsterName = '';

      // Handle different species formats
      if (monsterData.species && typeof monsterData.species === 'string') {
        speciesList = [monsterData.species];
        monsterName = monsterData.species;
      } else if (monsterData.species && Array.isArray(monsterData.species)) {
        speciesList = monsterData.species.slice(0, 3); // Take up to 3 species
        monsterName = speciesList.join('/');
      } else if (monsterData.species1) {
        speciesList.push(monsterData.species1);
        if (monsterData.species2) speciesList.push(monsterData.species2);
        if (monsterData.species3) speciesList.push(monsterData.species3);
        monsterName = speciesList.join('/');
      } else {
        // Default fallback
        speciesList = ['Unknown'];
        monsterName = 'Unknown';
      }

      // Extract type information
      let types = [];
      if (monsterData.type1) {
        types.push(monsterData.type1);
        if (monsterData.type2) types.push(monsterData.type2);
        if (monsterData.type3) types.push(monsterData.type3);
      } else if (monsterData.types && Array.isArray(monsterData.types)) {
        types = monsterData.types.slice(0, 3); // Take up to 3 types
      } else {
        types = ['Normal']; // Default type
      }

      // Create the monster
      await Monster.create({
        trainer_id: trainer.id,
        player_user_id: trainer.player_user_id,
        name: monsterName,
        species1: speciesList[0] || 'Unknown',
        species2: speciesList[1] || null,
        species3: speciesList[2] || null,
        type1: types[0] || 'Normal',
        type2: types[1] || null,
        type3: types[2] || null,
        attribute: monsterData.attribute || 'Data',
        level: monsterData.level || 1
      });
    } else if (reward_type === 'item') {
      // Add the item to the trainer's inventory
      const itemData = reward.reward_data;

      // Get the item category (default to 'items' if not specified)
      const category = (itemData && itemData.category) ? itemData.category.toLowerCase() : 'items';

      // Get current inventory for this category
      const inventoryQuery = `SELECT inv_${category} FROM trainers WHERE id = $1`;
      const inventoryResult = await pool.query(inventoryQuery, [trainer.id]);

      // Parse the inventory
      let inventory = [];
      try {
        const currentInventory = inventoryResult.rows[0][`inv_${category}`];
        inventory = currentInventory ? (typeof currentInventory === 'string' ? JSON.parse(currentInventory) : currentInventory) : [];
      } catch (error) {
        console.error(`Error parsing inventory for category ${category}:`, error);
      }

      // Add the item to inventory
      inventory.push({
        id: itemData.id || Date.now(),
        name: itemData.name || 'Unknown Item',
        description: itemData.description || '',
        quantity: itemData.quantity || 1,
        icon: itemData.icon || null
      });

      // Update the trainer's inventory
      const updateQuery = `UPDATE trainers SET inv_${category} = $1 WHERE id = $2`;
      await pool.query(updateQuery, [JSON.stringify(inventory), trainer.id]);
    } else if (reward_type === 'coin') {
      // Add coins to the trainer's balance
      const coinAmount = reward.reward_data.amount || 0;

      await Trainer.update(trainer.id, {
        currency_amount: (trainer.currency_amount || 0) + coinAmount,
        total_earned_currency: (trainer.total_earned_currency || 0) + coinAmount
      });
    }

    // Mark the reward as claimed in the session
    rewards[rewardIndex].claimed = true;

    // Update the session with the updated rewards
    await pool.query(
      'UPDATE location_activity_sessions SET rewards = $1 WHERE session_id = $2',
      [JSON.stringify(rewards), session_id]
    );

    // Return success
    res.json({ success: true });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, message: 'Error claiming reward' });
  }
});

}; // End of module.exports function
