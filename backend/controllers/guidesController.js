const path = require('path');
const fs = require('fs');
const { getDirectoryStructure, loadMarkdownContent } = require('../utils/markdownUtils');

// Base path for content
const CONTENT_BASE_PATH = path.join(__dirname, '../../content');

/**
 * Get all guide categories
 */
const getCategories = (req, res) => {
  try {
    const categories = {
      guides: {
        name: 'Game Guides',
        path: 'guides',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'guides'), '')
      },
      lore: {
        name: 'Lore',
        path: 'lore',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'lore'), '')
      },
      factions: {
        name: 'Factions',
        path: 'factions',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'factions'), '')
      },
      npcs: {
        name: 'NPCs',
        path: 'npcs',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'npcs'), '')
      }
    };

    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

/**
 * Get content for a specific guide
 */
const getGuideContent = (req, res) => {
  try {
    const { category, path: guidePath } = req.params;
    
    // Validate category
    const validCategories = ['guides', 'lore', 'factions', 'npcs'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = guidePath.replace(/\.\./g, '').replace(/^\/+/, '');

    // Construct the full path
    let contentPath = path.join(CONTENT_BASE_PATH, category, sanitizedPath);

    // Check if it's a directory
    if (fs.existsSync(contentPath) && fs.statSync(contentPath).isDirectory()) {
      contentPath = path.join(contentPath, 'overview.md');
    } else if (!contentPath.endsWith('.md')) {
      contentPath += '.md';
    }

    // Load the content
    const result = loadMarkdownContent(contentPath);

    if (!result.content) {
      // If no overview.md found and this is a category root, return directory structure
      if (sanitizedPath === '' || sanitizedPath === '/') {
        const structure = getDirectoryStructure(path.join(CONTENT_BASE_PATH, category), '');
        if (structure) {
          // Generate a default overview page
          const categoryNames = {
            'lore': 'Lore',
            'factions': 'Factions',
            'npcs': 'NPCs',
            'guides': 'Game Guides'
          };

          const categoryName = categoryNames[category] || category;
          const defaultContent = `# ${categoryName}\n\nWelcome to the ${categoryName} section. Please select a topic from the sidebar to get started.`;

          return res.json({
            content: defaultContent,
            metadata: { title: categoryName },
            raw: defaultContent,
            isGenerated: true
          });
        }
      }
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({
      content: result.html,
      metadata: result.metadata,
      raw: result.content
    });
  } catch (error) {
    console.error('Error getting guide content:', error);
    res.status(500).json({ error: 'Failed to get guide content' });
  }
};

module.exports = {
  getCategories,
  getGuideContent
};
