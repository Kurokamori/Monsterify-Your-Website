import api from './api';

// --- Types ---

export interface EventCategory {
  id?: number;
  name: string;
  [key: string]: unknown;
}

export interface EventPart {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface GameEvent {
  id: number | string;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  category?: string;
  isMultiPart?: boolean;
  partCount?: number;
  parts?: EventPart[];
  [key: string]: unknown;
}

// --- Service ---

const eventsService = {
  // Get all event categories
  getEventCategories: async (): Promise<EventCategory[]> => {
    const response = await api.get('/events/categories');
    return response.data;
  },

  // Get current events
  getCurrentEvents: async (): Promise<GameEvent[]> => {
    const response = await api.get('/events/current');
    return response.data;
  },

  // Get past events
  getPastEvents: async (): Promise<GameEvent[]> => {
    const response = await api.get('/events/past');
    return response.data;
  },

  // Get upcoming events
  getUpcomingEvents: async (): Promise<GameEvent[]> => {
    const response = await api.get('/events/upcoming');
    return response.data;
  },

  // Get specific event content by ID
  getEventContent: async (eventId: number | string): Promise<GameEvent> => {
    const response = await api.get(`/events/event/${eventId}`);
    return response.data;
  },
};

export default eventsService;
