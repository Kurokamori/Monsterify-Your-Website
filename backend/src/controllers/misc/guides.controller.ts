import { Request, Response } from 'express';
import { markdownToHtml } from '../../utils/markdownUtils';
import { GuideContentRepository } from '../../repositories/guide-content.repository';

const repo = new GuideContentRepository();

const VALID_CATEGORIES = ['guides', 'lore', 'factions', 'npcs'];

const CATEGORY_NAMES: Record<string, string> = {
  guides: 'Game Guides',
  lore: 'Lore',
  factions: 'Factions',
  npcs: 'NPCs',
};

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

// ============================================================================
// Controllers
// ============================================================================

/**
 * Get all guide categories with their directory structures
 * GET /api/guides/categories
 */
export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories: Record<string, { name: string; path: string; structure: unknown }> = {};

    for (const category of VALID_CATEGORIES) {
      categories[category] = {
        name: CATEGORY_NAMES[category] ?? category,
        path: category,
        structure: await repo.buildDirectoryStructure(category),
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

    const sanitizedPath = (guidePath || '').replace(/\.\./g, '').replace(/^\/+/, '');

    // Block access to !index paths
    if (sanitizedPath.endsWith('!index.md') || sanitizedPath.endsWith('!index')) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }

    // Empty path = category root
    if (!sanitizedPath || sanitizedPath === '/') {
      const overview = await repo.findOverview(category, '');
      if (overview) {
        res.json({
          success: true,
          content: overview.content,
          html: markdownToHtml(overview.content),
          metadata: overview.metadata,
          path: sanitizedPath,
        });
        return;
      }

      // Generate a default page for the category root
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

    // Try as exact file path (with .md)
    let entry = await repo.findByPath(category, sanitizedPath.endsWith('.md') ? sanitizedPath : `${sanitizedPath}.md`);

    // Try as directory (look for overview)
    entry ??= await repo.findOverview(category, sanitizedPath);

    if (!entry) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }

    res.json({
      success: true,
      content: entry.content,
      html: markdownToHtml(entry.content),
      metadata: entry.metadata,
      path: sanitizedPath,
    });
  } catch (error) {
    console.error('Error getting guide content:', error);
    res.status(500).json({ success: false, message: 'Failed to get guide content' });
  }
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

    const matchingEntries = await repo.search(query, categoriesToSearch, 50);

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const entry of matchingEntries) {
      // Strip frontmatter if any remains
      let content = entry.content;
      const fmMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      if (fmMatch?.[1]) { content = fmMatch[1]; }

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
        i = end; // Skip ahead to avoid overlapping contexts
      }

      if (matches.length > 0) {
        let navPath = entry.path;
        if (navPath.endsWith('.md')) {navPath = navPath.slice(0, -3);}

        results.push({
          category: entry.category,
          categoryName: CATEGORY_NAMES[entry.category] ?? entry.category,
          filePath: navPath,
          title: entry.title,
          matches,
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching guides:', error);
    res.status(500).json({ success: false, message: 'Failed to search guides' });
  }
}
