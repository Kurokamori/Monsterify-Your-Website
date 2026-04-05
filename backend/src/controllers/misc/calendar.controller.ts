import { Request, Response } from 'express';
import { CalendarService } from '../../services/calendar.service';

const calendarService = new CalendarService();

export async function getCalendarData(_req: Request, res: Response): Promise<void> {
  try {
    const data = await calendarService.getCalendarData();
    res.json(data);
  } catch (error) {
    console.error('Error getting calendar data:', error);
    res.status(500).json({ error: 'Failed to load calendar data' });
  }
}
