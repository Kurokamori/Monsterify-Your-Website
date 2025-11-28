const fs = require('fs');
const path = require('path');
const marked = require('marked');

/**
 * Convert markdown to HTML with enhanced features
 * @param {string} markdown - Raw markdown content
 * @returns {string} HTML content
 */
function markdownToHtml(markdown) {
  // Configure marked for tables and other features
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true,
    headerIds: true,
    mangle: false,
    tables: true,
  });

  return marked.parse(markdown);
}

/**
 * Get directory structure for content navigation
 * @param {string} dirPath - Base directory path
 * @param {string} basePath - Base URL path for links
 * @returns {Object} Directory structure
 */
function getDirectoryStructure(dirPath, basePath = '') {
  try {
    if (!fs.existsSync(dirPath)) {
      return null;
    }

    const items = fs.readdirSync(dirPath);
    const result = {
      directories: [],
      files: []
    };

    // Check for index file
    const indexPath = path.join(dirPath, '!index.md');
    let orderedItems = [...items];

    if (fs.existsSync(indexPath)) {
      try {
        // Read index file for custom ordering
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const orderList = indexContent.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        
        // Reorder items based on index
        const indexedItems = [];
        orderList.forEach(item => {
          if (items.includes(item)) {
            indexedItems.push(item);
          }
        });
        
        // Add remaining items
        const remainingItems = items.filter(item => 
          !indexedItems.includes(item) && item !== '!index.md'
        );
        
        orderedItems = [...indexedItems, ...remainingItems];
      } catch (error) {
        console.error(`Error reading index file: ${error.message}`);
      }
    } else {
      // If no index file, sort alphabetically but put overview.md first
      orderedItems = items.filter(item => item !== 'overview.md');
      orderedItems.sort();

      if (items.includes('overview.md')) {
        orderedItems.unshift('overview.md');
      }
    }

    // Process each item
    for (const item of orderedItems) {
      const itemPath = path.join(dirPath, item);
      const itemStat = fs.statSync(itemPath);
      // Use forward slashes for URLs regardless of OS
      const itemUrl = basePath ? `${basePath}/${item}`.replace(/\\/g, '/') : item;

      if (item === '!index.md') {
        continue; // Skip index file
      }

      if (itemStat.isDirectory()) {
        // Get the name from overview.md if it exists
        let name = item;
        const overviewPath = path.join(itemPath, 'overview.md');

        if (fs.existsSync(overviewPath)) {
          const overviewContent = fs.readFileSync(overviewPath, 'utf8');
          const titleMatch = overviewContent.match(/^# (.+)/m);
          if (titleMatch) {
            name = titleMatch[1];
          }
        }

        result.directories.push({
          name: name,
          path: item,
          url: itemUrl,
          children: getDirectoryStructure(itemPath, itemUrl)
        });
      } else if (item.endsWith('.md') && item !== 'overview.md') {
        // Get the name from the file content
        const content = fs.readFileSync(itemPath, 'utf8');
        const titleMatch = content.match(/^# (.+)/m);
        const name = titleMatch ? titleMatch[1] : item.replace('.md', '');

        result.files.push({
          name: name,
          path: item,
          url: itemUrl
        });
      }
    }

    return result;
  } catch (error) {
    console.error(`Error getting directory structure for ${dirPath}:`, error);
    return null;
  }
}

/**
 * Load markdown content from file
 * @param {string} filePath - Path to markdown file
 * @returns {Object} Content and metadata
 */
function loadMarkdownContent(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { 
        content: null,
        html: null,
        metadata: {}
      };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract metadata if present (YAML front matter)
    let markdown = content;
    let metadata = {};

    // Check for YAML front matter
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontMatterMatch) {
      try {
        // Simple YAML parser
        const yamlLines = frontMatterMatch[1].split('\n');
        yamlLines.forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            metadata[key] = value;
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
      metadata
    };
  } catch (error) {
    console.error(`Error loading markdown file ${filePath}:`, error);
    return {
      content: null,
      html: null,
      metadata: {}
    };
  }
}

module.exports = {
  markdownToHtml,
  getDirectoryStructure,
  loadMarkdownContent
};
