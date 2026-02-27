import { Request, Response } from 'express';
import { FactionService } from '../../services/faction.service';
import type { TrainerStatus, TaskSize } from '../../repositories/faction-submission.repository';
import type { SubmissionType } from '../../repositories/faction-tribute.repository';

const factionService = new FactionService();

// =============================================================================
// Core Faction
// =============================================================================

export async function getAllFactions(_req: Request, res: Response): Promise<void> {
  try {
    const factions = await factionService.getAllFactions();
    res.json({ success: true, data: factions });
  } catch (error) {
    console.error('Error getting factions:', error);
    res.status(500).json({ success: false, message: 'Failed to get factions' });
  }
}

export async function getFactionById(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const faction = await factionService.getFactionById(factionId);
    if (!faction) {
      res.status(404).json({ success: false, message: 'Faction not found' });
      return;
    }

    res.json({ success: true, data: faction });
  } catch (error) {
    console.error('Error getting faction:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction' });
  }
}

// =============================================================================
// Standing Management
// =============================================================================

export async function getTrainerStandings(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const standings = await factionService.getTrainerStandings(trainerId);
    res.json({ success: true, data: standings });
  } catch (error) {
    console.error('Error getting trainer standings:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer standings' });
  }
}

export async function getTrainerFactionStanding(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(trainerId) || isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID or faction ID' });
      return;
    }

    const result = await factionService.getTrainerFactionStanding(trainerId, factionId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting trainer faction standing:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer faction standing' });
  }
}

export async function updateTrainerStanding(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(trainerId) || isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID or faction ID' });
      return;
    }

    const { standingChange, reason } = req.body as { standingChange?: number; reason?: string };
    if (!standingChange || typeof standingChange !== 'number') {
      res.status(400).json({ success: false, message: 'Standing change amount is required and must be a number' });
      return;
    }

    const result = await factionService.updateStanding(trainerId, factionId, standingChange);
    res.json({
      success: true,
      data: result,
      message: `Standing updated by ${standingChange}${reason ? ` (${reason})` : ''}`,
    });
  } catch (error) {
    console.error('Error updating trainer standing:', error);
    res.status(500).json({ success: false, message: 'Failed to update trainer standing' });
  }
}

// =============================================================================
// Store
// =============================================================================

export async function getFactionStore(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const trainerId = req.query.trainerId ? parseInt(req.query.trainerId as string) : undefined;
    const items = await factionService.getFactionStore(factionId, trainerId);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error getting faction store:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction store' });
  }
}

