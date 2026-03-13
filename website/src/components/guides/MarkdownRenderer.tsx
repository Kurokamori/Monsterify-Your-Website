import DOMPurify from 'dompurify';
import { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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
  'sup', 'sub',
  'mark'
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'target', 'rel', 'width', 'height'
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectHighlights(html: string, query: string): string {
  if (!query || query.length < 2) return html;

  // Only highlight text content, not inside HTML tags
  const escaped = escapeRegExp(query);
  const regex = new RegExp(`(${escaped})`, 'gi');

  // Split by HTML tags, highlight only text parts
  return html.replace(/(<[^>]+>)|([^<]+)/g, (_match, tag: string, text: string) => {
    if (tag) return tag;
    return text.replace(regex, '<mark class="guide-search-highlight">$1</mark>');
  });
}

/**
 * Simple MarkdownRenderer for pre-rendered HTML content from the server.
 * Sanitizes HTML before rendering to prevent XSS attacks.
 * Supports ?highlight=query param to highlight search matches.
 */
export const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  const [searchParams] = useSearchParams();
  const highlightQuery = searchParams.get('highlight') || '';

  const sanitizedContent = useMemo(() => {
    if (!content) return '';

    let html = DOMPurify.sanitize(content, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ADD_ATTR: ['target', 'rel'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
    });

    if (highlightQuery) {
      html = injectHighlights(html, highlightQuery);
    }

    return html;
  }, [content, highlightQuery]);

  // Scroll to first highlight on mount
  useEffect(() => {
    if (!highlightQuery) return;
    const timer = setTimeout(() => {
      const firstMark = document.querySelector('.guide-search-highlight');
      if (firstMark) {
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [highlightQuery, sanitizedContent]);

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
