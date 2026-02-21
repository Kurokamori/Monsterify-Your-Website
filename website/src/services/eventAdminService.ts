import api from './api';

// --- Types ---

export interface EventPart {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface EventSummary {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  imageUrl: string | null;
  category: string;
  isMultiPart?: boolean;
  partCount?: number;
}

export interface EventDetail {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  imageUrl: string | null;
  category: string;
  content: string;
  isMultiPart?: boolean;
  parts?: EventPart[];
}

export interface EventListResponse {
  success: boolean;
  events: {
    current: EventSummary[];
    upcoming: EventSummary[];
    past: EventSummary[];
  };
  summary: {
    current: number;
    upcoming: number;
    past: number;
    total: number;
  };
}

export interface EventDetailResponse {
  success: boolean;
  event: EventDetail;
}

export interface MutationResponse {
  success: boolean;
  message: string;
  eventId?: string;
  partId?: string;
  imageUrl?: string;
}

export interface CreateEventData {
  title: string;
  startDate: string;
  endDate: string;
  content: string;
  category: string;
  fileName?: string;
  isMultiPart?: boolean;
}

export interface UpdateEventData {
  title?: string;
  startDate?: string;
  endDate?: string;
  content?: string;
  category?: string;
}

// --- Service ---

const eventAdminService = {
  listAll: async (): Promise<EventListResponse> => {
    const response = await api.get('/admin/events');
    return response.data;
  },

  getEvent: async (eventId: string): Promise<EventDetailResponse> => {
    const response = await api.get(`/admin/events/${eventId}`);
    return response.data;
  },

  createEvent: async (data: CreateEventData): Promise<MutationResponse> => {
    const response = await api.post('/admin/events', data);
    return response.data;
  },

  updateEvent: async (eventId: string, data: UpdateEventData): Promise<MutationResponse> => {
    const response = await api.put(`/admin/events/${eventId}`, data);
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<MutationResponse> => {
    const response = await api.delete(`/admin/events/${eventId}`);
    return response.data;
  },

  uploadImage: async (file: File): Promise<MutationResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/events/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // --- Part CRUD ---

  addPart: async (eventId: string, data: { title: string; content: string }): Promise<MutationResponse> => {
    const response = await api.post(`/admin/events/${eventId}/parts`, data);
    return response.data;
  },

  updatePart: async (eventId: string, partId: string, data: { title: string; content: string }): Promise<MutationResponse> => {
    const response = await api.put(`/admin/events/${eventId}/parts/${partId}`, data);
    return response.data;
  },

  deletePart: async (eventId: string, partId: string): Promise<MutationResponse> => {
    const response = await api.delete(`/admin/events/${eventId}/parts/${partId}`);
    return response.data;
  },
};

export default eventAdminService;