export async function purchaseFromFactionStore(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const { trainerId, itemId, quantity = 1 } = req.body as {
      trainerId?: number;
      itemId?: number;
      quantity?: number;
    };

    if (!trainerId || !itemId) {
      res.status(400).json({ success: false, message: 'Trainer ID and item ID are required' });
      return;
    }

    const result = await factionService.purchaseFromFactionStore(factionId, trainerId, itemId, quantity);
    res.json({ success: true, data: result, message: 'Item purchased successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to purchase item';
    console.error('Error purchasing from faction store:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

// =============================================================================
// Tributes
// =============================================================================

export async function submitTribute(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const {
      title_id, trainer_id, submission_id, submission_type,
      submission_url, submission_description,
      item_requirement, currency_requirement,
    } = req.body as {
      title_id?: number;
      trainer_id?: number;
      submission_id?: number;
      submission_type?: SubmissionType;
      submission_url?: string;
      submission_description?: string;
      item_requirement?: string;
      currency_requirement?: number;
    };

    if (!title_id || !trainer_id || !submission_type || !submission_url || !submission_description) {
      res.status(400).json({ success: false, message: 'All tribute fields are required' });
      return;
    }

    const tribute = await factionService.submitTribute({
      titleId: title_id,
      trainerId: trainer_id,
      submissionId: submission_id ?? null,
      submissionType: submission_type,
      submissionUrl: submission_url,
      submissionDescription: submission_description,
      itemRequirement: item_requirement ?? null,
      currencyRequirement: currency_requirement ?? 0,
    });

    res.json({ success: true, data: tribute, message: 'Tribute submitted successfully and is pending review' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to submit tribute';
    console.error('Error submitting tribute:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function getTrainerTributes(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const factionId = req.query.factionId ? parseInt(req.query.factionId as string) : undefined;
    const tributes = await factionService.getTrainerTributes(trainerId, factionId);
    res.json({ success: true, data: tributes });
  } catch (error) {
    console.error('Error getting trainer tributes:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer tributes' });
  }
}

export async function getPendingTributes(_req: Request, res: Response): Promise<void> {
  try {
    const tributes = await factionService.getPendingTributes();
    res.json({ success: true, data: tributes });
  } catch (error) {
    console.error('Error getting pending tributes:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending tributes' });
  }
}

export async function reviewTribute(req: Request, res: Response): Promise<void> {
  try {
    const tributeId = parseInt(req.params.tributeId as string);
    if (isNaN(tributeId)) {
      res.status(400).json({ success: false, message: 'Invalid tribute ID' });
      return;
    }

    const { status, reviewerId } = req.body as { status?: 'approved' | 'rejected'; reviewerId?: number };
    if (!status || !reviewerId) {
      res.status(400).json({ success: false, message: 'Status and reviewer ID are required' });
      return;
    }

    const tribute = await factionService.reviewTribute(tributeId, status, reviewerId);
    res.json({ success: true, data: tribute, message: `Tribute ${status} successfully` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to review tribute';
    console.error('Error reviewing tribute:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function getTributeRequirement(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(trainerId) || isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID or faction ID' });
      return;
    }

    const requirement = await factionService.getTributeRequirement(trainerId, factionId);
    res.json({ success: true, data: requirement });
  } catch (error) {
    console.error('Error getting tribute requirement:', error);
    res.status(500).json({ success: false, message: 'Failed to get tribute requirement' });
  }
}

// =============================================================================
// Submissions
// =============================================================================

export async function createFactionSubmission(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const { trainerId, submissionId, promptId, trainerStatus, taskSize, specialBonus, customScore } = req.body as {
      trainerId?: number;
      submissionId?: number;
      promptId?: number;
      trainerStatus?: TrainerStatus;
      taskSize?: TaskSize;
      specialBonus?: boolean;
      customScore?: number;
    };

    if (!trainerId || !submissionId || !trainerStatus || !taskSize) {
      res.status(400).json({
        success: false,
        message: 'Trainer ID, submission ID, trainer status, and task size are required',
      });
      return;
    }

    const result = await factionService.createFactionSubmission({
      trainerId,
      factionId,
      submissionId,
      promptId: promptId ?? null,
      trainerStatus,
      taskSize,
      specialBonus,
      customScore: customScore ?? null,
    });

    res.json({
      success: true,
      data: result,
      message: 'Faction submission created and standing applied successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create faction submission';
    console.error('Error creating faction submission:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function getTrainerFactionSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const factionId = req.query.factionId ? parseInt(req.query.factionId as string) : undefined;
    const submissions = await factionService.getTrainerFactionSubmissions(trainerId, factionId);
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting trainer faction submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer faction submissions' });
  }
}

export async function getAvailableSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const submissions = await factionService.getAvailableSubmissions(trainerId);
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting available submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to get available submissions' });
  }
}

export async function getAvailableSubmissionsForTribute(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const submissions = await factionService.getAvailableSubmissionsForTribute(trainerId);
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting available submissions for tribute:', error);
    res.status(500).json({ success: false, message: 'Failed to get available submissions for tribute' });
  }
}

export async function getAvailableSubmissionsForMeeting(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const submissions = await factionService.getAvailableSubmissionsForMeeting(trainerId);
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting available submissions for meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to get available submissions for meeting' });
  }
}

// =============================================================================
// Prompts
// =============================================================================

export async function getFactionPrompts(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const prompts = await factionService.getFactionPrompts(factionId);
    res.json({ success: true, data: prompts });
  } catch (error) {
    console.error('Error getting faction prompts:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction prompts' });
  }
}

