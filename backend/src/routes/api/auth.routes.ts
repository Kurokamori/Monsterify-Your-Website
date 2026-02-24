import { Router } from 'express';
import passport from 'passport';
import { authenticate } from '@middleware/auth.middleware';
import {
  registerUser,
  loginUser,
  refreshToken,
  getUserProfile,
  updateUserProfile,
  getMonsterRollerSettings,
  updateMonsterRollerSettings,
  updateUserTheme,
  updateContentSettings,
  testDiscordConfig,
  discordCallback,
  discordLinkStart,
  discordLinkCallback,
} from '../../controllers';

const router = Router();

// ============================================================================
// Public Routes
// ============================================================================

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);

// Discord OAuth
router.get('/discord', passport.authenticate('discord'));
router.get('/discord/test', testDiscordConfig);
router.get('/discord/callback', (req, res, next) => {
  passport.authenticate('discord', { session: false }, (err: Error | null, user: Express.User | false) => {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4000';
    if (err) {
      console.error('Discord auth error:', err);
      res.redirect(`${frontendUrl}/login?error=discord_error`);
      return;
    }
    if (!user) {
      console.error('Discord auth: no user returned');
      res.redirect(`${frontendUrl}/login?error=discord_no_user`);
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
}, discordCallback);
router.get('/discord/link', discordLinkStart);
router.get('/discord/link/callback', discordLinkCallback);

// ============================================================================
// Authenticated Routes
// ============================================================================

router.get('/profile', authenticate, getUserProfile);
router.patch('/profile', authenticate, updateUserProfile);
router.get('/roller-settings', authenticate, getMonsterRollerSettings);
router.put('/roller-settings', authenticate, updateMonsterRollerSettings);
router.put('/theme', authenticate, updateUserTheme);
router.put('/content-settings', authenticate, updateContentSettings);

export default router;
