const fs = require('fs');
const path = require('path');

/**
 * Load and parse markdown content
 * @param {string} filePath - Path to the markdown file
 * @returns {string} HTML content
 */
function loadMarkdownContent(filePath) {
  try {
    console.log(`Attempting to load markdown file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return `<p class="error">Content not found: File does not exist</p>`;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`Successfully loaded file: ${filePath}`);
    return simpleMarkdownToHtml(content);
  } catch (error) {
    console.error(`Error loading markdown file ${filePath}:`, error);
    return `<p class="error">Content not found: ${error.message}</p>`;
  }
}

/**
 * Simple markdown to HTML converter
 * @param {string} markdown - Markdown content
 * @returns {string} HTML content
 */
function simpleMarkdownToHtml(markdown) {
  // Replace headings
  let html = markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>');

  // Replace bold and italic
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');

  // Replace links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Replace lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Wrap lists
  html = html.replace(/(<li>.+<\/li>\n)+/g, function(match) {
    return '<ul>\n' + match + '</ul>\n';
  });

  // Replace code blocks
  html = html.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>');

  // Replace inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Replace blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Replace horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Process tables
  html = processMarkdownTables(html);

  // Replace paragraphs (any line that doesn't start with a special character)
  html = html.replace(/^([^<#\-*>\d\s|].+)$/gm, '<p>$1</p>');

  // Fix empty lines between paragraphs
  html = html.replace(/<\/p>\s+<p>/g, '</p>\n<p>');

  return html;
}

/**
 * Process markdown tables
 * @param {string} html - HTML content with potential markdown tables
 * @returns {string} HTML with tables processed
 */
function processMarkdownTables(html) {
  // Split the content by lines
  const lines = html.split('\n');
  let inTable = false;
  let tableContent = [];
  let result = [];

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a table row (contains | character)
    if (line.trim().startsWith('|') && line.includes('|', 1)) {
      if (!inTable) {
        inTable = true;
        tableContent = [];
      }
      tableContent.push(line);
    }
    // Check if this is a separator row
    else if (line.trim().startsWith('|') && line.includes('-') && line.includes('|', 1)) {
      if (!inTable) {
        inTable = true;
        tableContent = [];
      }
      tableContent.push(line);
    }
    // Not a table row
    else {
      if (inTable) {
        // We were in a table, but this line is not part of it
        // Convert the collected table content to HTML
        result.push(convertTableToHtml(tableContent));
        inTable = false;
      }
      result.push(line);
    }
  }

  // If we ended while still in a table
  if (inTable) {
    result.push(convertTableToHtml(tableContent));
  }

  return result.join('\n');
}

/**
 * Convert markdown table rows to HTML table
 * @param {string[]} tableRows - Array of markdown table rows
 * @returns {string} HTML table
 */
function convertTableToHtml(tableRows) {
  if (!tableRows || tableRows.length < 2) {
    return ''; // Need at least header and separator
  }

  let html = '<div class="table-container">\n<table class="markdown-table">\n';

  // Process each row
  tableRows.forEach((row, rowIndex) => {
    // Skip separator row (the one with dashes)
    if (rowIndex === 1 && row.includes('-')) {
      return;
    }

    // Split the row into cells
    const cells = row.split('|')
      .filter(cell => cell.trim() !== '') // Remove empty cells from start/end
      .map(cell => cell.trim()); // Trim whitespace

    if (cells.length === 0) return;

    // Determine if this is a header row
    const isHeader = rowIndex === 0;
    const cellTag = isHeader ? 'th' : 'td';

    html += '  <tr>\n';

    // Add each cell
    cells.forEach(cell => {
      html += `    <${cellTag}>${cell}</${cellTag}>\n`;
    });

    html += '  </tr>\n';
  });

  html += '</table>\n</div>';
  return html;
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
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const indexLines = indexContent.split('\n');
      const listedItems = [];

      // Extract items from index file
      indexLines.forEach(line => {
        const match = line.match(/- (.+)/);
        if (match) {
          listedItems.push(match[1]);
        }
      });

      // Reorder items based on index
      if (listedItems.length > 0) {
        // First add items in the order specified in the index
        orderedItems = listedItems.filter(item => items.includes(item));

        // Then add remaining items alphabetically
        const remainingItems = items.filter(item => !listedItems.includes(item) && item !== '!index.md');
        remainingItems.sort();

        orderedItems = [...orderedItems, ...remainingItems];
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
 * Get content categories
 * @returns {Object} Categories and their structures
 */
function getContentCategories() {
  const contentPath = path.join(__dirname, '..', 'content');
  console.log('Content base path:', contentPath);

  const categories = {
    guides: {
      name: 'Game Guides',
      path: 'guides',
      structure: getDirectoryStructure(path.join(contentPath, 'guides'), '')
    },
    lore: {
      name: 'Lore',
      path: 'lore',
      structure: getDirectoryStructure(path.join(contentPath, 'lore'), '')
    },
    factions: {
      name: 'Factions',
      path: 'factions',
      structure: getDirectoryStructure(path.join(contentPath, 'factions'), '')
    },
    npcs: {
      name: 'NPCs',
      path: 'npcs',
      structure: getDirectoryStructure(path.join(contentPath, 'npcs'), '')
    },
    locations: {
      name: 'Locations',
      path: 'locations',
      structure: getDirectoryStructure(path.join(contentPath, 'locations'), '')
    }
  };

  return categories;
}

/**
 * Create a new directory for content
 * @param {string} category - Category name (e.g., 'guides', 'lore')
 * @param {string} directoryName - Name of the directory to create
 * @param {string} directoryTitle - Display title for the directory
 * @param {string} parentPath - Parent directory path (optional)
 * @returns {boolean} Success status
 */
function createContentDirectory(category, directoryName, directoryTitle, parentPath = '') {
  try {
    const contentPath = path.join(__dirname, '..', 'content');
    const categoryPath = path.join(contentPath, category);

    // Validate category exists
    if (!fs.existsSync(categoryPath)) {
      console.error(`Category does not exist: ${category}`);
      return false;
    }

    // Build the full directory path
    let dirPath = categoryPath;
    if (parentPath) {
      dirPath = path.join(dirPath, parentPath);

      // Validate parent path exists
      if (!fs.existsSync(dirPath)) {
        console.error(`Parent path does not exist: ${dirPath}`);
        return false;
      }
    }

    // Add the new directory name
    dirPath = path.join(dirPath, directoryName);

    // Check if directory already exists
    if (fs.existsSync(dirPath)) {
      console.error(`Directory already exists: ${dirPath}`);
      return false;
    }

    // Create the directory
    fs.mkdirSync(dirPath, { recursive: true });

    // Create an overview.md file with the title
    const overviewPath = path.join(dirPath, 'overview.md');
    const overviewContent = `# ${directoryTitle}\n\nAdd your content here...`;
    fs.writeFileSync(overviewPath, overviewContent, 'utf8');

    return true;
  } catch (error) {
    console.error(`Error creating content directory: ${error.message}`);
    return false;
  }
}

/**
 * Save content to a markdown file
 * @param {string} category - Category name (e.g., 'guides', 'lore')
 * @param {string} filePath - File path relative to category
 * @param {string} content - Markdown content
 * @param {string} parentPath - Parent directory path (optional)
 * @returns {boolean} Success status
 */
function saveContentFile(category, filePath, content, parentPath = '') {
  try {
    const contentPath = path.join(__dirname, '..', 'content');
    const categoryPath = path.join(contentPath, category);

    // Validate category exists
    if (!fs.existsSync(categoryPath)) {
      console.error(`Category does not exist: ${category}`);
      return false;
    }

    // Build the full file path
    let fullPath = categoryPath;
    if (parentPath) {
      fullPath = path.join(fullPath, parentPath);

      // Validate parent path exists
      if (!fs.existsSync(fullPath)) {
        console.error(`Parent path does not exist: ${fullPath}`);
        return false;
      }
    }

    // Add the file name
    fullPath = path.join(fullPath, filePath);

    // Write the content to the file
    fs.writeFileSync(fullPath, content, 'utf8');

    return true;
  } catch (error) {
    console.error(`Error saving content file: ${error.message}`);
    return false;
  }
}

/**
 * Delete a content file
 * @param {string} category - Category name (e.g., 'guides', 'lore')
 * @param {string} filePath - File path relative to category
 * @param {string} parentPath - Parent directory path (optional)
 * @returns {boolean} Success status
 */
function deleteContentFile(category, filePath, parentPath = '') {
  try {
    const contentPath = path.join(__dirname, '..', 'content');
    const categoryPath = path.join(contentPath, category);

    // Validate category exists
    if (!fs.existsSync(categoryPath)) {
      console.error(`Category does not exist: ${category}`);
      return false;
    }

    // Build the full file path
    let fullPath = categoryPath;
    if (parentPath) {
      fullPath = path.join(fullPath, parentPath);

      // Validate parent path exists
      if (!fs.existsSync(fullPath)) {
        console.error(`Parent path does not exist: ${fullPath}`);
        return false;
      }
    }

    // Add the file name
    fullPath = path.join(fullPath, filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`File does not exist: ${fullPath}`);
      return false;
    }

    // Delete the file
    fs.unlinkSync(fullPath);

    return true;
  } catch (error) {
    console.error(`Error deleting content file: ${error.message}`);
    return false;
  }
}

