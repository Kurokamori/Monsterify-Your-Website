import { Request, Response } from 'express';
import { CalendarService } from '../../services/calendar.service';

const calendarService = new CalendarService();

export async function listMiscEntries(_req: Request, res: Response): Promise<void> {
  try {
    const entries = await calendarService.getAllMiscEntries();
    res.json({ success: true, entries });
  } catch (error) {
    console.error('Error listing calendar misc entries:', error);
    res.status(500).json({ success: false, message: 'Failed to list entries' });
  }
}

export async function getMiscEntry(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }
    const entry = await calendarService.getMiscEntry(id);
    if (!entry) {
      res.status(404).json({ success: false, message: 'Entry not found' });
      return;
    }
    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error getting calendar misc entry:', error);
    res.status(500).json({ success: false, message: 'Failed to get entry' });
  }
}

export async function createMiscEntry(req: Request, res: Response): Promise<void> {
  try {
    const { title, details, startDate, endDate } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }
    const entry = await calendarService.createMiscEntry({ title, details, startDate, endDate });
    res.status(201).json({ success: true, entry });
  } catch (error) {
    console.error('Error creating calendar misc entry:', error);
    res.status(500).json({ success: false, message: 'Failed to create entry' });
  }
}

export async function updateMiscEntry(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }
    const { title, details, startDate, endDate } = req.body;
    const entry = await calendarService.updateMiscEntry(id, { title, details, startDate, endDate });
    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating calendar misc entry:', error);
    res.status(500).json({ success: false, message: 'Failed to update entry' });
  }
}

export async function deleteMiscEntry(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }
    await calendarService.deleteMiscEntry(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar misc entry:', error);
    res.status(500).json({ success: false, message: 'Failed to delete entry' });
  }
}
