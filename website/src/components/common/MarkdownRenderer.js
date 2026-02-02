import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked options for safe rendering
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
  headerIds: true,
  mangle: false,
  pedantic: false
});

/**
 * Reusable component to render markdown content
 * Uses marked for parsing and DOMPurify for sanitization
 *
 * @param {Object} props
 * @param {string} props.content - The markdown content to render
 * @param {string} props.className - Optional additional CSS class
 * @param {boolean} props.inline - If true, renders without wrapper div
 */
const MarkdownRenderer = ({ content, className = '', inline = false }) => {
  // Parse and sanitize markdown content
  const htmlContent = useMemo(() => {
    if (!content) {
      return '';
    }

    try {
      // Parse markdown to HTML
      const rawHtml = marked.parse(content);

      // Sanitize HTML to prevent XSS attacks
      // Configure DOMPurify to allow safe HTML tags
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span',
          'sup', 'sub'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'class', 'id',
          'target', 'rel', 'width', 'height'
        ],
        // Add target="_blank" and rel="noopener" to external links
        ADD_ATTR: ['target', 'rel'],
        // Transform hooks for additional security
        FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
      });

      return sanitizedHtml;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return content; // Return raw content if parsing fails
    }
  }, [content]);

  if (!content) {
    return <div className={`markdown-empty ${className}`}>No content available</div>;
  }

  if (inline) {
    return (
      <span
        className={`markdown-content markdown-inline ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

/**
 * Hook for parsing markdown content without rendering
 * Useful when you need the HTML string directly
 *
 * @param {string} content - The markdown content to parse
 * @returns {string} Sanitized HTML string
 */
export const useMarkdownParser = (content) => {
  return useMemo(() => {
    if (!content) return '';

    try {
      const rawHtml = marked.parse(content);
      return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span',
          'sup', 'sub'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'class', 'id',
          'target', 'rel', 'width', 'height'
        ]
      });
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return content;
    }
  }, [content]);
};

/**
 * Utility function to parse markdown to plain text (strips HTML)
 * Useful for previews or excerpts
 *
 * @param {string} content - The markdown content
 * @param {number} maxLength - Maximum length of the output
 * @returns {string} Plain text excerpt
 */
export const markdownToPlainText = (content, maxLength = 200) => {
  if (!content) return '';

  try {
    // Parse markdown and strip HTML tags
    const rawHtml = marked.parse(content);
    const plainText = rawHtml.replace(/<[^>]*>/g, '').trim();

    if (maxLength && plainText.length > maxLength) {
      return plainText.substring(0, maxLength).trim() + '...';
    }

    return plainText;
  } catch (error) {
    console.error('Error converting markdown to plain text:', error);
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  }
};

export default MarkdownRenderer;
