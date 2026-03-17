import { Request, Response } from 'express';
import { markdownToHtml } from '../../utils/markdownUtils';
import { GuideContentRepository } from '../../repositories/guide-content.repository';

const repo = new GuideContentRepository();

const VALID_CATEGORIES = ['guides', 'lore', 'factions', 'npcs', 'locations'];

const CATEGORY_NAMES: Record<string, string> = {
  guides: 'Game Guides',
  lore: 'Lore',
  factions: 'Factions',
  npcs: 'NPCs',
  locations: 'Locations',
};

// Express 5 wildcard params (*contentPath) return an array of segments
function getContentPath(req: Request): string {
  const raw = req.params.contentPath;
  if (Array.isArray(raw)) { return raw.join('/'); }
  return (raw as string) ?? '';
}

// ============================================================================
// Controllers
// ============================================================================

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

    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, message: 'Failed to get categories' });
  }
}

export async function getContent(req: Request, res: Response): Promise<void> {
  try {
    const category = req.params.category as string;
    const contentPath = getContentPath(req);

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: 'Invalid category' });
      return;
    }

    const sanitizedPath = contentPath.replace(/\.\./g, '').replace(/^\/+/, '');

    // Try as exact file (with .md extension)
    let entry = await repo.findByPath(
      category,
      sanitizedPath.endsWith('.md') ? sanitizedPath : `${sanitizedPath}.md`,
    );

    // Try as directory overview
    entry ??= await repo.findOverview(category, sanitizedPath || '');

    // Try the path itself as a .md file if sanitizedPath already ends with .md
    if (!entry && sanitizedPath.endsWith('.md')) {
      entry = await repo.findByPath(category, sanitizedPath);
    }

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
    console.error('Error getting content:', error);
    res.status(500).json({ success: false, message: 'Failed to get content' });
  }
}

export async function saveContent(req: Request, res: Response): Promise<void> {
  try {
    const category = req.params.category as string;
    const contentPath = getContentPath(req);
    const { content, title } = req.body as { content?: string; title?: string };

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: 'Invalid category' });
      return;
    }

    if (!content) {
      res.status(400).json({ success: false, message: 'Content is required' });
      return;
    }

    const sanitizedPath = contentPath.replace(/\.\./g, '').replace(/^\/+/, '');
    const filePath = sanitizedPath.endsWith('.md') ? sanitizedPath : `${sanitizedPath}.md`;

    // Prepare content with title
    let finalContent = content;
    if (title && !content.startsWith('# ')) {
      finalContent = `# ${title}\n\n${content}`;
    }

    // Extract title from content
    const titleMatch = finalContent.match(/^# (.+)/m);
    const extractedTitle = titleMatch?.[1] ?? filePath.replace(/\.md$/, '').split('/').pop() ?? filePath;

    // Determine parent path
    const pathParts = filePath.split('/');
    const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
    const fileName = pathParts[pathParts.length - 1] ?? '';
    const isOverview = fileName === 'overview.md';

    // Check if entry exists
    const existing = await repo.findByPath(category, filePath);

    if (existing) {
      await repo.update(existing.id, {
        content: finalContent,
        title: extractedTitle,
      });
    } else {
      await repo.create({
        category,
        path: filePath,
        title: extractedTitle,
        content: finalContent,
        isOverview,
        parentPath,
      });
    }

    res.json({
      success: true,
      message: 'Content saved successfully',
      path: sanitizedPath,
    });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ success: false, message: 'Failed to save content' });
  }
}

export async function deleteContent(req: Request, res: Response): Promise<void> {
  try {
    const category = req.params.category as string;
    const contentPath = getContentPath(req);

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: 'Invalid category' });
      return;
    }

    const sanitizedPath = contentPath.replace(/\.\./g, '').replace(/^\/+/, '');

    // Try deleting as a file
    const filePath = sanitizedPath.endsWith('.md') ? sanitizedPath : `${sanitizedPath}.md`;
    const deletedFile = await repo.deleteByCategoryAndPath(category, filePath);

    if (deletedFile) {
      res.json({ success: true, message: 'File deleted successfully' });
      return;
    }

    // Try deleting as a directory (all entries with this parent path prefix)
    const deletedCount = await repo.deleteByParentPathPrefix(category, sanitizedPath);

    if (deletedCount > 0) {
      res.json({ success: true, message: 'Directory deleted successfully' });
      return;
    }

    res.status(404).json({ success: false, message: 'Content not found' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ success: false, message: 'Failed to delete content' });
  }
}

export async function createDirectory(req: Request, res: Response): Promise<void> {
  try {
    const category = req.params.category as string;
    const dirPath = getContentPath(req);
    const { name } = req.body as { name?: string };

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: 'Invalid category' });
      return;
    }

    if (!name || !/^[a-zA-Z0-9-_ ]+$/.test(name)) {
      res.status(400).json({
        success: false,
        message: 'Invalid directory name. Use only letters, numbers, hyphens, underscores, and spaces.',
      });
      return;
    }

    const sanitizedPath = dirPath.replace(/\.\./g, '').replace(/^\/+/, '');
    const fullDirPath = sanitizedPath ? `${sanitizedPath}/${name}` : name;
    const overviewPath = `${fullDirPath}/overview.md`;

    // Check if directory already exists
    const existing = await repo.findByPath(category, overviewPath);
    if (existing) {
      res.status(400).json({ success: false, message: 'Directory already exists' });
      return;
    }

    // Create overview.md entry for the new directory
    await repo.create({
      category,
      path: overviewPath,
      title: name,
      content: `# ${name}\n\nOverview content for ${name}`,
      isOverview: true,
      parentPath: fullDirPath,
    });

    res.json({
      success: true,
      message: 'Directory created successfully',
      path: fullDirPath.replace(/\\/g, '/'),
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ success: false, message: 'Failed to create directory' });
  }
}

export async function getSortOrder(req: Request, res: Response): Promise<void> {
  try {
    const category = req.params.category as string;
    const parentPath = getContentPath(req);

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: 'Invalid category' });
      return;
    }

    const sanitizedPath = parentPath.replace(/\.\./g, '').replace(/^\/+/, '');
    const items = await repo.getItemsAtLevel(category, sanitizedPath);

    res.json({
      success: true,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        path: item.path,
        isOverview: item.isOverview,
        isDirectory: item.isOverview,
        sortOrder: item.sortOrder,
      })),
    });
  } catch (error) {
    console.error('Error getting sort order:', error);
    res.status(500).json({ success: false, message: 'Failed to get sort order' });
  }
}

export async function updateSortOrder(req: Request, res: Response): Promise<void> {
  try {
    const { items } = req.body as { items?: { id: number; sortOrder: number }[] };

    if (!items || !Array.isArray(items)) {
      res.status(400).json({ success: false, message: 'Items array is required' });
      return;
    }

    await repo.bulkUpdateSortOrders(items);

    res.json({ success: true, message: 'Sort order updated successfully' });
  } catch (error) {
    console.error('Error updating sort order:', error);
    res.status(500).json({ success: false, message: 'Failed to update sort order' });
  }
}
