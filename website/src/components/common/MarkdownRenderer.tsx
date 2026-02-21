import { useMemo } from 'react';
import { marked, Marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked options for safe rendering
marked.setOptions({
  gfm: true,
  breaks: true
});

// Separate marked instance for writing content that ignores indented code blocks.
// Creative writing often has indented paragraphs that should not be rendered as code blocks.
const writingMarked = new Marked({
  gfm: true,
  breaks: true
});

// Override the indented code block tokenizer to return undefined (no match).
writingMarked.use({
  tokenizer: {
    code() {
      return undefined;
    }
  }
});

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

interface MarkdownRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
  disableCodeBlocks?: boolean;
}

export const MarkdownRenderer = ({
  content,
  className = '',
  inline = false,
  disableCodeBlocks = false
}: MarkdownRendererProps) => {
  const htmlContent = useMemo(() => {
    if (!content) {
      return '';
    }

    try {
      const parser = disableCodeBlocks ? writingMarked : marked;
      let textToParse = content;

      // When code blocks are disabled, preserve leading whitespace
      if (disableCodeBlocks) {
        textToParse = content.replace(/^([\t ]+)/gm, (match) => {
          return match.replace(/\t/g, '\u00a0\u00a0\u00a0\u00a0').replace(/ /g, '\u00a0');
        });
      }

      const rawHtml = parser.parse(textToParse) as string;

      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ADD_ATTR: ['target', 'rel'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
      });

      return sanitizedHtml;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return content;
    }
  }, [content, disableCodeBlocks]);

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
