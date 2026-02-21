import { createContext } from 'react';

export interface MonsterRollerSettings {
  pokemon?: boolean;
  digimon?: boolean;
  yokai?: boolean;
  pals?: boolean;
  nexomon?: boolean;
  fakemon?: boolean;
  finalfantasy?: boolean;
  monsterhunter?: boolean;
}

export interface ContentSettings {
  mature_enabled: boolean;
  gore: boolean;
  nsfw_light: boolean;
  nsfw_heavy: boolean;
  triggering: boolean;
  intense_violence: boolean;
}

export interface User {
  id: number;
  username: string;
  display_name?: string;
  discord_id?: string;
  email?: string;
  is_admin: boolean;
  theme?: string;
  monster_roller_settings?: MonsterRollerSettings;
  content_settings?: ContentSettings;
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  updateMonsterRollerSettings: (settings: MonsterRollerSettings) => Promise<boolean>;
  updateContentSettings: (settings: ContentSettings) => Promise<boolean>;
  updateTheme: (theme: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  refreshToken: () => Promise<string>;
  clearError: () => void;
}

export interface RegisterData {
  username: string;
  password: string;
  display_name?: string;
  discord_id?: string;
  email?: string;
  monster_roller_settings?: MonsterRollerSettings;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
