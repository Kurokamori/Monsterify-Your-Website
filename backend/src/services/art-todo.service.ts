import {
  ArtTodoRepository,
  ArtTodoListWithCounts,
  ArtTodoListWithItems,
  ArtTodoList,
  ArtTodoItem,
  ArtTodoItemWithDetails,
  ArtTodoReferenceWithDetails,
  ArtTodoReferenceType,
  TrainerRepository,
  MonsterRepository,
  TrainerWithStats,
  MonsterWithTrainer,
} from '../repositories';

export type TrainerSummary = {
  id: number;
  name: string;
  mainRef: string | null;
  species1: string | null;
  type1: string | null;
};

export type MonsterSummary = {
  id: number;
  name: string;
  imgLink: string | null;
  species1: string | null;
  type1: string | null;
  trainerId: number | null;
};

export class ArtTodoService {
  private artTodoRepository: ArtTodoRepository;
  private trainerRepository: TrainerRepository;
  private monsterRepository: MonsterRepository;

  constructor(
    artTodoRepository?: ArtTodoRepository,
    trainerRepository?: TrainerRepository,
    monsterRepository?: MonsterRepository,
  ) {
    this.artTodoRepository = artTodoRepository ?? new ArtTodoRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();
  }

  // List Methods
  async getLists(userId: number): Promise<ArtTodoListWithCounts[]> {
    return this.artTodoRepository.findByUserIdWithCounts(userId);
  }

  async getListById(id: number, userId: number): Promise<ArtTodoListWithItems | null> {
    return this.artTodoRepository.findByIdWithItems(id, userId);
  }

  async createList(userId: number, title: string, description?: string): Promise<ArtTodoList> {
    return this.artTodoRepository.create({
      userId,
      title,
      description: description ?? null,
    });
  }

  async updateList(id: number, userId: number, title: string, description?: string): Promise<ArtTodoList | null> {
    const list = await this.artTodoRepository.findByIdWithOwner(id, userId);
    if (!list) { return null; }

    return this.artTodoRepository.update(id, {
      title,
      description: description ?? null,
    });
  }

  async deleteList(id: number, userId: number): Promise<boolean> {
    const list = await this.artTodoRepository.findByIdWithOwner(id, userId);
    if (!list) { return false; }

    return this.artTodoRepository.delete(id);
  }

  async getPersonalItems(userId: number, limit: number): Promise<ArtTodoItem[]> {
    return this.artTodoRepository.getRecentItemsByUser(userId, limit);
  }

  // Item Methods
  async getItems(listId: number, userId: number): Promise<ArtTodoItemWithDetails[]> {
    return this.artTodoRepository.getItemsWithReferences(listId, userId);
  }

  async createItem(
    listId: number,
    userId: number,
    data: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      isPersistent?: boolean;
      stepsTotal?: number;
      references?: Array<{ referenceType: ArtTodoReferenceType; referenceId: number }>;
    }
  ): Promise<ArtTodoItemWithDetails | null> {
    const item = await this.artTodoRepository.createItem(
      {
        listId,
        title: data.title,
        description: data.description ?? null,
        status: (data.status as 'pending' | 'in_progress' | 'completed') ?? 'pending',
        priority: (data.priority as 'low' | 'medium' | 'high') ?? 'medium',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        isPersistent: data.isPersistent ?? false,
        stepsTotal: data.stepsTotal ?? 0,
        stepsCompleted: 0,
      },
      userId
    );

    // Add references if provided
    if (data.references && data.references.length > 0) {
      await this.artTodoRepository.bulkCreateReferences(item.id, data.references, userId);
    }

    // Get item with references
    const items = await this.artTodoRepository.getItemsWithReferences(listId, userId);
    return items.find(i => i.id === item.id) ?? null;
  }

  async updateItem(
    id: number,
    userId: number,
    data: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      isPersistent?: boolean;
      stepsTotal?: number;
      stepsCompleted?: number;
    }
  ): Promise<ArtTodoItem | null> {
    try {
      return await this.artTodoRepository.updateItem(id, userId, {
        title: data.title,
        description: data.description ?? null,
        status: (data.status as 'pending' | 'in_progress' | 'completed') ?? 'pending',
        priority: (data.priority as 'low' | 'medium' | 'high') ?? 'medium',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        isPersistent: data.isPersistent ?? false,
        stepsTotal: data.stepsTotal ?? 0,
        stepsCompleted: data.stepsCompleted ?? 0,
      });
    } catch {
      return null;
    }
  }

  async moveItem(id: number, newListId: number, userId: number): Promise<ArtTodoItem | null> {
    try {
      return await this.artTodoRepository.moveItemToList(id, newListId, userId);
    } catch {
      return null;
    }
  }

  async deleteItem(id: number, userId: number): Promise<boolean> {
    return this.artTodoRepository.deleteItem(id, userId);
  }

  // Reference Methods
  async getItemReferences(itemId: number, userId: number): Promise<ArtTodoReferenceWithDetails[]> {
    return this.artTodoRepository.getReferencesByItem(itemId, userId);
  }

  async getReferenceMatrix(itemId: number, userId: number): Promise<{
    trainers: ArtTodoReferenceWithDetails[];
    monsters: ArtTodoReferenceWithDetails[];
  }> {
    return this.artTodoRepository.getReferenceMatrix(itemId, userId);
  }

  async addReference(
    itemId: number,
    userId: number,
    referenceType: ArtTodoReferenceType,
    referenceId: number
  ): Promise<ArtTodoReferenceWithDetails> {
    return this.artTodoRepository.createReference(
      { itemId, referenceType, referenceId },
      userId
    );
  }

  async removeReference(id: number, userId: number): Promise<boolean> {
    return this.artTodoRepository.deleteReference(id, userId);
  }

  // Helper methods for reference selection
  async getUserTrainers(discordId: string): Promise<TrainerSummary[]> {
    const trainers: TrainerWithStats[] = await this.trainerRepository.findByUserId(discordId);
    return trainers.map(t => ({
      id: t.id,
      name: t.name,
      mainRef: t.main_ref ?? null,
      species1: null,
      type1: null,
    }));
  }

  async getUserMonsters(discordId: string): Promise<MonsterSummary[]> {
    const monsters: MonsterWithTrainer[] = await this.monsterRepository.findByUserId(discordId);
    return monsters.map(m => ({
      id: m.id,
      name: m.name,
      imgLink: m.img_link ?? null,
      species1: m.species1 ?? null,
      type1: m.type1 ?? null,
      trainerId: m.trainer_id ?? null,
    }));
  }
}
