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

interface SearchResult {
  category: string;
  categoryName: string;
  filePath: string;
  title: string;
  matches: { context: string; lineNumber: number }[];
}

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

    // Block access to !index.md files
    if (sanitizedPath.endsWith('!index.md') || sanitizedPath.endsWith('!index')) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }

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

/**
 * Recursively collect all markdown files in a directory
 */
function collectMarkdownFiles(dirPath: string, basePath: string): { filePath: string; relativePath: string }[] {
  const results: { filePath: string; relativePath: string }[] = [];
  if (!fs.existsSync(dirPath)) {return results;}

  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    if (item === '!index.md') {continue;}
    const fullPath = path.join(dirPath, item);
    const relPath = basePath ? `${basePath}/${item}` : item;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath, relPath));
    } else if (item.endsWith('.md')) {
      results.push({ filePath: fullPath, relativePath: relPath });
    }
  }
  return results;
}

/**
 * Search across guide content for a query string
 * GET /api/guides/search?q=query&category=optional
 */
export async function searchGuides(req: Request, res: Response): Promise<void> {
  try {
    const query = (req.query.q as string || '').trim();
    const categoryFilter = (req.query.category as string || '').trim();

    if (!query || query.length < 2) {
      res.json({ success: true, results: [] });
      return;
    }

    const categoriesToSearch = categoryFilter && VALID_CATEGORIES.includes(categoryFilter)
      ? [categoryFilter]
      : VALID_CATEGORIES;

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const MAX_RESULTS = 50;

    for (const category of categoriesToSearch) {
      if (results.length >= MAX_RESULTS) {break;}

      const categoryPath = path.join(CONTENT_BASE_PATH, category);
      const files = collectMarkdownFiles(categoryPath, '');

      for (const { filePath, relativePath } of files) {
        if (results.length >= MAX_RESULTS) {break;}

        const raw = fs.readFileSync(filePath, 'utf8');

        // Strip YAML front matter before searching
        let content = raw;
        const fmMatch = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
        if (fmMatch?.[1]) {content = fmMatch[1];}

        const contentLower = content.toLowerCase();
        if (!contentLower.includes(queryLower)) {continue;}

        // Extract title from first h1
        const titleMatch = content.match(/^# (.+)/m);
        const title = titleMatch?.[1] ?? relativePath.replace(/\.md$/, '').split('/').pop() ?? relativePath;

        // Find matching lines with context
        const lines = content.split('\n');
        const matches: { context: string; lineNumber: number }[] = [];
        const CONTEXT_LINES = 1;

        for (let i = 0; i < lines.length; i++) {
          if (matches.length >= 5) {break;}
          const line = lines[i];
          if (!line?.toLowerCase().includes(queryLower)) {continue;}

          const start = Math.max(0, i - CONTEXT_LINES);
          const end = Math.min(lines.length - 1, i + CONTEXT_LINES);
          const contextLines: string[] = [];
          for (let j = start; j <= end; j++) {
            contextLines.push(lines[j] ?? '');
          }
          matches.push({
            context: contextLines.join('\n'),
            lineNumber: i + 1,
          });
          // Skip ahead to avoid overlapping contexts
          i = end;
        }

        if (matches.length > 0) {
          // Build the navigable path (strip .md, strip overview.md → use dir path)
          let navPath = relativePath;
          if (navPath.endsWith('.md')) {navPath = navPath.slice(0, -3);}

          results.push({
            category,
            categoryName: CATEGORY_NAMES[category] ?? category,
            filePath: navPath,
            title,
            matches,
          });
        }
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching guides:', error);
    res.status(500).json({ success: false, message: 'Failed to search guides' });
  }
}
