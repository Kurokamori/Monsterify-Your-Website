import api from './api';

// --- Types ---

export interface GuideCategory {
  name: string;
  path: string;
  children?: GuideCategory[];
  [key: string]: unknown;
}

export interface GuideContent {
  title?: string;
  content?: string;
  html?: string;
  markdown?: string;
  [key: string]: unknown;
}

export interface GuideSearchMatch {
  context: string;
  lineNumber: number;
}

export interface GuideSearchResult {
  category: string;
  categoryName: string;
  filePath: string;
  title: string;
  matches: GuideSearchMatch[];
}

export interface GuideDetailData {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  date_published: string;
  image_url: string;
  read_time: string;
  content: string;
}

export interface RelatedGuide {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  date_published?: string;
  image_url: string;
  read_time: string;
}

export interface GuideDetailCategory {
  id: string;
  name: string;
}

// --- Service ---

const guidesService = {
  // Get all guide categories with their structure
  getCategories: async (): Promise<GuideCategory[]> => {
    const response = await api.get('/guides/categories');
    return response.data;
  },

  // Get content for a specific guide
  getGuideContent: async (category: string, path = ''): Promise<GuideContent> => {
    const response = await api.get(`/guides/${category}/${path}`);
    return response.data;
  },

  // Get individual guide detail
  getGuideDetail: async (guideId: string): Promise<GuideDetailData> => {
    const response = await api.get(`/guides/${guideId}`);
    return response.data.guide;
  },

  // Get related guides for a specific guide
  getRelatedGuides: async (guideId: string): Promise<RelatedGuide[]> => {
    const response = await api.get(`/guides/related/${guideId}`);
    return response.data.guides || [];
  },

  // Get flat categories list (for guide detail page)
  getDetailCategories: async (): Promise<GuideDetailCategory[]> => {
    const response = await api.get('/guides/categories');
    return response.data.categories || [];
  },

  // Search across guide content
  searchGuides: async (query: string, category?: string): Promise<GuideSearchResult[]> => {
    const params: Record<string, string> = { q: query };
    if (category) params.category = category;
    const response = await api.get('/guides/search', { params });
    return response.data.results || [];
  },
};

export default guidesService;
