import { Request, Response } from 'express';
import { EvolutionService } from '../../services/evolution.service';
import type { SpeciesSlot, EvolveInput, MultiEvolveInput, MultiEvolutionSlot } from '../../services/evolution.service';

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

/**
 * Multi-evolve a monster (Chimera Stone / Hydra Crystal)
 * POST /api/monsters/:id/multi-evolve
 */
export async function multiEvolveMonster(req: Request, res: Response): Promise<void> {
  try {
    const monsterId = parseInt(req.params.id as string, 10);
    if (isNaN(monsterId)) {
      res.status(400).json({ success: false, message: 'Invalid monster ID' });
      return;
    }

    const { trainerId, stoneType, imageUrl, useVoidStone } = req.body;

    const numTrainerId = Number(trainerId);
    if (!numTrainerId || isNaN(numTrainerId)) {
      res.status(400).json({ success: false, message: 'Valid trainer ID is required' });
      return;
    }

    if (!stoneType) {
      res.status(400).json({ success: false, message: 'Stone type is required' });
      return;
    }

    // Parse evolutions - could be JSON string (FormData) or array (JSON body)
    let evolutions: MultiEvolutionSlot[];
    if (typeof req.body.evolutions === 'string') {
      try {
        evolutions = JSON.parse(req.body.evolutions);
      } catch {
        res.status(400).json({ success: false, message: 'Invalid evolutions format' });
        return;
      }
    } else if (Array.isArray(req.body.evolutions)) {
      evolutions = req.body.evolutions;
    } else {
      res.status(400).json({ success: false, message: 'Evolutions array is required' });
      return;
    }

    // Handle file upload
    const parsedUseVoidStone = useVoidStone === true || useVoidStone === 'true';
    let resolvedImageUrl = imageUrl;
    if (req.file && !parsedUseVoidStone) {
      resolvedImageUrl = req.file.path;
    }

    // Parse boolean fields in evolutions (FormData sends strings)
    const parsedEvolutions: MultiEvolutionSlot[] = evolutions.map(evo => ({
      ...evo,
      useDigitalRepairKit: evo.useDigitalRepairKit === true
        || (evo.useDigitalRepairKit as unknown) === 'true',
    }));

    const input: MultiEvolveInput = {
      monsterId,
      trainerId: numTrainerId,
      stoneType,
      evolutions: parsedEvolutions,
      imageUrl: resolvedImageUrl,
      useVoidStone: parsedUseVoidStone,
    };

    const result = await evolutionService.multiEvolveMonster(input);

    res.json({
      success: true,
      message: 'Monster evolved successfully',
      data: result.monster,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error evolving monster';
    console.error('Error in multi-evolution:', error);

    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
    } else if (
      msg.includes('does not belong')
      || msg.includes('does not have')
      || msg.includes('requires')
      || msg.includes('Not enough')
      || msg.includes('Invalid')
      || msg.includes('Cannot evolve')
      || msg.includes('inventory')
    ) {
      res.status(400).json({ success: false, message: msg });
    } else {
      res.status(500).json({ success: false, message: msg });
    }
  }
}
