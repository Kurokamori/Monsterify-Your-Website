import { Request, Response } from 'express';
import { UserService } from '../../services/user.service';
import { ContentSettings } from '../../repositories';

const userService = new UserService();

// =============================================================================
// Public Auth Endpoints
// =============================================================================

export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { username, display_name, discord_id, password } = req.body as {
      username?: string;
      display_name?: string;
      discord_id?: string;
      password?: string;
    };

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const user = await userService.createUser(username, password, {
      displayName: display_name,
      discordId: discord_id,
    });

    const token = userService.generateToken(user);
    const refreshToken = userService.generateRefreshToken(user);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        monster_roller_settings: user.monster_roller_settings,
        theme: user.theme ?? 'dusk',
        content_settings: user.content_settings,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error && (
      error.message === 'Username already exists' ||
      error.message === 'Display name is already taken' ||
      error.message === 'An account with this Discord ID already exists'
    )) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
}

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, rememberMe } = req.body as {
      username?: string;
      password?: string;
      rememberMe?: boolean;
    };

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const authResult = await userService.authenticate(username, password);

    if (!authResult.success) {
      res.status(401).json({ success: false, message: authResult.message });
      return;
    }

    const user = authResult.user;
    const token = userService.generateToken(user);
    const refreshToken = userService.generateRefreshToken(user, rememberMe);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        monster_roller_settings: user.monster_roller_settings,
        theme: user.theme ?? 'dusk',
        content_settings: user.content_settings,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body as { refreshToken?: string };

    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    const result = await userService.refreshAccessToken(token);
    if (!result) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    res.json({ success: true, token: result.token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Server error during token refresh' });
  }
}

// =============================================================================
// Protected Profile Endpoints
// =============================================================================

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await userService.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        monster_roller_settings: user.monster_roller_settings,
        theme: user.theme ?? 'dusk',
        content_settings: user.content_settings,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error while getting profile' });
  }
}

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { display_name, discord_id } = req.body as {
      display_name?: string;
      discord_id?: string;
    };

    const updatedUser = await userService.update(req.user.id, {
      displayName: display_name,
      discordId: discord_id,
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        display_name: updatedUser.display_name,
        discord_id: updatedUser.discord_id,
        is_admin: updatedUser.is_admin,
        monster_roller_settings: updatedUser.monster_roller_settings,
        theme: updatedUser.theme ?? 'dusk',
        content_settings: updatedUser.content_settings,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error instanceof Error && (
      error.message === 'Display name is already taken' ||
      error.message === 'An account with this Discord ID already exists'
    )) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({ success: false, message: 'Server error while updating profile' });
  }
}

// =============================================================================
// Monster Roller Settings
// =============================================================================

export async function getMonsterRollerSettings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const settings = await userService.getMonsterRollerSettings(req.user.id);

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Get monster roller settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting monster roller settings',
    });
  }
}

export async function updateMonsterRollerSettings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ success: false, message: 'Invalid settings format' });
      return;
    }

    const updatedUser = await userService.updateMonsterRollerSettings(req.user.id, settings);

    res.json({
      success: true,
      settings: updatedUser.monster_roller_settings,
    });
  } catch (error) {
    console.error('Update monster roller settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating monster roller settings',
    });
  }
}

// =============================================================================
// Theme
// =============================================================================

export async function updateUserTheme(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { theme } = req.body as { theme?: string };

    if (!theme || typeof theme !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid theme value' });
      return;
    }

    const updatedUser = await userService.updateTheme(req.user.id, theme);

    res.json({ success: true, theme: updatedUser.theme ?? 'dusk' });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating theme' });
  }
}

// =============================================================================
// Content Settings
// =============================================================================

export async function updateContentSettings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ success: false, message: 'Invalid settings format' });
      return;
    }

    const sanitized: ContentSettings = {
      mature_enabled: !!settings.mature_enabled,
      gore: !!settings.gore,
      nsfw_light: !!settings.nsfw_light,
      nsfw_heavy: !!settings.nsfw_heavy,
      triggering: !!settings.triggering,
      intense_violence: !!settings.intense_violence,
    };

    // If mature content is disabled, force all sub-settings off
    if (!sanitized.mature_enabled) {
      sanitized.gore = false;
      sanitized.nsfw_light = false;
      sanitized.nsfw_heavy = false;
      sanitized.triggering = false;
      sanitized.intense_violence = false;
    }

    const updatedUser = await userService.updateContentSettings(req.user.id, sanitized);

    res.json({
      success: true,
      content_settings: updatedUser.content_settings,
    });
  } catch (error) {
    console.error('Update content settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating content settings',
    });
  }
}

