import api from './api';

// --- Types ---

export type SubmissionType = 'art' | 'writing' | 'prompt' | 'reference';
export type SubmissionContentType = 'general' | 'prompt' | 'story' | string;
export type ArtQuality = 'sketch' | 'lineart' | 'flat' | 'rendered' | string;
export type CollaboratorRole = 'editor' | 'viewer';
export type RecipientType = 'trainer' | 'monster';

export interface Submission {
  id: number;
  type?: SubmissionType;
  title?: string;
  description?: string;
  status?: string;
  content_type?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
  username?: string;
  display_name?: string;
  trainer_id?: number;
  tags?: string[];
  [key: string]: unknown;
}

export interface SubmissionListParams {
  type?: string;
  submissionType?: string;
  status?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface ArtSubmissionData {
  title: string;
  description?: string;
  contentType?: string;
  quality?: ArtQuality;
  backgroundType?: string;
  backgrounds?: { type: string; [key: string]: unknown }[];
  uniquelyDifficult?: boolean;
  useStaticRewards?: boolean;
  isGift?: boolean;
  isMature?: boolean;
  contentRating?: unknown;
  trainers?: ArtTrainerEntry[];
  trainerId?: number | string;
  trainerAppearances?: unknown[];
  monsters?: ArtMonsterEntry[];
  npcs?: ArtNpcEntry[];
  tags?: string[];
  imageFile?: File;
  imageUrl?: string;
  additionalImages?: (File | string)[];
}

export interface ArtTrainerEntry {
  trainerId: number | string;
  appearances?: unknown[];
  isOwned?: boolean;
  isGift?: boolean;
  [key: string]: unknown;
}

export interface ArtMonsterEntry {
  monsterId?: number | string;
  species?: string;
  [key: string]: unknown;
}

export interface ArtNpcEntry {
  name?: string;
  [key: string]: unknown;
}

export interface WritingSubmissionData {
  title: string;
  description?: string;
  contentType?: string;
  wordCount?: number;
  trainers?: ArtTrainerEntry[];
  trainerId?: number | string;
  isGift?: boolean;
  isMature?: boolean;
  contentRating?: unknown;
  monsters?: ArtMonsterEntry[];
  npcs?: ArtNpcEntry[];
  tags?: string[];
  isBook?: boolean | string;
  parentId?: number | string;
  chapterNumber?: number | string;
  content?: string;
  contentFile?: File;
  contentUrl?: string;
  coverImage?: File;
  coverImageUrl?: string;
}

export interface BookData {
  title: string;
  description?: string;
  coverImage?: File;
  coverImageUrl?: string;
  tags?: string[];
}

export interface PromptCombinedData {
  submissionType: 'art' | 'writing';
  promptId: number | string;
  trainerId: number | string;
  artData?: ArtSubmissionData;
  writingData?: WritingSubmissionData;
}

export interface RewardAllocation {
  submissionId?: number;
  recipientType?: RecipientType;
  recipientId?: number;
  amount?: number;
  itemId?: number;
}

export interface ClaimRewardsOptions {
  levelTarget: RecipientType;
  targetMonsterId: string | number | null;
  claimItems: boolean;
  promptLevelAllocation?: {
    type: RecipientType;
    targetId: number | string;
  };
  monsterClaims?: unknown[];
}

export interface Collaborator {
  user_id: string | number;
  username?: string;
  display_name?: string;
  role: CollaboratorRole;
  added_at?: string;
}

export interface PromptListParams {
  type?: string;
  category?: string;
  difficulty?: string;
  available_only?: string;
  trainer_id?: string | number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GalleryParams {
  contentType?: string;
  tags?: string;
  page?: number;
  limit?: number;
  isExternal?: boolean;
}

export interface LibraryParams {
  contentType?: string;
  tags?: string;
  page?: number;
  limit?: number;
  booksOnly?: boolean;
  excludeChapters?: boolean;
  isExternal?: boolean;
}

// --- External submission types ---

export type ExternalCharacterComplexity = 'simple' | 'average' | 'complex' | 'extravagant';
export type ExternalAppearance = 'bust' | 'halfBody' | 'fullBody';

export interface ExternalCharacter {
  name?: string;
  appearance: ExternalAppearance;
  complexity: ExternalCharacterComplexity;
}

export interface ExternalArtSubmissionData {
  title: string;
  description?: string;
  quality: string;
  backgrounds?: { type: string }[];
  characters?: ExternalCharacter[];
  tags?: string[];
  isMature?: boolean;
  contentRating?: unknown;
  imageFile?: File;
  imageUrl?: string;
  externalLink?: string;
}

export interface ExternalWritingSubmissionData {
  title: string;
  description?: string;
  content?: string;
  externalLink?: string;
  wordCount: number;
  tags?: string[];
  isMature?: boolean;
  contentRating?: unknown;
  coverImage?: File;
  coverImageUrl?: string;
  isBook?: boolean;
  parentId?: number;
  chapterNumber?: number;
}

export interface ExternalRewardResult {
  totalLevels: number;
  totalCoins: number;
  gardenPoints: number;
  missionProgress: number;
  bossDamage: number;
}

// --- Admin types ---

export interface AdminSubmissionListParams {
  search?: string;
  status?: string;
  submissionType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminSubmission {
  id: number;
  title: string;
  description: string | null;
  content_type: string;
  submission_type: string;
  is_book: number;
  status: string;
  submission_date: string;
  created_at: string;
  user_id: number;
  user_username: string | null;
  user_display_name: string | null;
  trainer_name: string | null;
  image_url: string | null;
  is_mature: number;
  tags: string[] | null;
}

// --- FormData helpers ---

function appendJsonArray(formData: FormData, key: string, arr: unknown[] | undefined): void {
  formData.append(key, JSON.stringify(Array.isArray(arr) ? arr : []));
}

function appendIfPresent(formData: FormData, key: string, value: unknown): void {
  if (value !== undefined && value !== null) {
    formData.append(key, String(value));
  }
}

// --- Service ---

const submissionService = {
  // ── Query & CRUD ──────────────────────────────────────────────────

  // Get all submissions
  getAllSubmissions: async (params: SubmissionListParams = {}) => {
    const response = await api.get('/submissions', { params });
    return response.data;
  },

  // Get submission by ID
  getSubmissionById: async (id: number | string) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },

