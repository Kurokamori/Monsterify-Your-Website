import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { UserPublic } from '../repositories/index.js';

// Re-export requireAdmin so existing route imports don't break.
// The canonical home is permissions.middleware.ts.
export { requireAdmin } from './permissions.middleware.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPublic;
    authSource?: 'jwt' | 'discord' | 'session';
  }
}

const userService = new UserService();

/**
 * Extract Bearer token from the Authorization header.
 */
function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

/**
 * Resolve a JWT token to a UserPublic record.
 * Returns the user if the token is valid and the user exists, otherwise undefined.
 */
async function resolveUser(token: string): Promise<UserPublic | undefined> {
  const payload = userService.verifyToken(token);
  if (!payload) {
    return undefined;
  }

  const user = await userService.findById(payload.id);
  return user ?? undefined;
}

/**
 * Required authentication middleware.
 *
 * Verifies a JWT Bearer token from the Authorization header,
 * loads the user from the database, and attaches it to `req.user`.
 * Responds with 401 if authentication fails for any reason.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const user = await resolveUser(token);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      });
      return;
    }

    req.user = user;
    req.authSource = 'jwt';
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware.
 *
 * Attempts to verify a JWT Bearer token if one is present.
 * On success, attaches the user to `req.user`.
 * On failure (missing token, invalid token, user not found),
 * continues to the next handler without setting `req.user`.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      next();
      return;
    }

    const user = await resolveUser(token);
    if (user) {
      req.user = user;
      req.authSource = 'jwt';
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}

/**
 * Discord bot authentication middleware.
 *
 * Authenticates requests coming from the Discord bot by looking up
 * users via their Discord ID. The bot sends the Discord ID in the
 * `X-Discord-Id` header. A shared secret in `X-Bot-Token` is
 * verified to ensure the request originates from the bot.
 *
 * Attaches the found user to `req.user` and sets `req.authSource` to 'discord'.
 * Responds with 401 if the Discord ID is missing, the bot token is
 * invalid, or no user is linked to that Discord ID.
 */
export async function authenticateDiscord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const botToken = req.headers['x-bot-token'] as string | undefined;
    const expectedToken = process.env.BOT_API_SECRET;

    if (!expectedToken) {
      console.error('BOT_API_SECRET is not configured');
      res.status(500).json({
        success: false,
        error: 'SERVER_CONFIG_ERROR',
        message: 'Bot authentication is not configured',
      });
      return;
    }

    if (!botToken || botToken !== expectedToken) {
      res.status(401).json({
        success: false,
        error: 'INVALID_BOT_TOKEN',
        message: 'Invalid or missing bot token',
      });
      return;
    }

    const discordId = req.headers['x-discord-id'] as string | undefined;
    if (!discordId) {
      res.status(401).json({
        success: false,
        error: 'MISSING_DISCORD_ID',
        message: 'Discord ID is required for bot authentication',
      });
      return;
    }

    const userRow = await userService.findByDiscordId(discordId);
    if (!userRow) {
      res.status(404).json({
        success: false,
        error: 'USER_NOT_LINKED',
        message: 'No account is linked to this Discord ID',
      });
      return;
    }

    // findByDiscordId returns a full UserRow; get the public version
    const user = await userService.findById(userRow.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account could not be loaded',
      });
      return;
    }

    req.user = user;
    req.authSource = 'discord';
    next();
  } catch (error) {
    console.error('Discord auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Discord authentication failed',
    });
  }
}

/**
 * Flexible authentication middleware.
 *
 * Accepts either a JWT Bearer token or Discord bot headers.
 * Tries JWT first, then falls back to Discord bot auth.
 * Use this on routes that should be accessible from both
 * the website and the Discord bot.
 */
export async function authenticateAny(req: Request, res: Response, next: NextFunction): Promise<void> {
  // If a Bearer token is present, try JWT auth
  const token = extractToken(req);
  if (token) {
    const user = await resolveUser(token);
    if (user) {
      req.user = user;
      req.authSource = 'jwt';
      next();
      return;
    }
  }

  // If Discord bot headers are present, try Discord auth
  const discordId = req.headers['x-discord-id'] as string | undefined;
  if (discordId) {
    await authenticateDiscord(req, res, next);
    return;
  }

  res.status(401).json({
    success: false,
    error: 'UNAUTHORIZED',
    message: 'Authentication required (JWT or Discord)',
  });
}
