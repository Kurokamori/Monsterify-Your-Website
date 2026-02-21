import { marked } from 'marked';

/**
 * Utility function to parse markdown to plain text (strips HTML)
 * Useful for previews or excerpts
 */
export const markdownToPlainText = (content: string, maxLength: number = 200): string => {
  if (!content) return '';

  try {
    const rawHtml = marked.parse(content) as string;
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

