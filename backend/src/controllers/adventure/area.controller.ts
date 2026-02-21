import { Request, Response } from 'express';
import { AreaDataService } from '../../services/adventure/area-data.service';

const areaDataService = new AreaDataService();

// =============================================================================
// Get Landmasses
// =============================================================================

export async function getLandmasses(_req: Request, res: Response): Promise<void> {
  try {
    const landmassMap = await areaDataService.getAllLandmasses();
    const landmasses = Object.values(landmassMap);

    res.json({
      success: true,
      landmasses,
    });
  } catch (error) {
    console.error('Error getting landmasses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get landmasses',
    });
  }
}

// =============================================================================
// Get Regions for Landmass
// =============================================================================

export async function getRegionsForLandmass(req: Request, res: Response): Promise<void> {
  try {
    const landmassId = req.params.landmassId as string;

    const regions = await areaDataService.getRegionsForLandmass(landmassId);

    res.json({
      success: true,
      regions,
    });
  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get regions',
    });
  }
}

// =============================================================================
// Get Areas for Region
// =============================================================================

export async function getAreasForRegion(req: Request, res: Response): Promise<void> {
  try {
    const regionId = req.params.regionId as string;

    const areas = await areaDataService.getAreasForRegion(regionId);

    res.json({
      success: true,
      areas,
    });
  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get areas',
    });
  }
}

// =============================================================================
// Get Area Configuration
// =============================================================================

export async function getAreaConfiguration(req: Request, res: Response): Promise<void> {
  try {
    const areaId = req.params.areaId as string;

    const configuration = await areaDataService.getFullAreaConfiguration(areaId);
    if (!configuration) {
      res.status(404).json({
        success: false,
        message: 'Area configuration not found',
      });
      return;
    }

    res.json({
      success: true,
      configuration,
    });
  } catch (error) {
    console.error('Error getting area configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get area configuration',
    });
  }
}

// =============================================================================
// Get World Map Data (Guide)
// =============================================================================

export async function getWorldMapData(_req: Request, res: Response): Promise<void> {
  try {
    const data = await areaDataService.getWorldMapData();
    res.json(data);
  } catch (error) {
    console.error('Error getting world map data:', error);
    res.status(500).json({ message: 'Failed to get world map data' });
  }
}

// =============================================================================
// Get Landmass Guide
// =============================================================================

export async function getLandmassGuide(req: Request, res: Response): Promise<void> {
  try {
    const landmassId = req.params.landmassId as string;
    const data = await areaDataService.getLandmassGuideData(landmassId);
    if (!data) {
      res.status(404).json({ message: 'Landmass not found' });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error('Error getting landmass guide:', error);
    res.status(500).json({ message: 'Failed to get landmass guide' });
  }
}

// =============================================================================
// Get Region Guide
// =============================================================================

export async function getRegionGuide(req: Request, res: Response): Promise<void> {
  try {
    const regionId = req.params.regionId as string;
    const data = await areaDataService.getRegionGuideData(regionId);
    if (!data) {
      res.status(404).json({ message: 'Region not found' });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error('Error getting region guide:', error);
    res.status(500).json({ message: 'Failed to get region guide' });
  }
}

// =============================================================================
// Get Area Guide
// =============================================================================

export async function getAreaGuide(req: Request, res: Response): Promise<void> {
  try {
    const areaId = req.params.areaId as string;
    const data = await areaDataService.getAreaGuideData(areaId);
    if (!data) {
      res.status(404).json({ message: 'Area not found' });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error('Error getting area guide:', error);
    res.status(500).json({ message: 'Failed to get area guide' });
  }
}

// =============================================================================
// Get Area Hierarchy
// =============================================================================

export async function getAreaHierarchy(_req: Request, res: Response): Promise<void> {
  try {
    const landmassMap = await areaDataService.getAllLandmasses();
    const landmasses = Object.values(landmassMap);

    const hierarchy = await Promise.all(
      landmasses.map(async (landmass) => {
        const regions = await areaDataService.getRegionsForLandmass(landmass.id);

        const regionsWithAreas = await Promise.all(
          regions.map(async (region) => {
            const areas = await areaDataService.getAreasForRegion(region.id);
            return {
              ...region,
              areas,
            };
          }),
        );

        return {
          ...landmass,
          regions: regionsWithAreas,
        };
      }),
    );

    res.json({
      success: true,
      hierarchy,
    });
  } catch (error) {
    console.error('Error getting area hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get area hierarchy',
    });
  }
}
