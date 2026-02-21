import { Request, Response } from 'express';
import { AdoptionService } from '../../services/adoption.service';

const adoptionService = new AdoptionService();

// =============================================================================
// Read Endpoints
// =============================================================================

export async function getCurrentMonthAdopts(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await adoptionService.getCurrentMonthAdopts(page, limit);

    res.json({
      success: true,
      adopts: result.adopts,
      total: result.total,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting current month adopts:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting current month adopts',
    });
  }
}

export async function getAllAdopts(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await adoptionService.getAllAdopts(page, limit);

    res.json({
      success: true,
      adopts: result.adopts,
      total: result.total,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting all adopts:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting all adopts',
    });
  }
}

export async function getAdoptsByYearAndMonth(req: Request, res: Response): Promise<void> {
  try {
    const year = parseInt(req.params.year as string);
    const month = parseInt(req.params.month as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({
        success: false,
        message: 'Invalid year or month',
      });
      return;
    }

    const result = await adoptionService.getAdoptsByYearAndMonth(year, month, page, limit);

    res.json({
      success: true,
      adopts: result.adopts,
      total: result.total,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting adopts by year and month:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting adopts by year and month',
    });
  }
}

export async function getMonthsWithData(_req: Request, res: Response): Promise<void> {
  try {
    const months = await adoptionService.getMonthsWithData();

    res.json({
      success: true,
      months,
    });
  } catch (error) {
    console.error('Error getting months with adoption data:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting months with adoption data',
    });
  }
}

// =============================================================================
// Daypass Check
// =============================================================================

export async function checkDaycareDaypass(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.json({
        success: true,
        hasDaypass: false,
        daypassCount: 0,
      });
      return;
    }

    const result = await adoptionService.checkDaycareDaypass(trainerId);

    res.json({
      success: true,
      hasDaypass: result.hasDaypass,
      daypassCount: result.daypassCount,
    });
  } catch (error) {
    console.error('Error checking daycare daypass:', error);
    res.json({
      success: true,
      hasDaypass: false,
      daypassCount: 0,
    });
  }
}

// =============================================================================
// Inventory Items for Adoption
// =============================================================================

export async function getBerriesForAdoption(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const berries = await adoptionService.getBerriesForAdoption(trainerId);
    res.json({ success: true, berries });
  } catch (error) {
    console.error('Error getting berries:', error);
    res.status(500).json({ success: false, message: 'Error getting berries' });
  }
}

export async function getPastriesForAdoption(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const pastries = await adoptionService.getPastriesForAdoption(trainerId);
    res.json({ success: true, pastries });
  } catch (error) {
    console.error('Error getting pastries:', error);
    res.status(500).json({ success: false, message: 'Error getting pastries' });
  }
}

// =============================================================================
// Claim
// =============================================================================

export async function claimAdopt(req: Request, res: Response): Promise<void> {
  try {
    const { adoptId, trainerId, monsterName, discordUserId, berryName, pastryName, speciesValue, typeValue } = req.body as {
      adoptId?: number;
      trainerId?: number;
      monsterName?: string;
      discordUserId?: string;
      berryName?: string;
      pastryName?: string;
      speciesValue?: string;
      typeValue?: string;
    };

    if (!adoptId || !trainerId) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
      return;
    }

    const result = await adoptionService.claimAdopt({
      adoptId,
      trainerId,
      monsterName,
      discordUserId,
      berryName,
      pastryName,
      speciesValue,
      typeValue,
    });

    if (!result.success) {
      res.json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error claiming adopt:', error);
    res.status(500).json({
      success: false,
      message: `Error claiming adopt: ${msg}`,
    });
  }
}

// =============================================================================
// Admin Endpoints
// =============================================================================

export async function generateMonthlyAdopts(_req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const result = await adoptionService.generateMonthlyAdopts(
      now.getFullYear(),
      now.getMonth() + 1,
    );

    res.json({
      success: true,
      message: `Generated ${result.count} monthly adopts for ${now.getFullYear()}-${now.getMonth() + 1}`,
      data: result.adopts,
    });
  } catch (error) {
    console.error('Error generating monthly adopts:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating monthly adopts',
    });
  }
}

export async function generateTestData(req: Request, res: Response): Promise<void> {
  try {
    const monthsCount = parseInt(req.body.monthsCount as string) || 3;
    const results = await adoptionService.generateTestData(monthsCount);

    res.json({
      success: true,
      message: `Generated test data for ${results.length} past months`,
      data: results,
    });
  } catch (error) {
    console.error('Error generating test data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating test data',
    });
  }
}

export async function addDaycareDaypass(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const result = await adoptionService.addDaycareDaypass(trainerId);

    res.json({
      success: true,
      message: `Added 1 Daycare Daypass to trainer ${trainerId}`,
      daypassCount: result.daypassCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error adding daycare daypass:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding daycare daypass',
      error: msg,
    });
  }
}
