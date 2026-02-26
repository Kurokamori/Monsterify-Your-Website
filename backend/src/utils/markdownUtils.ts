import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

/**
 * Convert markdown to HTML with enhanced features
 * @param markdown - Raw markdown content
 * @returns HTML content
 */
export function markdownToHtml(markdown: string): string {
  marked.setOptions({
    gfm: true,          // GitHub Flavored Markdown
    breaks: true,
  });

  return marked.parse(markdown) as string;
}

/* =========================
   Directory Structure Types
   ========================= */

export interface DirectoryFile {
  name: string;
  path: string;
  url: string;
}

export interface DirectoryNode {
  name: string;
  path: string;
  url: string;
  children: DirectoryStructure | null;
}

export type DirectoryItem =
  | ({ type: 'directory' } & DirectoryNode)
  | ({ type: 'file' } & DirectoryFile);

export interface DirectoryStructure {
  directories: DirectoryNode[];
  files: DirectoryFile[];
  items: DirectoryItem[];
}

/**
 * Get directory structure for content navigation
 * @param dirPath - Base directory path
 * @param basePath - Base URL path for links
 * @returns Directory structure or null
 */
export function getDirectoryStructure(
  dirPath: string,
  basePath = ''
): DirectoryStructure | null {
  try {
    if (!fs.existsSync(dirPath)) {
      return null;
    }

    const items = fs.readdirSync(dirPath);
    let orderedItems = [...items];

    const result: DirectoryStructure = {
      directories: [],
      files: [],
      items: [],
    };

    // Check for index file
    const indexPath = path.join(dirPath, '!index.md');

    if (fs.existsSync(indexPath)) {
      try {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const orderList = indexContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
          // Strip numbered prefixes like "1. ", "2. "
          .map(line => line.replace(/^\d+\.\s*/, ''));

        // Build a lookup: index entry name → actual filesystem item
        const nonIndexItems = items.filter(item => item !== '!index.md');
        const findItem = (name: string): string | undefined => {
          // Match directory name directly
          if (nonIndexItems.includes(name)) { return name; }
          // Match file name with .md extension
          if (nonIndexItems.includes(`${name}.md`)) { return `${name}.md`; }
          // Match file name with ! prefix (e.g., "Overall" → "!Overall.md")
          if (nonIndexItems.includes(`!${name}.md`)) { return `!${name}.md`; }
          return undefined;
        };

        const indexedItems: string[] = [];
        orderList.forEach(entry => {
          const match = findItem(entry);
          if (match) {
            indexedItems.push(match);
          }
        });

        const remainingItems = nonIndexItems
          .filter(item => !indexedItems.includes(item))
          .sort();

        orderedItems = [...indexedItems, ...remainingItems];
      } catch (error) {
        console.error(`Error reading index file: ${(error as Error).message}`);
      }
    } else {
      // No index file → alphabetical, overview.md first
      orderedItems = items.filter(item => item !== 'overview.md' && item !== '!index.md').sort();
      if (items.includes('overview.md')) {
        orderedItems.unshift('overview.md');
      }
    }

    // Process items
    for (const item of orderedItems) {
      if (item === '!index.md') {continue;}

      const itemPath = path.join(dirPath, item);
      const itemStat = fs.statSync(itemPath);
      const itemUrl = basePath
        ? `${basePath}/${item}`.replace(/\\/g, '/')
        : item;

      if (itemStat.isDirectory()) {
        let name = item;
        const overviewPath = path.join(itemPath, 'overview.md');

        if (fs.existsSync(overviewPath)) {
          const overviewContent = fs.readFileSync(overviewPath, 'utf8');
          const titleMatch = overviewContent.match(/^# (.+)/m);
          if (titleMatch?.[1]) {
            name = titleMatch[1];
          }
        }

        const dirEntry: DirectoryNode = {
          name,
          path: item,
          url: itemUrl,
          children: getDirectoryStructure(itemPath, itemUrl),
        };
        result.directories.push(dirEntry);
        result.items.push({ type: 'directory', ...dirEntry });
      } else if (item.endsWith('.md') && item !== 'overview.md') {
        const content = fs.readFileSync(itemPath, 'utf8');
        const titleMatch = content.match(/^# (.+)/m);
        const name = titleMatch?.[1] ?? item.replace('.md', '');

        const fileEntry: DirectoryFile = {
          name,
          path: item,
          url: itemUrl,
        };
        result.files.push(fileEntry);
        result.items.push({ type: 'file', ...fileEntry });
      }
    }

    return result;
  } catch (error) {
    console.error(
      `Error getting directory structure for ${dirPath}:`,
      error
    );
    return null;
  }
}

/* =========================
   Markdown Loading Types
   ========================= */

export interface MarkdownContent {
  content: string | null;
  html: string | null;
  metadata: Record<string, string>;
}

/**
 * Load markdown content from file
 * @param filePath - Path to markdown file
 * @returns Content, HTML, and metadata
 */
export function loadMarkdownContent(filePath: string): MarkdownContent {
  try {
    if (!fs.existsSync(filePath)) {
      return { content: null, html: null, metadata: {} };
    }

    const content = fs.readFileSync(filePath, 'utf8');

    let markdown = content;
    const metadata: Record<string, string> = {};

    // YAML front matter
    const frontMatterMatch = content.match(
      /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
    );

    if (frontMatterMatch?.[1] && frontMatterMatch?.[2]) {
      try {
        const yamlLines = frontMatterMatch[1].split('\n');
        yamlLines.forEach(line => {
          const parts = line.split(':');
          const key = parts[0];
          if (parts.length >= 2 && key) {
            const value = parts.slice(1).join(':').trim();
            metadata[key.trim()] = value;
          }
        });
        markdown = frontMatterMatch[2];
      } catch (e) {
        console.error('Error parsing front matter:', e);
      }
    }

    return {
      content: markdown,
      html: markdownToHtml(markdown),
      metadata,
    };
  } catch (error) {
    console.error(`Error loading markdown file ${filePath}:`, error);
    return { content: null, html: null, metadata: {} };
  }
}
