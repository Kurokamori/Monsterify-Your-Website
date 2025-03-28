// Location activity routes

// Import required models
const LocationTaskPrompt = require('./models/LocationTaskPrompt');
const LocationReward = require('./models/LocationReward');
const LocationActivitySession = require('./models/LocationActivitySession');
const Trainer = require('./models/Trainer');
const Monster = require('./models/Monster');
const pool = require('./db');

// Export a function that takes the app instance
module.exports = function(app) {

// Garden - Tend Garden route
app.get('/town/visit/garden/tend', async (req, res) => {
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

    // Get the trainer
    const trainer = await Trainer.getById(req.session.user.trainer_id);

    // Check if the trainer has an active session
    const activeSessions = await LocationActivitySession.getActiveForTrainer(trainer.id);

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

    // Generate a random duration between 20 and 60 minutes
    const durationMinutes = Math.floor(Math.random() * 41) + 20; // 20 to 60 minutes

    // Create a new activity session
    const session = await LocationActivitySession.create({
      trainer_id: trainer.id,
      location,
      activity,
      prompt_id: prompt.prompt_id,
      duration_minutes: durationMinutes
    });

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
    if (session.trainer_id !== req.session.user.trainer_id) {
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
      return res.render('town/activity_completed', {
        title: 'Activity Completed',
        trainer,
        session,
        rewards: JSON.parse(session.rewards),
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
    res.render('town/activity_session', {
      title: 'Activity Session',
      trainer,
      session,
      minutesRemaining,
      endTime: endTime.toISOString()
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

    // Check if the session belongs to the current user
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to claim these rewards' });
    }

    // Get the rewards from the session
    const rewards = JSON.parse(session.rewards);

    // Find the reward
    const rewardIndex = rewards.findIndex(r => r.reward_id.toString() === rewardId.toString());

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
            coins: selectedTrainer.coins + coinAmount
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
      if (session.trainer_id !== req.session.user.trainer_id) {
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
      const sessionRewards = JSON.parse(session.rewards);

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
    if (session.trainer_id !== req.session.user.trainer_id) {
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

    const rewards = await LocationReward.getRandomForLocation(session.location, rewardCount);

    // Complete the session with rewards
    const completedSession = await LocationActivitySession.complete(session_id, rewards);

    // Format rewards for the rewards view
    const formattedRewards = rewards.map(reward => {
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
    if (session.trainer_id !== req.session.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to claim rewards from this session' });
    }

    // Check if the session is completed
    if (!session.completed) {
      return res.status(400).json({ success: false, message: 'Cannot claim rewards from an incomplete session' });
    }

    // Get the rewards from the session
    const rewards = JSON.parse(session.rewards);

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

      // Create the monster
      await Monster.create({
        trainer_id: trainer.id,
        name: monsterData.species,
        species1: monsterData.species,
        type1: 'Normal', // Default type, should be replaced with actual type
        level: monsterData.level || 5
      });
    } else if (reward_type === 'item') {
      // Add the item to the trainer's inventory
      const itemData = reward.reward_data;

      // Update the trainer's inventory based on item type
      // This is a simplified version, you'll need to adapt it to your inventory system
      await Trainer.update(trainer.id, {
        inv_items: JSON.stringify([...JSON.parse(trainer.inv_items || '[]'), itemData])
      });
    } else if (reward_type === 'coin') {
      // Add coins to the trainer's balance
      const coinAmount = reward.reward_data.amount || 0;

      await Trainer.update(trainer.id, {
        coins: trainer.coins + coinAmount
      });
    }

    // Mark the reward as claimed in the session
    rewards[rewardIndex].claimed = true;

    // Update the session with the updated rewards
    await pool.query(
      'UPDATE location_activity_sessions SET rewards =  WHERE session_id = ',
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
