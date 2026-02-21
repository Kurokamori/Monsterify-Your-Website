import api from './api';

// --- Types ---

export type ItemStatus = 'pending' | 'in_progress' | 'completed';
export type ItemPriority = 'low' | 'medium' | 'high';
export type ReferenceType = 'trainer' | 'monster';

export interface ArtTodoList {
  id: number;
  title: string;
  description?: string;
  item_count: number;
  completed_count: number;
  items?: ArtTodoItem[];
}

export interface ArtTodoItem {
  id: number;
  list_id: number;
  title: string;
  description?: string;
  status: ItemStatus;
  priority: ItemPriority;
  due_date?: string;
  is_persistent: boolean;
  steps_total: number;
  steps_completed: number;
  references?: ArtTodoReference[];
}

export interface ArtTodoReference {
  id: number;
  reference_type: ReferenceType;
  reference_id: number;
  reference_name: string;
  reference_image?: string;
}

export interface ArtTodoTrainer {
  id: number;
  name: string;
  species1?: string;
  type1?: string;
  main_ref?: string;
}

export interface ArtTodoMonster {
  id: number;
  name: string;
  species1: string;
  type1?: string;
  trainer_id: number;
  img_link?: string;
}

export interface ListFormData {
  title: string;
  description: string;
}

export interface ItemFormData {
  title: string;
  description: string;
  status: ItemStatus;
  priority: ItemPriority;
  due_date: string;
  is_persistent: boolean;
  steps_total: number;
}

// --- Service ---

const artTodoService = {
  // Lists
  getLists: async (): Promise<ArtTodoList[]> => {
    const response = await api.get('/art-todo/lists');
    return response.data.data || [];
  },

  getList: async (id: number): Promise<ArtTodoList> => {
    const response = await api.get(`/art-todo/lists/${id}`);
    return response.data.data;
  },

  createList: async (data: ListFormData) => {
    const response = await api.post('/art-todo/lists', data);
    return response.data;
  },

  updateList: async (id: number, data: ListFormData) => {
    const response = await api.put(`/art-todo/lists/${id}`, data);
    return response.data;
  },

  deleteList: async (id: number) => {
    const response = await api.delete(`/art-todo/lists/${id}`);
    return response.data;
  },

  // Items
  createItem: async (listId: number, data: ItemFormData) => {
    const response = await api.post(`/art-todo/lists/${listId}/items`, data);
    return response.data;
  },

  updateItem: async (itemId: number, data: ItemFormData | Partial<ArtTodoItem>) => {
    const response = await api.put(`/art-todo/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (itemId: number) => {
    const response = await api.delete(`/art-todo/items/${itemId}`);
    return response.data;
  },

  // References
  getItemReferences: async (itemId: number): Promise<ArtTodoReference[]> => {
    const response = await api.get(`/art-todo/items/${itemId}/references`);
    return response.data.data || [];
  },

  addReference: async (itemId: number, referenceType: ReferenceType, referenceId: number) => {
    const response = await api.post(`/art-todo/items/${itemId}/references`, {
      reference_type: referenceType,
      reference_id: referenceId,
    });
    return response.data;
  },

  removeReference: async (referenceId: number) => {
    const response = await api.delete(`/art-todo/references/${referenceId}`);
    return response.data;
  },

  // Reference data
  getTrainers: async (): Promise<ArtTodoTrainer[]> => {
    const response = await api.get('/art-todo/trainers');
    return response.data.data || [];
  },

  getMonsters: async (): Promise<ArtTodoMonster[]> => {
    const response = await api.get('/art-todo/monsters');
    return response.data.data || [];
  },
};

export default artTodoService;