// =============================================================================
// Discord OAuth
// =============================================================================

export function testDiscordConfig(_req: Request, res: Response): void {
  const config = {
    clientIdSet: !!process.env.DISCORD_CLIENT_ID,
    clientSecretSet: !!process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_LINK_CALLBACK_URL ?? '/api/auth/discord/callback',
    frontendUrl: process.env.FRONTEND_URL ?? 'https://duskanddawn.net',
  };

  res.json({
    success: true,
    message: 'Discord configuration check',
    config,
  });
}

export async function discordCallback(req: Request, res: Response): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  try {
    const user = req.user as { id: number; username: string; display_name?: string; is_admin: boolean } | undefined;

    if (!user) {
      res.redirect(`${frontendUrl}/login?error=discord_no_user`);
      return;
    }

    const token = userService.generateToken(user);
    const refreshToken = userService.generateRefreshToken(user);
    const userParam = encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      is_admin: user.is_admin,
    }));

    res.redirect(`${frontendUrl}/discord-auth-success?token=${token}&refreshToken=${refreshToken}&user=${userParam}`);
  } catch (error) {
    console.error('Discord callback error:', error);
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
}

/**
 * Redirects to Discord OAuth for linking a Discord account (identify scope only).
 */
export function discordLinkStart(_req: Request, res: Response): void {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ success: false, message: 'Discord OAuth is not configured' });
    return;
  }

  const callbackUrl = process.env.DISCORD_LINK_CALLBACK_URL
    ?? `${process.env.BACKEND_URL ?? 'http://localhost:4000'}/api/auth/discord/link/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'identify',
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
}

/**
 * Handles the Discord OAuth callback for account linking.
 * Exchanges the code for a token, fetches the Discord user ID,
 * and returns an HTML page that posts the ID back to the opener window.
 */
export async function discordLinkCallback(req: Request, res: Response): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  try {
    const { code } = req.query as { code?: string };

    if (!code) {
      res.redirect(buildLinkRedirectUrl(frontendUrl, null, 'No authorization code received'));
      return;
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const callbackUrl = process.env.DISCORD_LINK_CALLBACK_URL
      ?? `${process.env.BACKEND_URL ?? 'http://localhost:4000'}/api/auth/discord/link/callback`;

    if (!clientId || !clientSecret) {
      res.redirect(buildLinkRedirectUrl(frontendUrl, null, 'Discord OAuth is not configured'));
      return;
    }

    // Exchange the code for an access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Discord token exchange failed:', await tokenResponse.text());
      res.redirect(buildLinkRedirectUrl(frontendUrl, null, 'Failed to authenticate with Discord'));
      return;
    }

    const tokenData = await tokenResponse.json() as { access_token: string };

    // Fetch the user's Discord profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      console.error('Discord user fetch failed:', await userResponse.text());
      res.redirect(buildLinkRedirectUrl(frontendUrl, null, 'Failed to fetch Discord profile'));
      return;
    }

    const discordUser = await userResponse.json() as { id: string; username: string };

    res.redirect(buildLinkRedirectUrl(frontendUrl, discordUser.id, null, discordUser.username));
  } catch (error) {
    console.error('Discord link callback error:', error);
    res.redirect(buildLinkRedirectUrl(frontendUrl, null, 'An unexpected error occurred'));
  }
}

function buildLinkRedirectUrl(
  frontendUrl: string,
  discordId: string | null,
  error: string | null,
  discordUsername?: string,
): string {
  const params = new URLSearchParams();
  if (discordId) {
    params.set('discord_id', discordId);
    if (discordUsername) { params.set('discord_username', discordUsername); }
  } else {
    params.set('discord_error', error ?? 'Unknown error');
  }
  return `${frontendUrl}/profile?${params.toString()}`;
}