  // Alias for consumers using the shorter name
  getSubmission: async (id: number | string) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },

  // Get current user's submissions
  getUserSubmissions: async (params: SubmissionListParams & { userId?: string } = {}) => {
    const response = await api.get('/submissions/user', { params });
    return response.data;
  },

  // Get authenticated user's own submissions with pagination
  getMySubmissions: async (params: SubmissionListParams = {}) => {
    const response = await api.get('/submissions/user/my-submissions', { params });
    return response.data;
  },

  // Get trainer's submissions
  getTrainerSubmissions: async (trainerId: number | string, params: SubmissionListParams = {}) => {
    const response = await api.get(`/trainers/${trainerId}/submissions`, { params });
    return response.data;
  },

  // Update a submission
  updateSubmission: async (submissionId: number | string, data: Partial<Submission>) => {
    const response = await api.put(`/submissions/${submissionId}`, data);
    return response.data;
  },

  // Delete a submission permanently
  deleteSubmission: async (submissionId: number | string) => {
    const response = await api.delete(`/submissions/${submissionId}`);
    return response.data;
  },

  // ── Admin ────────────────────────────────────────────────────────

  // Get admin submission list with filters/pagination
  getAdminSubmissions: async (params: AdminSubmissionListParams = {}) => {
    const response = await api.get('/submissions/admin/list', { params });
    return response.data;
  },

  // ── Art submissions ───────────────────────────────────────────────

