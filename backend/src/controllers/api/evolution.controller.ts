import { Request, Response } from 'express';
import { EvolutionService } from '../../services/evolution.service';
import type { SpeciesSlot, EvolveInput } from '../../services/evolution.service';

const VALID_SPECIES_SLOTS: SpeciesSlot[] = ['species1', 'species2', 'species3'];

const evolutionService = new EvolutionService();

// ============================================================================
// Controllers
// ============================================================================

/**
 * Evolve a monster
 * POST /api/monsters/:id/evolve
 */
export async function evolveMonster(req: Request, res: Response): Promise<void> {
  try {
    const monsterId = parseInt(req.params.id as string, 10);
    if (isNaN(monsterId)) {
      res.status(400).json({ success: false, message: 'Invalid monster ID' });
      return;
    }

    const {
      trainerId,
      speciesSlot,
      evolutionName,
      evolutionItem,
      imageUrl,
      useVoidStone,
      useDigitalRepairKit,
      customEvolutionName,
    } = req.body as {
      trainerId?: number;
      speciesSlot?: string;
      evolutionName?: string;
      evolutionItem?: string;
      imageUrl?: string;
      useVoidStone?: boolean;
      useDigitalRepairKit?: boolean;
      customEvolutionName?: string;
    };

    if (!trainerId || !speciesSlot) {
      res.status(400).json({
        success: false,
        message: 'Trainer ID and species slot are required',
      });
      return;
    }

    if (!VALID_SPECIES_SLOTS.includes(speciesSlot as SpeciesSlot)) {
      res.status(400).json({
        success: false,
        message: 'Species slot must be species1, species2, or species3',
      });
      return;
    }

    // Handle file upload: use uploaded file URL or provided imageUrl
    let resolvedImageUrl = imageUrl;
    if (req.file && !useVoidStone) {
      resolvedImageUrl = req.file.path;
    }

    const input: EvolveInput = {
      monsterId,
      trainerId,
      speciesSlot: speciesSlot as SpeciesSlot,
      evolutionName,
      evolutionItem,
      imageUrl: resolvedImageUrl,
      useVoidStone,
      useDigitalRepairKit,
      customEvolutionName,
    };

    const result = await evolutionService.evolveMonster(input);

    res.json({
      success: true,
      message: 'Monster evolved successfully',
      data: result.monster,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error evolving monster';
    console.error('Error evolving monster:', error);

    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
    } else if (msg.includes('does not belong') || msg.includes('does not have')) {
      res.status(400).json({ success: false, message: msg });
    } else if (msg.includes('inventory')) {
      res.status(400).json({ success: false, message: msg });
    } else if (msg.includes('Image URL is required')) {
      res.status(400).json({ success: false, message: msg });
    } else {
      res.status(500).json({ success: false, message: msg });
    }
  }
}

/**
 * Get evolution options for a monster
 * GET /api/monsters/:id/evolution-options
 */
export async function getEvolutionOptions(req: Request, res: Response): Promise<void> {
  try {
    const monsterId = parseInt(req.params.id as string, 10);
    if (isNaN(monsterId)) {
      res.status(400).json({ success: false, message: 'Invalid monster ID' });
      return;
    }

    const speciesSlot = (req.query.speciesSlot as string) || 'species1';

    if (!VALID_SPECIES_SLOTS.includes(speciesSlot as SpeciesSlot)) {
      res.status(400).json({
        success: false,
        message: 'Species slot must be species1, species2, or species3',
      });
      return;
    }

    const options = await evolutionService.getEvolutionOptions(
      monsterId,
      speciesSlot as SpeciesSlot,
    );

    res.json({ success: true, data: options });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting evolution options';
    console.error('Error getting evolution options:', error);

    if (msg.includes('not found') || msg.includes('does not have')) {
      res.status(404).json({ success: false, message: msg });
    } else {
      res.status(500).json({ success: false, message: msg });
    }
  }
}

/**
 * Get evolution options for a species by name
 * GET /api/evolution/options/:speciesName
 */
export async function getEvolutionOptionsBySpecies(req: Request, res: Response): Promise<void> {
  try {
    const speciesName = decodeURIComponent(req.params.speciesName as string);

    if (!speciesName) {
      res.status(400).json({ success: false, message: 'Species name is required' });
      return;
    }

    const options = await evolutionService.getEvolutionOptionsBySpecies(speciesName);

    res.json({ success: true, data: options });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting evolution options';
    console.error('Error getting evolution options by species:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

/**
 * Get reverse evolution options (what evolves into this species)
 * GET /api/evolution/reverse/:speciesName
 */
export async function getReverseEvolutionOptions(req: Request, res: Response): Promise<void> {
  try {
    const speciesName = decodeURIComponent(req.params.speciesName as string);

    if (!speciesName) {
      res.status(400).json({ success: false, message: 'Species name is required' });
      return;
    }

    const options = await evolutionService.getReverseEvolutionOptions(speciesName);

    res.json({ success: true, data: options });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting reverse evolution options';
    console.error('Error getting reverse evolution options:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
