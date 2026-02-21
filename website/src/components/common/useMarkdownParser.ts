import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span',
  'sup', 'sub'
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'target', 'rel', 'width', 'height'
];

/**
 * Hook for parsing markdown content without rendering
 * Useful when you need the HTML string directly
 */
export const useMarkdownParser = (content: string): string => {
  return useMemo(() => {
    if (!content) return '';

    try {
      const rawHtml = marked.parse(content) as string;
      return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS,
        ALLOWED_ATTR
      });
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return content;
    }
  }, [content]);
};

