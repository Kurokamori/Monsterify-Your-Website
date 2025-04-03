const { Trainer, Mon } = require('../models');
const { addCurrency, addLevel } = require('./trainerHelpers');
const { addLevel: addMonLevel, addFriendship } = require('./monHelpers');

/**
 * Process a writing submission
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} - Result object with rewards info
 */
async function processWritingSubmission(submissionData) {
  try {
    const { 
      trainerId, 
      wordCount, 
      difficultyModifier = 1, 
      targetType, 
      targetId 
    } = submissionData;

    // Calculate rewards
    // 1 level per 50 words, 1 coin per word
    const levelsEarned = Math.floor(wordCount / 50) * difficultyModifier;
    const coinsEarned = wordCount * difficultyModifier;

    // Apply rewards
    if (targetType === 'monster' && targetId) {
      // Award levels to the monster
      await addMonLevel(targetId, levelsEarned);
      await addFriendship(targetId, levelsEarned * 5);
      
      // Coins always go to the trainer
      await addCurrency(trainerId, coinsEarned);
      
      const monster = await Mon.findByPk(targetId);
      return {
        success: true,
        targetType: 'monster',
        targetName: monster.name,
        levelsEarned,
        coinsEarned,
        friendshipEarned: levelsEarned * 5
      };
    } else {
      // Award both to the trainer
      await addLevel(trainerId, levelsEarned);
      await addCurrency(trainerId, coinsEarned);
      
      const trainer = await Trainer.findByPk(trainerId);
      return {
        success: true,
        targetType: 'trainer',
        targetName: trainer.name,
        levelsEarned,
        coinsEarned
      };
    }
  } catch (error) {
    console.error('Error processing writing submission:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process an art submission
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} - Result object with rewards info
 */
async function processArtSubmission(submissionData) {
  try {
    const { 
      trainerId, 
      artType, 
      targetType, 
      targetId 
    } = submissionData;

    // Calculate rewards based on art type
    let levelsEarned = 1; // Default
    
    switch (artType.toLowerCase()) {
      case 'sketch':
        levelsEarned = 1;
        break;
      case 'sketch set':
        levelsEarned = 3;
        break;
      case 'line art':
        levelsEarned = 3;
        break;
      case 'rendered':
        levelsEarned = 5;
        break;
      case 'polished':
        levelsEarned = 7;
        break;
      default:
        levelsEarned = 1;
    }
    
    // 50 coins per level for art submissions
    const coinsEarned = levelsEarned * 50;

    // Apply rewards
    if (targetType === 'monster' && targetId) {
      // Award levels to the monster
      await addMonLevel(targetId, levelsEarned);
      await addFriendship(targetId, levelsEarned * 5);
      
      // Coins always go to the trainer
      await addCurrency(trainerId, coinsEarned);
      
      const monster = await Mon.findByPk(targetId);
      return {
        success: true,
        targetType: 'monster',
        targetName: monster.name,
        levelsEarned,
        coinsEarned,
        friendshipEarned: levelsEarned * 5
      };
    } else {
      // Award both to the trainer
      await addLevel(trainerId, levelsEarned);
      await addCurrency(trainerId, coinsEarned);
      
      const trainer = await Trainer.findByPk(trainerId);
      return {
        success: true,
        targetType: 'trainer',
        targetName: trainer.name,
        levelsEarned,
        coinsEarned
      };
    }
  } catch (error) {
    console.error('Error processing art submission:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process a reference submission
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} - Result object with rewards info
 */
async function processReferenceSubmission(submissionData) {
  try {
    const { 
      trainerId, 
      targetType, 
      targetId 
    } = submissionData;

    // Fixed rewards for reference submissions
    const levelsEarned = 6;
    const coinsEarned = 200;

    // Apply rewards
    if (targetType === 'monster' && targetId) {
      // Award levels to the monster
      await addMonLevel(targetId, levelsEarned);
      await addFriendship(targetId, levelsEarned * 5);
      
      // Coins always go to the trainer
      await addCurrency(trainerId, coinsEarned);
      
      const monster = await Mon.findByPk(targetId);
      return {
        success: true,
        targetType: 'monster',
        targetName: monster.name,
        levelsEarned,
        coinsEarned,
        friendshipEarned: levelsEarned * 5
      };
    } else {
      // Award both to the trainer
      await addLevel(trainerId, levelsEarned);
      await addCurrency(trainerId, coinsEarned);
      
      const trainer = await Trainer.findByPk(trainerId);
      return {
        success: true,
        targetType: 'trainer',
        targetName: trainer.name,
        levelsEarned,
        coinsEarned
      };
    }
  } catch (error) {
    console.error('Error processing reference submission:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Distribute gift levels to recipients
 * @param {Array} recipients - Array of recipient objects
 * @param {number} totalLevels - Total levels to distribute
 * @returns {Promise<Object>} - Result object with distribution info
 */
async function distributeGiftLevels(recipients, totalLevels) {
  try {
    const results = [];
    
    // Calculate gift levels (1:5 ratio)
    const giftLevels = Math.floor(totalLevels / 5);
    
    if (giftLevels <= 0 || !recipients || recipients.length === 0) {
      return {
        success: true,
        message: 'No gift levels to distribute or no recipients specified',
        results: []
      };
    }
    
    // Distribute evenly among recipients
    const levelsPerRecipient = Math.floor(giftLevels / recipients.length);
    
    for (const recipient of recipients) {
      const { trainerId, targetType, targetId } = recipient;
      
      if (targetType === 'monster' && targetId) {
        // Award levels to the monster
        await addMonLevel(targetId, levelsPerRecipient);
        await addFriendship(targetId, levelsPerRecipient * 5);
        
        const monster = await Mon.findByPk(targetId);
        results.push({
          targetType: 'monster',
          targetName: monster.name,
          levelsReceived: levelsPerRecipient,
          friendshipEarned: levelsPerRecipient * 5
        });
      } else {
        // Award levels to the trainer
        await addLevel(trainerId, levelsPerRecipient);
        
        const trainer = await Trainer.findByPk(trainerId);
        results.push({
          targetType: 'trainer',
          targetName: trainer.name,
          levelsReceived: levelsPerRecipient
        });
      }
    }
    
    return {
      success: true,
      totalGiftLevels: giftLevels,
      levelsPerRecipient,
      results
    };
  } catch (error) {
    console.error('Error distributing gift levels:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processWritingSubmission,
  processArtSubmission,
  processReferenceSubmission,
  distributeGiftLevels
};
