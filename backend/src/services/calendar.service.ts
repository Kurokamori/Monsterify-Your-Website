import { CalendarEntryRepository, CalendarEntry, CalendarEntryCreateInput, CalendarEntryUpdateInput } from '../repositories/calendar-entry.repository';
import { AntiqueSettingRepository } from '../repositories/antique-setting.repository';
import { HolidayDateRepository } from '../repositories/holiday-date.repository';
import { ItemRepository } from '../repositories/item.repository';
import { EventRepository } from '../repositories/event.repository';

export type CalendarAntiqueItem = {
  itemName: string;
  category: string;
  holiday: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type CalendarEventPartItem = {
  id: number;
  title: string;
  partId: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
};

export type CalendarEventItem = {
  id: number | string;
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isMultiPart: boolean;
  color: string | null;
  parts: CalendarEventPartItem[];
};

export type CalendarData = {
  antiques: CalendarAntiqueItem[];
  events: CalendarEventItem[];
  misc: CalendarEntry[];
};

export class CalendarService {
  private calendarEntryRepo = new CalendarEntryRepository();
  private antiqueSettingRepo = new AntiqueSettingRepository();
  private holidayDateRepo = new HolidayDateRepository();
  private itemRepo = new ItemRepository();
  private eventRepo = new EventRepository();

  async getCalendarData(): Promise<CalendarData> {
    const currentYear = new Date().getFullYear();

    const [antiqueSettings, holidayDates, events, misc] = await Promise.all([
      this.antiqueSettingRepo.findAll(),
      this.holidayDateRepo.findByYear(currentYear),
      this.eventRepo.findAllWithParts(),
      this.calendarEntryRepo.findAll(),
    ]);

    // Build a map of holiday name -> date range for current year
    const holidayDateMap = new Map<string, { startDate: string; endDate: string }>();
    for (const hd of holidayDates) {
      holidayDateMap.set(hd.holiday, { startDate: hd.startDate, endDate: hd.endDate });
    }

    // Fetch item image URLs for all antique item names
    const antiqueNames = antiqueSettings.map(s => s.itemName);
    const itemRows = antiqueNames.length > 0 ? await this.itemRepo.findByNames(antiqueNames) : [];
    const itemImageMap = new Map<string, string>();
    for (const row of itemRows) {
      if (row.image_url) {
        itemImageMap.set(row.name, row.image_url);
      }
    }

    const antiques: CalendarAntiqueItem[] = antiqueSettings.map(s => {
      const dates = holidayDateMap.get(s.holiday);
      return {
        itemName: s.itemName,
        category: s.category,
        holiday: s.holiday,
        description: s.description,
        imageUrl: itemImageMap.get(s.itemName) ?? null,
        startDate: dates?.startDate ?? null,
        endDate: dates?.endDate ?? null,
      };
    });

    const calendarEvents: CalendarEventItem[] = events.map(e => ({
      id: e.id,
      eventId: e.eventId,
      title: e.title,
      description: e.description,
      startDate: e.startDate instanceof Date ? e.startDate.toISOString() : String(e.startDate),
      endDate: e.endDate instanceof Date ? e.endDate.toISOString() : String(e.endDate),
      isMultiPart: e.isMultiPart,
      color: e.color,
      parts: (e.parts ?? []).map(p => ({
        id: p.id,
        title: p.title,
        partId: p.partId,
        sortOrder: p.sortOrder,
        startDate: p.startDate instanceof Date ? p.startDate.toISOString() : (p.startDate ? String(p.startDate) : null),
        endDate: p.endDate instanceof Date ? p.endDate.toISOString() : (p.endDate ? String(p.endDate) : null),
      })),
    }));

    return { antiques, events: calendarEvents, misc };
  }

  // --- Misc CRUD ---
  async getAllMiscEntries(): Promise<CalendarEntry[]> {
    return this.calendarEntryRepo.findAll();
  }

  async getMiscEntry(id: number): Promise<CalendarEntry | null> {
    return this.calendarEntryRepo.findById(id);
  }

  async createMiscEntry(input: CalendarEntryCreateInput): Promise<CalendarEntry> {
    return this.calendarEntryRepo.create(input);
  }

  async updateMiscEntry(id: number, input: CalendarEntryUpdateInput): Promise<CalendarEntry> {
    return this.calendarEntryRepo.update(id, input);
  }

  async deleteMiscEntry(id: number): Promise<boolean> {
    return this.calendarEntryRepo.delete(id);
  }
}
