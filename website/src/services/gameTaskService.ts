import api from './api';

// --- Types ---

export interface TaskReward {
  type: string;
  name: string;
  quantity: number;
}

export interface GameTask {
  id: number;
  title: string;
  description: string;
  progress: number;
  total: number;
  completed: boolean;
  rewards: TaskReward[];
}

export interface CompleteTaskResponse {
  rewards: TaskReward[];
}

// --- Service ---

const gameTaskService = {
  getDailyTasks: async (): Promise<GameTask[]> => {
    const response = await api.get('/tasks/daily');
    return response.data.tasks || [];
  },

  getWeeklyTasks: async (): Promise<GameTask[]> => {
    const response = await api.get('/tasks/weekly');
    return response.data.tasks || [];
  },

  completeTask: async (taskId: number, trainerId: number): Promise<CompleteTaskResponse> => {
    const response = await api.post(`/tasks/complete/${taskId}`, {
      trainer_id: trainerId,
    });
    return response.data;
  },
};

export default gameTaskService;
