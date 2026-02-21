/**
 * Faction Type Definitions
 * Types for the faction system
 */

import { BaseEntity } from './common.types';
import { FactionNameValue, FactionRelationshipValue } from '../constants/factions';
import { ItemCategoryValue } from '../constants/item-categories';

/**
 * Faction entity (database record)
 */
export interface Faction extends BaseEntity {
  name: FactionNameValue;
  description: string;
  bannerImage: string;
  iconImage: string;
  color: string;
}

/**
 * Faction title (rank within a faction)
 */
export interface FactionTitleRecord extends BaseEntity {
  factionId: number;
  name: string;
  description: string;
  standingRequirement: number;
  isPositive: boolean;
  orderIndex: number;
}

/**
 * Faction relationship (between factions)
 */
export interface FactionRelationshipRecord extends BaseEntity {
  factionId: number;
  relatedFactionId: number;
  relationshipType: FactionRelationshipValue;
  standingModifier: number;
}

/**
 * Trainer standing with a faction
 */
export interface FactionStanding extends BaseEntity {
  trainerId: number;
  factionId: number;
  standing: number;
  currentTitleId: number | null;
}

/**
 * Faction standing with details
 */
export interface FactionStandingWithDetails extends FactionStanding {
  factionName: FactionNameValue;
  currentTitle: string | null;
  nextTitle: string | null;
  standingToNextTitle: number | null;
  factionColor: string;
}

/**
 * Faction store item
 */
export interface FactionStoreItem extends BaseEntity {
  factionId: number;
  itemName: string;
  itemDescription: string;
  itemType: ItemCategoryValue;
  price: number;
  standingRequirement: number;
  stock: number | null; // null = unlimited
  isActive: boolean;
}

/**
 * Faction store with items
 */
export interface FactionStore {
  factionId: number;
  factionName: FactionNameValue;
  items: FactionStoreItem[];
}

/**
 * Faction tribute submission
 */
export interface FactionTribute extends BaseEntity {
  trainerId: number;
  factionId: number;
  tributeType: TributeType;
  amount: number;
  standingGained: number;
  description: string | null;
}

/**
 * Tribute types
 */
export type TributeType = 'currency' | 'item' | 'monster' | 'quest' | 'art';

/**
 * Faction NPC/person
 */
export interface FactionPerson extends BaseEntity {
  factionId: number;
  name: string;
  title: string;
  description: string;
  imgLink: string | null;
  role: FactionPersonRole;
  isImportant: boolean;
}

/**
 * Faction person roles
 */
export type FactionPersonRole = 'leader' | 'officer' | 'merchant' | 'trainer' | 'quest_giver' | 'general';

/**
 * Meeting with a faction person
 */
export interface FactionPersonMeeting extends BaseEntity {
  trainerId: number;
  personId: number;
  meetingType: string;
  notes: string | null;
}

/**
 * Faction prompt/quest
 */
export interface FactionPrompt extends BaseEntity {
  factionId: number;
  title: string;
  description: string;
  requirements: FactionPromptRequirements;
  rewards: FactionPromptRewards;
  minStanding: number;
  maxStanding: number | null;
  isActive: boolean;
  expiresAt: Date | null;
}

/**
 * Faction prompt requirements
 */
export interface FactionPromptRequirements {
  type: 'art' | 'writing' | 'battle' | 'capture' | 'trade' | 'exploration';
  description: string;
  wordCount?: number;
  monsterType?: string;
  monsterLevel?: number;
  location?: string;
}

/**
 * Faction prompt rewards
 */
export interface FactionPromptRewards {
  standing: number;
  currency?: number;
  items?: Array<{
    name: string;
    category: ItemCategoryValue;
    quantity: number;
  }>;
  title?: string;
}

/**
 * Faction submission (for prompts)
 */
export interface FactionSubmission extends BaseEntity {
  trainerId: number;
  promptId: number;
  submissionType: string;
  content: string;
  imageUrls: string[];
  status: SubmissionStatus;
  reviewedBy: number | null;
  reviewNotes: string | null;
  standingAwarded: number;
}

/**
 * Submission status
 */
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

/**
 * Input for updating faction standing
 */
export interface UpdateStandingInput {
  trainerId: number;
  factionId: number;
  amount: number;
  reason: string;
}

/**
 * Standing change result
 */
export interface StandingChangeResult {
  previousStanding: number;
  newStanding: number;
  previousTitle: string | null;
  newTitle: string | null;
  titleChanged: boolean;
  relatedChanges: Array<{
    factionId: number;
    factionName: FactionNameValue;
    change: number;
  }>;
}

/**
 * Purchase from faction store input
 */
export interface FactionPurchaseInput {
  trainerId: number;
  factionId: number;
  itemId: number;
  quantity: number;
}

/**
 * Purchase result
 */
export interface FactionPurchaseResult {
  success: boolean;
  itemName: string;
  quantity: number;
  totalCost: number;
  newBalance: number;
  message?: string;
}

/**
 * Faction summary for trainer
 */
export interface TrainerFactionSummary {
  trainerId: number;
  standings: FactionStandingWithDetails[];
  highestStanding: {
    factionName: FactionNameValue;
    standing: number;
    title: string | null;
  } | null;
  lowestStanding: {
    factionName: FactionNameValue;
    standing: number;
    title: string | null;
  } | null;
  availablePrompts: number;
}

/**
 * Faction leaderboard entry
 */
export interface FactionLeaderboardEntry {
  rank: number;
  trainerId: number;
  trainerName: string;
  standing: number;
  title: string | null;
}

/**
 * Faction query options
 */
export interface FactionQueryOptions {
  trainerId?: number;
  factionId?: number;
  minStanding?: number;
  maxStanding?: number;
  sortBy?: 'standing' | 'name';
  sortOrder?: 'asc' | 'desc';
}
