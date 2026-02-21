import {
  LocationActivitySessionRepository,
  LocationPromptRepository,
  LocationFlavorRepository,
} from '../repositories/location-activity.repository';
import type {
  ActivitySessionRow,
  ActivitySession,
  ActivityReward,
  LocationPromptRow,
  LocationPromptCreateInput,
  LocationPromptUpdateInput,
  LocationFlavorRow,
  LocationFlavorCreateInput,
  LocationFlavorUpdateInput,
} from '../utils/types/location-activity.types';
import type { LocationId, ActivityId } from '../utils/constants/location-constants';

// ============================================================================
// Helpers
// ============================================================================

function parseSessionRow(row: ActivitySessionRow): ActivitySession {
  let rewards: ActivityReward[] = [];
  if (row.rewards) {
    try {
      rewards = typeof row.rewards === 'string' ? JSON.parse(row.rewards) : row.rewards;
    } catch {
      rewards = [];
    }
  }

  return {
    id: row.id,
    session_id: row.session_id,
    player_id: row.player_id,
    location: row.location as LocationId,
    activity: row.activity as ActivityId,
    prompt_id: row.prompt_id,
    difficulty: row.difficulty,
    status: row.completed ? 'completed' : 'active',
    rewards,
    created_at: row.created_at,
    completed_at: row.completed_at,
  };
}

// ============================================================================
// Admin Service
// ============================================================================

export class LocationActivityAdminService {
  private sessionRepo: LocationActivitySessionRepository;
  private promptRepo: LocationPromptRepository;
  private flavorRepo: LocationFlavorRepository;

  constructor() {
    this.sessionRepo = new LocationActivitySessionRepository();
    this.promptRepo = new LocationPromptRepository();
    this.flavorRepo = new LocationFlavorRepository();
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  async getAllSessions(page = 1, limit = 50): Promise<{
    data: ActivitySession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const { rows, total } = await this.sessionRepo.findAll(limit, offset);
    return {
      data: rows.map(parseSessionRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSessionById(sessionId: string): Promise<ActivitySession> {
    const row = await this.sessionRepo.findBySessionId(sessionId);
    if (!row) {
      throw new Error('Session not found');
    }
    return parseSessionRow(row);
  }

  async forceCompleteSession(sessionId: string): Promise<ActivitySession> {
    const row = await this.sessionRepo.findBySessionId(sessionId);
    if (!row) {
      throw new Error('Session not found');
    }
    if (row.completed) {
      throw new Error('Session already completed');
    }

    const updated = await this.sessionRepo.markCompleted(sessionId);
    return parseSessionRow(updated);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const row = await this.sessionRepo.findBySessionId(sessionId);
    if (!row) {
      throw new Error('Session not found');
    }
    return this.sessionRepo.deleteSession(sessionId);
  }

  // ==========================================================================
  // Prompt CRUD
  // ==========================================================================

  async getPrompts(page = 1, limit = 50): Promise<{
    data: LocationPromptRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const { rows, total } = await this.promptRepo.findAll(limit, offset);
    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPromptById(id: number): Promise<LocationPromptRow> {
    const prompt = await this.promptRepo.findById(id);
    if (!prompt) {
      throw new Error('Prompt not found');
    }
    return prompt;
  }

  async createPrompt(input: LocationPromptCreateInput): Promise<LocationPromptRow> {
    return this.promptRepo.create(input);
  }

  async updatePrompt(id: number, input: LocationPromptUpdateInput): Promise<LocationPromptRow> {
    const existing = await this.promptRepo.findById(id);
    if (!existing) {
      throw new Error('Prompt not found');
    }
    return this.promptRepo.update(id, input);
  }

  async deletePrompt(id: number): Promise<boolean> {
    const existing = await this.promptRepo.findById(id);
    if (!existing) {
      throw new Error('Prompt not found');
    }
    return this.promptRepo.delete(id);
  }

  // ==========================================================================
  // Flavor CRUD
  // ==========================================================================

  async getFlavors(page = 1, limit = 50): Promise<{
    data: LocationFlavorRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const { rows, total } = await this.flavorRepo.findAll(limit, offset);
    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createFlavor(input: LocationFlavorCreateInput): Promise<LocationFlavorRow> {
    return this.flavorRepo.create(input);
  }

  async updateFlavor(id: number, input: LocationFlavorUpdateInput): Promise<LocationFlavorRow> {
    const existing = await this.flavorRepo.findById(id);
    if (!existing) {
      throw new Error('Flavor not found');
    }
    return this.flavorRepo.update(id, input);
  }

  async deleteFlavor(id: number): Promise<boolean> {
    const existing = await this.flavorRepo.findById(id);
    if (!existing) {
      throw new Error('Flavor not found');
    }
    return this.flavorRepo.delete(id);
  }
}
