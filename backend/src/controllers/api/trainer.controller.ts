import { Request, Response } from 'express';
import { TrainerService } from '../../services/trainer.service';
import type { InventoryCategory } from '../../repositories';
import cloudinary from '../../utils/cloudinary';

const trainerService = new TrainerService();

// =============================================================================
// Trainer CRUD
// =============================================================================

export async function getAllTrainersForForms(_req: Request, res: Response): Promise<void> {
  try {
    const trainers = await trainerService.getAllTrainersForForms();
    res.json({ success: true, trainers, data: trainers, totalTrainers: trainers.length });
  } catch (error) {
    console.error('Error in getAllTrainersForForms:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getAllTrainers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt((req.query.page as string) ?? '1') || 1;
    const limit = parseInt((req.query.limit as string) ?? '12') || 12;
    const sortBy = (req.query.sort_by as string | undefined) ?? 'name';
    const sortOrder = (req.query.sort_order as string | undefined) ?? 'asc';
    const search = (req.query.search as string | undefined) ?? '';
    const faction = (req.query.faction as string | undefined) ?? '';

    const result = await trainerService.getAllTrainers(page, limit, sortBy, sortOrder, search, faction);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in getAllTrainers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getTrainerById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    res.json({ success: true, trainer });
  } catch (error) {
    console.error('Error in getTrainerById:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getTrainersByUserId(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req.params.userId as string | undefined) ?? req.user?.discord_id;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await trainerService.getTrainersByUserId(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in getTrainersByUserId:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function createTrainer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id ?? req.body.player_user_id;
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    if (!req.body.name) {
      res.status(400).json({ success: false, message: 'Trainer name is required' });
      return;
    }

    // Handle file upload
    let mainRef = req.body.main_ref ?? null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'trainers' });
        mainRef = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        res.status(500).json({ success: false, message: 'Error uploading image' });
        return;
      }
    }

    // Handle additional_refs JSON
    let additionalRefs: string | null = null;
    if (req.body.additional_refs) {
      if (typeof req.body.additional_refs === 'string') {
        try {
          JSON.parse(req.body.additional_refs);
          additionalRefs = req.body.additional_refs;
        } catch {
          additionalRefs = req.body.additional_refs;
        }
      } else {
        additionalRefs = JSON.stringify(req.body.additional_refs);
      }
    }

    const { trainer, rewardMessage } = await trainerService.createTrainer({
      name: req.body.name,
      playerUserId: userId,
      mainRef,
      birthday: req.body.birthday ?? null,
      additionalRefs,
      // Profile fields
      nickname: req.body.nickname,
      full_name: req.body.full_name,
      faction: req.body.faction,
      title: req.body.title,
      species1: req.body.species1,
      species2: req.body.species2,
      species3: req.body.species3,
      type1: req.body.type1,
      type2: req.body.type2,
      type3: req.body.type3,
      type4: req.body.type4,
      type5: req.body.type5,
      type6: req.body.type6,
      ability: req.body.ability,
      nature: req.body.nature,
      characteristic: req.body.characteristic,
      fav_berry: req.body.fav_berry,
      fav_type1: req.body.fav_type1,
      fav_type2: req.body.fav_type2,
      fav_type3: req.body.fav_type3,
      fav_type4: req.body.fav_type4,
      fav_type5: req.body.fav_type5,
      fav_type6: req.body.fav_type6,
      gender: req.body.gender,
      pronouns: req.body.pronouns,
      sexuality: req.body.sexuality,
      age: req.body.age,
      height: req.body.height,
      weight: req.body.weight,
      birthplace: req.body.birthplace,
      residence: req.body.residence,
      race: req.body.race,
      occupation: req.body.occupation,
      theme: req.body.theme,
      voice_claim: req.body.voice_claim,
      quote: req.body.quote,
      tldr: req.body.tldr,
      biography: req.body.biography,
      strengths: req.body.strengths,
      weaknesses: req.body.weaknesses,
      likes: req.body.likes,
      dislikes: req.body.dislikes,
      flaws: req.body.flaws,
      values: req.body.values,
      quirks: req.body.quirks,
      secrets: req.body.secrets,
      relations: req.body.relations,
      icon: req.body.icon,
    });

    res.status(201).json({
      success: true,
      data: trainer,
      message: `Trainer created successfully!${rewardMessage}`,
    });
  } catch (error) {
    console.error('Error in createTrainer:', error);

    if (error instanceof Error && error.message === 'A trainer with this name already exists') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function updateTrainer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    // Authorization: owner or admin
    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      res.status(403).json({ success: false, message: 'Not authorized to update this trainer' });
      return;
    }

    // Destructure non-trainer fields from body
    const { image: _image, uploadType, refId, description, title, ...bodyData } = req.body;

    let mainRef: string | undefined;
    let megaInfo: string | undefined;
    let additionalRefs: string | undefined;

    // Handle file uploads
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'trainers/references',
      });

      if (uploadType === 'main_ref') {
        mainRef = result.secure_url;
      } else if (uploadType === 'mega_ref') {
        let existing: Record<string, unknown> = {};
        if (trainer.mega_info) {
          try {
            existing = JSON.parse(trainer.mega_info) as Record<string, unknown>;
          } catch { /* empty */ }
        }
        existing.mega_ref = result.secure_url;
        megaInfo = JSON.stringify(existing);
      } else if (uploadType === 'additional_ref') {
        let refs: Array<Record<string, unknown>> = [];
        if (trainer.additional_refs) {
          try {
            refs = JSON.parse(trainer.additional_refs) as Array<Record<string, unknown>>;
          } catch { /* empty */ }
        }

        const existingIndex = refs.findIndex((r) => String(r.id) === String(refId));
        const existingRef = existingIndex !== -1 ? refs[existingIndex] : undefined;
        if (existingRef) {
          existingRef.image_url = result.secure_url;
          existingRef.title = title ?? '';
          existingRef.description = description ?? '';
        } else {
          refs.push({
            id: refId ?? Date.now(),
            title: title ?? '',
            description: description ?? '',
            image_url: result.secure_url,
          });
        }
        additionalRefs = JSON.stringify(refs);
      }
    }

    // Handle mega_info from body
    if (req.body.mega_info && !megaInfo) {
      if (typeof req.body.mega_info === 'string') {
        try {
          const parsed = JSON.parse(req.body.mega_info);
          megaInfo = JSON.stringify(parsed);
        } catch {
          let existing: Record<string, unknown> = {};
          if (trainer.mega_info) {
            try { existing = JSON.parse(trainer.mega_info) as Record<string, unknown>; } catch { /* empty */ }
          }
          megaInfo = JSON.stringify(existing);
        }
      } else if (typeof req.body.mega_info === 'object') {
        let existing: Record<string, unknown> = {};
        if (trainer.mega_info) {
          try { existing = JSON.parse(trainer.mega_info) as Record<string, unknown>; } catch { /* empty */ }
        }
        megaInfo = JSON.stringify({ ...existing, ...req.body.mega_info });
      }
    }

    // Handle additional_references from body
    if (req.body.additional_references && !additionalRefs) {
      if (typeof req.body.additional_references === 'string') {
        try {
          const parsed = JSON.parse(req.body.additional_references);
          additionalRefs = JSON.stringify(parsed);
        } catch {
          additionalRefs = JSON.stringify([]);
        }
      } else if (typeof req.body.additional_references === 'object') {
        additionalRefs = JSON.stringify(req.body.additional_references);
      }
    }

    const updatedTrainer = await trainerService.updateTrainer(id, {
      name: bodyData.name,
      mainRef: mainRef ?? bodyData.main_ref,
      additionalRefs: additionalRefs ?? bodyData.additional_refs,
      birthday: bodyData.birthday,
      megaInfo,
      // Profile fields
      nickname: bodyData.nickname,
      full_name: bodyData.full_name,
      faction: bodyData.faction,
      title: bodyData.title,
      species1: bodyData.species1,
      species2: bodyData.species2,
      species3: bodyData.species3,
      type1: bodyData.type1,
      type2: bodyData.type2,
      type3: bodyData.type3,
      type4: bodyData.type4,
      type5: bodyData.type5,
      type6: bodyData.type6,
      ability: bodyData.ability,
      nature: bodyData.nature,
      characteristic: bodyData.characteristic,
      fav_berry: bodyData.fav_berry,
      fav_type1: bodyData.fav_type1,
      fav_type2: bodyData.fav_type2,
      fav_type3: bodyData.fav_type3,
      fav_type4: bodyData.fav_type4,
      fav_type5: bodyData.fav_type5,
      fav_type6: bodyData.fav_type6,
      gender: bodyData.gender,
      pronouns: bodyData.pronouns,
      sexuality: bodyData.sexuality,
      age: bodyData.age,
      height: bodyData.height,
      weight: bodyData.weight,
      birthplace: bodyData.birthplace,
      residence: bodyData.residence,
      race: bodyData.race,
      occupation: bodyData.occupation,
      theme: bodyData.theme,
      voice_claim: bodyData.voice_claim,
      quote: bodyData.quote,
      tldr: bodyData.tldr,
      biography: bodyData.biography,
      strengths: bodyData.strengths,
      weaknesses: bodyData.weaknesses,
      likes: bodyData.likes,
      dislikes: bodyData.dislikes,
      flaws: bodyData.flaws,
      values: bodyData.values,
      quirks: bodyData.quirks,
      secrets: bodyData.secrets,
      relations: bodyData.relations,
      icon: bodyData.icon,
    });

    res.json({ success: true, data: updatedTrainer });
  } catch (error) {
    console.error('Error in updateTrainer:', error);

    if (error instanceof Error && error.message === 'A trainer with this name already exists') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function deleteTrainer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this trainer' });
      return;
    }

    await trainerService.deleteTrainer(id);
    res.json({ success: true, message: `Trainer with ID ${id} deleted` });
  } catch (error) {
    console.error('Error in deleteTrainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// Inventory
// =============================================================================

export async function getTrainerInventory(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const inventory = await trainerService.getTrainerInventory(id);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error in getTrainerInventory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function updateTrainerInventoryItem(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      res.status(403).json({ success: false, message: "Not authorized to update this trainer's inventory" });
      return;
    }

    const { category, itemName, quantity } = req.body;
    if (!category || !itemName || quantity === undefined) {
      res.status(400).json({ success: false, message: 'Category, itemName, and quantity are required' });
      return;
    }

    const updatedInventory = await trainerService.updateTrainerInventoryItem(
      id,
      category as InventoryCategory,
      itemName,
      parseInt(quantity),
    );

    res.json({ success: true, data: updatedInventory });
  } catch (error) {
    console.error('Error in updateTrainerInventoryItem:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function bulkAddItemToAllTrainers(req: Request, res: Response): Promise<void> {
  try {
    const { itemName, quantity, category } = req.body;
    if (!itemName || !category) {
      res.status(400).json({ success: false, message: 'itemName and category are required' });
      return;
    }
    const qty = parseInt(quantity) || 1;

    const allTrainers = await trainerService.getAllTrainersForForms();
    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const trainer of allTrainers) {
      try {
        await trainerService.addItem(trainer.id, itemName.trim(), qty, category as InventoryCategory);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Trainer ${trainer.name} (ID ${trainer.id}): ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Added ${itemName} x${qty} to ${results.success} trainers. ${results.failed} failed.`,
    });
  } catch (error) {
    console.error('Error in bulkAddItemToAllTrainers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// Monsters
// =============================================================================

export async function getTrainerMonsters(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const page = parseInt((req.query.page as string) ?? '1') || 1;
    const limit = parseInt((req.query.limit as string) ?? '12') || 12;

    const result = await trainerService.getTrainerMonsters(id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in getTrainerMonsters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getAllTrainerMonsters(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const monsters = await trainerService.getAllTrainerMonsters(id);
    res.json({ success: true, monsters, totalMonsters: monsters.length });
  } catch (error) {
    console.error('Error in getAllTrainerMonsters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function updateMonsterBoxPositions(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.id as string);
    const { positions } = req.body;

    if (!positions || !Array.isArray(positions)) {
      res.status(400).json({ success: false, message: 'Invalid positions data. Expected an array of positions.' });
      return;
    }

    const trainer = await trainerService.getTrainerById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${trainerId} not found` });
      return;
    }

    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      res.status(403).json({ success: false, message: "Not authorized to update this trainer's monsters" });
      return;
    }

    await trainerService.updateMonsterBoxPositions(trainerId, positions);
    res.json({ success: true, message: 'Monster box positions updated successfully' });
  } catch (error) {
    console.error('Error in updateMonsterBoxPositions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// Featured Monsters
// =============================================================================

export async function getFeaturedMonsters(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(trainerId);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${trainerId} not found` });
      return;
    }

    const featuredMonsters = await trainerService.getFeaturedMonsters(trainerId);
    res.json({ success: true, featuredMonsters });
  } catch (error) {
    console.error('Error in getFeaturedMonsters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function updateFeaturedMonsters(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.id as string);
    const { featuredMonsters } = req.body;

    if (!featuredMonsters || !Array.isArray(featuredMonsters)) {
      res.status(400).json({ success: false, message: 'Invalid featured monsters data. Expected an array.' });
      return;
    }

    if (featuredMonsters.length > 6) {
      res.status(400).json({ success: false, message: 'Maximum 6 featured monsters allowed.' });
      return;
    }

    const trainer = await trainerService.getTrainerById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${trainerId} not found` });
      return;
    }

    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      res.status(403).json({ success: false, message: "Not authorized to update this trainer's featured monsters" });
      return;
    }

    await trainerService.updateFeaturedMonsters(trainerId, featuredMonsters);
    res.json({ success: true, message: 'Featured monsters updated successfully' });
  } catch (error) {
    console.error('Error in updateFeaturedMonsters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// References & Images
// =============================================================================

export async function getTrainerReferences(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const references = await trainerService.getTrainerReferences(id);
    res.json({ success: true, data: references });
  } catch (error) {
    console.error('Error in getTrainerReferences:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getTrainerImages(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const images = await trainerService.getTrainerImages(id);
    res.json({ success: true, data: images });
  } catch (error) {
    console.error('Error in getTrainerImages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function uploadTrainerImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload an image' });
      return;
    }

    const result = await trainerService.uploadImage(req.file.path);
    res.json({ success: true, data: result, message: 'Image uploaded successfully' });
  } catch (error) {
    console.error('Error uploading trainer image:', error);
    res.status(500).json({ success: false, message: 'Error uploading image' });
  }
}

