import { Router } from 'express';
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
router.get('/discord/test', testDiscordConfig);
router.get('/discord/callback', discordCallback);
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
