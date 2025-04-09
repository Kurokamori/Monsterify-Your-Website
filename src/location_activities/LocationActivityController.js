/**
 * Location Activity Controller
 * Handles requests related to location activities
 */

const LocationActivityService = require('./LocationActivityService');
const LocationActivitySession = require('../models/LocationActivitySession');
const Trainer = require('../models/Trainer');
const RewardSystem = require('../utils/RewardSystem');
const Monster = require('../models/Monster');

class LocationActivityController {
  /**
   * Show available locations
   */
  static async showLocations(req, res) {
    try {
      // Get all trainers for the user
      const trainers = await Trainer.getByUserId(req.session.user.discord_id);

      // Define available locations
      const locations = [
        {
          id: 'garden',
          name: 'Garden',
          activity: 'tend',
          description: 'Tend to the garden and grow berries',
          image: '/images/locations/garden.jpg',
          color: 'green'
        },
        {
          id: 'farm',
          name: 'Farm',
          activity: 'work',
          description: 'Work on the farm and tend to the animals',
          image: '/images/locations/farm.jpg',
          color: 'orange'
        },
        {
          id: 'pirates_dock_fishing',
          name: 'Pirate\'s Dock - Fishing',
          activity: 'fishing',
          description: 'Go fishing at the pirate\'s dock',
          image: '/images/locations/pirates_dock.jpg',
          color: 'blue'
        },
        {
          id: 'pirates_dock_swab',
          name: 'Pirate\'s Dock - Swabbing',
          activity: 'swab',
          description: 'Swab the deck at the pirate\'s dock',
          image: '/images/locations/pirates_dock.jpg',
          color: 'blue'
        }
      ];

      res.render('town/location_activity', {
        title: 'Location Activities',
        locations,
        trainers
      });
    } catch (error) {
      console.error('Error showing locations:', error);
      res.status(500).send('Error loading locations');
    }
  }

  /**
   * Start an activity at a specific location
   */
  static async startActivity(req, res) {
    try {
      const { location, activity } = req.body;

      if (!location || !activity) {
        return res.status(400).json({ success: false, message: 'Location and activity are required' });
      }

      console.log('Starting activity with data:', { location, activity });

      // Validate location and activity
      const validLocations = ['garden', 'farm', 'pirates_dock_fishing', 'pirates_dock_swab'];
      const validActivities = {
        'garden': ['tend'],
        'farm': ['work'],
        'pirates_dock_fishing': ['fishing'],
        'pirates_dock_swab': ['swab']
      };

      if (!validLocations.includes(location)) {
        return res.status(400).json({ success: false, message: `Invalid location: ${location}` });
      }

      if (!validActivities[location] || !validActivities[location].includes(activity)) {
        return res.status(400).json({ success: false, message: `Invalid activity: ${activity} for location: ${location}` });
      }

      // Get a random prompt for the specific location and activity
      const prompt = await LocationActivityService.getRandomPrompt(location, activity);

      // Generate a random duration between 20 and 120 minutes
      const durationMinutes = Math.min(Math.floor(Math.random() * 101) + 20, 120);

      // Create a session object for the user's session
      const sessionObj = {
        id: Date.now().toString(),
        location,
        activity,
        prompt,
        durationMinutes,
        startTime: new Date(),
        endTime: new Date(Date.now() + durationMinutes * 60 * 1000)
      };

      // Store the session in the user's session
      req.session.activitySession = sessionObj;

      // Save the session to ensure it's persisted
      req.session.save(err => {
        if (err) {
          console.error('Error saving session:', err);
        }
      });

      // Create a new activity session in the database
      const dbSession = await LocationActivitySession.create({
        player_id: req.session.user.discord_id,
        location,
        activity,
          prompt_id: prompt.id || null, // Handle case where prompt.id might not exist
        duration_minutes: durationMinutes
      });

      return res.json({
        success: true,
        session_id: dbSession.session_id,
        redirect: `/town/activities/session/${location}/${activity}`
      });
    } catch (error) {
      console.error('Error starting activity:', error);
      res.status(500).json({ success: false, message: 'Error starting activity: ' + error.message });
    }
  }