  // Submit art (builds FormData from typed input)
  submitArt: async (input: ArtSubmissionData | Record<string, unknown>) => {
    const d = input as ArtSubmissionData;
    const formData = new FormData();

    formData.append('title', d.title || '');
    appendIfPresent(formData, 'description', d.description ?? '');
    appendIfPresent(formData, 'contentType', d.contentType ?? 'general');
    appendIfPresent(formData, 'quality', d.quality ?? 'rendered');
    appendIfPresent(formData, 'backgroundType', d.backgroundType ?? 'none');

    if (d.backgrounds?.length) {
      formData.append('backgrounds', JSON.stringify(d.backgrounds));
    }

    appendIfPresent(formData, 'uniquelyDifficult', d.uniquelyDifficult ?? false);
    appendIfPresent(formData, 'useStaticRewards', d.useStaticRewards ?? false);

    // Trainers - support both new array format and legacy single trainer
    if (d.trainers?.length) {
      formData.append('trainers', JSON.stringify(d.trainers));
    } else if (d.trainerId) {
      const trainers = [{ trainerId: d.trainerId, appearances: d.trainerAppearances || [] }];
      formData.append('trainers', JSON.stringify(trainers));
    } else {
      formData.append('trainers', JSON.stringify([]));
    }

    appendJsonArray(formData, 'monsters', d.monsters);
    appendJsonArray(formData, 'npcs', d.npcs);

    appendIfPresent(formData, 'isGift', d.isGift);

    if (d.tags?.length) {
      formData.append('tags', JSON.stringify(d.tags));
    }

    // Image - file or URL
    if (d.imageFile) {
      formData.append('image', d.imageFile);
    } else if (d.imageUrl) {
      formData.append('imageUrl', d.imageUrl);
    }

    // Additional images
    if (d.additionalImages?.length) {
      d.additionalImages.forEach((image: File | string, index: number) => {
        if (image instanceof File) {
          formData.append(`additionalImage${index}`, image);
        } else if (typeof image === 'string') {
          formData.append(`additionalImageUrl${index}`, image);
        }
      });
    }

    const response = await api.post('/submissions/art', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Calculate art submission rewards
  calculateArtRewards: async (artData: Record<string, unknown>) => {
    const processedData = JSON.parse(JSON.stringify(artData));
    processedData.trainers = Array.isArray(processedData.trainers) ? processedData.trainers : [];
    processedData.monsters = Array.isArray(processedData.monsters) ? processedData.monsters : [];
    processedData.backgrounds = Array.isArray(processedData.backgrounds)
      ? processedData.backgrounds
      : [{ type: 'none' }];
    processedData.quality = processedData.quality || 'rendered';
    processedData.backgroundType = processedData.backgroundType || 'none';
    processedData.uniquelyDifficult = !!processedData.uniquelyDifficult;
    processedData.isGift = !!processedData.isGift;
    processedData.useStaticRewards = !!processedData.useStaticRewards;

    const response = await api.post('/submissions/art/calculate', processedData);
    const data = response.data.rewards;
    // Backend wraps as { rewards: { rewards: { ...actual } } } — unwrap if nested
    return data?.rewards ?? data;
  },

  // Get art gallery
  getArtGallery: async (params: GalleryParams = {}) => {
    const response = await api.get('submissions/gallery', { params });
    return response.data;
  },

  // ── Writing submissions ───────────────────────────────────────────

  // Submit writing (builds FormData from typed input)
  submitWriting: async (input: WritingSubmissionData | Record<string, unknown>) => {
    const d = input as WritingSubmissionData;
    const formData = new FormData();

    formData.append('title', d.title || '');
    appendIfPresent(formData, 'description', d.description ?? '');
    formData.append('type', 'writing');
    appendIfPresent(formData, 'contentType', d.contentType ?? 'story');
    appendIfPresent(formData, 'wordCount', d.wordCount ?? 0);

    // Trainers - support both new array format and legacy single trainer
    if (d.trainers?.length) {
      formData.append('trainers', JSON.stringify(d.trainers));
    } else if (d.trainerId) {
      const trainers = [{
        trainerId: d.trainerId,
        isOwned: true,
        isGift: d.isGift || false,
      }];
      formData.append('trainers', JSON.stringify(trainers));
    } else {
      formData.append('trainers', JSON.stringify([]));
    }

    appendJsonArray(formData, 'monsters', d.monsters);
    appendJsonArray(formData, 'npcs', d.npcs);

    if (d.tags?.length) {
      formData.append('tags', JSON.stringify(d.tags));
    }

    // Book/chapter data
    appendIfPresent(formData, 'isBook', d.isBook);
    appendIfPresent(formData, 'parentId', d.parentId);
    appendIfPresent(formData, 'chapterNumber', d.chapterNumber);

    // Content - inline text, file, or URL
    if (d.content) {
      formData.append('content', d.content);
    } else if (d.contentFile) {
      formData.append('contentFile', d.contentFile);
    } else if (d.contentUrl) {
      formData.append('contentUrl', d.contentUrl);
    }

    // Cover image
    if (d.coverImage) {
      formData.append('coverImage', d.coverImage);
    } else if (d.coverImageUrl) {
      formData.append('coverImageUrl', d.coverImageUrl);
    }

    const response = await api.post('/submissions/writing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Calculate writing submission rewards
  calculateWritingRewards: async (writingData: Record<string, unknown>) => {
    const requestData: Record<string, unknown> = {
      wordCount: writingData.wordCount,
      trainers: writingData.trainers || [],
      monsters: writingData.monsters || [],
    };

    // Legacy support
    if (writingData.trainerId) {
      requestData.trainerId = writingData.trainerId;
      requestData.isGift = writingData.isGift || false;
    }

    const response = await api.post('/submissions/writing/calculate', requestData);
    const data = response.data.rewards;
    // Backend wraps as { rewards: { rewards: { ...actual } } } — unwrap if nested
    return data?.rewards ?? data;
  },

  // Get writing library
  getWritingLibrary: async (params: LibraryParams = {}) => {
    const response = await api.get('submissions/library', { params });
    return response.data;
  },

  // ── Books & chapters ──────────────────────────────────────────────

  // Get user's books (for chapter assignment)
  getUserBooks: async () => {
    const response = await api.get('/submissions/user/books');
    return response.data;
  },

  // Get chapters for a book
  getBookChapters: async (bookId: number | string) => {
    const response = await api.get(`/submissions/books/${bookId}/chapters`);
    return response.data;
  },

  // Update chapter order in a book
  updateChapterOrder: async (bookId: number | string, chapterOrder: number[]) => {
    const response = await api.put(`/submissions/books/${bookId}/chapters/order`, {
      chapterOrder,
    });
    return response.data;
  },

  // Create a new book
  createBook: async (input: BookData | Record<string, unknown>) => {
    const d = input as BookData;
    const formData = new FormData();
    formData.append('title', d.title || '');
    appendIfPresent(formData, 'description', d.description ?? '');
    formData.append('isBook', '1');

    if (d.coverImage) {
      formData.append('coverImage', d.coverImage);
    } else if (d.coverImageUrl) {
      formData.append('coverImageUrl', d.coverImageUrl);
    }

    if (d.tags?.length) {
      formData.append('tags', JSON.stringify(d.tags));
    }

    const response = await api.post('/submissions/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ── Book collaborators ────────────────────────────────────────────

  // Get collaborators for a book
  getBookCollaborators: async (bookId: number | string) => {
    const response = await api.get(`/submissions/books/${bookId}/collaborators`);
    return response.data;
  },

  // Search users to add as collaborators
  searchCollaboratorUsers: async (bookId: number | string, searchTerm: string) => {
    const response = await api.get(`/submissions/books/${bookId}/collaborators/search`, {
      params: { search: searchTerm },
    });
    return response.data;
  },

  // Add a collaborator to a book
  addBookCollaborator: async (
    bookId: number | string,
    userId: string | number,
    role: CollaboratorRole = 'editor',
  ) => {
    const response = await api.post(`/submissions/books/${bookId}/collaborators`, {
      userId,
      role,
    });
    return response.data;
  },

  // Remove a collaborator from a book
  removeBookCollaborator: async (bookId: number | string, userId: string | number) => {
    const response = await api.delete(`/submissions/books/${bookId}/collaborators/${userId}`);
    return response.data;
  },

  // Update a collaborator's role
  updateCollaboratorRole: async (
    bookId: number | string,
    userId: string | number,
    role: CollaboratorRole,
  ) => {
    const response = await api.put(`/submissions/books/${bookId}/collaborators/${userId}`, {
      role,
    });
    return response.data;
  },

  // Get books the current user collaborates on
  getUserCollaborations: async () => {
    const response = await api.get('/submissions/user/collaborations');
    return response.data;
  },

  // ── Prompts ───────────────────────────────────────────────────────

  // Get available prompts for a trainer
  getAvailablePrompts: async (trainerId: number | string, category?: string) => {
    const response = await api.get('/submissions/prompt/available', {
      params: { trainerId, category },
    });
    return response.data;
  },

  // Get prompts with filters and pagination
  getPrompts: async (params: PromptListParams) => {
    const { search, ...queryParams } = params;
    const url = search
      ? `/prompts/search/${encodeURIComponent(search)}`
      : '/prompts';
    const response = await api.get(url, { params: queryParams });
    return response.data;
  },

  // Get prompt categories
  getPromptCategories: async () => {
    const response = await api.get('/prompts/meta/categories');
    return response.data;
  },

  // Check prompt availability for a trainer
  checkPromptAvailability: async (promptId: string | number, trainerId: string | number) => {
    const response = await api.get(`/prompts/${promptId}/availability/${trainerId}`);
    return response.data;
  },

  // Calculate prompt submission rewards
  calculatePromptRewards: async (promptData: Record<string, unknown>) => {
    const response = await api.post('/submissions/prompt/calculate', promptData);
    return response.data.rewards;
  },

  // Submit prompt (FormData for file uploads)
  submitPrompt: async (formData: FormData) => {
    const response = await api.post('/submissions/prompt/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Submit to a prompt by ID (FormData for file uploads)
  submitToPrompt: async (promptId: string | number, formData: FormData) => {
    const response = await api.post(`/prompts/${promptId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Submit combined art/writing + prompt submission
  submitPromptCombined: async (input: PromptCombinedData | Record<string, unknown>) => {
    const data = input as PromptCombinedData;
    const formData = new FormData();

    formData.append('submissionType', data.submissionType);
    appendIfPresent(formData, 'promptId', data.promptId);
    appendIfPresent(formData, 'trainerId', data.trainerId);

    if (data.submissionType === 'art' && data.artData) {
      const art = data.artData as ArtSubmissionData;
      appendIfPresent(formData, 'title', art.title ?? '');
      appendIfPresent(formData, 'description', art.description ?? '');
      appendIfPresent(formData, 'contentType', art.contentType ?? 'prompt');
      appendIfPresent(formData, 'quality', art.quality ?? 'rendered');
      appendIfPresent(formData, 'uniquelyDifficult', art.uniquelyDifficult ?? false);
      appendIfPresent(formData, 'isMature', art.isMature ?? false);

      if (art.backgrounds?.length) {
        formData.append('backgrounds', JSON.stringify(art.backgrounds));
      }
      if (art.contentRating) {
        formData.append('contentRating', JSON.stringify(art.contentRating));
      }

      appendJsonArray(formData, 'trainers', art.trainers);
      appendJsonArray(formData, 'monsters', art.monsters);
      appendJsonArray(formData, 'npcs', art.npcs);

      if (art.tags?.length) {
        formData.append('tags', JSON.stringify(art.tags));
      }

      if (art.imageFile) {
        formData.append('image', art.imageFile);
      } else if (art.imageUrl) {
        formData.append('imageUrl', art.imageUrl);
      }

      if (art.additionalImages?.length) {
        art.additionalImages.forEach((file: File | string, index: number) => {
          if (file instanceof File) {
            formData.append(`additionalImage_${index}`, file);
          }
        });
      }
    } else if (data.submissionType === 'writing' && data.writingData) {
      const writing = data.writingData as WritingSubmissionData;
      appendIfPresent(formData, 'title', writing.title ?? '');
      appendIfPresent(formData, 'description', writing.description ?? '');
      appendIfPresent(formData, 'contentType', writing.contentType ?? 'prompt');
      appendIfPresent(formData, 'wordCount', writing.wordCount ?? 0);
      appendIfPresent(formData, 'isMature', writing.isMature ?? false);

      if (writing.contentRating) {
        formData.append('contentRating', JSON.stringify(writing.contentRating));
      }

      appendJsonArray(formData, 'trainers', writing.trainers);
      appendJsonArray(formData, 'monsters', writing.monsters);
      appendJsonArray(formData, 'npcs', writing.npcs);

      if (writing.tags?.length) {
        formData.append('tags', JSON.stringify(writing.tags));
      }

      if (writing.content) {
        formData.append('content', writing.content);
      } else if (writing.contentFile) {
        formData.append('contentFile', writing.contentFile);
      } else if (writing.contentUrl) {
        formData.append('contentUrl', writing.contentUrl);
      }

      if (writing.coverImage) {
        formData.append('coverImage', writing.coverImage);
      } else if (writing.coverImageUrl) {
        formData.append('coverImageUrl', writing.coverImageUrl);
      }
    }

    const response = await api.post('/submissions/prompt/combined', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ── References ────────────────────────────────────────────────────

  // Calculate reference submission rewards
  calculateReferenceRewards: async (referenceData: Record<string, unknown>) => {
    const response = await api.post('/submissions/reference/calculate', referenceData);
    return response.data.rewards;
  },

  // Submit reference (FormData for file uploads)
  submitReference: async (formData: FormData) => {
    const response = await api.post('/submissions/reference/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ── Rewards & claiming ────────────────────────────────────────────

  // Get submission rewards
  getSubmissionRewards: async (submissionId: number | string) => {
    const response = await api.get(`/submissions/${submissionId}/rewards`);
    return response.data.rewards;
  },

  // Get gift items for a submission
  getGiftItems: async (submissionId: number | string) => {
    const response = await api.get(`/submissions/${submissionId}/gift-items`);
    return response.data.giftItems;
  },

  // Allocate gift levels
  allocateGiftLevels: async (
    submissionId: number | string,
    recipientType: RecipientType,
    recipientId: number | string,
    levels: number,
  ) => {
    const response = await api.post('/submissions/gift-levels/allocate', {
      submissionId,
      recipientType,
      recipientId,
      levels,
    });
    return response.data.allocation;
  },

  // Allocate gift coins
  allocateGiftCoins: async (
    submissionId: number | string,
    trainerId: number | string,
    coins: number,
  ) => {
    const response = await api.post('/submissions/gift-coins/allocate', {
      submissionId,
      trainerId,
      coins,
    });
    return response.data.allocation;
  },

  // Allocate capped levels
  allocateCappedLevels: async (
    submissionId: number | string,
    recipientType: RecipientType,
    recipientId: number | string,
    levels: number,
  ) => {
    const response = await api.post('/submissions/capped-levels/allocate', {
      submissionId,
      recipientType,
      recipientId,
      levels,
    });
    return response.data.allocation;
  },

  // Allocate gift item
  allocateGiftItem: async (itemId: number | string, trainerId: number | string) => {
    const response = await api.post('/submissions/gift-items/allocate', {
      itemId,
      trainerId,
    });
    return response.data.allocation;
  },

  // Claim prompt-specific rewards
  claimPromptRewards: async (submissionId: number | string, allocations: ClaimRewardsOptions) => {
    const response = await api.post(`/submissions/prompt/${submissionId}/claim-rewards`, allocations);
    return response.data;
  },

  // Claim a monster from a submission
  claimMonster: async (
    submissionId: number | string,
    trainerId: number | string,
    monsterIndex: number,
    monsterName: string,
  ) => {
    const response = await api.post(`/submissions/${submissionId}/claim-monster`, {
      trainerId,
      monsterIndex,
      monsterName,
    });
    return response.data;
  },

  // Alias used by prompt components
  claimSubmissionMonster: async (
    submissionId: number | string,
    trainerId: number | string,
    monsterIndex: number,
    monsterName: string,
  ) => {
    const response = await api.post(`/submissions/${submissionId}/claim-monster`, {
      trainerId,
      monsterIndex,
      monsterName,
    });
    return response.data;
  },

  // ── External submissions ─────────────────────────────────────────

  // Calculate external art rewards
  calculateExternalArtRewards: async (data: { quality: string; backgrounds?: unknown[]; characters?: unknown[] }) => {
    const response = await api.post('/submissions/external/art/calculate', data);
    return response.data.rewards as ExternalRewardResult;
  },

  // Calculate external writing rewards
  calculateExternalWritingRewards: async (data: { wordCount: number }) => {
    const response = await api.post('/submissions/external/writing/calculate', data);
    return response.data.rewards as ExternalRewardResult;
  },

  // Submit external art
  submitExternalArt: async (input: ExternalArtSubmissionData) => {
    const formData = new FormData();
    formData.append('title', input.title);
    appendIfPresent(formData, 'description', input.description);
    formData.append('quality', input.quality);

    if (input.backgrounds?.length) {
      formData.append('backgrounds', JSON.stringify(input.backgrounds));
    }
    if (input.characters?.length) {
      formData.append('characters', JSON.stringify(input.characters));
    }
    if (input.tags?.length) {
      formData.append('tags', JSON.stringify(input.tags));
    }

    appendIfPresent(formData, 'isMature', input.isMature);
    if (input.contentRating) {
      formData.append('contentRating', JSON.stringify(input.contentRating));
    }
    appendIfPresent(formData, 'externalLink', input.externalLink);

    if (input.imageFile) {
      formData.append('image', input.imageFile);
    } else if (input.imageUrl) {
      formData.append('imageUrl', input.imageUrl);
    }

    const response = await api.post('/submissions/external/art', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Submit external writing
  submitExternalWriting: async (input: ExternalWritingSubmissionData) => {
    const formData = new FormData();
    formData.append('title', input.title);
    appendIfPresent(formData, 'description', input.description);
    formData.append('wordCount', String(input.wordCount));

    if (input.content) {
      formData.append('content', input.content);
    }
    appendIfPresent(formData, 'externalLink', input.externalLink);

    if (input.tags?.length) {
      formData.append('tags', JSON.stringify(input.tags));
    }

    appendIfPresent(formData, 'isMature', input.isMature);
    if (input.contentRating) {
      formData.append('contentRating', JSON.stringify(input.contentRating));
    }

    appendIfPresent(formData, 'isBook', input.isBook);
    appendIfPresent(formData, 'parentId', input.parentId);
    appendIfPresent(formData, 'chapterNumber', input.chapterNumber);

    if (input.coverImage) {
      formData.append('coverImage', input.coverImage);
    } else if (input.coverImageUrl) {
      formData.append('coverImageUrl', input.coverImageUrl);
    }

    const response = await api.post('/submissions/external/writing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Allocate external levels to a trainer or monster
  allocateExternalLevels: async (
    submissionId: number | string,
    recipientType: RecipientType,
    recipientId: number | string,
    levels: number,
  ) => {
    const response = await api.post('/submissions/external/allocate', {
      submissionId,
      recipientType,
      recipientId,
      levels,
    });
    return response.data;
  },

  // ── Rerolls ───────────────────────────────────────────────────────

  // Reroll items for a submission
  rerollItems: async (submissionId: number | string, trainerId: number | string) => {
    const response = await api.post(`/submissions/${submissionId}/reroll-items`, {
      trainerId,
    });
    return response.data;
  },

  // Reroll monsters for a submission
  rerollMonsters: async (submissionId: number | string, trainerId: number | string) => {
    const response = await api.post(`/submissions/${submissionId}/reroll-monsters`, {
      trainerId,
    });
    return response.data;
  },

  // Reroll a specific monster reward
  rerollMonster: async (
    trainerId: string | number,
    monsterId: string | number,
    originalParams: unknown,
  ) => {
    const response = await api.post('/prompts/reroll-monster', {
      trainer_id: trainerId,
      monster_id: monsterId,
      original_params: originalParams,
    });
    return response.data;
  },

  // ── Social ────────────────────────────────────────────────────────

  // Get submission tags
  getSubmissionTags: async () => {
    const response = await api.get('/submissions/tags');
    return response.data;
  },

  // Add comment to submission
  addComment: async (submissionId: number | string, comment: string) => {
    const response = await api.post(`/submissions/${submissionId}/comments`, { comment });
    return response.data;
  },

  // Like submission
  likeSubmission: async (submissionId: number | string) => {
    const response = await api.post(`/submissions/${submissionId}/like`);
    return response.data;
  },

  // Unlike submission
  unlikeSubmission: async (submissionId: number | string) => {
    const response = await api.delete(`/submissions/${submissionId}/like`);
    return response.data;
  },

  // Get related submissions
  getRelatedSubmissions: async (
    submissionId: number | string,
    userId: number | string,
    contentType: string,
  ) => {
    const response = await api.get(`/users/${userId}/submissions/related`, {
      params: { excludeId: submissionId, contentType },
    });
    return response.data;
  },

  // ── Trainer items ─────────────────────────────────────────────────

  // Get available berries for a trainer
  getAvailableBerries: async (trainerId: number | string) => {
    const response = await api.get(`/trainers/${trainerId}/berries`);
    return response.data;
  },
};

export default submissionService;
