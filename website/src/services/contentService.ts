import api from './api';

// --- Types ---

export interface DirectoryFile {
  name: string;
  path: string;
  url: string;
}

export interface DirectoryNode {
  name: string;
  path: string;
  url: string;
  children: DirectoryStructure | null;
}

export interface DirectoryStructure {
  directories: DirectoryNode[];
  files: DirectoryFile[];
}

export interface CategoryInfo {
  name: string;
  path: string;
  structure: DirectoryStructure | null;
}

export type CategoriesResponse = Record<string, CategoryInfo>;

export interface ContentResponse {
  success: boolean;
  content: string;
  html: string;
  metadata: Record<string, string>;
  path: string;
}

export interface MutationResponse {
  success: boolean;
  message: string;
  path?: string;
}

export interface SaveContentData {
  title?: string;
  content: string;
}

export interface SortOrderItem {
  id: number;
  title: string;
  path: string;
  isOverview: boolean;
  isDirectory: boolean;
  sortOrder: number;
}

export interface SortOrderResponse {
  success: boolean;
  items: SortOrderItem[];
}

// --- Service ---

const contentService = {
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await api.get('/content/categories');
    return response.data;
  },

  getContent: async (category: string, path = ''): Promise<ContentResponse> => {
    const response = await api.get(`/content/${category}/${path}`);
    return response.data;
  },

  saveContent: async (category: string, path: string, data: SaveContentData): Promise<MutationResponse> => {
    const response = await api.post(`/content/${category}/${path}`, data);
    return response.data;
  },

  deleteContent: async (category: string, path: string): Promise<MutationResponse> => {
    const response = await api.delete(`/content/${category}/${path}`);
    return response.data;
  },

  createDirectory: async (category: string, path: string, name: string): Promise<MutationResponse> => {
    const response = await api.post(`/content/${category}/directory/${path}`, { name });
    return response.data;
  },

  getSortOrder: async (category: string, parentPath = ''): Promise<SortOrderResponse> => {
    const url = parentPath
      ? `/content/${category}/sort-order/${parentPath}`
      : `/content/${category}/sort-order`;
    const response = await api.get(url);
    return response.data;
  },

  updateSortOrder: async (items: { id: number; sortOrder: number }[]): Promise<MutationResponse> => {
    const response = await api.put('/content/sort-order', { items });
    return response.data;
  },
};

export default contentService;
