const path = require('path');
const fs = require('fs');
const { getDirectoryStructure, loadMarkdownContent } = require('../utils/markdownUtils');

// Base path for content
const CONTENT_BASE_PATH = path.join(__dirname, '../../content');

/**
 * Get all content categories
 * @route GET /api/content/categories
 * @access Admin
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
      },
      locations: {
        name: 'Locations',
        path: 'locations',
        structure: getDirectoryStructure(path.join(CONTENT_BASE_PATH, 'locations'), '')
      }
    };

    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, message: 'Failed to get categories' });
  }
};

/**
 * Get content for a specific file
 * @route GET /api/content/:category/:path
 * @access Admin
 */
const getContent = (req, res) => {
  try {
    const { category, path: contentPath } = req.params;
    
    // Validate category
    const validCategories = ['guides', 'lore', 'factions', 'npcs', 'locations'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = contentPath.replace(/\.\./g, '').replace(/^\/+/, '');
    
    // Construct the full path
    let filePath = path.join(CONTENT_BASE_PATH, category, sanitizedPath);
    
    // Check if it's a directory
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'overview.md');
    } else if (!filePath.endsWith('.md')) {
      filePath += '.md';
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Load the content
    const result = loadMarkdownContent(filePath);
    
    res.json({
      success: true,
      content: result.content,
      html: result.html,
      metadata: result.metadata,
      path: sanitizedPath
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({ success: false, message: 'Failed to get content' });
  }
};

/**
 * Create or update content
 * @route POST /api/content/:category/:path
 * @access Admin
 */
const saveContent = (req, res) => {
  try {
    const { category, path: contentPath } = req.params;
    const { content, title } = req.body;
    
    // Validate category
    const validCategories = ['guides', 'lore', 'factions', 'npcs', 'locations'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = contentPath.replace(/\.\./g, '').replace(/^\/+/, '');
    
    // Construct the full path
    let filePath = path.join(CONTENT_BASE_PATH, category, sanitizedPath);
    
    // Ensure it has .md extension
    if (!filePath.endsWith('.md')) {
      filePath += '.md';
    }

    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Prepare content with title
    let finalContent = content;
    if (title && !content.startsWith('# ')) {
      finalContent = `# ${title}\n\n${content}`;
    }

    // Write the file
    fs.writeFileSync(filePath, finalContent, 'utf8');
    
    res.json({
      success: true,
      message: 'Content saved successfully',
      path: sanitizedPath
    });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ success: false, message: 'Failed to save content' });
  }
};

/**
 * Delete content
 * @route DELETE /api/content/:category/:path
 * @access Admin
 */
const deleteContent = (req, res) => {
  try {
    const { category, path: contentPath } = req.params;
    
    // Validate category
    const validCategories = ['guides', 'lore', 'factions', 'npcs', 'locations'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = contentPath.replace(/\.\./g, '').replace(/^\/+/, '');
    
    // Construct the full path
    let filePath = path.join(CONTENT_BASE_PATH, category, sanitizedPath);
    
    // Ensure it has .md extension if it's a file
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.md')) {
        filePath += '.md';
      } else {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }
    }

    // Check if it's a directory or file
    const isDirectory = fs.statSync(filePath).isDirectory();
    
    if (isDirectory) {
      // Delete directory recursively
      fs.rmdirSync(filePath, { recursive: true });
    } else {
      // Delete file
      fs.unlinkSync(filePath);
    }
    
    res.json({
      success: true,
      message: `${isDirectory ? 'Directory' : 'File'} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ success: false, message: 'Failed to delete content' });
  }
};

/**
 * Create directory
 * @route POST /api/content/:category/directory/:path
 * @access Admin
 */
const createDirectory = (req, res) => {
  try {
    const { category, path: dirPath } = req.params;
    const { name } = req.body;
    
    // Validate category
    const validCategories = ['guides', 'lore', 'factions', 'npcs', 'locations'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    // Validate name
    if (!name || !/^[a-zA-Z0-9-_]+$/.test(name)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid directory name. Use only letters, numbers, hyphens, and underscores.' 
      });
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = dirPath.replace(/\.\./g, '').replace(/^\/+/, '');
    
    // Construct the full path
    const fullPath = path.join(CONTENT_BASE_PATH, category, sanitizedPath, name);
    
    // Check if directory already exists
    if (fs.existsSync(fullPath)) {
      return res.status(400).json({ success: false, message: 'Directory already exists' });
    }

    // Create directory
    fs.mkdirSync(fullPath, { recursive: true });
    
    // Create overview.md file
    const overviewPath = path.join(fullPath, 'overview.md');
    fs.writeFileSync(overviewPath, `# ${name}\n\nOverview content for ${name}`, 'utf8');
    
    res.json({
      success: true,
      message: 'Directory created successfully',
      path: path.join(sanitizedPath, name)
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ success: false, message: 'Failed to create directory' });
  }
};

module.exports = {
  getCategories,
  getContent,
  saveContent,
  deleteContent,
  createDirectory
};
