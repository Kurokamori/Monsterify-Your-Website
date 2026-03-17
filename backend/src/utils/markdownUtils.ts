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

/* =========================
   Markdown Loading Types
   ========================= */

export interface MarkdownContent {
  content: string | null;
  html: string | null;
  metadata: Record<string, string>;
}
