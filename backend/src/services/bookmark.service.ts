import {
  BookmarkRepository,
  BookmarkCategory,
  BookmarkCategoryWithCounts,
  BookmarkItemWithDetails,
  BookmarkItem,
  BookmarkItemType,
  BookmarkTextNote,
} from '../repositories';

export class BookmarkService {
  private bookmarkRepository: BookmarkRepository;

  constructor(bookmarkRepository?: BookmarkRepository) {
    this.bookmarkRepository = bookmarkRepository ?? new BookmarkRepository();
  }

  // =========================================================================
  // Category Methods
  // =========================================================================

  async getCategories(userId: number): Promise<BookmarkCategoryWithCounts[]> {
    return this.bookmarkRepository.findByUserIdWithCounts(userId);
  }

  async getCategoryById(id: number, userId: number): Promise<BookmarkCategory | null> {
    return this.bookmarkRepository.findByIdWithOwner(id, userId);
  }

  async createCategory(userId: number, title: string, sortOrder?: number): Promise<BookmarkCategory> {
    return this.bookmarkRepository.create({ userId, title, sortOrder });
  }

  async updateCategory(id: number, userId: number, title: string, sortOrder?: number): Promise<BookmarkCategory | null> {
    const category = await this.bookmarkRepository.findByIdWithOwner(id, userId);
    if (!category) { return null; }

    return this.bookmarkRepository.update(id, { title, sortOrder });
  }

  async deleteCategory(id: number, userId: number): Promise<boolean> {
    const category = await this.bookmarkRepository.findByIdWithOwner(id, userId);
    if (!category) { return false; }

    return this.bookmarkRepository.delete(id);
  }

  // =========================================================================
  // Item Methods
  // =========================================================================

  async getCategoryItems(categoryId: number, userId: number): Promise<{
    items: BookmarkItemWithDetails[];
    notes: BookmarkTextNote[];
  }> {
    const [items, notes] = await Promise.all([
      this.bookmarkRepository.getItemsByCategory(categoryId, userId),
      this.bookmarkRepository.getNotesByCategory(categoryId, userId),
    ]);
    return { items, notes };
  }

  async addItem(
    categoryId: number,
    userId: number,
    itemType: BookmarkItemType,
    itemId: number,
    posX?: number,
    posY?: number,
    cardWidth?: number,
  ): Promise<BookmarkItem> {
    return this.bookmarkRepository.createItem(
      { categoryId, itemType, itemId, posX, posY, cardWidth },
      userId,
    );
  }

  async updateItemPosition(id: number, userId: number, posX: number, posY: number, cardWidth?: number, cardHeight?: number | null): Promise<BookmarkItem | null> {
    return this.bookmarkRepository.updateItemPosition(id, userId, posX, posY, cardWidth, cardHeight);
  }

  async bulkUpdatePositions(
    positions: Array<{ id: number; posX: number; posY: number }>,
    userId: number,
  ): Promise<boolean> {
    return this.bookmarkRepository.bulkUpdatePositions(positions, userId);
  }

  async removeItem(id: number, userId: number): Promise<boolean> {
    return this.bookmarkRepository.deleteItem(id, userId);
  }

  // =========================================================================
  // Note Methods
  // =========================================================================

  async addNote(
    categoryId: number,
    userId: number,
    content?: string,
    posX?: number,
    posY?: number,
    fontSize?: number,
    width?: number,
    color?: string,
  ): Promise<BookmarkTextNote> {
    return this.bookmarkRepository.createNote(
      { categoryId, content, posX, posY, fontSize, width, color },
      userId,
    );
  }

  async updateNote(
    id: number,
    userId: number,
    data: { content?: string; posX?: number; posY?: number; fontSize?: number; width?: number; color?: string },
  ): Promise<BookmarkTextNote | null> {
    return this.bookmarkRepository.updateNote(id, userId, data);
  }

  async removeNote(id: number, userId: number): Promise<boolean> {
    return this.bookmarkRepository.deleteNote(id, userId);
  }
}