export async function addTrainerMegaImage(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { image_url } = req.body;

    if (!image_url) {
      res.status(400).json({ success: false, message: 'image_url is required' });
      return;
    }

    const trainer = await trainerService.getTrainerById(id);
    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      res.status(403).json({ success: false, message: 'Not authorized to add mega image to this trainer' });
      return;
    }

    const megaInfo = await trainerService.setMegaImage(id, image_url);
    res.status(201).json({ success: true, data: megaInfo, message: 'Mega image added successfully' });
  } catch (error) {
    console.error('Error in addTrainerMegaImage:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function addTrainerAdditionalRef(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { image_url, title, description } = req.body;

    if (!image_url) {
      res.status(400).json({ success: false, message: 'image_url is required' });
      return;
    }

    const trainer = await trainerService.getTrainerById(id);
    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const userId = req.user?.discord_id;
    if (userId && trainer.player_user_id !== userId && !req.user?.is_admin) {
      res.status(403).json({ success: false, message: 'Not authorized to add additional reference to this trainer' });
      return;
    }

    const ref = await trainerService.addAdditionalRef(id, image_url, title, description);
    res.status(201).json({ success: true, data: ref, message: 'Additional reference added successfully' });
  } catch (error) {
    console.error('Error in addTrainerAdditionalRef:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// Levels (Self-service)
// =============================================================================

export async function addTrainerLevels(req: Request, res: Response): Promise<void> {
  try {
    const { trainerId, levels } = req.body;

    if (!trainerId || !levels || levels <= 0) {
      res.status(400).json({ success: false, message: 'Trainer ID and positive level count are required' });
      return;
    }

    const trainer = await trainerService.getTrainerById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    // Verify ownership (req.user guaranteed by authenticate middleware)
    if (!req.user || trainer.player_user_id !== req.user.discord_id) {
      res.status(403).json({ success: false, message: 'You do not own this trainer' });
      return;
    }

    const result = await trainerService.addTrainerLevels(trainerId, levels);
    res.json({
      success: true,
      message: `Successfully added ${levels} levels to ${trainer.name}`,
      data: { trainerId, ...result },
    });
  } catch (error) {
    console.error('Error adding levels to trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// Admin Level Management
// =============================================================================

export async function adminAddLevelsToTrainer(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    const { levels, coins, reason } = req.body;

    if (!trainerId || !levels) {
      res.status(400).json({ success: false, message: 'Trainer ID and levels are required' });
      return;
    }

    const parsedLevels = parseInt(levels);
    if (isNaN(parsedLevels) || parsedLevels <= 0) {
      res.status(400).json({ success: false, message: 'Levels must be a positive number' });
      return;
    }

    const parsedCoins = coins ? parseInt(coins) : undefined;
    const result = await trainerService.adminAddLevelsToTrainer(trainerId, parsedLevels, parsedCoins);

    if (reason) {
      console.log(`Admin level add reason: ${reason}`);
    }

    res.json({
      success: true,
      message: `Successfully added ${parsedLevels} levels and ${parsedCoins ?? parsedLevels * 50} coins to trainer ${result.trainer.name}`,
      data: result,
    });
  } catch (error) {
    console.error('Error adding levels to trainer:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Error adding levels to trainer: ${message}` });
  }
}

export async function adminAddLevelsToBulkTrainers(req: Request, res: Response): Promise<void> {
  try {
    const { trainerIds, levels, coins, reason } = req.body;

    if (!trainerIds || !Array.isArray(trainerIds) || trainerIds.length === 0 || !levels) {
      res.status(400).json({ success: false, message: 'Trainer IDs array and levels are required' });
      return;
    }

    const parsedLevels = parseInt(levels);
    if (isNaN(parsedLevels) || parsedLevels <= 0) {
      res.status(400).json({ success: false, message: 'Levels must be a positive number' });
      return;
    }

    const parsedCoins = coins ? parseInt(coins) : undefined;
    const results = await trainerService.adminAddLevelsToBulkTrainers(trainerIds, parsedLevels, parsedCoins);

    if (reason) {
      console.log(`Admin bulk level add reason: ${reason}`);
    }

    res.json({
      success: true,
      message: `Successfully processed ${results.success.length} trainers, failed: ${results.failed.length}`,
      data: results,
    });
  } catch (error) {
    console.error('Error adding levels to bulk trainers:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Error adding levels to bulk trainers: ${message}` });
  }
}

// =============================================================================
// Achievements
// =============================================================================

export async function getTrainerAchievements(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    // Determine ownership
    let isOwner = false;
    if (req.user?.discord_id) {
      isOwner = trainerService.isTrainerOwner(trainer, req.user.discord_id);
    }

    const achievements = await trainerService.getTrainerAchievements(id, isOwner);
    res.json({
      success: true,
      data: {
        achievements,
        isOwner,
        trainer: { id: trainer.id, name: trainer.name, level: trainer.level },
      },
    });
  } catch (error) {
    console.error('Error getting trainer achievements:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function claimTrainerAchievement(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const achievementId = req.params.achievementId as string;
    const trainerId = parseInt(id);

    const trainer = await trainerService.getTrainerById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    if (!req.user || trainer.player_user_id !== req.user.discord_id) {
      res.status(403).json({ success: false, message: 'You do not own this trainer' });
      return;
    }

    const result = await trainerService.claimAchievement(trainerId, achievementId);
    res.json({
      success: true,
      message: `Achievement "${result.achievement.name}" claimed successfully!`,
      data: result,
    });
  } catch (error) {
    console.error('Error claiming achievement:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
}

export async function claimAllTrainerAchievements(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.id as string);

    const trainer = await trainerService.getTrainerById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    if (!req.user || trainer.player_user_id !== req.user.discord_id) {
      res.status(403).json({ success: false, message: 'You do not own this trainer' });
      return;
    }

    const result = await trainerService.claimAllAchievements(trainerId);
    res.json({ success: true, message: result.message, data: result });
  } catch (error) {
    console.error('Error claiming all achievements:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
}

export async function getTrainerAchievementStats(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    const stats = await trainerService.getAchievementStats(id);
    res.json({
      success: true,
      data: {
        stats,
        trainer: { id: trainer.id, name: trainer.name, level: trainer.level },
      },
    });
  } catch (error) {
    console.error('Error getting achievement stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// Berries
// =============================================================================

export async function getTrainerBerries(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const trainer = await trainerService.getTrainerById(id);

    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${id} not found` });
      return;
    }

    const berries = await trainerService.getTrainerBerries(id);
    res.json({ success: true, berries });
  } catch (error) {
    console.error('Error in getTrainerBerries:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// =============================================================================
// Admin Currency Management
// =============================================================================

export async function adminUpdateCurrency(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    const { amount, reason } = req.body;

    if (amount === undefined || amount === null || isNaN(parseInt(amount))) {
      res.status(400).json({ success: false, message: 'Amount is required and must be a number' });
      return;
    }

    const parsedAmount = parseInt(amount);

    const trainer = await trainerService.getTrainerById(trainerId);
    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer with ID ${trainerId} not found` });
      return;
    }

    const updatedTrainer = await trainerService.adminUpdateCurrency(trainerId, parsedAmount);

    if (reason) {
      console.log(`Admin currency update reason: ${reason}`);
    }

    res.json({
      success: true,
      message: `Successfully ${parsedAmount >= 0 ? 'added' : 'removed'} ${Math.abs(parsedAmount)} currency ${parsedAmount >= 0 ? 'to' : 'from'} trainer ${trainer.name}`,
      data: { trainer: updatedTrainer },
    });
  } catch (error) {
    console.error('Error updating trainer currency:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
}

// =============================================================================
// Admin Trainer Management
// =============================================================================

export async function adminChangeTrainerOwner(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { newOwnerDiscordId } = req.body;

    if (!newOwnerDiscordId) {
      res.status(400).json({ success: false, message: 'newOwnerDiscordId is required' });
      return;
    }

    const updatedTrainer = await trainerService.adminChangeOwner(id, newOwnerDiscordId);
    res.json({ success: true, trainer: updatedTrainer, message: 'Trainer owner changed successfully' });
  } catch (error) {
    console.error('Error in adminChangeTrainerOwner:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
}

export async function adminDeleteTrainer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const forfeitToBazar = req.body.forfeitToBazar === true;

    const result = await trainerService.adminDeleteWithForfeit(id, forfeitToBazar);
    res.json({
      success: true,
      message: forfeitToBazar
        ? `Trainer deleted. Forfeited ${result.forfeited.monsters} monsters and ${result.forfeited.items} item stacks to the bazar.`
        : 'Trainer deleted successfully.',
      data: result,
    });
  } catch (error) {
    console.error('Error in adminDeleteTrainer:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ success: false, message });
  }
}
