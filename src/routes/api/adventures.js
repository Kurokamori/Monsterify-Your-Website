const express = require('express');
const router = express.Router();
const Region = require('../../models/Region');
const Area = require('../../models/Area');
const Adventure = require('../../models/Adventure');
const DiscordService = require('../../utils/DiscordService');
const DiscordServiceAlt = require('../../utils/DiscordServiceAlt');

/**
 * @route GET /api/adventures/regions
 * @desc Get all regions
 * @access Private
 */
router.get('/regions', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Ensure regions table exists
    await Region.createTableIfNotExists();

    const regions = await Region.getAll(true);

    res.json({
      success: true,
      regions
    });
  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting regions'
    });
  }
});

/**
 * @route GET /api/adventures/areas/:regionId
 * @desc Get areas for a region
 * @access Private
 */
router.get('/areas/:regionId', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const regionId = req.params.regionId;

    // Ensure areas table exists
    await Area.createTableIfNotExists();

    const areas = await Area.getByRegionId(regionId, true);

    res.json({
      success: true,
      areas
    });
  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting areas'
    });
  }
});

/**
 * @route POST /api/adventures/start
 * @desc Start a new adventure
 * @access Private
 */
router.post('/start', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { areaId, threadName, channelId } = req.body;
    const userId = req.session.user.discord_id;

    // Validate input
    if (!threadName) {
      return res.status(400).json({
        success: false,
        message: 'Thread name is required'
      });
    }

    // Use default channel ID if not provided and user is not admin
    let finalChannelId = channelId;
    if (!finalChannelId && !req.session.user.is_admin) {
      // Use a default channel ID from environment variables
      finalChannelId = process.env.DEFAULT_ADVENTURE_CHANNEL_ID || '123456789012345678';
    } else if (!finalChannelId) {
      return res.status(400).json({
        success: false,
        message: 'Channel ID is required'
      });
    }

    // Get user's active adventures (for informational purposes)
    const activeAdventures = await Adventure.getActiveAdventures(userId);
    console.log(`User ${userId} has ${activeAdventures.length} active adventures`);

    // Ensure adventures table exists
    await Adventure.createTableIfNotExists();

    // Create the Discord thread
    let threadMessage = 'A new adventure has begun!';

    if (areaId) {
      // Get area and region info for the message
      const area = await Area.getById(areaId);
      if (area) {
        const region = await Region.getById(area.region_id);
        threadMessage = `A new adventure has begun in ${area.name} of the ${region.name} region!`;
      }
    } else {
      threadMessage = 'A new custom adventure has begun!';
    }

    // Determine if we should use mock data (for development/testing)
    const useMock = process.env.USE_MOCK_DISCORD === 'true';

    // Try to create the Discord thread using the primary method first
    console.log('Attempting to create thread using primary method...');
    let thread;
    try {
      thread = await DiscordService.createThread(
        finalChannelId,
        threadName,
        threadMessage,
        useMock
      );

      // If we got a fallback thread, throw an error to try the alternative method
      if (thread.is_fallback) {
        throw new Error('Primary method failed with fallback thread');
      }
    } catch (error) {
      // If the primary method fails, try the alternative method
      console.log('Primary method failed. Trying alternative method...');
      thread = await DiscordServiceAlt.createThread(
        finalChannelId,
        threadName,
        threadMessage,
        useMock
      );
    }

    // Log whether we're using a mock thread or a real one
    if (thread.is_mock || thread.is_fallback) {
      console.log(`Using ${thread.is_fallback ? 'fallback' : 'mock'} thread with ID: ${thread.id}`);
    } else {
      console.log(`Successfully created thread with ID: ${thread.id}`);
    }

    // Create the adventure in the database
    let adventure;
    if (areaId) {
      adventure = await Adventure.create({
        area_id: areaId,
        starter_user_id: userId,
        thread_id: thread.id,
        channel_id: finalChannelId
      });
    } else {
      adventure = await Adventure.createCustom({
        starter_user_id: userId,
        thread_id: thread.id,
        channel_id: finalChannelId
      });
    }

    res.json({
      success: true,
      message: 'Adventure started successfully',
      adventure,
      thread
    });
  } catch (error) {
    console.error('Error starting adventure:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error starting adventure'
    });
  }
});

