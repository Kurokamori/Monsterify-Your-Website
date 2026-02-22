import api from './api';

export interface MonthlyItem {
  name: string;
  category: string;
  quantity: number;
}

export interface CronJobEntry {
  running: boolean;
  scheduled: boolean;
}

export type CronJobStatus = Record<string, CronJobEntry>;

export interface DistributionResult {
  success: boolean;
  message: string;
  results?: {
    totalTrainers: number;
    successCount: number;
    failCount: number;
    errors: Array<{ trainerId: number; error: string }>;
  };
  error?: string;
}

const monthlyDistributionService = {
  getCronStatus: async (): Promise<CronJobStatus> => {
    const response = await api.get('/schedule/admin/status');
    return response.data.data;
  },

  getMonthlyItems: async (): Promise<MonthlyItem[]> => {
    const response = await api.get('/schedule/admin/monthly/items-config');
    return response.data.data;
  },

  updateMonthlyItems: async (items: MonthlyItem[]): Promise<MonthlyItem[]> => {
    const response = await api.put('/schedule/admin/monthly/items-config', { items });
    return response.data.data;
  },

  triggerDistribution: async (): Promise<DistributionResult> => {
    const response = await api.post('/schedule/admin/monthly/items', { force: true });
    return response.data;
  },

  getDistributionRuns: async (limit = 20): Promise<DistributionRun[]> => {
    const response = await api.get('/schedule/admin/distribution-runs', { params: { limit } });
    return response.data.data;
  },
};

export interface DistributionRun {
  id: number;
  triggerType: 'automatic' | 'manual';
  success: boolean;
  totalTrainers: number;
  successCount: number;
  failCount: number;
  errorMessage: string | null;
  ranAt: string;
}

export default monthlyDistributionService;
