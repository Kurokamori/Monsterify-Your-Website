import { markdownToHtml } from '../utils/markdownUtils';
import { EventRepository, type GameEvent, type EventPart } from '../repositories/event.repository';

const repo = new EventRepository();

// Re-export types for consumers
export type { EventPart };

export type EventMetadata = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description: string;
  imageUrl: string | null;
  content: string;
  isMultiPart: boolean;
  parts?: { id: string; title: string; content: string; order: number }[];
};

export type EventPartWithHtml = {
  id: string;
  title: string;
  content: string;
  order: number;
  html: string;
};

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

function eventToMetadata(event: GameEvent, parts?: EventPart[]): EventMetadata {
  return {
    id: event.eventId,
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    description: event.description,
    imageUrl: event.imageUrl,
    content: event.content,
    isMultiPart: event.isMultiPart,
    parts: parts?.map(p => ({
      id: p.partId,
      title: p.title,
      content: p.content,
      order: p.sortOrder,
    })),
  };
}

/**
 * Service for managing events from PostgreSQL
 */
export class EventService {
  /**
   * Get all events with their parts
   */
  async getAllEvents(): Promise<EventMetadata[]> {
    const events = await repo.findAll();
    const results: EventMetadata[] = [];

    for (const event of events) {
      const parts = event.isMultiPart ? await repo.getPartsByEventId(event.id) : undefined;
      results.push(eventToMetadata(event, parts));
    }

    return results;
  }

  /**
   * Categorize events by date
   */
  categorizeEventsByDate(events: EventMetadata[]): CategorizedEvents {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const categorized: CategorizedEvents = {
      current: [],
      upcoming: [],
      past: [],
    };

    for (const event of events) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      if (eventEnd < today) {
        categorized.past.push(event);
      } else if (eventStart > today) {
        categorized.upcoming.push(event);
      } else {
        categorized.current.push(event);
      }
    }

    categorized.current.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    categorized.upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    categorized.past.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return categorized;
  }

  /**
   * Get events by category (current, upcoming, past)
   */
  async getEventsByCategory(category: 'current' | 'upcoming' | 'past'): Promise<EventMetadata[]> {
    const allEvents = await this.getAllEvents();
    const categorized = this.categorizeEventsByDate(allEvents);
    return categorized[category] || [];
  }

  async getCurrentEvents(): Promise<EventMetadata[]> {
    return this.getEventsByCategory('current');
  }

  async getUpcomingEvents(): Promise<EventMetadata[]> {
    return this.getEventsByCategory('upcoming');
  }

  async getPastEvents(): Promise<EventMetadata[]> {
    return this.getEventsByCategory('past');
  }

  /**
   * Get a specific event by ID with HTML-rendered content
   */
  async getEventById(eventId: string): Promise<EventWithHtml | null> {
    const eventWithParts = await repo.findByEventIdWithParts(eventId);
    if (!eventWithParts) {return null;}

    const { parts: _parts, ...metadataWithoutParts } = eventToMetadata(eventWithParts, eventWithParts.parts);

    const result: EventWithHtml = {
      ...metadataWithoutParts,
      html: markdownToHtml(eventWithParts.content),
      formattedStartDate: eventWithParts.startDate.toLocaleDateString(),
      formattedEndDate: eventWithParts.endDate.toLocaleDateString(),
    };

    if (eventWithParts.isMultiPart && eventWithParts.parts.length > 0) {
      result.parts = eventWithParts.parts.map(part => ({
        id: part.partId,
        title: part.title,
        content: part.content,
        order: part.sortOrder,
        html: markdownToHtml(part.content),
      }));
    }

    return result;
  }

  /**
   * Check if an event is currently active
   */
  async isEventActive(eventId: string): Promise<boolean> {
    const event = await repo.findByEventId(eventId);
    if (!event) {return false;}

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
   */
  async getEventsSummary(): Promise<{ current: number; upcoming: number; past: number; total: number }> {
    const allEvents = await this.getAllEvents();
    const categorized = this.categorizeEventsByDate(allEvents);

    return {
      current: categorized.current.length,
      upcoming: categorized.upcoming.length,
      past: categorized.past.length,
      total: allEvents.length,
    };
  }
}