/**
 * @route POST /api/adventures/:adventureId/end
 * @desc End an adventure
 * @access Private
 */
router.post('/:adventureId/end', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const adventureId = req.params.adventureId;
    const userId = req.session.user.discord_id;

    // Get the adventure
    const adventure = await Adventure.getById(adventureId);

    // Check if adventure exists
    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Check if user is the starter of the adventure
    if (adventure.starter_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the adventure starter can end the adventure'
      });
    }

    // Check if adventure is already ended
    if (adventure.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Adventure is already ended'
      });
    }

    // End the adventure
    const updatedAdventure = await Adventure.end(adventureId);

    // Determine if we should use mock data (for development/testing)
    const useMock = process.env.USE_MOCK_DISCORD === 'true';

    // Try to send a message using the primary method first
    console.log('Attempting to send message using primary method...');
    let message;
    try {
      message = await DiscordService.sendMessage(
        adventure.thread_id,
        'The adventure has ended!',
        useMock
      );

      // If we got a fallback message, throw an error to try the alternative method
      if (message.is_fallback) {
        throw new Error('Primary method failed with fallback message');
      }
    } catch (error) {
      // If the primary method fails, try the alternative method
      console.log('Primary method failed. Trying alternative method...');
      message = await DiscordServiceAlt.sendMessage(
        adventure.thread_id,
        'The adventure has ended!',
        useMock
      );
    }

    // Log whether we're using a mock message or a real one
    if (message.is_mock || message.is_fallback) {
      console.log(`Using ${message.is_fallback ? 'fallback' : 'mock'} message with ID: ${message.id}`);
    } else {
      console.log(`Successfully sent message with ID: ${message.id}`);
    }

    // Create the embed data
    const embedData = {
      title: 'Adventure Summary',
      description: 'This adventure has concluded.',
      color: 0x9b59b6, // Purple color
      fields: [
        {
          name: 'Duration',
          value: `${Math.floor((new Date() - new Date(adventure.started_at)) / (1000 * 60 * 60 * 24))} days`,
          inline: true
        },
        {
          name: 'Started By',
          value: `<@${adventure.starter_user_id}>`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: `Adventure ID: ${adventure.adventure_id}`
      }
    };

    // Try to send the embed using the primary method
    try {
      await DiscordService.sendEmbed(
        adventure.thread_id,
        embedData,
        useMock
      );
    } catch (error) {
      console.log('Failed to send embed using primary method. Sending as regular message instead.');
      // If sending the embed fails, send a regular message with the summary
      await DiscordServiceAlt.sendMessage(
        adventure.thread_id,
        `**Adventure Summary**\n\nThis adventure has concluded.\n\n**Duration:** ${Math.floor((new Date() - new Date(adventure.started_at)) / (1000 * 60 * 60 * 24))} days\n**Started By:** <@${adventure.starter_user_id}>\n\nAdventure ID: ${adventure.adventure_id}`,
        useMock
      );
    }

    res.json({
      success: true,
      message: 'Adventure ended successfully',
      adventure: updatedAdventure
    });
  } catch (error) {
    console.error('Error ending adventure:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error ending adventure'
    });
  }
});

/**
 * @route GET /api/adventures/user
 * @desc Get adventures for the current user
 * @access Private
 */
router.get('/user', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.session.user.discord_id;

    // Ensure adventures table exists
    await Adventure.createTableIfNotExists();

    const adventures = await Adventure.getByUserId(userId);

    res.json({
      success: true,
      adventures
    });
  } catch (error) {
    console.error('Error getting user adventures:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting user adventures'
    });
  }
});

/**
 * @route GET /api/adventures
 * @desc Get all adventures
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Ensure adventures table exists
    await Adventure.createTableIfNotExists();

    const adventures = await Adventure.getAll();

    res.json({
      success: true,
      adventures
    });
  } catch (error) {
    console.error('Error getting adventures:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting adventures'
    });
  }
});

module.exports = router;