/**
 * Delete a content directory and all its contents
 * @param {string} category - Category name (e.g., 'guides', 'lore')
 * @param {string} directoryPath - Directory path relative to category
 * @param {string} parentPath - Parent directory path (optional)
 * @returns {boolean} Success status
 */
function deleteContentDirectory(category, directoryPath, parentPath = '') {
  try {
    const contentPath = path.join(__dirname, '..', 'content');
    const categoryPath = path.join(contentPath, category);

    // Validate category exists
    if (!fs.existsSync(categoryPath)) {
      console.error(`Category does not exist: ${category}`);
      return false;
    }

    // Build the full directory path
    let fullPath = categoryPath;
    if (parentPath) {
      fullPath = path.join(fullPath, parentPath);

      // Validate parent path exists
      if (!fs.existsSync(fullPath)) {
        console.error(`Parent path does not exist: ${fullPath}`);
        return false;
      }
    }

    // Add the directory name
    fullPath = path.join(fullPath, directoryPath);

    // Check if directory exists
    if (!fs.existsSync(fullPath)) {
      console.error(`Directory does not exist: ${fullPath}`);
      return false;
    }

    // Helper function to recursively delete directory contents
    function deleteDirRecursive(dirPath) {
      if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
          const curPath = path.join(dirPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            // Recursive call for directories
            deleteDirRecursive(curPath);
          } else {
            // Delete file
            fs.unlinkSync(curPath);
          }
        });
        // Delete the empty directory
        fs.rmdirSync(dirPath);
      }
    }

    // Delete the directory and its contents
    deleteDirRecursive(fullPath);

    return true;
  } catch (error) {
    console.error(`Error deleting content directory: ${error.message}`);
    return false;
  }
}

