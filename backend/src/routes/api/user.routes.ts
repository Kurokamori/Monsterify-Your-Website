import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getAdminUsers,
  getAllUsers,
  getUserById,
  createUser,
  updateUserAdmin,
  deleteUser,
  getUserRelatedSubmissions,
} from '../../controllers';

const router = Router();

// ============================================================================
// Public Routes
// ============================================================================

router.get('/:id/submissions/related', getUserRelatedSubmissions);

// ============================================================================
// Authenticated Routes
// ============================================================================

router.get('/', authenticate, getAllUsers);

// ============================================================================
// Admin Routes
// ============================================================================

router.get('/admin/list', authenticate, requireAdmin, getAdminUsers);
router.get('/:id', authenticate, requireAdmin, getUserById);
router.post('/', authenticate, requireAdmin, createUser);
router.put('/:id', authenticate, requireAdmin, updateUserAdmin);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
