const apiService = require('../services/apiService');

class UserLinkingSystem {
  constructor() {
    // In-memory storage for linking tokens (in production, use Redis or database)
    this.linkingTokens = new Map();
    this.linkedUsers = new Map(); // discordId -> userId mapping
    this.tokenExpiry = 15 * 60 * 1000; // 15 minutes
  }

  // Generate a linking token for a user
  generateLinkingToken(userId, username) {
    const token = this.generateRandomToken();
    const expiresAt = Date.now() + this.tokenExpiry;

    this.linkingTokens.set(token, {
      userId,
      username,
      expiresAt,
      used: false,
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  // Verify and use a linking token
  async linkDiscordAccount(discordId, discordTag, token) {
    const tokenData = this.linkingTokens.get(token);

    if (!tokenData) {
      throw new Error('Invalid or expired linking token.');
    }

    if (tokenData.used) {
      throw new Error('This linking token has already been used.');
    }

    if (Date.now() > tokenData.expiresAt) {
      this.linkingTokens.delete(token);
      throw new Error('Linking token has expired. Please generate a new one.');
    }

    try {
      // Update user with Discord information
      const response = await apiService.patch(`/auth/profile`, {
        discord_id: discordId,
        discord_tag: discordTag,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to link Discord account');
      }

      // Mark token as used
      tokenData.used = true;
      
      // Store the linking
      this.linkedUsers.set(discordId, {
        userId: tokenData.userId,
        username: tokenData.username,
        linkedAt: new Date(),
      });

      // Clean up the token
      this.linkingTokens.delete(token);

      return {
        success: true,
        userId: tokenData.userId,
        username: tokenData.username,
      };

    } catch (error) {
      throw new Error(error.isApiError ? error.message : 'Failed to link Discord account');
    }
  }

  // Get user ID from Discord ID
  async getUserIdFromDiscord(discordId) {
    // Check local cache first
    const cached = this.linkedUsers.get(discordId);
    if (cached) {
      return cached.userId;
    }

    try {
      // Query the API to find user by Discord ID
      const response = await apiService.get('/auth/profile');
      
      if (response.success && response.user && response.user.discord_id === discordId) {
        // Cache the result
        this.linkedUsers.set(discordId, {
          userId: response.user.id,
          username: response.user.username,
          linkedAt: new Date(),
        });
        
        return response.user.id;
      }

      return null;

    } catch (error) {
      console.error('Error getting user ID from Discord ID:', error);
      return null;
    }
  }

  // Check if Discord account is linked
  async isDiscordLinked(discordId) {
    const userId = await this.getUserIdFromDiscord(discordId);
    return userId !== null;
  }

  // Unlink Discord account
  async unlinkDiscordAccount(discordId) {
    try {
      const response = await apiService.patch(`/auth/profile`, {
        discord_id: null,
        discord_tag: null,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to unlink Discord account');
      }

      // Remove from local cache
      this.linkedUsers.delete(discordId);

      return { success: true };

    } catch (error) {
      throw new Error(error.isApiError ? error.message : 'Failed to unlink Discord account');
    }
  }

  // Get linking instructions
  getLinkingInstructions() {
    return {
      title: '🔗 Account Linking Instructions',
      description: 
        '**To link your Discord account to your website account:**\n\n' +
        '1. Log in to the website\n' +
        '2. Go to your profile settings\n' +
        '3. Click "Link Discord Account"\n' +
        '4. Copy the generated token\n' +
        '5. Use `/link-account <token>` command here\n\n' +
        '**Benefits of linking:**\n' +
        '• Access your trainers and monsters\n' +
        '• Sync progress between platforms\n' +
        '• Receive notifications\n' +
        '• Participate in Discord-exclusive events',
    };
  }

  // Generate random token
  generateRandomToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Clean up expired tokens
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.linkingTokens.entries()) {
      if (now > data.expiresAt) {
        this.linkingTokens.delete(token);
      }
    }
  }

  // Get linking statistics
  getLinkingStats() {
    const activeTokens = Array.from(this.linkingTokens.values())
      .filter(token => !token.used && Date.now() <= token.expiresAt).length;

    return {
      linkedUsers: this.linkedUsers.size,
      activeTokens,
      totalTokensGenerated: this.linkingTokens.size,
    };
  }

  // Validate Discord user for linking
  validateDiscordUser(discordUser) {
    if (!discordUser.id) {
      throw new Error('Invalid Discord user ID');
    }

    if (!discordUser.tag && !discordUser.username) {
      throw new Error('Invalid Discord user information');
    }

    if (discordUser.bot) {
      throw new Error('Bot accounts cannot be linked');
    }

    return true;
  }

  // Get user's linked account info
  async getLinkedAccountInfo(discordId) {
    const cached = this.linkedUsers.get(discordId);
    if (cached) {
      return {
        isLinked: true,
        userId: cached.userId,
        username: cached.username,
        linkedAt: cached.linkedAt,
      };
    }

    const userId = await this.getUserIdFromDiscord(discordId);
    if (userId) {
      return {
        isLinked: true,
        userId,
        linkedAt: null, // Unknown from cache
      };
    }

    return {
      isLinked: false,
    };
  }
}

// Create singleton instance
const userLinkingSystem = new UserLinkingSystem();

module.exports = userLinkingSystem;
