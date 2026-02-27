import { db } from '../database';
import { FactionRepository } from '../repositories/faction.repository';
import { FactionPersonRepository } from '../repositories/faction-person.repository';
import { FactionPersonMeetingRepository } from '../repositories/faction-person-meeting.repository';
import { FactionPromptRepository } from '../repositories/faction-prompt.repository';
import { FactionSubmissionRepository } from '../repositories/faction-submission.repository';
import { FactionTributeRepository } from '../repositories/faction-tribute.repository';
import type { FactionRow, FactionTitleRow, FactionRelationshipRow, FactionStandingRow, FactionStoreItemRow, FactionUpdateInput } from '../repositories/faction.repository';
import type { FactionPerson, FactionPersonWithDetails, FactionPersonMonster } from '../repositories/faction-person.repository';
import type { FactionPersonMeetingCreateInput } from '../repositories/faction-person-meeting.repository';
import type { FactionPrompt, FactionPromptCreateInput, FactionPromptUpdateInput } from '../repositories/faction-prompt.repository';
import type { FactionSubmission, FactionSubmissionCreateInput, FactionSubmissionWithDetails, TrainerStatus, TaskSize } from '../repositories/faction-submission.repository';
import type { FactionTribute, FactionTributeCreateInput, FactionTributeWithDetails, SubmissionType } from '../repositories/faction-tribute.repository';

// =============================================================================
// Types
// =============================================================================

export type FactionWithDetails = FactionRow & {
  titles: FactionTitleRow[];
  relationships: FactionRelationshipRow[];
};

export type FactionPersonWithMeetingStatus = FactionPerson & {
  hasMet: boolean;
  canMeet: boolean;
  metAt: Date | null;
};

export type PersonWithTeam = FactionPersonWithDetails & {
  team: FactionPersonMonster[];
  hasMet?: boolean;
  canMeet?: boolean;
  metAt?: Date | null;
};

export type StandingUpdateResult = {
  standing: FactionStandingRow;
  relationshipEffects: { factionId: number; change: number }[];
};

export type SubmissionCreateResult = {
  submission: FactionSubmission;
  standingResult: StandingUpdateResult;
};

export type MeetPersonResult = {
  meeting: { id: number; trainerId: number; personId: number; submissionId: number | null; metAt: Date };
  standingReward: number;
  person: FactionPerson;
};

export type TributeRequirement = {
  nextTitleId: number | null;
  nextTitleName: string | null;
  standingRequired: number | null;
  currentStanding: number;
  hasMetRequirement: boolean;
  tributeCount: number;
} | null;

export type AvailableSubmission = {
  id: number;
  title: string;
  createdAt: Date;
  submissionType: 'art' | 'writing';
  imageUrl: string | null;
  description: string | null;
};

// =============================================================================
// Service
// =============================================================================

export class FactionService {
  private factionRepo: FactionRepository;
  private personRepo: FactionPersonRepository;
  private meetingRepo: FactionPersonMeetingRepository;
  private promptRepo: FactionPromptRepository;
  private submissionRepo: FactionSubmissionRepository;
  private tributeRepo: FactionTributeRepository;

  constructor(
    factionRepo?: FactionRepository,
    personRepo?: FactionPersonRepository,
    meetingRepo?: FactionPersonMeetingRepository,
    promptRepo?: FactionPromptRepository,
    submissionRepo?: FactionSubmissionRepository,
    tributeRepo?: FactionTributeRepository,
  ) {
    this.factionRepo = factionRepo ?? new FactionRepository();
    this.personRepo = personRepo ?? new FactionPersonRepository();
    this.meetingRepo = meetingRepo ?? new FactionPersonMeetingRepository();
    this.promptRepo = promptRepo ?? new FactionPromptRepository();
    this.submissionRepo = submissionRepo ?? new FactionSubmissionRepository();
    this.tributeRepo = tributeRepo ?? new FactionTributeRepository();
  }

  // ===========================================================================
  // Core Faction
  // ===========================================================================

  async getAllFactions(): Promise<FactionRow[]> {
    return this.factionRepo.findAll();
  }

