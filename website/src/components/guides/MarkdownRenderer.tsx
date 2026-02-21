import DOMPurify from 'dompurify';
import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

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
 * Simple MarkdownRenderer for pre-rendered HTML content from the server.
 * Sanitizes HTML before rendering to prevent XSS attacks.
 */
export const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  const sanitizedContent = useMemo(() => {
    if (!content) return '';

    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ADD_ATTR: ['target', 'rel'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
    });
  }, [content]);

  if (!content) {
    return <div className={`markdown-empty ${className}`}>No content available</div>;
  }

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
