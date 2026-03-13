import {
  AdminConnectRepository,
  AdminConnectItem,
  AdminConnectItemWithSubs,
  AdminConnectItemCreateInput,
  AdminConnectItemUpdateInput,
  AdminConnectSubItem,
  AdminConnectSubItemCreateInput,
  AdminConnectSubItemUpdateInput,
} from '../repositories/admin-connect.repository';

export class AdminConnectService {
  private repo: AdminConnectRepository;

  constructor(repo?: AdminConnectRepository) {
    this.repo = repo ?? new AdminConnectRepository();
  }

  // ── Public (any authenticated user) ───────────────────────────

  async getAllItems(): Promise<AdminConnectItemWithSubs[]> {
    return this.repo.findAllWithSubs();
  }

  async getItemById(id: number): Promise<AdminConnectItemWithSubs | null> {
    return this.repo.findItemWithSubs(id);
  }

  // ── Admin-only ────────────────────────────────────────────────

  async createItem(input: AdminConnectItemCreateInput): Promise<AdminConnectItem> {
    return this.repo.createItem(input);
  }

  async updateItem(id: number, input: AdminConnectItemUpdateInput): Promise<AdminConnectItem | null> {
    return this.repo.updateItem(id, input);
  }

  async resolveItem(id: number): Promise<AdminConnectItem | null> {
    return this.repo.updateItem(id, { status: 'resolved', resolvedAt: new Date() });
  }

  async reopenItem(id: number): Promise<AdminConnectItem | null> {
    return this.repo.updateItem(id, { status: 'open', resolvedAt: null });
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.repo.deleteItem(id);
  }

  async reorderItems(orderedIds: number[]): Promise<void> {
    await this.repo.updatePriorities(orderedIds);
  }

  // ── Sub-items (admin-only) ────────────────────────────────────

  async createSubItem(input: AdminConnectSubItemCreateInput): Promise<AdminConnectSubItem> {
    return this.repo.createSubItem(input);
  }

  async updateSubItem(id: number, input: AdminConnectSubItemUpdateInput): Promise<AdminConnectSubItem | null> {
    return this.repo.updateSubItem(id, input);
  }

  async deleteSubItem(id: number): Promise<boolean> {
    return this.repo.deleteSubItem(id);
  }
}
