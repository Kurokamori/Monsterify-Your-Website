import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository, UserPublic, UserRow, UserCreateInput, MonsterRollerSettings, ContentSettings, NotificationSettings, AdminUserQueryOptions, PaginatedUsers } from '../repositories';

export type { AdminUserQueryOptions, PaginatedUsers };

export type AuthResult =
  | { success: true; user: UserPublic }
  | { success: false; error: 'USER_NOT_FOUND' | 'WRONG_PASSWORD'; message: string };

export type TokenPayload = {
  id: number;
  username: string;
  is_admin: boolean;
};

export type RefreshTokenPayload = {
  id: number;
  type: 'refresh';
};

export type DiscordProfile = {
  id: string;
  username: string;
  global_name?: string;
};

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET ?? 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'your-refresh-secret-key';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository ?? new UserRepository();
  }

  /**
   * Create a new user
   * @param username - Username
   * @param password - Plain text password
   * @param options - Optional additional fields
   * @returns Created user (without password)
   */
  async createUser(
    username: string,
    password: string,
    options: {
      displayName?: string;
      discordId?: string;
      isAdmin?: boolean;
    } = {}
  ): Promise<UserPublic> {
    // Check if username already exists
    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check display name uniqueness (must not overlap with any display name or username)
    const effectiveDisplayName = options.displayName ?? username;
    const displayNameAsUsername = await this.userRepository.findByUsername(effectiveDisplayName);
    if (displayNameAsUsername && displayNameAsUsername.username.toLowerCase() !== username.toLowerCase()) {
      throw new Error('Display name is already taken');
    }
    const displayNameExists = await this.userRepository.findByDisplayName(effectiveDisplayName);
    if (displayNameExists) {
      throw new Error('Display name is already taken');
    }

    // Check Discord ID uniqueness
    if (options.discordId) {
      const discordIdExists = await this.userRepository.findByDiscordId(options.discordId);
      if (discordIdExists) {
        throw new Error('An account with this Discord ID already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const input: UserCreateInput = {
      username,
      passwordHash,
      displayName: options.displayName ?? username,
      discordId: options.discordId,
      isAdmin: options.isAdmin ?? false,
    };

    return this.userRepository.create(input);
  }

  /**
   * Authenticate user with username and password
   * @param username - Username
   * @param password - Plain text password
   * @returns Authentication result with user or error info
   */
  async authenticate(username: string, password: string): Promise<AuthResult> {
    // Find user by username (includes password hash)
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'No user found matching that username',
      };
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        success: false,
        error: 'WRONG_PASSWORD',
        message: 'Incorrect password',
      };
    }

    // Get public user data (without password)
    const publicUser = await this.userRepository.findById(user.id);
    if (!publicUser) {
      throw new Error('User not found after authentication');
    }

    return {
      success: true,
      user: publicUser,
    };
  }

  /**
   * Generate JWT access token for user
   * @param user - User object
   * @returns JWT token string
   */
  generateToken(user: UserPublic): string {
    const payload: TokenPayload = {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  }

  /**
   * Generate refresh token for user
   * @param user - User object
   * @param rememberMe - Whether user wants to be remembered (extends expiry)
   * @returns Refresh token string
   */
  generateRefreshToken(user: UserPublic, rememberMe = false): string {
    const payload: RefreshTokenPayload = {
      id: user.id,
      type: 'refresh',
    };

    const expiresIn = rememberMe ? '30d' : '1d';
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
  }

  /**
   * Verify JWT access token
   * @param token - JWT token string
   * @returns Decoded payload or null if invalid
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verify refresh token
   * @param token - Refresh token string
   * @returns Decoded payload or null if invalid
   */
  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token string
   * @returns New access token and user, or null if invalid
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ token: string; user: UserPublic } | null> {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    const user = await this.userRepository.findById(payload.id);
    if (!user) {
      return null;
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  /**
   * Find or create user from Discord OAuth profile
   * @param profile - Discord profile data
   * @returns User (created or updated)
   */
  async findOrCreateFromDiscord(profile: DiscordProfile): Promise<UserPublic> {
    // First try to find existing user by Discord ID
    const existingUser = await this.userRepository.findByDiscordId(profile.id);

    if (existingUser) {
      // Update user with latest Discord info
      // Only update display_name if the user hasn't set one
      const currentUser = await this.userRepository.findById(existingUser.id);
      if (!currentUser) {
        throw new Error('User not found after lookup');
      }

      const updateData: { discordId: string; displayName?: string } = {
        discordId: profile.id,
      };

      // Only set display_name if user doesn't already have one
      if (!currentUser.display_name || currentUser.display_name.trim() === '') {
        updateData.displayName = profile.global_name ?? profile.username;
      }

      return this.userRepository.update(existingUser.id, updateData);
    }

    // Create new user with Discord data
    // Use Discord username as the username, but make it unique if needed
    let username = profile.username;
    let counter = 1;

    // Ensure username is unique
    while (await this.userRepository.findByUsername(username)) {
      username = `${profile.username}${counter}`;
      counter++;
    }

    // Create user with placeholder password for Discord OAuth users
    const passwordHash = await bcrypt.hash('discord_oauth', SALT_ROUNDS);

    return this.userRepository.create({
      username,
      displayName: profile.global_name ?? profile.username,
      discordId: profile.id,
      passwordHash,
      isAdmin: false,
    });
  }

  /**
   * Get user by ID
   * @param id - User ID
   * @returns User or null
   */
  async findById(id: number): Promise<UserPublic | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Get user by username (includes password for auth purposes)
   * @param username - Username
   * @returns User row or null
   */
  async findByUsername(username: string): Promise<UserRow | null> {
    return this.userRepository.findByUsername(username);
  }

  /**
   * Get user by Discord ID
   * @param discordId - Discord ID
   * @returns User row or null
   */
  async findByDiscordId(discordId: string): Promise<UserRow | null> {
    return this.userRepository.findByDiscordId(discordId);
  }

  /**
   * Get all users
   * @returns Array of public user data
   */
  async getAll(): Promise<UserPublic[]> {
    return this.userRepository.getAll();
  }

  /**
   * Get paginated admin user list with search and sorting
   */
  async getAdminUserList(options: AdminUserQueryOptions): Promise<{ users: UserPublic[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const result = await this.userRepository.findAdminList(options);
    return {
      users: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Update user
   * @param id - User ID
   * @param data - Update data
   * @returns Updated user
   */
  async update(
    id: number,
    data: {
      username?: string;
      displayName?: string;
      discordId?: string;
      password?: string;
      isAdmin?: boolean;
      monsterRollerSettings?: MonsterRollerSettings;
      theme?: string;
      contentSettings?: ContentSettings;
    }
  ): Promise<UserPublic> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if username already exists (if changing username)
    if (data.username && data.username !== user.username) {
      const existingUser = await this.userRepository.findByUsername(data.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }
    }

    // Check display name uniqueness (must not overlap with any display name or username)
    if (data.displayName !== undefined && data.displayName !== user.display_name) {
      const displayName = data.displayName;
      if (displayName) {
        // Check against other users' usernames
        const usernameMatch = await this.userRepository.findByUsername(displayName);
        if (usernameMatch && usernameMatch.id !== id) {
          throw new Error('Display name is already taken');
        }
        // Check against other users' display names
        const displayNameMatch = await this.userRepository.findByDisplayName(displayName);
        if (displayNameMatch && displayNameMatch.id !== id) {
          throw new Error('Display name is already taken');
        }
      }
    }

    // Check Discord ID uniqueness (if changing discord ID)
    if (data.discordId !== undefined && data.discordId !== (user.discord_id ?? undefined)) {
      if (data.discordId) {
        const discordIdMatch = await this.userRepository.findByDiscordId(data.discordId);
        if (discordIdMatch && discordIdMatch.id !== id) {
          throw new Error('An account with this Discord ID already exists');
        }
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    return this.userRepository.update(id, {
      username: data.username,
      displayName: data.displayName,
      discordId: data.discordId,
      passwordHash,
      isAdmin: data.isAdmin,
      monsterRollerSettings: data.monsterRollerSettings,
      theme: data.theme,
      contentSettings: data.contentSettings,
    });
  }

  /**
   * Delete user
   * @param id - User ID
   * @returns True if deleted
   */
  async delete(id: number): Promise<boolean> {
    return this.userRepository.delete(id);
  }

  /**
   * Get user's monster roller settings
   * @param id - User ID
   * @returns Monster roller settings
   */
  async getMonsterRollerSettings(id: number): Promise<MonsterRollerSettings> {
    return this.userRepository.getMonsterRollerSettings(id);
  }

  /**
   * Update user's monster roller settings
   * @param id - User ID
   * @param settings - Monster roller settings
   * @returns Updated user
   */
  async updateMonsterRollerSettings(
    id: number,
    settings: MonsterRollerSettings
  ): Promise<UserPublic> {
    return this.userRepository.updateMonsterRollerSettings(id, settings);
  }

  /**
   * Update user's theme preference
   * @param id - User ID
   * @param theme - Theme ID
   * @returns Updated user
   */
  async updateTheme(id: number, theme: string | null): Promise<UserPublic> {
    return this.userRepository.updateTheme(id, theme);
  }

  /**
   * Update user's content settings
   */
  async updateContentSettings(id: number, settings: ContentSettings): Promise<UserPublic> {
    return this.userRepository.updateContentSettings(id, settings);
  }

  async updateNotificationSettings(id: number, settings: NotificationSettings): Promise<UserPublic> {
    return this.userRepository.updateNotificationSettings(id, settings);
  }

  /**
   * Change user password
   * @param id - User ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password
   * @returns True if successful
   */
  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Get user with password
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Get full user row to access password
    const fullUser = await this.userRepository.findByUsername(user.username);
    if (!fullUser) {
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, fullUser.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userRepository.update(id, { passwordHash });

    return true;
  }
}
