import { Router } from 'express';
import { getCategories, getGuideContent, searchGuides } from '@controllers/misc/guides.controller';

const router = Router();

// Routes for /api/guides (public, read-only)

// Get all guide categories with directory structures
router.get('/categories', getCategories);

// Search across guide content
router.get('/search', searchGuides);

// Get content for a specific guide (category root or subpath)
router.get('/:category', getGuideContent);
router.get('/:category/*guidePath', getGuideContent);

export default router;