  /**
   * Show the activity session page with timer
   */
  static async showSession(req, res) {
    try {
      const { location, activity } = req.params;

      console.log('Showing session for location:', location, 'activity:', activity);

      // Get the session from the user's session
      let session = req.session.activitySession;

      if (!session || session.location !== location || session.activity !== activity) {
        // If no session or mismatch, create a new session
        console.log('No matching session found, creating a new one');

        // Generate a random duration between 20 and 120 minutes
        const durationMinutes = Math.min(Math.floor(Math.random() * 101) + 20, 120);

        // Get a random prompt for the location
        const prompt = await LocationActivityService.getRandomPrompt(location, activity);

        // Create a new session
        session = {
          id: Date.now().toString(),
          location,
          activity,
          prompt,
          durationMinutes,
          startTime: new Date(),
          endTime: new Date(Date.now() + durationMinutes * 60 * 1000)
        };

        // Store the session
        req.session.activitySession = session;
      }

      // Ensure the session has a valid prompt
      if (!session.prompt || !session.prompt.text) {
        console.log('Session missing prompt, adding default prompt');
        session.prompt = {
          text: `Perform tasks at the ${location}.`,
          difficulty: 'normal'
        };
      }

      // Get the location color based on the actual location parameter
      const locationColors = {
        garden: 'green',
        farm: 'orange',
        pirates_dock_fishing: 'blue',
        pirates_dock_swab: 'pink'
      };

      // Set a default color if the location is not found
      const color = locationColors[location] || 'blue';

      console.log('Using color for location:', { location, color });
      console.log('Using color:', color, 'for location:', location);

      // Make sure the session has the correct location and activity
      session.location = location;
      session.activity = activity;

      // Update the session in the user's session
      req.session.activitySession = session;

      // Save the session to ensure it's persisted
      req.session.save(err => {
        if (err) {
          console.error('Error saving session:', err);
        }
      });

      res.render('town/activity_session', {
        title: 'Activity Session',
        session,
        color
      });
    } catch (error) {
      console.error('Error showing session:', error);
      res.status(500).send('Error loading session');
    }
  }

