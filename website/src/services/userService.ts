import api from './api';

// --- Types ---

export interface User {
  id: number;
  username: string;
  display_name?: string;
  discord_id?: string;
  is_admin?: boolean;
  created_at?: string;
  last_login?: string;
  [key: string]: unknown;
}

export interface CreateUserData {
  username: string;
  password: string;
  display_name?: string;
  discord_id?: string;
  is_admin?: boolean;
}

export interface UpdateUserData {
  username?: string;
  password?: string;
  display_name?: string;
  discord_id?: string;
  is_admin?: boolean;
}

export interface AdminUserListParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminUser {
  id: number;
  username: string;
  display_name: string;
  discord_id: string | null;
  is_admin: boolean;
  theme: string | null;
  created_at: string;
  monster_roller_settings: Record<string, boolean> | null;
  content_settings: Record<string, boolean>;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- Service ---

const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data.users;
  },

  // Get user by ID
  getUserById: async (id: number | string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.user;
  },

  // Create a new user
  createUser: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data.user;
  },

  // Update a user
  updateUser: async (id: number | string, userData: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.user;
  },

  // Delete a user
  deleteUser: async (id: number | string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Get paginated admin user list
  getAdminUsers: async (params: AdminUserListParams): Promise<AdminUserListResponse> => {
    const response = await api.get('/users/admin/list', { params });
    return { users: response.data.users, pagination: response.data.pagination };
  },
};

export default userService;
