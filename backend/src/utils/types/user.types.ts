/**
 * User Type Definitions
 * Types for user accounts and authentication
 */

import { BaseEntity } from './common.types';

/**
 * Theme options for the user interface
 */
export type ThemeValue = 'dusk' | 'dawn';

/**
 * Monster roller settings - controls which monster species are enabled
 */
export interface MonsterRollerSettings {
  pokemonEnabled: boolean;
  digimonEnabled: boolean;
  yokaiEnabled: boolean;
  palsEnabled: boolean;
  nexomonEnabled: boolean;
  fakemonEnabled: boolean;
  finalfantasyEnabled: boolean;
  monsterhunterEnabled: boolean;
  dragonquestEnabled: boolean;
}

/**
 * Default monster roller settings
 */
export const DEFAULT_MONSTER_ROLLER_SETTINGS: MonsterRollerSettings = {
  pokemonEnabled: true,
  digimonEnabled: true,
  yokaiEnabled: true,
  palsEnabled: true,
  nexomonEnabled: true,
  fakemonEnabled: true,
  finalfantasyEnabled: true,
  monsterhunterEnabled: true,
  dragonquestEnabled: true,
};

/**
 * Full user entity
 */
export interface User extends BaseEntity {
  username: string;
  displayName: string | null;
  discordId: string | null;
  passwordHash: string;
  isAdmin: boolean;
  theme: ThemeValue | null;
  monsterRollerSettings: MonsterRollerSettings;
  lastLoginAt: Date | null;
}

/**
 * User without sensitive fields (for API responses)
 */
export type UserPublic = Omit<User, 'passwordHash'>;

/**
 * User summary (minimal info for listings)
 */
export interface UserSummary {
  id: number;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
}

/**
 * Input for creating a new user
 */
export interface UserCreateInput {
  username: string;
  displayName?: string;
  discordId?: string;
  password: string;
  isAdmin?: boolean;
}

/**
 * Input for updating a user
 */
export interface UserUpdateInput {
  username?: string;
  displayName?: string | null;
  discordId?: string | null;
  password?: string;
  isAdmin?: boolean;
  theme?: ThemeValue | null;
  monsterRollerSettings?: Partial<MonsterRollerSettings>;
}

/**
 * Input for user login
 */
export interface LoginInput {
  username: string;
  password: string;
}

/**
 * JWT token payload
 */
export interface AuthTokenPayload {
  id: number;
  username: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Refresh token payload
 */
export interface RefreshTokenPayload {
  id: number;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

/**
 * Authentication tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Login response with user data and tokens
 */
export interface LoginResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

/**
 * Discord OAuth user data
 */
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
  globalName?: string | null;
}

/**
 * Discord OAuth tokens
 */
export interface DiscordTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

/**
 * Session data stored in session store
 */
export interface SessionData {
  userId: number;
  username: string;
  isAdmin: boolean;
  discordId?: string;
  loginAt: Date;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  userId: number;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

/**
 * User preferences (separate from account settings)
 */
export interface UserPreferences {
  userId: number;
  emailNotifications: boolean;
  discordNotifications: boolean;
  adventureAutoJoin: boolean;
  battleAnimations: boolean;
  soundEffects: boolean;
}

/**
 * User activity log entry
 */
export interface UserActivity {
  id: number;
  userId: number;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * User statistics
 */
export interface UserStats {
  userId: number;
  totalTrainers: number;
  totalMonsters: number;
  totalBattlesWon: number;
  totalBattlesLost: number;
  totalAdventures: number;
  totalTrades: number;
  accountAge: number; // days
}
