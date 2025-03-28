/**
 * Base API module for reward system
 */

// Error codes enum
const RewardErrorCodes = {
    INVALID_INPUT: 'INVALID_INPUT',
    REWARD_NOT_FOUND: 'REWARD_NOT_FOUND',
    TRAINER_NOT_FOUND: 'TRAINER_NOT_FOUND',
    ALREADY_CLAIMED: 'ALREADY_CLAIMED',
    INSUFFICIENT_PERMISSION: 'INSUFFICIENT_PERMISSION',
    CLAIM_FAILED: 'CLAIM_FAILED',
    GENERATE_FAILED: 'GENERATE_FAILED'
  };
  
  /**
   * Base response structure
   * @typedef {Object} ApiResponse
   * @property {boolean} success - Overall success flag
   * @property {string} [message] - Optional message
   * @property {*} [data] - Response data if any
   * @property {Object} [error] - Error details if any
   * @property {string} error.code - Error code
   * @property {string} error.message - Error message
   * @property {*} [error.details] - Additional error details
   */
  
  /**
   * Creates a success response
   * @param {*} data - Response data
   * @param {string} [message] - Optional success message
   * @returns {ApiResponse} Success response
   */
  const successResponse = (data = null, message = null) => ({
    success: true,
    ...(message && { message }),
    ...(data && { data })
  });
  
  /**
   * Creates an error response
   * @param {string} code - Error code from RewardErrorCodes
   * @param {string} message - Error message
   * @param {*} [details] - Additional error details
   * @returns {ApiResponse} Error response
   */
  const errorResponse = (code, message, details = null) => ({
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  });
  
  /**
   * Validates reward generation parameters
   * @param {string} source - Reward source
   * @param {Object} parameters - Source-specific parameters
   * @returns {Object} Validation result {isValid, error}
   */
  const validateGenerationParams = (source, parameters) => {
    // Validate source
    const validSources = ['game_corner', 'garden', 'task', 'habit', 'fishing'];
    if (!source || !validSources.includes(source)) {
      return {
        isValid: false,
        error: errorResponse(
          RewardErrorCodes.INVALID_INPUT,
          `Invalid reward source. Must be one of: ${validSources.join(', ')}`
        )
      };
    }
  
    // Source-specific parameter validation
    switch (source) {
      case 'game_corner':
        if (!parameters.sessions || !parameters.minutes || !parameters.productivity) {
          return {
            isValid: false,
            error: errorResponse(
              RewardErrorCodes.INVALID_INPUT,
              'Missing required parameters: sessions, minutes, productivity'
            )
          };
        }
        break;
  
      case 'garden':
        if (!parameters.points) {
          return {
            isValid: false,
            error: errorResponse(
              RewardErrorCodes.INVALID_INPUT,
              'Missing required parameter: points'
            )
          };
        }
        break;
  
      // Add validation for other sources as needed
    }
  
    return { isValid: true };
  };
  
  /**
   * Validates reward claim parameters
   * @param {string} rewardId - Reward ID
   * @param {number} trainerId - Trainer ID
   * @returns {Object} Validation result {isValid, error}
   */
  const validateClaimParams = (rewardId, trainerId) => {
    if (!rewardId) {
      return {
        isValid: false,
        error: errorResponse(
          RewardErrorCodes.INVALID_INPUT,
          'Reward ID is required'
        )
      };
    }
  
    if (!trainerId || isNaN(parseInt(trainerId))) {
      return {
        isValid: false,
        error: errorResponse(
          RewardErrorCodes.INVALID_INPUT,
          'Valid trainer ID is required'
        )
      };
    }
  
    return { isValid: true };
  };
  
  /**
   * Validates batch claim parameters
   * @param {Array} rewards - Array of {rewardId, trainerId} objects
   * @returns {Object} Validation result {isValid, error}
   */
  const validateBatchClaimParams = (rewards) => {
    if (!Array.isArray(rewards) || rewards.length === 0) {
      return {
        isValid: false,
        error: errorResponse(
          RewardErrorCodes.INVALID_INPUT,
          'Valid rewards array is required'
        )
      };
    }
  
    for (const reward of rewards) {
      const validation = validateClaimParams(reward.rewardId, reward.trainerId);
      if (!validation.isValid) {
        return validation;
      }
    }
  
    return { isValid: true };
  };
  
  module.exports = {
    RewardErrorCodes,
    successResponse,
    errorResponse,
    validateGenerationParams,
    validateClaimParams,
    validateBatchClaimParams
  };