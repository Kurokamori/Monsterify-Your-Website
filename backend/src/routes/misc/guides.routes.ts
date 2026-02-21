import { Router } from 'express';
import { getCategories, getGuideContent } from '@controllers/misc/guides.controller';

const router = Router();

// Routes for /api/guides (public, read-only)

// Get all guide categories with directory structures
router.get('/categories', getCategories);

// Get content for a specific guide (category root or subpath)
router.get('/:category', getGuideContent);
router.get('/:category/*guidePath', getGuideContent);

export default router;