/**
 * Get raw content of a markdown file
 * @param {string} category - Category name (e.g., 'guides', 'lore')
 * @param {string} filePath - File path relative to category
 * @param {string} parentPath - Parent directory path (optional)
 * @returns {string|null} Markdown content or null if not found
 */
function getRawContentFile(category, filePath, parentPath = '') {
  try {
    const contentPath = path.join(__dirname, '..', 'content');
    const categoryPath = path.join(contentPath, category);

    // Validate category exists
    if (!fs.existsSync(categoryPath)) {
      console.error(`Category does not exist: ${category}`);
      return null;
    }

    // Build the full file path
    let fullPath = categoryPath;
    if (parentPath) {
      fullPath = path.join(fullPath, parentPath);

      // Validate parent path exists
      if (!fs.existsSync(fullPath)) {
        console.error(`Parent path does not exist: ${fullPath}`);
        return null;
      }
    }

    // Add the file name
    fullPath = path.join(fullPath, filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`File does not exist: ${fullPath}`);
      return null;
    }

    // Read the file content
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.error(`Error reading content file: ${error.message}`);
    return null;
  }
}

module.exports = {
  loadMarkdownContent,
  getDirectoryStructure,
  getContentCategories,
  createContentDirectory,
  saveContentFile,
  deleteContentFile,
  deleteContentDirectory,
  getRawContentFile
};
