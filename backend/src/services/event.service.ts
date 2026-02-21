import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type EventPart = {
  id: string;
  title: string;
  content: string;
  order: number;
};

export type EventMetadata = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description: string;
  imageUrl: string | null;
  filePath: string;
  lastModified: Date;
  content: string;
  isMultiPart: boolean;
  parts?: EventPart[];
};

export type EventPartWithHtml = EventPart & { html: string };

export type EventWithHtml = Omit<EventMetadata, 'parts'> & {
  html: string;
  formattedStartDate: string;
  formattedEndDate: string;
  parts?: EventPartWithHtml[];
};

export type CategorizedEvents = {
  current: EventMetadata[];
  upcoming: EventMetadata[];
  past: EventMetadata[];
};

type CacheEntry = {
  data: EventMetadata;
  timestamp: number;
  lastModified: Date;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Service for managing events from markdown files
 */
export class EventService {
  private eventsBasePath: string;
  private eventCache: Map<string, CacheEntry>;

  constructor(eventsBasePath?: string) {
    this.eventsBasePath = eventsBasePath ?? path.resolve(__dirname, '..', '..', '..', 'website', 'public', 'content', 'events');
    this.eventCache = new Map();
  }

  /**
   * Parse event metadata from markdown file
   * @param filePath - Path to the markdown file
   * @returns Event metadata or null if invalid
   */
  parseEventMetadata(filePath: string): EventMetadata | null {
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
      const titleLine = lines[0]?.trim() ?? '';
      if (!titleLine.startsWith('#')) {
        return null;
      }
      const title = titleLine.substring(1).trim();

      // Extract date range from second line
      const dateLine = lines[1]?.trim() ?? '';
      const dateMatch = dateLine.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);

      if (!dateMatch?.[1] || !dateMatch?.[2]) {
        return null;
      }

      const startDate = new Date(dateMatch[1]);
      const endDate = new Date(dateMatch[2]);

      // Extract description (first paragraph after title and date)
      let description = '';
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i]?.trim() ?? '';
        if (line && !line.startsWith('#') && !line.startsWith('![')) {
          description = line;
          break;
        }
      }

      // Extract image URL if present
      let imageUrl: string | null = null;
      const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch?.[1]) {
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
        content,
        isMultiPart: false,
      };
    } catch (error) {
      console.error(`Error parsing event metadata from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse a multi-part event from a directory containing overview.md and part-*.md files
   */
  parseMultiPartEvent(dirPath: string): EventMetadata | null {
    try {
      const overviewPath = path.join(dirPath, 'overview.md');
      if (!fs.existsSync(overviewPath)) {
        return null;
      }

      // Parse the overview file for metadata
      const overview = this.parseEventMetadata(overviewPath);
      if (!overview) {
        return null;
      }

      // Use directory name as ID
      const dirName = path.basename(dirPath);

      // Scan for part files
      const files = fs.readdirSync(dirPath);
      const partFiles = files
        .filter(f => f.match(/^part-\d+\.md$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/^part-(\d+)\.md$/)?.[1] ?? '0');
          const numB = parseInt(b.match(/^part-(\d+)\.md$/)?.[1] ?? '0');
          return numA - numB;
        });

      const parts: EventPart[] = partFiles.map((file, index) => {
        const partPath = path.join(dirPath, file);
        const partContent = fs.readFileSync(partPath, 'utf8');
        const partLines = partContent.split('\n');

        // Extract title from first line
        let partTitle = `Part ${index + 1}`;
        if (partLines[0]?.startsWith('#')) {
          partTitle = partLines[0].replace(/^#+\s*/, '').trim();
        }

        const partId = path.basename(file, '.md');

        return {
          id: partId,
          title: partTitle,
          content: partContent,
          order: index + 1,
        };
      });

      // Get directory stats (use most recent file modification)
      const stats = fs.statSync(overviewPath);

      return {
        id: dirName,
        title: overview.title,
        startDate: overview.startDate,
        endDate: overview.endDate,
        description: overview.description,
        imageUrl: overview.imageUrl,
        filePath: dirPath,
        lastModified: stats.mtime,
        content: overview.content,
        isMultiPart: true,
        parts,
      };
    } catch (error) {
      console.error(`Error parsing multi-part event from ${dirPath}:`, error);
      return null;
    }
  }

  /**
   * Get cached event metadata or parse if not cached/expired
   * @param filePath - Path to the markdown file
   * @returns Event metadata
   */
  getCachedEventMetadata(filePath: string): EventMetadata | null {
    const cacheKey = filePath;
    const cached = this.eventCache.get(cacheKey);

    if (cached) {
      const now = Date.now();
      try {
        const stats = fs.statSync(filePath);

        // Check if cache is still valid (not expired and file not modified)
        if (
          now - cached.timestamp < CACHE_DURATION &&
          stats.mtime.getTime() === cached.lastModified.getTime()
        ) {
          return cached.data;
        }
      } catch {
        // File may have been deleted, remove from cache
        this.eventCache.delete(cacheKey);
        return null;
      }
    }

    // Parse fresh metadata
    const metadata = this.parseEventMetadata(filePath);
    if (metadata) {
      this.eventCache.set(cacheKey, {
        data: metadata,
        timestamp: Date.now(),
        lastModified: metadata.lastModified,
      });
    }

    return metadata;
  }

  /**
   * Categorize events by date
   * @param events - Array of event metadata objects
   * @returns Categorized events
   */
  categorizeEventsByDate(events: EventMetadata[]): CategorizedEvents {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const categorized: CategorizedEvents = {
      current: [],
      upcoming: [],
      past: [],
    };

    events.forEach((event) => {
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
    const sortByStartDate = (a: EventMetadata, b: EventMetadata) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime();

    const sortByStartDateDesc = (a: EventMetadata, b: EventMetadata) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime();

    categorized.current.sort(sortByStartDate);
    categorized.upcoming.sort(sortByStartDate);
    categorized.past.sort(sortByStartDateDesc); // Most recent first for past events

    return categorized;
  }

  /**
   * Get all events from all directories
   * @returns Array of all event metadata
   */
  getAllEvents(): EventMetadata[] {
    const allEvents: EventMetadata[] = [];
    const directories = ['current', 'upcoming', 'past'];

    directories.forEach((dir) => {
      const dirPath = path.join(this.eventsBasePath, dir);
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      entries.forEach((entry) => {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          // Single-part event (regular .md file)
          const filePath = path.join(dirPath, entry.name);
          const metadata = this.getCachedEventMetadata(filePath);
          if (metadata) {
            allEvents.push(metadata);
          }
        } else if (entry.isDirectory()) {
          // Multi-part event (directory with overview.md)
          const eventDirPath = path.join(dirPath, entry.name);
          const metadata = this.parseMultiPartEvent(eventDirPath);
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
   * @param category - Event category
   * @returns Array of events in the specified category
   */
  getEventsByCategory(category: 'current' | 'upcoming' | 'past'): EventMetadata[] {
    const allEvents = this.getAllEvents();
    const categorized = this.categorizeEventsByDate(allEvents);
    return categorized[category] || [];
  }

  /**
   * Get current events
   * @returns Array of current events
   */
  getCurrentEvents(): EventMetadata[] {
    return this.getEventsByCategory('current');
  }

  /**
   * Get upcoming events
   * @returns Array of upcoming events
   */
  getUpcomingEvents(): EventMetadata[] {
    return this.getEventsByCategory('upcoming');
  }

  /**
   * Get past events
   * @returns Array of past events
   */
  getPastEvents(): EventMetadata[] {
    return this.getEventsByCategory('past');
  }

  /**
   * Get a specific event by ID
   * @param eventId - Event ID (filename without extension or directory name)
   * @returns Event data with full content and HTML
   */
  getEventById(eventId: string): EventWithHtml | null {
    const allEvents = this.getAllEvents();
    const event = allEvents.find((e) => e.id === eventId);

    if (!event) {
      return null;
    }

    const { parts, ...eventWithoutParts } = event;

    const result: EventWithHtml = {
      ...eventWithoutParts,
      html: this.markdownToHtml(event.content),
      formattedStartDate: event.startDate.toLocaleDateString(),
      formattedEndDate: event.endDate.toLocaleDateString(),
    };

    // Convert part content to HTML if multi-part
    if (event.isMultiPart && parts) {
      result.parts = parts.map(part => ({
        ...part,
        html: this.markdownToHtml(part.content),
      }));
    }

    return result;
  }

  /**
   * Get parts for a specific multi-part event
   */
  getEventParts(eventId: string): EventPart[] | null {
    const allEvents = this.getAllEvents();
    const event = allEvents.find((e) => e.id === eventId);
    if (!event?.isMultiPart) { return null; }
    return event.parts ?? [];
  }

  /**
   * Simple markdown to HTML conversion
   * @param markdown - Markdown content
   * @returns HTML content
   */
  private markdownToHtml(markdown: string): string {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

    // Images
    html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');

    // Line breaks
    html = html.replace(/\n/gim, '<br />');

    // Paragraphs (wrap non-tag lines)
    html = html.replace(/<br \/><br \/>/gim, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><h/g, '<h');
    html = html.replace(/<\/h(\d)><\/p>/g, '</h$1>');
    html = html.replace(/<p><\/p>/g, '');

    return html;
  }

  /**
   * Clear the event cache (useful for development/testing)
   */
  clearCache(): void {
    this.eventCache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.eventCache.size,
      entries: Array.from(this.eventCache.keys()),
    };
  }

  /**
   * Check if an event is currently active
   * @param eventId - Event ID
   * @returns Whether the event is currently active
   */
  isEventActive(eventId: string): boolean {
    const event = this.getEventById(eventId);
    if (!event) {
      return false;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    return eventStart <= today && eventEnd >= today;
  }

  /**
   * Get events summary
   * @returns Summary of events by category
   */
  getEventsSummary(): { current: number; upcoming: number; past: number; total: number } {
    const allEvents = this.getAllEvents();
    const categorized = this.categorizeEventsByDate(allEvents);

    return {
      current: categorized.current.length,
      upcoming: categorized.upcoming.length,
      past: categorized.past.length,
      total: allEvents.length,
    };
  }
}
