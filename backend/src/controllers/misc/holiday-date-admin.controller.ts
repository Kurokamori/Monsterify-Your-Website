import { Request, Response } from 'express';
import { HolidayDateRepository } from '../../repositories/holiday-date.repository';
import { HolidayCalculatorService } from '../../services/holiday-calculator.service';

const repo = new HolidayDateRepository();
const calculator = new HolidayCalculatorService();

export async function listHolidayDates(_req: Request, res: Response): Promise<void> {
  try {
    const dates = await repo.findAll();
    res.json({ success: true, dates });
  } catch (error) {
    console.error('Error listing holiday dates:', error);
    res.status(500).json({ success: false, message: 'Failed to list holiday dates' });
  }
}

export async function getHolidayDate(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }
    const date = await repo.findById(id);
    if (!date) {
      res.status(404).json({ success: false, message: 'Holiday date not found' });
      return;
    }
    res.json({ success: true, date });
  } catch (error) {
    console.error('Error getting holiday date:', error);
    res.status(500).json({ success: false, message: 'Failed to get holiday date' });
  }
}

export async function upsertHolidayDate(req: Request, res: Response): Promise<void> {
  try {
    const { holiday, year, startDate, endDate } = req.body;
    if (!holiday || !year || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Holiday, year, startDate, and endDate are required' });
      return;
    }
    const date = await repo.upsert({ holiday, year: Number(year), startDate, endDate });
    res.json({ success: true, date });
  } catch (error) {
    console.error('Error upserting holiday date:', error);
    res.status(500).json({ success: false, message: 'Failed to save holiday date' });
  }
}

export async function generateHolidayDates(req: Request, res: Response): Promise<void> {
  try {
    const year = Number(req.body.year ?? new Date().getFullYear());
    if (isNaN(year) || year < 2000 || year > 2100) {
      res.status(400).json({ success: false, message: 'Invalid year' });
      return;
    }
    const result = await calculator.generateHolidayDates(year);
    res.json({ success: true, ...result, year });
  } catch (error) {
    console.error('Error generating holiday dates:', error);
    res.status(500).json({ success: false, message: 'Failed to generate holiday dates' });
  }
}

export async function deleteHolidayDate(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }
    await repo.delete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting holiday date:', error);
    res.status(500).json({ success: false, message: 'Failed to delete holiday date' });
  }
}
