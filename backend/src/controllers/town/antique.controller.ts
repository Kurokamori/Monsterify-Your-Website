import { Request, Response } from 'express';
import { AntiqueService } from '../../services/antique.service';
import type { AntiqueAuctionQueryOptions, AntiqueSettingUpsertInput } from '../../repositories';

const antiqueService = new AntiqueService();

// =============================================================================
// Get All Antique Auctions (Admin)
// =============================================================================

export async function getAntiqueAuctions(_req: Request, res: Response): Promise<void> {
  try {
    const auctions = await antiqueService.getAntiqueAuctions();
    res.json({ success: true, data: auctions });
  } catch (error) {
    console.error('Error getting antique auctions:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get antique auctions';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Auction Catalogue (Public)
// =============================================================================

export async function getAuctionCatalogue(req: Request, res: Response): Promise<void> {
  try {
    const { antique, species, type, creator, search, page, limit } = req.query as Record<
      string,
      string | undefined
    >;

    const options: AntiqueAuctionQueryOptions = {
      antique,
      species,
      type,
      creator,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await antiqueService.getAuctionCatalogue(options);

    res.json({
      success: true,
      data: result.auctions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting auction catalogue:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get auction catalogue';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Catalogue Filters (Public)
// =============================================================================

export async function getCatalogueFilters(_req: Request, res: Response): Promise<void> {
  try {
    const filters = await antiqueService.getCatalogueFilters();
    res.json({ success: true, data: filters });
  } catch (error) {
    console.error('Error getting catalogue filters:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get catalogue filters';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Trainer Antiques
// =============================================================================

export async function getTrainerAntiques(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string, 10);
    const antiques = await antiqueService.getTrainerAntiques(trainerId);
    res.json({ success: true, data: antiques });
  } catch (error) {
    console.error('Error getting trainer antiques:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get trainer antiques';
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Appraise Antique
// =============================================================================

export async function appraiseAntique(req: Request, res: Response): Promise<void> {
  try {
    const { trainerId, antique } = req.body as {
      trainerId?: number;
      antique?: string;
    };

    if (!trainerId || !antique) {
      res.status(400).json({
        success: false,
        message: 'Trainer ID and antique name are required',
      });
      return;
    }

    const result = await antiqueService.appraiseAntique(trainerId, antique);

    res.json({
      success: true,
      message: `Successfully appraised ${antique}`,
      data: result,
    });
  } catch (error) {
    console.error('Error appraising antique:', error);
    const msg = error instanceof Error ? error.message : 'Failed to appraise antique';
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('does not have')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Auction Options
// =============================================================================

export async function getAuctionOptions(req: Request, res: Response): Promise<void> {
  try {
    const antique = req.params.antique as string;
    const options = await antiqueService.getAuctionOptions(antique);
    res.json({ success: true, data: options });
  } catch (error) {
    console.error('Error getting auction options:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get auction options';
    if (msg.includes('No auction options')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Auction Antique
// =============================================================================

export async function auctionAntique(req: Request, res: Response): Promise<void> {
  try {
    const {
      trainerId,
      targetTrainerId,
      antique,
      auctionId,
      monsterName,
      discordUserId,
    } = req.body as {
      trainerId?: number;
      targetTrainerId?: number;
      antique?: string;
      auctionId?: number;
      monsterName?: string;
      discordUserId?: string;
    };

    if (!trainerId || !antique || !auctionId) {
      res.status(400).json({
        success: false,
        message: 'Trainer ID, antique name, and auction ID are required',
      });
      return;
    }

    const result = await antiqueService.auctionAntique(
      trainerId,
      targetTrainerId,
      antique,
      auctionId,
      monsterName,
      discordUserId
    );

    res.json({
      success: true,
      message: `Successfully auctioned ${antique}`,
      data: result,
    });
  } catch (error) {
    console.error('Error auctioning antique:', error);
    const msg = error instanceof Error ? error.message : 'Failed to auction antique';
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('does not have')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Antique Settings (Admin) — replaces old roll settings + appraisal configs
// =============================================================================

export async function getAppraisalConfigs(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await antiqueService.getAllAntiqueSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error getting antique settings:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get antique settings';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Save Antique Setting (Admin)
// =============================================================================

export async function saveAppraisalConfig(req: Request, res: Response): Promise<void> {
  try {
    const itemName = decodeURIComponent(req.params.itemName as string);
    const body = req.body as Record<string, unknown>;

    const input: AntiqueSettingUpsertInput = {
      itemName,
      category: body.category as string,
      holiday: body.holiday as string,
      description: (body.description as string | null) ?? null,
      rollCount: (body.rollCount as number) ?? 1,
      forceFusion: (body.forceFusion as boolean | null) ?? null,
      forceNoFusion: (body.forceNoFusion as boolean | null) ?? null,
      allowFusion: (body.allowFusion as boolean | null) ?? null,
      forceMinTypes: (body.forceMinTypes as number | null) ?? null,
      overrideParameters: (body.overrideParameters as Record<string, unknown>) ?? {},
    };

    if (!input.category || !input.holiday) {
      res.status(400).json({ success: false, message: 'Category and holiday are required' });
      return;
    }

    const setting = await antiqueService.saveAntiqueSetting(input);
    res.json({ success: true, data: setting, message: 'Antique setting saved successfully' });
  } catch (error) {
    console.error('Error saving antique setting:', error);
    const msg = error instanceof Error ? error.message : 'Failed to save antique setting';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Delete Antique Setting (Admin)
// =============================================================================

export async function deleteAppraisalConfig(req: Request, res: Response): Promise<void> {
  try {
    const itemName = decodeURIComponent(req.params.itemName as string);
    await antiqueService.deleteAntiqueSetting(itemName);
    res.json({ success: true, message: 'Antique setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting antique setting:', error);
    const msg = error instanceof Error ? error.message : 'Failed to delete antique setting';
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get All Antiques Dropdown (Admin)
// =============================================================================

export async function getAllAntiquesDropdown(_req: Request, res: Response): Promise<void> {
  try {
    const antiques = await antiqueService.getAllAntiquesDropdown();
    res.json({ success: true, data: antiques });
  } catch (error) {
    console.error('Error getting antiques dropdown:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get antiques list';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Antique Auction By ID (Admin)
// =============================================================================

export async function getAntiqueAuctionById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const auction = await antiqueService.getAntiqueAuctionById(id);

    if (!auction) {
      res.status(404).json({ success: false, message: 'Antique auction not found' });
      return;
    }

    res.json({ success: true, data: auction });
  } catch (error) {
    console.error('Error getting antique auction:', error);
    const msg = error instanceof Error ? error.message : 'Failed to get antique auction';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Create Antique Auction (Admin)
// =============================================================================

export async function createAntiqueAuction(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;

    if (!body.name || !body.antique || !body.species1 || !body.type1 || !body.attribute || !body.creator) {
      res.status(400).json({
        success: false,
        message: 'Name, antique, species1, type1, attribute, and creator are required',
      });
      return;
    }

    const auction = await antiqueService.createAntiqueAuction({
      name: body.name as string,
      antique: body.antique as string,
      image: body.image as string | null | undefined,
      species1: body.species1 as string,
      species2: body.species2 as string | null | undefined,
      species3: body.species3 as string | null | undefined,
      type1: body.type1 as string,
      type2: body.type2 as string | null | undefined,
      type3: body.type3 as string | null | undefined,
      type4: body.type4 as string | null | undefined,
      type5: body.type5 as string | null | undefined,
      attribute: body.attribute as string | null | undefined,
      description: body.description as string | null | undefined,
      family: body.family as string | null | undefined,
      creator: body.creator as string | null | undefined,
    });

    res.status(201).json({
      success: true,
      data: auction,
      message: 'Antique auction created successfully',
    });
  } catch (error) {
    console.error('Error creating antique auction:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create antique auction';
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Update Antique Auction (Admin)
// =============================================================================

export async function updateAntiqueAuction(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    const body = req.body as Record<string, unknown>;

    if (!body.name || !body.antique || !body.species1 || !body.type1 || !body.attribute || !body.creator) {
      res.status(400).json({
        success: false,
        message: 'Name, antique, species1, type1, attribute, and creator are required',
      });
      return;
    }

    const auction = await antiqueService.updateAntiqueAuction(id, {
      name: body.name as string,
      antique: body.antique as string,
      image: body.image as string | null | undefined,
      species1: body.species1 as string,
      species2: body.species2 as string | null | undefined,
      species3: body.species3 as string | null | undefined,
      type1: body.type1 as string,
      type2: body.type2 as string | null | undefined,
      type3: body.type3 as string | null | undefined,
      type4: body.type4 as string | null | undefined,
      type5: body.type5 as string | null | undefined,
      attribute: body.attribute as string | null | undefined,
      description: body.description as string | null | undefined,
      family: body.family as string | null | undefined,
      creator: body.creator as string | null | undefined,
    });

    res.json({
      success: true,
      data: auction,
      message: 'Antique auction updated successfully',
    });
  } catch (error) {
    console.error('Error updating antique auction:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update antique auction';
    if (msg === 'Antique auction not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Delete Antique Auction (Admin)
// =============================================================================

export async function deleteAntiqueAuction(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    await antiqueService.deleteAntiqueAuction(id);
    res.json({ success: true, message: 'Antique auction deleted successfully' });
  } catch (error) {
    console.error('Error deleting antique auction:', error);
    const msg = error instanceof Error ? error.message : 'Failed to delete antique auction';
    if (msg === 'Antique auction not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Upload Antique Image (Admin)
// =============================================================================

export async function uploadAntiqueImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload an image' });
      return;
    }

    const result = await antiqueService.uploadAntiqueImage(req.file.path);

    res.json({
      success: true,
      data: { url: result.url, public_id: result.publicId },
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    const msg = error instanceof Error ? error.message : 'Error uploading image';
    res.status(500).json({ success: false, message: msg });
  }
}
