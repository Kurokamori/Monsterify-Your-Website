const express = require('express');
const router = express.Router();
const DiscordMessageHandler = require('../../utils/DiscordMessageHandler');

/**
 * @route POST /api/discord-webhook
 * @desc Handle Discord webhook events
 * @access Public (but secured with a verification token)
 */
router.post('/', async (req, res) => {
  try {
    // Verify the request is from Discord
    const token = req.headers['x-discord-token'];
    if (!token || token !== process.env.DISCORD_WEBHOOK_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Handle different types of Discord events
    const { type, data } = req.body;
    
    // Handle message create events
    if (type === 1 && data && data.content) { // Type 1 is MESSAGE_CREATE
      // Process the message asynchronously
      DiscordMessageHandler.processMessage(data)
        .then(result => {
          console.log('Message processed:', result);
        })
        .catch(error => {
          console.error('Error processing message:', error);
        });
      
      // Return immediately to acknowledge receipt
      return res.status(200).json({
        success: true,
        message: 'Message received and being processed'
      });
    }
    
    // Handle other event types
    return res.status(200).json({
      success: true,
      message: 'Event received but not processed'
    });
  } catch (error) {
    console.error('Error handling Discord webhook:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error handling Discord webhook'
    });
  }
});

module.exports = router;
