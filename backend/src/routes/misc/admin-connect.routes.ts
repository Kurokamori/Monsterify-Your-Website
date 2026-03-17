import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware';
import {
  getAdminConnectItems,
  getAdminConnectItem,
  createAdminConnectItem,
  updateAdminConnectItem,
  resolveAdminConnectItem,
  reopenAdminConnectItem,
  deleteAdminConnectItem,
  reorderAdminConnectItems,
  createAdminConnectSubItem,
  updateAdminConnectSubItem,
  deleteAdminConnectSubItem,
  getUpdateNotes,
  saveUpdateNotes,
  clearForUpdate,
} from '../../controllers/misc/admin-connect.controller';

const router = Router();

// Public — any authenticated user can view
router.get('/', authenticate, getAdminConnectItems);

// Update notes — public read, admin write (must be before /:id)
router.get('/update-notes', authenticate, getUpdateNotes);
router.put('/update-notes', authenticate, requireAdmin, saveUpdateNotes);
router.post('/update-notes/clear', authenticate, requireAdmin, clearForUpdate);

router.get('/:id', authenticate, getAdminConnectItem);

// Admin-only — CRUD on items
router.post('/', authenticate, requireAdmin, createAdminConnectItem);
router.put('/reorder', authenticate, requireAdmin, reorderAdminConnectItems);
router.put('/:id', authenticate, requireAdmin, updateAdminConnectItem);
router.put('/:id/resolve', authenticate, requireAdmin, resolveAdminConnectItem);
router.put('/:id/reopen', authenticate, requireAdmin, reopenAdminConnectItem);
router.delete('/:id', authenticate, requireAdmin, deleteAdminConnectItem);

// Admin-only — sub-items
router.post('/:itemId/sub-items', authenticate, requireAdmin, createAdminConnectSubItem);
router.put('/:itemId/sub-items/:subId', authenticate, requireAdmin, updateAdminConnectSubItem);
router.delete('/:itemId/sub-items/:subId', authenticate, requireAdmin, deleteAdminConnectSubItem);

export default router;
