// Categories map type (matches GuideCategoryTabs + GuideSidebar expectations)
export interface GuideSidebarStructure {
  directories?: {
    path: string;
    name: string;
    children?: GuideSidebarStructure;
  }[];
  files?: {
    path: string;
    name: string;
  }[];
}

export interface CategoryInfo {
  name: string;
  structure?: GuideSidebarStructure;
  [key: string]: unknown;
}

export type CategoriesMap = Record<string, CategoryInfo>;

// Shared filter category type (used by lore + npcs)
export interface FilterCategory {
  id: string;
  name: string;
}

// Utility: capitalize first letter
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Utility: get icon for a guide category key
export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    guides: 'fas fa-book',
    lore: 'fas fa-scroll',
    factions: 'fas fa-flag',
    npcs: 'fas fa-user',
    'interactive-map': 'fas fa-globe-americas',
  };
  return icons[category] || 'fas fa-book';
};

// Utility: get description for a guide category key
export const getCategoryDescription = (category: string): string => {
  const descriptions: Record<string, string> = {
    guides: 'Learn how to play the game with comprehensive guides and tutorials.',
    lore: 'Explore the rich history and mythology of the game world.',
    factions: 'Discover the different factions and their unique philosophies and goals.',
    npcs: 'Meet the important non-player characters that inhabit the game world.',
    'interactive-map': 'Navigate through the world with our interactive map system.',
  };
  return descriptions[category] || 'Explore guides and documentation.';
};

// Utility: get icon for NPC reward type
export const getRewardIcon = (type: string): string => {
  const icons: Record<string, string> = {
    item: 'fas fa-box',
    monster: 'fas fa-dragon',
    badge: 'fas fa-medal',
    training: 'fas fa-graduation-cap',
    permit: 'fas fa-scroll',
    access: 'fas fa-key',
    technique: 'fas fa-book',
  };
  return icons[type] || 'fas fa-gift';
};

// Categories that have standalone pages instead of guide markdown views
const STANDALONE_PAGES: Record<string, string> = {
  factions: '/guides/factions',
  lore: '/guides/lore',
  npcs: '/guides/npcs',
};

// Utility: get link for a category (standalone page or guide category)
export const getCategoryLink = (key: string): string =>
  STANDALONE_PAGES[key] || `/guides/${key}`;
