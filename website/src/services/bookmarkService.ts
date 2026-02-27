import api from './api';

// --- Types ---

export interface BookmarkCategory {
  id: number;
  userId: number;
  title: string;
  sortOrder: number;
  itemCount: number;
  createdAt: string;
}

export interface BookmarkItem {
  id: number;
  categoryId: number;
  itemType: 'trainer' | 'monster';
  itemId: number;
  posX: number;
  posY: number;
  cardWidth: number;
  cardHeight: number | null;
  itemName: string | null;
  itemImage: string | null;
  itemSpecies1: string | null;
  itemSpecies2: string | null;
  itemSpecies3: string | null;
  itemType1: string | null;
  itemType2: string | null;
  itemType3: string | null;
  itemType4: string | null;
  itemType5: string | null;
  itemType6: string | null;
  itemAttribute: string | null;
  createdAt: string;
}

export interface BookmarkTextNote {
  id: number;
  categoryId: number;
  content: string;
  posX: number;
  posY: number;
  fontSize: number;
  width: number;
  color: string;
  createdAt: string;
}

export interface CategoryItemsResponse {
  items: BookmarkItem[];
  notes: BookmarkTextNote[];
}

// --- Service ---

const bookmarkService = {
  // Categories
  getCategories: async (): Promise<BookmarkCategory[]> => {
    const response = await api.get('/bookmarks/categories');
    return response.data.data || [];
  },

  getCategory: async (id: number): Promise<BookmarkCategory> => {
    const response = await api.get(`/bookmarks/categories/${id}`);
    return response.data.data;
  },

  createCategory: async (title: string, sortOrder?: number) => {
    const response = await api.post('/bookmarks/categories', { title, sort_order: sortOrder });
    return response.data;
  },

  updateCategory: async (id: number, title: string, sortOrder?: number) => {
    const response = await api.put(`/bookmarks/categories/${id}`, { title, sort_order: sortOrder });
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await api.delete(`/bookmarks/categories/${id}`);
    return response.data;
  },

  // Items
  getCategoryItems: async (categoryId: number): Promise<CategoryItemsResponse> => {
    const response = await api.get(`/bookmarks/categories/${categoryId}/items`);
    return response.data.data || { items: [], notes: [] };
  },

  addItem: async (categoryId: number, itemType: 'trainer' | 'monster', itemId: number, posX?: number, posY?: number, cardWidth?: number) => {
    const response = await api.post(`/bookmarks/categories/${categoryId}/items`, {
      item_type: itemType,
      item_id: itemId,
      pos_x: posX,
      pos_y: posY,
      card_width: cardWidth,
    });
    return response.data;
  },

  updateItemPosition: async (itemId: number, posX: number, posY: number, cardWidth?: number, cardHeight?: number | null) => {
    const body: Record<string, number | null> = { pos_x: posX, pos_y: posY };
    if (cardWidth !== undefined) { body.card_width = cardWidth; }
    if (cardHeight !== undefined) { body.card_height = cardHeight; }
    const response = await api.put(`/bookmarks/items/${itemId}/position`, body);
    return response.data;
  },

  bulkUpdatePositions: async (positions: Array<{ id: number; pos_x: number; pos_y: number }>) => {
    const response = await api.put('/bookmarks/items/positions', { positions });
    return response.data;
  },

  removeItem: async (itemId: number) => {
    const response = await api.delete(`/bookmarks/items/${itemId}`);
    return response.data;
  },

  // Notes
  addNote: async (categoryId: number, data?: { content?: string; pos_x?: number; pos_y?: number; font_size?: number; width?: number; color?: string }) => {
    const response = await api.post(`/bookmarks/categories/${categoryId}/notes`, data || {});
    return response.data;
  },

  updateNote: async (noteId: number, data: { content?: string; pos_x?: number; pos_y?: number; font_size?: number; width?: number; color?: string }) => {
    const response = await api.put(`/bookmarks/notes/${noteId}`, data);
    return response.data;
  },

  removeNote: async (noteId: number) => {
    const response = await api.delete(`/bookmarks/notes/${noteId}`);
    return response.data;
  },
};

export default bookmarkService;
