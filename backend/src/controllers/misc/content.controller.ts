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
const VALID_CATEGORIES = ['guides', 'lore', 'factions', 'npcs', 'locations'];

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
    const categories: Record<string, { name: string; path: string; structure: ReturnType<typeof getDirectoryStructure> }> = {
      guides: {
        name: 'Game Guides',
        path: 'guides',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'guides'), ''),
      },
      lore: {
        name: 'Lore',
        path: 'lore',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'lore'), ''),
      },
      factions: {
        name: 'Factions',
        path: 'factions',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'factions'), ''),
      },
      npcs: {
        name: 'NPCs',
        path: 'npcs',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'npcs'), ''),
      },
      locations: {
        name: 'Locations',
        path: 'locations',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'locations'), ''),
      },
    };

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

    // Sanitize path to prevent directory traversal
    const sanitizedPath = contentPath.replace(/\.\./g, '').replace(/^\/+/, '');

    // Construct the full path
    let filePath = path.join(CONTENT_BASE_PATH, category, sanitizedPath);

    // Check if it's a directory
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'overview.md');
    } else if (!filePath.endsWith('.md')) {
      filePath += '.md';
    }

    if (!fs.existsSync(filePath)) {
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
    let filePath = path.join(CONTENT_BASE_PATH, category, sanitizedPath);

    if (!filePath.endsWith('.md')) {
      filePath += '.md';
    }

    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Prepare content with title
    let finalContent = content;
    if (title && !content.startsWith('# ')) {
      finalContent = `# ${title}\n\n${content}`;
    }

    fs.writeFileSync(filePath, finalContent, 'utf8');

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
    let filePath = path.join(CONTENT_BASE_PATH, category, sanitizedPath);

    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.md')) {
        filePath += '.md';
      } else {
        res.status(404).json({ success: false, message: 'Content not found' });
        return;
      }
    }

    const isDirectory = fs.statSync(filePath).isDirectory();

    if (isDirectory) {
      fs.rmSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: `${isDirectory ? 'Directory' : 'File'} deleted successfully`,
    });
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

    if (!name || !/^[a-zA-Z0-9-_]+$/.test(name)) {
      res.status(400).json({
        success: false,
        message: 'Invalid directory name. Use only letters, numbers, hyphens, and underscores.',
      });
      return;
    }

    const sanitizedPath = dirPath.replace(/\.\./g, '').replace(/^\/+/, '');
    const fullPath = path.join(CONTENT_BASE_PATH, category, sanitizedPath, name);

    if (fs.existsSync(fullPath)) {
      res.status(400).json({ success: false, message: 'Directory already exists' });
      return;
    }

    fs.mkdirSync(fullPath, { recursive: true });

    // Create overview.md file
    const overviewPath = path.join(fullPath, 'overview.md');
    fs.writeFileSync(overviewPath, `# ${name}\n\nOverview content for ${name}`, 'utf8');

    res.json({
      success: true,
      message: 'Directory created successfully',
      path: path.join(sanitizedPath, name).replace(/\\/g, '/'),
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ success: false, message: 'Failed to create directory' });
  }
}