export async function createFactionPrompt(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const { name, description, modifier, isActive, submissionGiftItems } = req.body as {
      name?: string;
      description?: string;
      modifier?: number;
      isActive?: boolean;
      submissionGiftItems?: unknown[] | null;
    };

    if (!name) {
      res.status(400).json({ success: false, message: 'Prompt name is required' });
      return;
    }

    const prompt = await factionService.createFactionPrompt({
      factionId,
      name,
      description: description ?? null,
      modifier,
      isActive,
      submissionGiftItems: submissionGiftItems as import('../../repositories/faction-prompt.repository').GiftItemDefinition[] | undefined,
    });

    res.json({ success: true, data: prompt, message: 'Faction prompt created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create faction prompt';
    console.error('Error creating faction prompt:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function updateFactionPrompt(req: Request, res: Response): Promise<void> {
  try {
    const promptId = parseInt(req.params.promptId as string);
    if (isNaN(promptId)) {
      res.status(400).json({ success: false, message: 'Invalid prompt ID' });
      return;
    }

    const { name, description, modifier, isActive, submissionGiftItems } = req.body as {
      name?: string;
      description?: string;
      modifier?: number;
      isActive?: boolean;
      submissionGiftItems?: unknown[] | null;
    };

    const prompt = await factionService.updateFactionPrompt(promptId, {
      name,
      description,
      modifier,
      isActive,
      submissionGiftItems: submissionGiftItems as import('../../repositories/faction-prompt.repository').GiftItemDefinition[] | undefined,
    });

    res.json({ success: true, data: prompt, message: 'Faction prompt updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update faction prompt';
    console.error('Error updating faction prompt:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

// =============================================================================
// People & Meetings
// =============================================================================

export async function getFactionPeople(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const trainerId = req.query.trainerId ? parseInt(req.query.trainerId as string) : undefined;
    const people = await factionService.getFactionPeople(factionId, trainerId);
    res.json({ success: true, data: people });
  } catch (error) {
    console.error('Error getting faction people:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction people' });
  }
}

export async function getPersonById(req: Request, res: Response): Promise<void> {
  try {
    const personId = parseInt(req.params.personId as string);
    if (isNaN(personId)) {
      res.status(400).json({ success: false, message: 'Invalid person ID' });
      return;
    }

    const trainerId = req.query.trainerId ? parseInt(req.query.trainerId as string) : undefined;
    const person = await factionService.getPersonById(personId, trainerId);

    if (!person) {
      res.status(404).json({ success: false, message: 'Person not found' });
      return;
    }

    res.json({ success: true, data: person });
  } catch (error) {
    console.error('Error getting person:', error);
    res.status(500).json({ success: false, message: 'Failed to get person' });
  }
}

export async function meetPerson(req: Request, res: Response): Promise<void> {
  try {
    const personId = parseInt(req.params.personId as string);
    if (isNaN(personId)) {
      res.status(400).json({ success: false, message: 'Invalid person ID' });
      return;
    }

    const { trainerId, submissionId } = req.body as { trainerId?: number; submissionId?: number };
    if (!trainerId || !submissionId) {
      res.status(400).json({ success: false, message: 'Trainer ID and submission ID are required' });
      return;
    }

    const result = await factionService.meetPerson(personId, trainerId, submissionId);
    res.json({
      success: true,
      data: result,
      message: `You have successfully met ${result.person.name} and gained ${result.standingReward} standing!`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to meet person';
    console.error('Error meeting person:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function getTrainerMetPeople(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(req.params.trainerId as string);
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(trainerId) || isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID or faction ID' });
      return;
    }

    const metPeople = await factionService.getTrainerMetPeople(trainerId, factionId);
    res.json({ success: true, data: metPeople });
  } catch (error) {
    console.error('Error getting trainer met people:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer met people' });
  }
}

// =============================================================================
// Admin: Faction Management
// =============================================================================

export async function updateFactionAdmin(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const { name, description, bannerImage, iconImage, color } = req.body as {
      name?: string;
      description?: string | null;
      bannerImage?: string | null;
      iconImage?: string | null;
      color?: string | null;
    };

    const faction = await factionService.updateFaction(factionId, { name, description, bannerImage, iconImage, color });
    res.json({ success: true, data: faction, message: 'Faction updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update faction';
    console.error('Error updating faction:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function bulkUpdateFactionPropertyAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { property, updates } = req.body as {
      property?: string;
      updates?: { id: number; value: string | null }[];
    };

    if (!property || !updates || !Array.isArray(updates)) {
      res.status(400).json({ success: false, message: 'Property and updates array are required' });
      return;
    }

    const factions = await factionService.bulkUpdateFactionProperty(property, updates);
    res.json({ success: true, data: factions, message: `Updated ${factions.length} factions` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to bulk update factions';
    console.error('Error bulk updating factions:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

// Admin: Titles

export async function getFactionTitlesAdmin(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const faction = await factionService.getFactionById(factionId);
    if (!faction) {
      res.status(404).json({ success: false, message: 'Faction not found' });
      return;
    }

    res.json({ success: true, data: faction.titles });
  } catch (error) {
    console.error('Error getting faction titles:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction titles' });
  }
}

export async function createFactionTitleAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { factionId, titleName, standingRequirement, isPositive } = req.body as {
      factionId?: number;
      titleName?: string;
      standingRequirement?: number;
      isPositive?: boolean;
    };

    if (!factionId || !titleName || standingRequirement === undefined) {
      res.status(400).json({ success: false, message: 'Faction ID, title name, and standing requirement are required' });
      return;
    }

    const title = await factionService.createTitle(factionId, {
      titleName,
      standingRequirement,
      isPositive: isPositive ?? true,
    });
    res.json({ success: true, data: title, message: 'Title created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create title';
    console.error('Error creating title:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function updateFactionTitleAdmin(req: Request, res: Response): Promise<void> {
  try {
    const titleId = parseInt(req.params.titleId as string);
    if (isNaN(titleId)) {
      res.status(400).json({ success: false, message: 'Invalid title ID' });
      return;
    }

    const { titleName, standingRequirement, isPositive } = req.body as {
      titleName?: string;
      standingRequirement?: number;
      isPositive?: boolean;
    };

    const title = await factionService.updateTitleAdmin(titleId, { titleName, standingRequirement, isPositive });
    res.json({ success: true, data: title, message: 'Title updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update title';
    console.error('Error updating title:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function deleteFactionTitleAdmin(req: Request, res: Response): Promise<void> {
  try {
    const titleId = parseInt(req.params.titleId as string);
    if (isNaN(titleId)) {
      res.status(400).json({ success: false, message: 'Invalid title ID' });
      return;
    }

    const success = await factionService.deleteTitle(titleId);
    if (success) {
      res.json({ success: true, message: 'Title deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Title not found' });
    }
  } catch (error) {
    console.error('Error deleting title:', error);
    res.status(500).json({ success: false, message: 'Failed to delete title' });
  }
}

// Admin: Relationships

export async function getFactionRelationshipsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const relationships = await factionService.getRelationshipsAdmin(factionId);
    res.json({ success: true, data: relationships });
  } catch (error) {
    console.error('Error getting faction relationships:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction relationships' });
  }
}

export async function createFactionRelationshipAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { factionId, relatedFactionId, relationshipType, standingModifier } = req.body as {
      factionId?: number;
      relatedFactionId?: number;
      relationshipType?: string;
      standingModifier?: number;
    };

    if (!factionId || !relatedFactionId || !relationshipType || standingModifier === undefined) {
      res.status(400).json({ success: false, message: 'All relationship fields are required' });
      return;
    }

    const relationship = await factionService.createRelationship({ factionId, relatedFactionId, relationshipType, standingModifier });
    res.json({ success: true, data: relationship, message: 'Relationship created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create relationship';
    console.error('Error creating relationship:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function updateFactionRelationshipAdmin(req: Request, res: Response): Promise<void> {
  try {
    const relationshipId = parseInt(req.params.relationshipId as string);
    if (isNaN(relationshipId)) {
      res.status(400).json({ success: false, message: 'Invalid relationship ID' });
      return;
    }

    const { relatedFactionId, relationshipType, standingModifier } = req.body as {
      relatedFactionId?: number;
      relationshipType?: string;
      standingModifier?: number;
    };

    const relationship = await factionService.updateRelationship(relationshipId, { relatedFactionId, relationshipType, standingModifier });
    res.json({ success: true, data: relationship, message: 'Relationship updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update relationship';
    console.error('Error updating relationship:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function deleteFactionRelationshipAdmin(req: Request, res: Response): Promise<void> {
  try {
    const relationshipId = parseInt(req.params.relationshipId as string);
    if (isNaN(relationshipId)) {
      res.status(400).json({ success: false, message: 'Invalid relationship ID' });
      return;
    }

    const success = await factionService.deleteRelationship(relationshipId);
    if (success) {
      res.json({ success: true, message: 'Relationship deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Relationship not found' });
    }
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ success: false, message: 'Failed to delete relationship' });
  }
}

// Admin: Store Items

export async function getFactionStoreItemsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const items = await factionService.getAllStoreItemsAdmin(factionId);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error getting faction store items:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction store items' });
  }
}

export async function createFactionStoreItemAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { factionId, itemName, price, standingRequirement, isActive, itemCategory, titleId } = req.body as {
      factionId?: number;
      itemName?: string;
      price?: number;
      standingRequirement?: number;
      isActive?: boolean;
      itemCategory?: string | null;
      titleId?: number | null;
    };

    if (!factionId || !itemName || price === undefined) {
      res.status(400).json({ success: false, message: 'Faction ID, item name, and price are required' });
      return;
    }

    const item = await factionService.createStoreItem({ factionId, itemName, price, standingRequirement, isActive, itemCategory, titleId });
    res.json({ success: true, data: item, message: 'Store item created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create store item';
    console.error('Error creating store item:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function updateFactionStoreItemAdmin(req: Request, res: Response): Promise<void> {
  try {
    const itemId = parseInt(req.params.itemId as string);
    if (isNaN(itemId)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    const { itemName, price, standingRequirement, isActive, itemCategory, titleId } = req.body as {
      itemName?: string;
      price?: number;
      standingRequirement?: number;
      isActive?: boolean;
      itemCategory?: string | null;
      titleId?: number | null;
    };

    const item = await factionService.updateStoreItem(itemId, { itemName, price, standingRequirement, isActive, itemCategory, titleId });
    res.json({ success: true, data: item, message: 'Store item updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update store item';
    console.error('Error updating store item:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function deleteFactionStoreItemAdmin(req: Request, res: Response): Promise<void> {
  try {
    const itemId = parseInt(req.params.itemId as string);
    if (isNaN(itemId)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    const success = await factionService.deleteStoreItem(itemId);
    if (success) {
      res.json({ success: true, message: 'Store item deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Store item not found' });
    }
  } catch (error) {
    console.error('Error deleting store item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete store item' });
  }
}

// Admin: All Prompts

export async function getAllPromptsAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const prompts = await factionService.getAllPromptsAdmin();
    res.json({ success: true, data: prompts });
  } catch (error) {
    console.error('Error getting all prompts:', error);
    res.status(500).json({ success: false, message: 'Failed to get prompts' });
  }
}

export async function getFactionPromptsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const factionId = parseInt(req.params.factionId as string);
    if (isNaN(factionId)) {
      res.status(400).json({ success: false, message: 'Invalid faction ID' });
      return;
    }

    const prompts = await factionService.getFactionPromptsAdmin(factionId);
    res.json({ success: true, data: prompts });
  } catch (error) {
    console.error('Error getting faction prompts:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction prompts' });
  }
}

export async function deleteFactionPromptAdmin(req: Request, res: Response): Promise<void> {
  try {
    const promptId = parseInt(req.params.promptId as string);
    if (isNaN(promptId)) {
      res.status(400).json({ success: false, message: 'Invalid prompt ID' });
      return;
    }

    const deleted = await factionService.deleteFactionPrompt(promptId);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Prompt not found' });
      return;
    }
    res.json({ success: true, message: 'Prompt deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete prompt';
    console.error('Error deleting prompt:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

// =============================================================================
// Admin People Management
// =============================================================================

export async function getAllFactionPeopleAdmin(req: Request, res: Response): Promise<void> {
  try {
    const factionId = req.query.factionId ? parseInt(req.query.factionId as string) : undefined;
    const people = await factionService.getAllFactionPeopleAdmin(factionId);
    res.json({ success: true, data: people });
  } catch (error) {
    console.error('Error getting faction people for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to get faction people' });
  }
}

export async function createFactionPersonAdmin(req: Request, res: Response): Promise<void> {
  try {
    const {
      factionId, name, alias, standingRequirement,
      blurb, shortBio, longBio, role, availableAssistance, images, standingReward,
    } = req.body as {
      factionId?: number;
      name?: string;
      alias?: string;
      standingRequirement?: number;
      blurb?: string;
      shortBio?: string;
      longBio?: string;
      role?: string;
      availableAssistance?: string;
      images?: Record<string, string>;
      standingReward?: number;
    };

    if (!factionId || !name || !alias || standingRequirement === undefined) {
      res.status(400).json({
        success: false,
        message: 'Faction ID, name, alias, and standing requirement are required',
      });
      return;
    }

    const person = await factionService.createFactionPerson({
      factionId,
      name,
      alias,
      standingRequirement,
      blurb: blurb ?? null,
      shortBio: shortBio ?? null,
      longBio: longBio ?? null,
      role: role ?? null,
      availableAssistance: availableAssistance ?? null,
      images,
      standingReward,
    });

    res.json({ success: true, data: person, message: 'Faction person created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create faction person';
    console.error('Error creating faction person:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function updateFactionPersonAdmin(req: Request, res: Response): Promise<void> {
  try {
    const personId = parseInt(req.params.personId as string);
    if (isNaN(personId)) {
      res.status(400).json({ success: false, message: 'Invalid person ID' });
      return;
    }

    const person = await factionService.updateFactionPerson(personId, req.body as Record<string, unknown>);
    res.json({ success: true, data: person, message: 'Faction person updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update faction person';
    console.error('Error updating faction person:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function deleteFactionPersonAdmin(req: Request, res: Response): Promise<void> {
  try {
    const personId = parseInt(req.params.personId as string);
    if (isNaN(personId)) {
      res.status(400).json({ success: false, message: 'Invalid person ID' });
      return;
    }

    const success = await factionService.deleteFactionPerson(personId);
    if (success) {
      res.json({ success: true, message: 'Faction person deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Faction person not found' });
    }
  } catch (error) {
    console.error('Error deleting faction person:', error);
    res.status(500).json({ success: false, message: 'Failed to delete faction person' });
  }
}

export async function getPersonTeamAdmin(req: Request, res: Response): Promise<void> {
  try {
    const personId = parseInt(req.params.personId as string);
    if (isNaN(personId)) {
      res.status(400).json({ success: false, message: 'Invalid person ID' });
      return;
    }

    const team = await factionService.getPersonTeamAdmin(personId);
    res.json({ success: true, data: team });
  } catch (error) {
    console.error('Error getting person team for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to get person team' });
  }
}

export async function addMonsterToTeamAdmin(req: Request, res: Response): Promise<void> {
  try {
    const personId = parseInt(req.params.personId as string);
    if (isNaN(personId)) {
      res.status(400).json({ success: false, message: 'Invalid person ID' });
      return;
    }

    const { name, species, types, attribute, image, position } = req.body as {
      name?: string;
      species?: string[];
      types?: string[];
      attribute?: string;
      image?: string;
      position?: number;
    };

    if (!name || !species || !types || !attribute) {
      res.status(400).json({
        success: false,
        message: 'Name, species, types, and attribute are required',
      });
      return;
    }

    const monster = await factionService.addMonsterToTeam(personId, {
      name,
      species,
      types,
      attribute,
      image: image ?? null,
      position,
    });

    res.json({ success: true, data: monster, message: 'Monster added to team successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add monster to team';
    console.error('Error adding monster to team:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function updateMonsterAdmin(req: Request, res: Response): Promise<void> {
  try {
    const monsterId = parseInt(req.params.monsterId as string);
    if (isNaN(monsterId)) {
      res.status(400).json({ success: false, message: 'Invalid monster ID' });
      return;
    }

    const monster = await factionService.updateMonster(monsterId, req.body as Record<string, unknown>);
    res.json({ success: true, data: monster, message: 'Monster updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update monster';
    console.error('Error updating monster:', error);
    res.status(400).json({ success: false, message: msg });
  }
}

export async function deleteMonsterAdmin(req: Request, res: Response): Promise<void> {
  try {
    const monsterId = parseInt(req.params.monsterId as string);
    if (isNaN(monsterId)) {
      res.status(400).json({ success: false, message: 'Invalid monster ID' });
      return;
    }

    const success = await factionService.deleteMonster(monsterId);
    if (success) {
      res.json({ success: true, message: 'Monster deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Monster not found' });
    }
  } catch (error) {
    console.error('Error deleting monster:', error);
    res.status(500).json({ success: false, message: 'Failed to delete monster' });
  }
}
