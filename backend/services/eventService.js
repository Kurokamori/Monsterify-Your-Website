const fs = require('fs');
const path = require('path');
const { markdownToHtml } = require('../utils/markdownUtils');

// Cache for parsed event metadata
const eventCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Base path for events content
const EVENTS_BASE_PATH = path.join(__dirname, '../../content/events');

/**
 * Parse event metadata from markdown file
 * @param {string} filePath - Path to the markdown file
 * @returns {Object} Event metadata
 */
function parseEventMetadata(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) {
      return null;
    }

    // Extract title from first line (remove # and trim)
    const titleLine = lines[0].trim();
    if (!titleLine.startsWith('#')) {
      return null;
    }
    const title = titleLine.substring(1).trim();

    // Extract date range from second line
    const dateLine = lines[1].trim();
    const dateMatch = dateLine.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
    
    if (!dateMatch) {
      return null;
    }

    const startDate = new Date(dateMatch[1]);
    const endDate = new Date(dateMatch[2]);

    // Extract description (first paragraph after title and date)
    let description = '';
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('![')) {
        description = line;
        break;
      }
    }

    // Extract image URL if present
    let imageUrl = null;
    const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
    if (imageMatch) {
      imageUrl = imageMatch[1];
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath, '.md');

    return {
      id: fileName,
      title,
      startDate,
      endDate,
      description,
      imageUrl,
      filePath,
      lastModified: stats.mtime,
      content: content
    };
  } catch (error) {
    console.error(`Error parsing event metadata from ${filePath}:`, error);
    return null;
  }
}

/**
 * Get cached event metadata or parse if not cached/expired
 * @param {string} filePath - Path to the markdown file
 * @returns {Object} Event metadata
 */
function getCachedEventMetadata(filePath) {
  const cacheKey = filePath;
  const cached = eventCache.get(cacheKey);
  
  if (cached) {
    const now = Date.now();
    const stats = fs.statSync(filePath);
    
    // Check if cache is still valid (not expired and file not modified)
    if (now - cached.timestamp < CACHE_DURATION && 
        stats.mtime.getTime() === cached.lastModified.getTime()) {
      return cached.data;
    }
  }

  // Parse fresh metadata
  const metadata = parseEventMetadata(filePath);
  if (metadata) {
    eventCache.set(cacheKey, {
      data: metadata,
      timestamp: Date.now(),
      lastModified: metadata.lastModified
    });
  }

  return metadata;
}

/**
 * Categorize events by date
 * @param {Array} events - Array of event metadata objects
 * @returns {Object} Categorized events
 */
function categorizeEventsByDate(events) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const categorized = {
    current: [],
    upcoming: [],
    past: []
  };

  events.forEach(event => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Normalize dates to compare only date parts (not time)
    const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (eventEnd < today) {
      categorized.past.push(event);
    } else if (eventStart > today) {
      categorized.upcoming.push(event);
    } else {
      categorized.current.push(event);
    }
  });

  // Sort events within each category
  const sortByStartDate = (a, b) => new Date(a.startDate) - new Date(b.startDate);
  const sortByStartDateDesc = (a, b) => new Date(b.startDate) - new Date(a.startDate);

  categorized.current.sort(sortByStartDate);
  categorized.upcoming.sort(sortByStartDate);
  categorized.past.sort(sortByStartDateDesc); // Most recent first for past events

  return categorized;
}

/**
 * Get all events from all directories
 * @returns {Array} Array of all event metadata
 */
function getAllEvents() {
  const allEvents = [];
  const directories = ['current', 'upcoming', 'past'];

  directories.forEach(dir => {
    const dirPath = path.join(EVENTS_BASE_PATH, dir);
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      if (file.endsWith('.md')) {
        const filePath = path.join(dirPath, file);
        const metadata = getCachedEventMetadata(filePath);
        if (metadata) {
          allEvents.push(metadata);
        }
      }
    });
  });

  return allEvents;
}

/**
 * Get events by category (current, upcoming, past)
 * @param {string} category - Event category
 * @returns {Array} Array of events in the specified category
 */
function getEventsByCategory(category) {
  const allEvents = getAllEvents();
  const categorized = categorizeEventsByDate(allEvents);
  return categorized[category] || [];
}

/**
 * Get a specific event by ID
 * @param {string} eventId - Event ID (filename without extension)
 * @returns {Object} Event data with full content
 */
function getEventById(eventId) {
  const allEvents = getAllEvents();
  const event = allEvents.find(e => e.id === eventId);
  
  if (!event) {
    return null;
  }

  // Return event with HTML content
  return {
    ...event,
    html: markdownToHtml(event.content),
    formattedStartDate: event.startDate.toLocaleDateString(),
    formattedEndDate: event.endDate.toLocaleDateString()
  };
}

/**
 * Clear the event cache (useful for development/testing)
 */
function clearCache() {
  eventCache.clear();
}

module.exports = {
  parseEventMetadata,
  getCachedEventMetadata,
  categorizeEventsByDate,
  getAllEvents,
  getEventsByCategory,
  getEventById,
  clearCache
};