  async getFactionById(id: number): Promise<FactionWithDetails | null> {
    const faction = await this.factionRepo.findById(id);
    if (!faction) {
      return null;
    }

    const [titles, relationships] = await Promise.all([
      this.factionRepo.getTitles(id),
      this.factionRepo.getRelationships(id),
    ]);

    return { ...faction, titles, relationships };
  }

  async getFactionStore(factionId: number, trainerId?: number): Promise<FactionStoreItemRow[]> {
    const items = await this.factionRepo.getStoreItems(factionId);

    if (trainerId) {
      const standing = await this.factionRepo.getTrainerStanding(trainerId, factionId);
      const currentStanding = Math.abs(standing?.standing ?? 0);

      if (items.some(i => i.title_id)) {
        const titles = await this.factionRepo.getTitles(factionId);
        return items.filter(item => {
          if (item.title_id) {
            const requiredTitle = titles.find(t => t.id === item.title_id);
            return requiredTitle ? currentStanding >= requiredTitle.standing_requirement : false;
          }
          return currentStanding >= item.standing_requirement;
        });
      }

      return items.filter(item => currentStanding >= item.standing_requirement);
    }

    return items;
  }

  // ===========================================================================
  // Standing Management
  // ===========================================================================

  async initializeTrainerStandings(trainerId: number): Promise<void> {
    const factions = await this.factionRepo.findAll();
    const existingStandings = await this.factionRepo.getAllTrainerStandings(trainerId);
    const existingFactionIds = new Set(existingStandings.map(s => s.faction_id));

    for (const faction of factions) {
      if (!existingFactionIds.has(faction.id)) {
        await this.factionRepo.setTrainerStanding(trainerId, faction.id, 0);
      }
    }
  }

  async getTrainerStandings(trainerId: number): Promise<(FactionStandingRow & { faction_name: string })[]> {
    await this.initializeTrainerStandings(trainerId);
    return this.factionRepo.getAllTrainerStandings(trainerId);
  }

  async getTrainerFactionStanding(trainerId: number, factionId: number): Promise<{
    standing: FactionStandingRow;
    availableTitles: FactionTitleRow[];
  }> {
    let standing = await this.factionRepo.getTrainerStanding(trainerId, factionId);

    if (!standing) {
      await this.initializeTrainerStandings(trainerId);
      standing = await this.factionRepo.getTrainerStanding(trainerId, factionId);
    }

    if (!standing) {
      throw new Error('Failed to initialize standing');
    }

    const titles = await this.factionRepo.getTitles(factionId);
    const currentStanding = Math.abs(standing.standing);
    const availableTitles = titles.filter(t => currentStanding >= t.standing_requirement);

    return { standing, availableTitles };
  }

  async updateStanding(trainerId: number, factionId: number, change: number): Promise<StandingUpdateResult> {
    const existing = await this.factionRepo.getTrainerStanding(trainerId, factionId);
    const currentStanding = existing?.standing ?? 0;
    const newStanding = Math.max(-1000, Math.min(1000, currentStanding + change));

    const standing = await this.factionRepo.setTrainerStanding(trainerId, factionId, newStanding);

    await this.updateTitle(trainerId, factionId);

    const relationshipEffects = await this.applyRelationshipEffects(trainerId, factionId, change);

    return { standing, relationshipEffects };
  }

  async updateTitle(trainerId: number, factionId: number): Promise<void> {
    const standing = await this.factionRepo.getTrainerStanding(trainerId, factionId);
    if (!standing) {
      return;
    }

    const titles = await this.factionRepo.getTitles(factionId);
    const currentAbs = Math.abs(standing.standing);

    const tributeCaps = [200, 400, 600, 800];
    const approvedCount = await this.tributeRepo.getApprovedTributesCount(trainerId, factionId);

    const eligibleTitles = titles.filter(t => {
      if (currentAbs < t.standing_requirement) {
        return false;
      }
      const capIndex = tributeCaps.indexOf(t.standing_requirement);
      if (capIndex >= 0 && approvedCount < capIndex + 1) {
        return false;
      }
      return true;
    });

    // The highest eligible title is determined by standing_requirement (titles are sorted ASC)
    // We don't store a "current title" in DB — the client derives it from standings + tributes
    // This method exists for potential side-effects; currently a no-op beyond validation
    void eligibleTitles;
  }

