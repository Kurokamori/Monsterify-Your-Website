import api from './api';

export interface PublicUserProfile {
  id: number;
  username: string;
  display_name: string;
  profile_image_url: string | null;
  profile_trainer_id: number | null;
  profile_trainer_image: string | null;
  bio: string | null;
  created_at: string | null;
  trainer_count: number;
  monster_count: number;
}

export interface ProfileSubmission {
  id: number;
  title: string;
  description?: string;
  submission_type: string;
  submission_date: string;
  is_book?: boolean;
  is_mature?: boolean;
  image_url?: string;
  cover_image_url?: string;
  chapter_count?: number;
  word_count?: number;
  display_name?: string;
  username?: string;
}

export interface ProfileTrainer {
  id: number;
  name: string;
  nickname?: string;
  level: number;
  faction?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  type6?: string;
  main_ref?: string;
  icon?: string;
  monster_count: number;
  player_display_name?: string;
  player_username?: string;
}

export interface ProfileSubmissionsResponse {
  success: boolean;
  submissions: ProfileSubmission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const userProfileService = {
  getPublicProfile: async (userId: number | string): Promise<{ success: boolean; profile: PublicUserProfile }> => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },

  getProfileSubmissions: async (userId: number | string, params: {
    page?: number;
    limit?: number;
    type?: 'art' | 'writing';
    sort?: string;
    showMature?: boolean;
    matureFilters?: string;
  } = {}): Promise<ProfileSubmissionsResponse> => {
    const response = await api.get(`/users/${userId}/profile/submissions`, { params });
    return response.data;
  },

  getProfileTrainers: async (userId: number | string): Promise<{ success: boolean; trainers: ProfileTrainer[] }> => {
    const response = await api.get(`/users/${userId}/profile/trainers`);
    return response.data;
  },

  uploadProfileImage: async (file: File): Promise<{ success: boolean; secure_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'profile-pictures');
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default userProfileService;
