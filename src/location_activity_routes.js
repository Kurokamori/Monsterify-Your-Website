// Location activity routes to be added to index.js

// Import required models
const LocationTaskPrompt = require('./models/LocationTaskPrompt');
const LocationReward = require('./models/LocationReward');
const LocationActivitySession = require('./models/LocationActivitySession');
const Trainer = require('./models/Trainer');
const Monster = require('./models/Monster');

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
      return res.redirect(/town/visit/activity-session/);
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
      return res.redirect(/town/visit/activity-session/);
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
      return res.redirect(/town/visit/activity-session/);
    }
    
    // Render the swab deck view
    res.render('town/pirates_dock/swab', {
      title: 'Swab the Deck',
      trainer,
      location: 'pirates_dock_swab',
      activity: 'swab',
      welcomeImage: 'https://i.imgur.com/RmKySNO.png',
      welcomeText: 'Ahoy there! The deck needs a good swabbing after last night\\'s storm. Grab a mop and help the crew keep the ship shipshape!'
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
      return res.redirect(/town/visit/activity-session/);
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
        redirect: /town/visit/activity-session/
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
      redirect: /town/visit/activity-session/
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
        activityUrl: /town/visit//
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
        redirect: /town/visit/activity-session/
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
    
    // Return success and redirect URL
    res.json({ 
      success: true, 
      redirect: /town/visit/activity-session/
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