  async applyRelationshipEffects(trainerId: number, factionId: number, change: number): Promise<{ factionId: number; change: number }[]> {
    const relationships = await this.submissionRepo.getFactionRelationships(factionId);
    const effects: { factionId: number; change: number }[] = [];

    for (const rel of relationships) {
      const relChange = Math.round(change * (rel.standingModifier / 100));
      if (relChange === 0) {
        continue;
      }

      const existing = await this.factionRepo.getTrainerStanding(trainerId, rel.relatedFactionId);
      const current = existing?.standing ?? 0;
      const clamped = Math.max(-1000, Math.min(1000, current + relChange));
      await this.factionRepo.setTrainerStanding(trainerId, rel.relatedFactionId, clamped);

      effects.push({ factionId: rel.relatedFactionId, change: relChange });
    }

    return effects;
  }

  // ===========================================================================
  // Tributes
  // ===========================================================================

  async submitTribute(data: {
    titleId: number;
    trainerId: number;
    submissionId?: number | null;
    submissionType: SubmissionType;
    submissionUrl?: string | null;
    submissionDescription?: string | null;
    itemRequirement?: string | null;
    currencyRequirement?: number;
  }): Promise<FactionTribute> {
    return this.tributeRepo.create(data as FactionTributeCreateInput);
  }

  async reviewTribute(tributeId: number, status: 'approved' | 'rejected', reviewerId: number): Promise<FactionTribute> {
    const tribute = await this.tributeRepo.review(tributeId, status, reviewerId);

    if (status === 'approved') {
      const titleDetails = await this.tributeRepo.getTitleDetails(tribute.titleId);
      if (titleDetails) {
        await this.updateTitle(tribute.trainerId, titleDetails.factionId);
      }
    }

    return tribute;
  }

  async getPendingTributes(): Promise<FactionTributeWithDetails[]> {
    return this.tributeRepo.findPending();
  }

  async getTrainerTributes(trainerId: number, factionId?: number): Promise<FactionTributeWithDetails[]> {
    if (factionId) {
      return this.tributeRepo.findByTrainerAndFaction(trainerId, factionId);
    }
    return this.tributeRepo.findByTrainerId(trainerId);
  }

  async getTributeRequirement(trainerId: number, factionId: number): Promise<TributeRequirement> {
    const standing = await this.factionRepo.getTrainerStanding(trainerId, factionId);
    const currentStanding = standing?.standing ?? 0;
    const currentAbs = Math.abs(currentStanding);
    const approvedCount = await this.tributeRepo.getApprovedTributesCount(trainerId, factionId);

    const titles = await this.factionRepo.getTitles(factionId);
    const tributeCaps = [200, 400, 600, 800];

    // Find the next title that requires a tribute
    for (let i = 0; i < tributeCaps.length; i++) {
      const cap = tributeCaps[i] as number;
      if (approvedCount <= i) {
        const title = titles.find(t => t.standing_requirement === cap);
        if (title) {
          return {
            nextTitleId: title.id,
            nextTitleName: title.name,
            standingRequired: cap,
            currentStanding: currentAbs,
            hasMetRequirement: currentAbs >= cap,
            tributeCount: approvedCount,
          };
        }
      }
    }

    return null;
  }

  // ===========================================================================
  // Submissions
  // ===========================================================================

  async createFactionSubmission(data: {
    trainerId: number;
    factionId: number;
    submissionId: number;
    promptId?: number | null;
    trainerStatus: TrainerStatus;
    taskSize: TaskSize;
    specialBonus?: boolean;
    customScore?: number | null;
  }): Promise<SubmissionCreateResult> {
    // Check if trainer has already used this submission
    const hasUsed = await this.submissionRepo.hasTrainerUsedSubmission(data.trainerId, data.submissionId);
    if (hasUsed) {
      throw new Error('This trainer has already used this submission for faction standing');
    }

    // Check if submission exists and belongs to trainer
    const submissionCheck = await db.query<{ id: number; trainer_id: number }>(
      'SELECT id, trainer_id FROM submissions WHERE id = $1',
      [data.submissionId]
    );
    const sub = submissionCheck.rows[0];
    if (sub?.trainer_id !== data.trainerId) {
      throw new Error('Invalid submission or submission does not belong to this trainer');
    }

    const submission = await this.submissionRepo.create(data as FactionSubmissionCreateInput);

    const standingResult = await this.updateStanding(data.trainerId, data.factionId, submission.finalScore);

    return { submission, standingResult };
  }

