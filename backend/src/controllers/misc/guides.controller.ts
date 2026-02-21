import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getDirectoryStructure,
  loadMarkdownContent,
} from '../../utils/markdownUtils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_BASE_PATH = path.resolve(__dirname, '..', '..', '..', '..', 'website', 'public', 'content');
const VALID_CATEGORIES = ['guides', 'lore', 'factions', 'npcs'];

// Express 5 wildcard params return an array of segments
function getWildcardPath(param: unknown): string {
  if (Array.isArray(param)) { return param.join('/'); }
  return (param as string) ?? '';
}

const CATEGORY_NAMES: Record<string, string> = {
  guides: 'Game Guides',
  lore: 'Lore',
  factions: 'Factions',
  npcs: 'NPCs',
};

// ============================================================================
// Controllers
// ============================================================================

/**
 * Get all guide categories with their directory structures
 * GET /api/guides/categories
 */
export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories: Record<
      string,
      { name: string; path: string; structure: ReturnType<typeof getDirectoryStructure> }
    > = {};

    for (const category of VALID_CATEGORIES) {
      const categoryPath = path.join(CONTENT_BASE_PATH, category);
      categories[category] = {
        name: CATEGORY_NAMES[category] ?? category,
        path: category,
        structure: fs.existsSync(categoryPath)
          ? getDirectoryStructure(categoryPath, '')
          : null,
      };
    }

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting guide categories:', error);
    res.status(500).json({ success: false, message: 'Failed to get categories' });
  }
}

/**
 * Get content for a specific guide
 * GET /api/guides/:category/*guidePath
 */
export async function getGuideContent(req: Request, res: Response): Promise<void> {
  try {
    const category = req.params.category as string;
    const guidePath = getWildcardPath(req.params.guidePath);

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: 'Invalid category' });
      return;
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = (guidePath || '').replace(/\.\./g, '').replace(/^\/+/, '');

    // Construct the full path
    let filePath = path.join(CONTENT_BASE_PATH, category, sanitizedPath);

    // Check if it's a directory
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'overview.md');
    } else if (!filePath.endsWith('.md')) {
      filePath += '.md';
    }

    // If file doesn't exist, generate a default page for category roots
    if (!fs.existsSync(filePath)) {
      if (!sanitizedPath || sanitizedPath === '/') {
        const categoryPath = path.join(CONTENT_BASE_PATH, category);
        if (fs.existsSync(categoryPath)) {
          const categoryName = CATEGORY_NAMES[category] ?? category;
          const defaultContent = `# ${categoryName}\n\nWelcome to the ${categoryName} section. Please select a topic from the sidebar to get started.`;

          res.json({
            success: true,
            content: defaultContent,
            html: `<h1>${categoryName}</h1>\n<p>Welcome to the ${categoryName} section. Please select a topic from the sidebar to get started.</p>`,
            metadata: { title: categoryName },
            path: sanitizedPath,
            isGenerated: true,
          });
          return;
        }
      }

      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }

    const result = loadMarkdownContent(filePath);

    res.json({
      success: true,
      content: result.content,
      html: result.html,
      metadata: result.metadata,
      path: sanitizedPath,
    });
  } catch (error) {
    console.error('Error getting guide content:', error);
    res.status(500).json({ success: false, message: 'Failed to get guide content' });
  }
}