  /**
   * Complete an activity and show rewards
   */
  static async completeActivity(req, res) {
    try {
      // Get location and activity from form data or session
      let location, activity, prompt;

      // Try to get from form data first
      if (req.body.location && req.body.activity) {
        location = req.body.location;
        activity = req.body.activity;
        console.log('Using location and activity from form data:', { location, activity });
      }
      // Try to get from session as fallback
      else if (req.session.activitySession) {
        location = req.session.activitySession.location;
        activity = req.session.activitySession.activity;
        console.log('Using location and activity from session:', { location, activity });
      }

      // Log the request body and session for debugging
      console.log('Request body:', req.body);
      console.log('Session activity data:', req.session.activitySession);

      if (!location || !activity) {
        console.error('No location or activity found in request or session');
        return res.status(400).json({ success: false, message: 'Location and activity are required' });
      }

      // Get a random prompt for the location
      prompt = await LocationActivityService.getRandomPrompt(location, activity);

      // Get session data from user session or create a new one
      let session = req.session.activitySession || {
        id: Date.now().toString(),
        location,
        activity,
        prompt,
        durationMinutes: 60, // Default
        startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        endTime: new Date() // Now
      };

      // Calculate time spent in minutes
      const startTime = new Date(session.startTime);
      const endTime = new Date();
      const timeSpentMinutes = Math.max(1, Math.round((endTime - startTime) / (60 * 1000)));

      // Calculate productivity score based on time spent
      // Higher score for completing within the expected time frame
      let productivityScore = 100; // Default score

      if (timeSpentMinutes <= session.durationMinutes) {
        // Completed on time or early - bonus score
        productivityScore = Math.min(120, 100 + Math.round((session.durationMinutes - timeSpentMinutes) / session.durationMinutes * 20));
      } else if (timeSpentMinutes > session.durationMinutes * 2) {
        // Took more than twice the expected time - penalty
        productivityScore = Math.max(80, 100 - Math.round((timeSpentMinutes - session.durationMinutes) / session.durationMinutes * 10));
      }

      console.log('Activity completion metrics:', {
        sessionId: session.id,
        location: session.location,
        activity: session.activity,
        timeSpentMinutes,
        expectedDuration: session.durationMinutes,
        productivityScore
      });

      // Generate rewards based on location and productivity
      const rewards = await LocationActivityService.generateRewards(session.location, {
        productivityScore,
        timeSpent: timeSpentMinutes,
        difficulty: session.prompt?.difficulty || 'normal'
      });

      console.log('Raw rewards from LocationActivityService:', rewards);

      // Use RewardSystem to format rewards for display
      let formattedRewards;
      try {
        formattedRewards = RewardSystem.formatRewardsForView(rewards);
        console.log('Formatted rewards using RewardSystem:', formattedRewards.length);
      } catch (error) {
        console.error('Error formatting rewards with RewardSystem, using fallback:', error);

        // Fallback: Process rewards for display manually
        formattedRewards = rewards.map(reward => {
          // Ensure reward has an ID
          if (!reward.id && !reward.reward_id) {
            reward.id = `reward-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          } else if (!reward.id) {
            reward.id = reward.reward_id;
          }

          // Ensure reward has a type
          if (!reward.type && reward.reward_type) {
            reward.type = reward.reward_type;
          } else if (!reward.reward_type && reward.type) {
            reward.reward_type = reward.type;
          }

          // Add icon based on reward type
          let icon = 'fas fa-gift';
          switch (reward.type || reward.reward_type) {
            case 'monster':
              icon = 'fas fa-dragon';
              break;
            case 'item':
              icon = 'fas fa-box';
              break;
            case 'coin':
              icon = 'fas fa-coins';
              break;
            case 'level':
              icon = 'fas fa-level-up-alt';
              break;
          }

          return {
            ...reward,
            icon
          };
        });
      }

      // Process rewards to ensure they have all required properties
      const processedRewards = formattedRewards.map(reward => {
        return {
          ...reward,
          id: reward.id || reward.reward_id || `activity-reward-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: reward.type || reward.reward_type || 'unknown',
          reward_type: reward.reward_type || reward.type || 'unknown',
          data: reward.reward_data || reward.data || {},
          reward_data: reward.reward_data || reward.data || {}
        };
      });

      // Store rewards in session for claiming
      req.session.activityRewards = processedRewards;
      // Also store in req.session.rewards for compatibility
      req.session.rewards = processedRewards;

      // Try to find and update the database session if it exists
      let sessionId = null;
      try {
        // Get active sessions for the player
        const activeSessions = await LocationActivitySession.getActiveForPlayer(req.session.user.discord_id);

        // Find a matching session
        const dbSession = activeSessions.find(s =>
          s.location === location && s.activity === activity && !s.completed
        );

        if (dbSession) {
          console.log('Found matching database session, marking as completed:', dbSession.session_id);
          // Complete the session and store rewards
          const completedSession = await LocationActivitySession.complete(dbSession.session_id, formattedRewards);
          sessionId = completedSession.session_id;
          console.log('Session completed with ID:', sessionId);
        } else {
          console.log('No matching database session found, creating a new completed session');
          // Create a new completed session
          const newSession = await LocationActivitySession.create({
            player_id: req.session.user.discord_id,
            location,
            activity,
              prompt_id: prompt?.id || null, // Use null if prompt ID doesn't exist
            duration_minutes: session.durationMinutes || 60
          });

          // Mark it as completed
          const completedSession = await LocationActivitySession.complete(newSession.session_id, formattedRewards);
          sessionId = completedSession.session_id;
          console.log('New session created and completed with ID:', sessionId);
        }
      } catch (dbError) {
        console.error('Error updating database session:', dbError);
        // Continue anyway since we have the rewards in the user session
      }

      // Clear the activity session since it's completed
      req.session.activitySession = null;

      // Get trainers for the user
      const trainers = await Trainer.getByUserId(req.session.user.discord_id);

      // Render the rewards view
      res.render('town/rewards', {
        title: 'Activity Completed',
        message: `Great job completing your ${activity} at the ${location}!`,
        rewards: formattedRewards,
        trainers: trainers || [],
        source: 'location_activity',
        returnUrl: '/town/activities',
        productivityScore,
        sessionId: sessionId, // Pass the session ID to the view
        session: { session_id: sessionId } // Also pass as session object for consistency
      });

      // Store the session ID in the user session for later use
      req.session.lastActivitySessionId = sessionId;
    } catch (error) {
      console.error('Error completing activity:', error);
      res.status(500).json({ success: false, message: 'Error completing activity: ' + error.message });
    }
  }

  /**
   * Claim a reward
   */
  static async claimReward(req, res) {
    try {
      const { rewardId, rewardType, trainerId, session_id } = req.body;

      if (!rewardId || !rewardType || !trainerId) {
        return res.status(400).json({ success: false, message: 'Reward ID, type, and trainer ID are required' });
      }

      // Log the session_id if provided
      if (session_id) {
        console.log('Session ID provided:', session_id);
      }

      // Get the rewards from the session
      const rewards = req.session.activityRewards || [];

      // Find the reward
      const reward = rewards.find(r => r.id === rewardId);

      if (!reward) {
        return res.status(404).json({ success: false, message: 'Reward not found' });
      }

      // Get all trainers for the user
      const trainers = await Trainer.getByUserId(req.session.user.discord_id);

      // Process the reward claim
      let result;
      try {
        if (RewardSystem.processRewardClaim) {
          result = await RewardSystem.processRewardClaim(reward, trainerId, trainers, 'location_activity');
        } else {
          // Fallback if the method doesn't exist
          result = await this.processRewardClaimFallback(reward, trainerId, trainers);
        }
      } catch (error) {
        console.error('Error processing reward claim:', error);
        result = { success: false, message: 'Error processing reward: ' + error.message };
      }

      if (result.success) {
        // Mark the reward as claimed in the session
        const rewardIndex = rewards.findIndex(r => r.id === rewardId);
        if (rewardIndex !== -1) {
          rewards[rewardIndex].claimed = true;
          rewards[rewardIndex].claimedBy = trainerId;
        }

        // Update the session
        req.session.activityRewards = rewards;
      }

      res.json(result);
    } catch (error) {
      console.error('Error claiming reward:', error);
      res.status(500).json({ success: false, message: 'Error claiming reward' });
    }
  }
  /**
   * Fallback method for processing reward claims if RewardSystem.processRewardClaim is not available
   * @param {Object} reward - Reward object
   * @param {string} trainerId - Trainer ID
   * @param {Array} trainers - Array of trainer objects
   * @returns {Object} - Result object
   */
  static async processRewardClaimFallback(reward, trainerId, trainers) {
    try {
      // Find the trainer
      const trainer = trainers.find(t => t.id.toString() === trainerId.toString());

      if (!trainer) {
        return { success: false, message: 'Trainer not found' };
      }

      // Process the reward based on type
      const rewardType = reward.type || reward.reward_type;

      switch (rewardType) {
        case 'coin':
          // Add coins to trainer
          const coinAmount = reward.data?.amount || reward.reward_data?.amount || 100;
          await Trainer.update(trainer.id, {
            coins: trainer.coins + coinAmount
          });
          return {
            success: true,
            message: `Added ${coinAmount} coins to ${trainer.name}`,
            trainerId: trainer.id,
            trainerName: trainer.name
          };

        case 'level':
          // Add levels to trainer
          const levelAmount = reward.data?.levels || reward.reward_data?.levels || 1;
          await Trainer.update(trainer.id, {
            level: trainer.level + levelAmount
          });
          return {
            success: true,
            message: `Added ${levelAmount} levels to ${trainer.name}`,
            trainerId: trainer.id,
            trainerName: trainer.name
          };

        case 'item':
          // Add item to trainer's inventory
          const itemName = reward.data?.name || reward.reward_data?.name || 'Unknown Item';
          const itemQuantity = reward.data?.quantity || reward.reward_data?.quantity || 1;

          // Get current inventory
          let inventory = [];
          try {
            inventory = JSON.parse(trainer.inv_items || '[]');
          } catch (e) {
            console.error('Error parsing inventory:', e);
            inventory = [];
          }

          // Add item to inventory
          inventory.push({
            id: Date.now(),
            name: itemName,
            quantity: itemQuantity,
            description: reward.data?.description || reward.reward_data?.description || ''
          });

          // Update trainer
          await Trainer.update(trainer.id, {
            inv_items: JSON.stringify(inventory)
          });

          return {
            success: true,
            message: `Added ${itemQuantity} ${itemName} to ${trainer.name}'s inventory`,
            trainerId: trainer.id,
            trainerName: trainer.name
          };

        case 'monster':
          // Create a new monster for the trainer
          const Monster = require('../models/Monster');

          // Extract monster data
          const monsterData = reward.data || reward.reward_data || {};

          // Extract species information
          let species1 = null, species2 = null, species3 = null;
          if (monsterData.species) {
            if (Array.isArray(monsterData.species)) {
              [species1, species2, species3] = monsterData.species;
            } else {
              species1 = monsterData.species;
            }
          } else {
            species1 = monsterData.species1 || 'Unknown';
            species2 = monsterData.species2 || null;
            species3 = monsterData.species3 || null;
          }

          // Extract type information
          let type1 = null, type2 = null, type3 = null;
          if (monsterData.types) {
            if (Array.isArray(monsterData.types)) {
              [type1, type2, type3] = monsterData.types;
            } else {
              type1 = monsterData.types;
            }
          } else {
            type1 = monsterData.type1 || 'Normal';
            type2 = monsterData.type2 || null;
            type3 = monsterData.type3 || null;
          }

          // Extract level information
          let level = 1;
          if (monsterData.level) {
            level = monsterData.level;
          } else if (monsterData.minLevel && monsterData.maxLevel) {
            level = Math.floor(Math.random() * (monsterData.maxLevel - monsterData.minLevel + 1)) + monsterData.minLevel;
          }

          // Create the monster
          await Monster.create({
            trainer_id: trainer.id,
            player_user_id: trainer.player_user_id,
            name: species1,
            species1,
            species2,
            species3,
            type1,
            type2,
            type3,
            level
          });

          return {
            success: true,
            message: `Added a new ${species1} (Level ${level}) to ${trainer.name}'s team`,
            trainerId: trainer.id,
            trainerName: trainer.name
          };

        default:
          return { success: false, message: `Unsupported reward type: ${rewardType}` };
      }
    } catch (error) {
      console.error('Error in processRewardClaimFallback:', error);
      return { success: false, message: 'Error processing reward: ' + error.message };
    }
  }
}

module.exports = LocationActivityController;


