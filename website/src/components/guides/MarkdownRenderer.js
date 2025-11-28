import React from 'react';

/**
 * Component to render HTML content from markdown
 * Uses dangerouslySetInnerHTML but content is sanitized on the server
 */
const MarkdownRenderer = ({ content }) => {
  if (!content) {
    return <div className="markdown-empty">No content available</div>;
  }

  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default MarkdownRenderer;