  async getTrainerFactionSubmissions(trainerId: number, factionId?: number): Promise<FactionSubmissionWithDetails[]> {
    return this.submissionRepo.findByTrainerId(trainerId, factionId);
  }

  async getAvailableSubmissions(trainerId: number): Promise<AvailableSubmission[]> {
    const result = await db.query<{ id: number; title: string; created_at: Date; submission_type: 'art' | 'writing'; image_url: string | null; description: string | null }>(
      `
        SELECT s.id, s.title, s.created_at, s.submission_type, s.description,
          (SELECT si.image_url FROM submission_images si WHERE si.submission_id = s.id AND si.is_main::boolean = true LIMIT 1) as image_url
        FROM submissions s
        JOIN submission_trainers st ON st.submission_id = s.id AND st.trainer_id = $1
        WHERE s.id NOT IN (
          SELECT fs.submission_id FROM faction_submissions fs
          WHERE fs.trainer_id = $1 AND fs.submission_id IS NOT NULL
        )
        ORDER BY s.created_at DESC
      `,
      [trainerId]
    );
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      submissionType: row.submission_type,
      imageUrl: row.image_url,
      description: row.description,
    }));
  }

  async getAvailableSubmissionsForTribute(trainerId: number): Promise<AvailableSubmission[]> {
    const result = await db.query<{ id: number; title: string; created_at: Date; submission_type: 'art' | 'writing'; image_url: string | null; description: string | null }>(
      `
        SELECT s.id, s.title, s.created_at, s.submission_type, s.description,
          (SELECT si.image_url FROM submission_images si WHERE si.submission_id = s.id AND si.is_main::boolean = true LIMIT 1) as image_url
        FROM submissions s
        JOIN submission_trainers st ON st.submission_id = s.id AND st.trainer_id = $1
        WHERE s.id NOT IN (
          SELECT fs.submission_id FROM faction_submissions fs
          WHERE fs.trainer_id = $1 AND fs.submission_id IS NOT NULL
        )
        AND s.id NOT IN (
          SELECT ft.submission_id FROM faction_tributes ft
          WHERE ft.trainer_id = $1 AND ft.submission_id IS NOT NULL
        )
        ORDER BY s.created_at DESC
      `,
      [trainerId]
    );
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      submissionType: row.submission_type,
      imageUrl: row.image_url,
      description: row.description,
    }));
  }

  async getAvailableSubmissionsForMeeting(trainerId: number): Promise<AvailableSubmission[]> {
    return this.meetingRepo.getAvailableSubmissionsForMeeting(trainerId);
  }

  // ===========================================================================
  // Prompts
  // ===========================================================================

  async getFactionPrompts(factionId: number): Promise<FactionPrompt[]> {
    return this.promptRepo.findByFactionId(factionId, true);
  }

  async createFactionPrompt(data: FactionPromptCreateInput): Promise<FactionPrompt> {
    return this.promptRepo.create(data);
  }

  async updateFactionPrompt(promptId: number, data: FactionPromptUpdateInput): Promise<FactionPrompt> {
    return this.promptRepo.update(promptId, data);
  }

  // ===========================================================================
  // People & Meetings
  // ===========================================================================

  async getFactionPeople(factionId: number, trainerId?: number): Promise<(FactionPerson | FactionPersonWithMeetingStatus)[]> {
    const people = await this.personRepo.findByFactionId(factionId);

    if (!trainerId) {return people;}

    const result: FactionPersonWithMeetingStatus[] = [];
    for (const person of people) {
      const hasMet = await this.meetingRepo.hasMet(trainerId, person.id);
      const canMeet = await this.meetingRepo.canMeet(trainerId, person.id);
      result.push({
        ...person,
        hasMet: !!hasMet,
        canMeet,
        metAt: hasMet?.metAt ?? null,
      });
    }
    return result;
  }

  async getPersonById(personId: number, trainerId?: number): Promise<PersonWithTeam | null> {
    const person = await this.personRepo.findById(personId);
    if (!person) {return null;}

    const team = await this.personRepo.getPersonTeam(personId);
    const result: PersonWithTeam = { ...person, team };

    if (trainerId) {
      const hasMet = await this.meetingRepo.hasMet(trainerId, personId);
      const canMeet = await this.meetingRepo.canMeet(trainerId, personId);
      result.hasMet = !!hasMet;
      result.canMeet = canMeet;
      result.metAt = hasMet?.metAt ?? null;
    }

    return result;
  }

  async meetPerson(personId: number, trainerId: number, submissionId: number): Promise<MeetPersonResult> {
    // Check if trainer can meet this person
    const canMeet = await this.meetingRepo.canMeet(trainerId, personId);
    if (!canMeet) {
      throw new Error('You do not meet the standing requirements to meet this person');
    }

    // Check if trainer has already met this person
    const hasMet = await this.meetingRepo.hasMet(trainerId, personId);
    if (hasMet) {
      throw new Error('You have already met this person');
    }

    // Check if submission is available
    const availableSubmissions = await this.meetingRepo.getAvailableSubmissionsForMeeting(trainerId);
    const isAvailable = availableSubmissions.some(s => s.id === submissionId);
    if (!isAvailable) {
      throw new Error('This submission has already been used or does not belong to you');
    }

    // Create the meeting
    const meetingInput: FactionPersonMeetingCreateInput = {
      trainerId,
      personId,
      submissionId,
    };
    const meeting = await this.meetingRepo.create(meetingInput);

    // Get person info for standing reward
    const person = await this.personRepo.findById(personId);
    if (!person) {
      throw new Error('Person not found after meeting creation');
    }

    // Apply standing reward
    if (person.standingReward) {
      await this.updateStanding(trainerId, person.factionId, person.standingReward);
    }

    return {
      meeting: {
        id: meeting.id,
        trainerId: meeting.trainerId,
        personId: meeting.personId,
        submissionId: meeting.submissionId,
        metAt: meeting.metAt,
      },
      standingReward: person.standingReward,
      person,
    };
  }

  async getTrainerMetPeople(trainerId: number, factionId: number): Promise<unknown[]> {
    return this.meetingRepo.getTrainerMetPeople(trainerId, factionId);
  }

  // ===========================================================================
  // Admin: Faction Management
  // ===========================================================================

  async updateFaction(id: number, data: FactionUpdateInput): Promise<FactionRow> {
    return this.factionRepo.update(id, data);
  }

  async bulkUpdateFactionProperty(property: string, updates: { id: number; value: string | null }[]): Promise<FactionRow[]> {
    return this.factionRepo.bulkUpdateProperty(property, updates);
  }

  // Admin: Titles
  async createTitle(factionId: number, data: { titleName: string; standingRequirement: number; isPositive: boolean }): Promise<FactionTitleRow> {
    return this.factionRepo.createTitle(factionId, data);
  }

  async updateTitleAdmin(titleId: number, data: { titleName?: string; standingRequirement?: number; isPositive?: boolean }): Promise<FactionTitleRow> {
    return this.factionRepo.updateTitle(titleId, data);
  }

  async deleteTitle(titleId: number): Promise<boolean> {
    return this.factionRepo.deleteTitle(titleId);
  }

  // Admin: Relationships
  async getRelationshipsAdmin(factionId: number): Promise<FactionRelationshipRow[]> {
    return this.factionRepo.getAllRelationships(factionId);
  }

  async createRelationship(data: { factionId: number; relatedFactionId: number; relationshipType: string; standingModifier: number }): Promise<FactionRelationshipRow> {
    return this.factionRepo.createRelationship(data);
  }

  async updateRelationship(relationshipId: number, data: { relatedFactionId?: number; relationshipType?: string; standingModifier?: number }): Promise<FactionRelationshipRow> {
    return this.factionRepo.updateRelationship(relationshipId, data);
  }

  async deleteRelationship(relationshipId: number): Promise<boolean> {
    return this.factionRepo.deleteRelationship(relationshipId);
  }

  // Admin: Store Items
  async getAllStoreItemsAdmin(factionId: number): Promise<FactionStoreItemRow[]> {
    return this.factionRepo.getAllStoreItemsAdmin(factionId);
  }

  async createStoreItem(data: { factionId: number; itemName: string; price: number; standingRequirement?: number; isActive?: boolean; itemCategory?: string | null; titleId?: number | null }): Promise<FactionStoreItemRow> {
    return this.factionRepo.createStoreItem(data);
  }

  async updateStoreItem(itemId: number, data: { itemName?: string; price?: number; standingRequirement?: number; isActive?: boolean; itemCategory?: string | null; titleId?: number | null }): Promise<FactionStoreItemRow> {
    return this.factionRepo.updateStoreItem(itemId, data);
  }

  async deleteStoreItem(itemId: number): Promise<boolean> {
    return this.factionRepo.deleteStoreItem(itemId);
  }

  // Admin: Prompts
  async getAllPromptsAdmin(): Promise<import('../repositories/faction-prompt.repository').FactionPromptWithDetails[]> {
    return this.promptRepo.findAllWithFactions(false);
  }

  async getFactionPromptsAdmin(factionId: number): Promise<FactionPrompt[]> {
    return this.promptRepo.findByFactionId(factionId, false);
  }

  async deleteFactionPrompt(promptId: number): Promise<boolean> {
    return this.promptRepo.delete(promptId);
  }

  // ===========================================================================
  // Store Purchase
  // ===========================================================================

  async purchaseFromFactionStore(factionId: number, trainerId: number, itemId: number, quantity: number): Promise<{
    item: FactionStoreItemRow;
    totalCost: number;
  }> {
    const items = await this.factionRepo.getStoreItems(factionId);
    const item = items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in faction store');
    }

    // Check standing requirement (title-based or legacy)
    const standing = await this.factionRepo.getTrainerStanding(trainerId, factionId);
    const currentStanding = Math.abs(standing?.standing ?? 0);

    if (item.title_id) {
      const titles = await this.factionRepo.getTitles(factionId);
      const requiredTitle = titles.find(t => t.id === item.title_id);
      if (requiredTitle && currentStanding < requiredTitle.standing_requirement) {
        throw new Error(`Requires title "${requiredTitle.name}" to purchase this item`);
      }
    } else if (currentStanding < item.standing_requirement) {
      throw new Error('Insufficient standing to purchase this item');
    }

    const totalCost = item.price * quantity;

    // Check trainer currency
    const trainerResult = await db.query<{ currency: number }>(
      'SELECT currency FROM trainers WHERE id = $1',
      [trainerId]
    );
    const trainer = trainerResult.rows[0];
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    if (trainer.currency < totalCost) {
      throw new Error('Insufficient currency');
    }

    // Deduct currency
    await db.query(
      'UPDATE trainers SET currency = currency - $1 WHERE id = $2',
      [totalCost, trainerId]
    );

    // Add items to inventory
    const category = item.item_category ?? 'general';
    for (let i = 0; i < quantity; i++) {
      await db.query(
        `INSERT INTO trainer_inventory (trainer_id, item_name, category, quantity)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (trainer_id, item_name) DO UPDATE SET quantity = trainer_inventory.quantity + 1`,
        [trainerId, item.item_name, category]
      );
    }

    return { item, totalCost };
  }

  // ===========================================================================
  // Admin People Management
  // ===========================================================================

  async getAllFactionPeopleAdmin(factionId?: number): Promise<(FactionPerson | FactionPersonWithDetails)[]> {
    if (factionId) {
      return this.personRepo.findByFactionId(factionId);
    }

    const result = await db.query<{
      id: number; faction_id: number; name: string; alias: string | null;
      standing_requirement: number; blurb: string | null; short_bio: string | null;
      long_bio: string | null; role: string | null; available_assistance: string | null;
      images: string | object | null; standing_reward: number;
      created_at: Date; updated_at: Date;
      faction_name: string | null; faction_color: string | null;
    }>(
      `SELECT fp.*, f.name as faction_name, f.color as faction_color
       FROM faction_people fp
       JOIN factions f ON fp.faction_id = f.id
       ORDER BY f.name, fp.standing_requirement ASC, fp.name ASC`
    );

    return result.rows.map(row => {
      let images: Record<string, string> = {};
      if (row.images) {
        if (typeof row.images === 'object') {
          images = row.images as Record<string, string>;
        } else {
          try { images = JSON.parse(row.images); } catch { /* empty */ }
        }
      }
      return {
        id: row.id,
        factionId: row.faction_id,
        name: row.name,
        alias: row.alias,
        standingRequirement: row.standing_requirement,
        blurb: row.blurb,
        shortBio: row.short_bio,
        longBio: row.long_bio,
        role: row.role,
        availableAssistance: row.available_assistance,
        images,
        standingReward: row.standing_reward,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        factionName: row.faction_name,
        factionColor: row.faction_color,
      };
    });
  }

  async createFactionPerson(data: {
    factionId: number;
    name: string;
    alias?: string | null;
    standingRequirement?: number;
    blurb?: string | null;
    shortBio?: string | null;
    longBio?: string | null;
    role?: string | null;
    availableAssistance?: string | null;
    images?: Record<string, string>;
    standingReward?: number;
  }): Promise<FactionPerson> {
    return this.personRepo.create(data);
  }

  async updateFactionPerson(personId: number, data: {
    factionId?: number;
    name?: string;
    alias?: string | null;
    standingRequirement?: number;
    blurb?: string | null;
    shortBio?: string | null;
    longBio?: string | null;
    role?: string | null;
    availableAssistance?: string | null;
    images?: Record<string, string>;
    standingReward?: number;
  }): Promise<FactionPerson> {
    return this.personRepo.update(personId, data);
  }

  async deleteFactionPerson(personId: number): Promise<boolean> {
    return this.personRepo.delete(personId);
  }

  async getPersonTeamAdmin(personId: number): Promise<FactionPersonMonster[]> {
    return this.personRepo.getPersonTeam(personId);
  }

  async addMonsterToTeam(personId: number, data: {
    name: string;
    species?: string[];
    types?: string[];
    attribute?: string | null;
    image?: string | null;
    position?: number;
  }): Promise<FactionPersonMonster> {
    return this.personRepo.addMonsterToTeam({ personId, ...data });
  }

  async updateMonster(monsterId: number, data: {
    name?: string;
    species?: string[];
    types?: string[];
    attribute?: string | null;
    image?: string | null;
    position?: number;
  }): Promise<FactionPersonMonster> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      values.push(data.name);
      updates.push(`name = $${values.length}`);
    }
    if (data.species !== undefined) {
      values.push(JSON.stringify(data.species));
      updates.push(`species = $${values.length}`);
    }
    if (data.types !== undefined) {
      values.push(JSON.stringify(data.types));
      updates.push(`types = $${values.length}`);
    }
    if (data.attribute !== undefined) {
      values.push(data.attribute);
      updates.push(`attribute = $${values.length}`);
    }
    if (data.image !== undefined) {
      values.push(data.image);
      updates.push(`image = $${values.length}`);
    }
    if (data.position !== undefined) {
      values.push(data.position);
      updates.push(`position = $${values.length}`);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(monsterId);
    await db.query(
      `UPDATE faction_person_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const result = await db.query<{
      id: number; person_id: number; name: string;
      species: string | object | null; types: string | object | null;
      attribute: string | null; image: string | null; position: number; created_at: Date;
    }>(
      'SELECT * FROM faction_person_monsters WHERE id = $1',
      [monsterId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Monster not found after update');
    }

    const parseJson = <T>(val: string | object | null, def: T): T => {
      if (!val) {return def;}
      if (typeof val === 'object') {return val as T;}
      try { return JSON.parse(val); } catch { return def; }
    };

    return {
      id: row.id,
      personId: row.person_id,
      name: row.name,
      species: parseJson(row.species, []),
      types: parseJson(row.types, []),
      attribute: row.attribute,
      image: row.image,
      position: row.position,
      createdAt: row.created_at,
    };
  }

  async deleteMonster(monsterId: number): Promise<boolean> {
    return this.personRepo.removeMonsterFromTeam(monsterId);
  }
}
