import api from './api';

export interface Item {
  id: number;
  name: string;
  category?: string;
  type?: string;
  rarity?: string;
  description?: string;
  effect?: string;
  image_url?: string;
  image_path?: string;
  base_price?: number;
}

interface GetItemsParams {
  search?: string;
  category?: string;
  type?: string;
  rarity?: string;
  limit?: number;
  offset?: number;
}

interface ItemsResponse {
  success: boolean;
  data: Item[];
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface AdminItemListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  type?: string;
  rarity?: string;
}

export interface AdminItemListResponse {
  data: Item[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BerryPastryImagesResponse {
  success: boolean;
  berryImages: Record<string, string | null>;
  pastryImages?: Record<string, string | null>;
}

/**
 * Items API service
 */
const itemsService = {
  /**
   * Get all items with pagination and filtering
   */
  getItems: async (params: GetItemsParams = {}): Promise<ItemsResponse> => {
    try {
      const response = await api.get('/items', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  /**
   * Get item by ID
   */
  getItemById: async (id: number): Promise<Item> => {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching item with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all categories
   */
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get('/items/categories');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  /**
   * Get all types
   */
  getTypes: async (): Promise<string[]> => {
    try {
      const response = await api.get('/items/types');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching types:', error);
      return [];
    }
  },

  /**
   * Get all rarities
   */
  getRarities: async (): Promise<string[]> => {
    try {
      const response = await api.get('/items/rarities');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching rarities:', error);
      return [];
    }
  },

  /**
   * Create a new item
   */
  createItem: async (item: Partial<Item>): Promise<Item> => {
    try {
      const response = await api.post('/items', item);
      return response.data.data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  /**
   * Create multiple items
   */
  createBulkItems: async (items: Partial<Item>[]): Promise<{ success: boolean; created: number }> => {
    try {
      const response = await api.post('/items/bulk', { items });
      return response.data;
    } catch (error) {
      console.error('Error creating items in bulk:', error);
      throw error;
    }
  },

  /**
   * Upload an image
   */
  uploadImage: async (image: File): Promise<{ success: boolean; url: string }> => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post('/items/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  /**
   * Upload an image with progress callback (for bulk uploads)
   */
  uploadImageWithProgress: async (
    image: File,
    onProgress: (progress: number) => void,
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('image', image);

    const response = await api.post('/items/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });

    return response.data.data.url;
  },

  /**
   * Update an item
   */
  updateItem: async (id: number, item: Partial<Item>): Promise<Item> => {
    try {
      const response = await api.put(`/items/${id}`, item);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating item with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an item
   */
  deleteItem: async (id: number): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting item with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Batch update item images
   */
  batchUpdateItemImages: async (updates: { id: number; image_url: string }[]): Promise<{ success: boolean; updated: number }> => {
    const response = await api.patch('/items/batch-images', { updates });
    return response.data;
  },

  /**
   * Get paginated admin item list with filtering and sorting
   */
  getAdminItems: async (params: AdminItemListParams = {}): Promise<AdminItemListResponse> => {
    const response = await api.get('/items', { params });
    return { data: response.data.data, pagination: response.data.pagination };
  },

  /**
   * Get all berry items with images
   */
  getBerryItems: async (): Promise<BerryPastryImagesResponse> => {
    try {
      const response = await api.get('/items', {
        params: {
          category: 'berries',
          limit: 1000
        }
      });
      if (response.data.success) {
        const berryImages: Record<string, string | null> = {};
        (response.data.data || []).forEach((item: Item) => {
          berryImages[item.name] = item.image_url || null;
        });
        return { success: true, berryImages };
      }
      return { success: false, berryImages: {} };
    } catch (error) {
      console.error('Error fetching berry items:', error);
      return { success: false, berryImages: {} };
    }
  },

  /**
   * Get all pastry items with images
   */
  getPastryItems: async (): Promise<BerryPastryImagesResponse> => {
    try {
      const response = await api.get('/items', {
        params: {
          category: 'pastries',
          limit: 1000
        }
      });
      if (response.data.success) {
        const pastryImages: Record<string, string | null> = {};
        (response.data.data || []).forEach((item: Item) => {
          pastryImages[item.name] = item.image_url || null;
        });
        return { success: true, berryImages: pastryImages };
      }
      return { success: false, berryImages: {} };
    } catch (error) {
      console.error('Error fetching pastry items:', error);
      return { success: false, berryImages: {} };
    }
  },

  /**
   * Get all berry and pastry items with images in a single call
   */
  rollItems: async (options: { categories?: string[]; quantity: number }): Promise<{ success: boolean; data: Item[] }> => {
    const response = await api.post('/items/roll', options);
    return response.data;
  },

  addItemToTrainer: async (trainerId: number, itemName: string, quantity: number, category: string): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post(`/items/admin/trainers/${trainerId}`, { itemName, quantity, category });
    return response.data;
  },

  getBerryAndPastryImages: async (): Promise<BerryPastryImagesResponse & { pastryImages: Record<string, string | null> }> => {
    try {
      const response = await api.get('/items', { params: { limit: 2000 } });

      const berryImages: Record<string, string | null> = {};
      const pastryImages: Record<string, string | null> = {};

      if (response.data.success) {
        (response.data.data || []).forEach((item: Item) => {
          const name = item.name || '';
          const category = (item.category || '').toLowerCase();
          const hasImage = item.image_url || null;

          // Match berries by category or name pattern
          if (category.includes('berry') || category.includes('berries') ||
              name.toLowerCase().includes('berry')) {
            berryImages[name] = hasImage;
          }
          // Match pastries by category or name pattern
          if (category.includes('pastry') || category.includes('pastries') ||
              name.toLowerCase().includes('pastry')) {
            pastryImages[name] = hasImage;
          }
        });
      }

      return { success: true, berryImages, pastryImages };
    } catch (error) {
      console.error('Error fetching berry and pastry items:', error);
      return { success: false, berryImages: {}, pastryImages: {} };
    }
  }
};

export default itemsService;
