import api from './api';

// --- Types ---

export interface CalendarAntiqueItem {
  itemName: string;
  category: string;
  holiday: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CalendarEventPart {
  id: number;
  title: string;
  partId: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
}

export interface CalendarEventItem {
  id: number | string;
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isMultiPart: boolean;
  color: string | null;
  parts: CalendarEventPart[];
}

export interface CalendarMiscItem {
  id: number;
  title: string;
  details: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarData {
  antiques: CalendarAntiqueItem[];
  events: CalendarEventItem[];
  misc: CalendarMiscItem[];
}

export interface HolidayDateItem {
  id: number;
  holiday: string;
  year: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// --- Service ---

const calendarService = {
  getCalendarData: async (): Promise<CalendarData> => {
    const response = await api.get('/calendar');
    return response.data;
  },

  // Admin CRUD for misc entries
  listMiscEntries: async (): Promise<CalendarMiscItem[]> => {
    const response = await api.get('/admin/calendar');
    return response.data.entries;
  },

  getMiscEntry: async (id: number): Promise<CalendarMiscItem> => {
    const response = await api.get(`/admin/calendar/${id}`);
    return response.data.entry;
  },

  createMiscEntry: async (data: { title: string; details?: string; startDate?: string; endDate?: string }): Promise<CalendarMiscItem> => {
    const response = await api.post('/admin/calendar', data);
    return response.data.entry;
  },

  updateMiscEntry: async (id: number, data: { title?: string; details?: string; startDate?: string; endDate?: string }): Promise<CalendarMiscItem> => {
    const response = await api.put(`/admin/calendar/${id}`, data);
    return response.data.entry;
  },

  deleteMiscEntry: async (id: number): Promise<void> => {
    await api.delete(`/admin/calendar/${id}`);
  },

  // Admin CRUD for holiday dates
  listHolidayDates: async (): Promise<HolidayDateItem[]> => {
    const response = await api.get('/admin/holiday-dates');
    return response.data.dates;
  },

  upsertHolidayDate: async (data: { holiday: string; year: number; startDate: string; endDate: string }): Promise<HolidayDateItem> => {
    const response = await api.post('/admin/holiday-dates', data);
    return response.data.date;
  },

  deleteHolidayDate: async (id: number): Promise<void> => {
    await api.delete(`/admin/holiday-dates/${id}`);
  },

  generateHolidayDates: async (year: number): Promise<{ generated: number; holidays: string[]; year: number }> => {
    const response = await api.post('/admin/holiday-dates/generate', { year });
    return response.data;
  },
};

export default calendarService;
