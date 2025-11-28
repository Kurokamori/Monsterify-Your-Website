import axios from 'axios';
import { getMockData, monsters, trainers, submissions, users, adventures, bosses } from './mockData';

// Configuration
const API_CONFIG = {
  // Use the environment variable if set, otherwise default to the backend port 4890
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4890/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Maximum number of retry attempts
  maxRetries: 3,
  // Retry delay in milliseconds (increases with each retry)
  retryDelay: 1000,
  // Whether to use mock data in development
  // Only use mock data if explicitly set to true via environment variable
  useMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true',
};

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Add specific debugging for session endpoint
api.interceptors.request.use(
  config => {
    if (config.url.includes('/town/activities/session/')) {
      console.log('API Request:', {
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data
      });
    }
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    if (response.config.url.includes('/town/activities/session/')) {
      console.log('API Response:', {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  error => {
    if (error.config?.url.includes('/town/activities/session/')) {
      console.error('API Response Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
    return Promise.reject(error);
  }
);

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp for debugging
    const timestamp = new Date().toISOString();
    config.metadata = { timestamp };

    // Special handling for art submission calculator
    if (config.url === '/submissions/art/calculate') {
      console.log('[ART CALCULATOR REQUEST]', JSON.stringify(config.data, null, 2));

      // Ensure trainers and monsters are arrays
      if (config.data) {
        if (!Array.isArray(config.data.trainers)) {
          console.warn('[ART CALCULATOR WARNING] trainers is not an array:', config.data.trainers);
          config.data.trainers = Array.isArray(config.data.trainers) ? config.data.trainers : [];
        }

        if (!Array.isArray(config.data.monsters)) {
          console.warn('[ART CALCULATOR WARNING] monsters is not an array:', config.data.monsters);
          config.data.monsters = Array.isArray(config.data.monsters) ? config.data.monsters : [];
        }

        console.log('[ART CALCULATOR FIXED REQUEST]', JSON.stringify(config.data, null, 2));
      }
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${timestamp} - ${config.method.toUpperCase()} ${config.url}`);
      if (config.params) {
        console.log('[API Request Params]', config.params);
      }
      if (config.data) {
        console.log('[API Request Data]', config.data);
      }
    }

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - new Date(response.config.metadata.timestamp);

    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.status} - ${response.config.method.toUpperCase()} ${response.config.url} (${duration}ms)`);
    }

    return response;
  },
  async (error) => {
    // Calculate request duration
    const duration = error.config?.metadata?.timestamp
      ? new Date() - new Date(error.config.metadata.timestamp)
      : 0;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error] ${error.response?.status || 'Network Error'} - ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`);
      if (error.response?.data) {
        console.error('[API Error Data]', error.response.data);
      }
    }

    // Handle retry logic
    const config = error.config;

    // If config doesn't exist or retry property is not set, reject
    if (!config || !config.retry) {
      // Set retry property with initial values
      if (config) {
        config.retry = {
          retryCount: 0,
          maxRetries: API_CONFIG.maxRetries,
          retryDelay: API_CONFIG.retryDelay,
        };
      }
    }

    // Check if we should retry the request
    if (
      config &&
      config.retry.retryCount < config.retry.maxRetries &&
      (error.response?.status >= 500 || error.code === 'ECONNABORTED' || !error.response)
    ) {
      config.retry.retryCount += 1;

      // Exponential backoff
      const delay = config.retry.retryDelay * Math.pow(2, config.retry.retryCount - 1);

      console.log(`[API Retry] Attempt ${config.retry.retryCount}/${config.retry.maxRetries} after ${delay}ms`);

      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry the request
      return api(config);
    }

    // Handle 401 Unauthorized errors (token expired, etc.)
    // Only redirect on 401 if this is NOT a login or register request
    if (error.response && error.response.status === 401 && 
        !config?.url?.includes('/auth/login') && 
        !config?.url?.includes('/auth/register')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Mock API implementation for development
const mockApi = {
  get: async (url, config = {}) => {
    console.log(`[Mock API] GET ${url}`, config);

    // Parse the URL to determine what data to return
    if (url.startsWith('/monsters')) {
      // Check for monster moves endpoint
      if (url.includes('/moves')) {
        const id = url.match(/\/monsters\/(\d+)\/moves/)?.[1];
        if (id) {
          console.log(`[Mock API] Fetching moves for monster ${id}`);
          // Return mock moves data
          return {
            data: {
              success: true,
              data: [
                { move_name: 'Tackle', move_type: 'Normal', pp: 35, power: 40, accuracy: 100 },
                { move_name: 'Growl', move_type: 'Normal', pp: 40, power: null, accuracy: 100 },
                { move_name: 'Ember', move_type: 'Fire', pp: 25, power: 40, accuracy: 100 },
                { move_name: 'Scratch', move_type: 'Normal', pp: 35, power: 40, accuracy: 100 }
              ]
            }
          };
        }
      }

      // Regular monster endpoint
      const id = url.match(/\/monsters\/(\d+)/)?.[1];
      if (id) {
        console.log(`[Mock API] Fetching monster with ID ${id}`);
        // Create a mock monster with the requested ID
        const mockMonster = {
          mon_id: parseInt(id),
          id: parseInt(id),
          name: `Monster ${id}`,
          level: 25,
          species1: 'Pikachu',
          type1: 'Electric',
          type2: 'Normal',
          attribute: 'Speed',
          ability1: 'Static',
          nature: 'Jolly',
          characteristic: 'Likes to run',
          friendship: 70,
          gender: 'Male',
          pronouns: 'he/him',
          age: '2 years',
          where_met: 'Viridian Forest',
          date_met: '2023-05-15',
          acquired: 'Caught in the wild',
          ball: 'Ultra Ball',
          height: '1\'4"',
          weight: '13.2 lbs',
          shiny: Math.random() > 0.9, // 10% chance of being shiny
          alpha: Math.random() > 0.9,
          shadow: false,
          paradox: false,
          pokerus: Math.random() > 0.95,
          tldr: 'A friendly electric mouse that loves to play and battle.',
          bio: 'This Pikachu was found in Viridian Forest during a thunderstorm. It has a particularly strong affinity for electricity and can generate more powerful electric attacks than most of its kind.',
          img_link: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
          trainer_id: 1,
          box_number: 1,
          box_position: 1,
          hp_total: 60,
          hp_iv: 25,
          hp_ev: 0,
          atk_total: 55,
          atk_iv: 28,
          atk_ev: 0,
          def_total: 40,
          def_iv: 20,
          def_ev: 0,
          spa_total: 50,
          spa_iv: 31,
          spa_ev: 0,
          spd_total: 50,
          spd_iv: 27,
          spd_ev: 0,
          spe_total: 90,
          spe_iv: 30,
          spe_ev: 0
        };

        return {
          data: {
            success: true,
            data: mockMonster
          }
        };
      }

      // Return list of monsters
      return {
        data: {
          success: true,
          data: monsters.map((m, index) => ({
            ...m,
            mon_id: m.id || index + 1,
            id: m.id || index + 1
          }))
        }
      };
    }

    if (url.startsWith('/trainers')) {
      // Handle /trainers/user endpoint
      if (url === '/trainers/user') {
        const userTrainers = trainers.slice(0, 3); // Return first 3 trainers as user's trainers
        return {
          data: {
            success: true,
            data: userTrainers,
            totalTrainers: userTrainers.length,
            currentPage: 1,
            totalPages: 1
          }
        };
      }

      // Handle /trainers/:id endpoint
      const id = url.match(/\/trainers\/(\d+)/)?.[1];
      if (id) {
        const trainer = trainers.find(t => t.id === parseInt(id));
        return {
          data: {
            success: true,
            data: trainer || null
          }
        };
      }

      // Return all trainers
      return {
        data: {
          success: true,
          data: trainers
        }
      };
    }

    if (url.startsWith('/submissions')) {
      const id = url.match(/\/submissions\/(\d+)/)?.[1];
      if (id) {
        const submission = submissions.find(s => s.id === parseInt(id));
        return { data: submission || null };
      }
      return { data: submissions };
    }

    if (url.startsWith('/adventures')) {
      const id = url.match(/\/adventures\/(\d+)/)?.[1];
      if (id) {
        const adventure = adventures.find(a => a.id === parseInt(id));
        return { data: adventure || null };
      }
      return { data: adventures };
    }

    if (url.startsWith('/bosses')) {
      const id = url.match(/\/bosses\/(\d+)/)?.[1];
      if (id) {
        const boss = bosses.find(b => b.id === parseInt(id));
        return { data: boss || null };
      }
      return { data: bosses };
    }

    if (url.startsWith('/fakemon/random')) {
      const count = config.params?.count || 3;
      const randomMonsters = [...monsters].sort(() => 0.5 - Math.random()).slice(0, count);
      return { data: randomMonsters };
    }

    if (url.startsWith('/statistics/overall')) {
      return {
        data: {
          success: true,
          data: {
            overview: {
              total_monsters: monsters.length,
              unique_species: new Set(monsters.map(m => m.species1)).size,
              average_level: Math.round(monsters.reduce((sum, m) => sum + (m.level || 0), 0) / monsters.length) || 0,
              highest_level: Math.max(...monsters.map(m => m.level || 0), 0),
              type_distribution: {
                Fire: 8,
                Water: 10,
                Grass: 7,
                Electric: 5,
                Normal: 12
              }
            },
            top_monsters: monsters.slice(0, 5).map(monster => ({
              id: monster.id,
              name: monster.name || 'Unnamed',
              image_path: monster.img_link || '/images/default_monster.png',
              level: monster.level || 1,
              types: [monster.type1, monster.type2].filter(Boolean),
              stats: {
                hp: monster.hp_total || 0,
                attack: monster.atk_total || 0,
                defense: monster.def_total || 0,
                sp_attack: monster.spa_total || 0,
                sp_defense: monster.spd_total || 0,
                speed: monster.spe_total || 0
              },
              battles_won: monster.battles_won || 0,
              battles_total: monster.battles_total || 0
            })),
            monsters: monsters.map(monster => ({
              id: monster.id,
              name: monster.name || 'Unnamed',
              image_path: monster.img_link || '/images/default_monster.png',
              level: monster.level || 1,
              types: [monster.type1, monster.type2].filter(Boolean),
              battles_won: monster.battles_won || 0,
              battles_total: monster.battles_total || 0,
              win_rate: monster.battles_total > 0
                ? Math.round((monster.battles_won / monster.battles_total) * 100 * 10) / 10
                : 0
            }))
          }
        }
      };
    }

    if (url.startsWith('/statistics/monster')) {
      const type = config.params?.type || 'all';
      const sort = config.params?.sort || 'level';
      const order = config.params?.order || 'desc';

      // Filter monsters by type if specified
      let filteredMonsters = [...monsters];
      if (type !== 'all') {
        filteredMonsters = filteredMonsters.filter(m =>
          m.type1 === type || m.type2 === type || m.type3 === type || m.type4 === type || m.type5 === type
        );
      }

      // Sort monsters
      filteredMonsters.sort((a, b) => {
        let comparison = 0;

        switch (sort) {
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
          case 'level':
            comparison = (a.level || 0) - (b.level || 0);
            break;
          case 'win_rate':
            const aWinRate = a.battles_total > 0 ? (a.battles_won / a.battles_total) : 0;
            const bWinRate = b.battles_total > 0 ? (b.battles_won / b.battles_total) : 0;
            comparison = aWinRate - bWinRate;
            break;
          default:
            comparison = (a.level || 0) - (b.level || 0);
        }

        return order === 'asc' ? comparison : -comparison;
      });

      return {
        data: {
          success: true,
          data: {
            overview: {
              total_monsters: filteredMonsters.length,
              unique_species: new Set(filteredMonsters.map(m => m.species1)).size,
              average_level: Math.round(filteredMonsters.reduce((sum, m) => sum + (m.level || 0), 0) / filteredMonsters.length) || 0,
              highest_level: Math.max(...filteredMonsters.map(m => m.level || 0), 0),
              type_distribution: {
                Fire: 8,
                Water: 10,
                Grass: 7,
                Electric: 5,
                Normal: 12
              }
            },
            top_monsters: filteredMonsters.slice(0, 5).map(monster => ({
              id: monster.id,
              name: monster.name || 'Unnamed',
              image_path: monster.img_link || '/images/default_monster.png',
              level: monster.level || 1,
              types: [monster.type1, monster.type2].filter(Boolean),
              stats: {
                hp: monster.hp_total || 0,
                attack: monster.atk_total || 0,
                defense: monster.def_total || 0,
                sp_attack: monster.spa_total || 0,
                sp_defense: monster.spd_total || 0,
                speed: monster.spe_total || 0
              },
              battles_won: monster.battles_won || 0,
              battles_total: monster.battles_total || 0
            })),
            monsters: filteredMonsters.map(monster => ({
              id: monster.id,
              name: monster.name || 'Unnamed',
              image_path: monster.img_link || '/images/default_monster.png',
              level: monster.level || 1,
              types: [monster.type1, monster.type2].filter(Boolean),
              battles_won: monster.battles_won || 0,
              battles_total: monster.battles_total || 0,
              win_rate: monster.battles_total > 0
                ? Math.round((monster.battles_won / monster.battles_total) * 100 * 10) / 10
                : 0
            }))
          }
        }
      };
    }

    if (url.startsWith('/statistics/trainer/')) {
      const trainerId = url.match(/\/statistics\/trainer\/(\d+)/)?.[1];
      const timeframe = config.params?.timeframe || 'all_time';

      if (trainerId) {
        const trainer = trainers.find(t => t.id === parseInt(trainerId));

        if (trainer) {
          // Get monsters for this trainer
          const trainerMonsters = monsters.filter(m => m.trainer_id === trainer.id);

          return {
            data: {
              success: true,
              data: {
                trainer: {
                  id: trainer.id,
                  name: trainer.name,
                  level: trainer.level || 1,
                  experience: trainer.experience || 0,
                  next_level_exp: (trainer.level || 1) * 1000,
                  coins: trainer.currency_amount || 0,
                  join_date: trainer.created_at || new Date().toISOString(),
                  avatar_url: trainer.main_ref || '/images/default_trainer.png'
                },
                monsters: {
                  total: trainerMonsters.length,
                  unique_species: new Set(trainerMonsters.map(m => m.species1)).size,
                  highest_level: Math.max(...trainerMonsters.map(m => m.level || 0), 0),
                  types: {
                    Fire: 8,
                    Water: 10,
                    Grass: 7,
                    Electric: 5,
                    Normal: 12
                  }
                },
                activities: {
                  battles_won: 87,
                  battles_lost: 23,
                  missions_completed: 35,
                  bosses_defeated: 5,
                  events_participated: 8,
                  monsters_caught: 52,
                  monsters_evolved: 15,
                  items_collected: 124
                },
                activity_chart: {
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  data: [45, 60, 30, 75, 50, 90, 65]
                }
              }
            }
          };
        }
      }

      return {
        data: {
          success: false,
          message: 'Trainer not found'
        }
      };
    }

    // Default: return empty array
    return { data: [] };
  },

  post: async (url, data, config = {}) => {
    console.log(`[Mock API] POST ${url}`, data, config);

    // Handle authentication
    if (url === '/auth/login') {
      const { username, password } = data;
      const user = users.find(u => u.username === username);

      if (user && password === 'password') { // Simple mock password check
        return {
          data: {
            success: true,
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: user.id,
              username: user.username,
              display_name: user.display_name,
              discord_id: user.discord_id,
              is_admin: user.role === 'admin'
            }
          }
        };
      }

      // Simulate error
      return {
        data: {
          success: false,
          message: 'Invalid username or password'
        }
      };
    }

    if (url === '/auth/register') {
      // Simple validation
      if (!data.username || !data.password) {
        return {
          data: {
            success: false,
            message: 'Username and password are required'
          }
        };
      }

      // Check if username exists
      if (users.some(u => u.username === data.username)) {
        return {
          data: {
            success: false,
            message: 'Username already exists'
          }
        };
      }

      // Create new user
      const newUser = {
        id: users.length + 1,
        username: data.username,
        display_name: data.display_name || data.username,
        discord_id: data.discord_id || '',
        role: 'user',
        is_admin: false,
        created_at: new Date().toISOString()
      };

      users.push(newUser);

      return {
        data: {
          success: true,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: newUser.id,
            username: newUser.username,
            display_name: newUser.display_name,
            discord_id: newUser.discord_id,
            is_admin: false
          }
        }
      };
    }

    if (url === '/auth/refresh') {
      return {
        data: {
          success: true,
          token: 'new-mock-jwt-token'
        }
      };
    }

    if (url === '/auth/profile') {
      // This would normally use the token to identify the user
      return {
        data: {
          success: true,
          user: {
            id: 1,
            username: 'testuser',
            display_name: 'Test User',
            discord_id: '123456789',
            is_admin: false,
            monster_roller_settings: {
              pokemon: true,
              digimon: true,
              yokai: true,
              pals: true,
              nexomon: true
            }
          }
        }
      };
    }

    if (url === '/auth/roller-settings') {
      return {
        data: {
          success: true,
          settings: {
            pokemon: true,
            digimon: true,
            yokai: true,
            pals: true,
            nexomon: true
          }
        }
      };
    }

    // Default: return the data that was sent
    return { data };
  },

  put: async (url, data, config = {}) => {
    console.log(`[Mock API] PUT ${url}`, data, config);

    if (url === '/auth/roller-settings') {
      return {
        data: {
          success: true,
          settings: data
        }
      };
    }

    return { data };
  },

  patch: async (url, data, config = {}) => {
    console.log(`[Mock API] PATCH ${url}`, data, config);

    if (url === '/auth/profile') {
      return {
        data: {
          success: true,
          user: {
            id: 1,
            username: 'testuser',
            display_name: data.display_name || 'Test User',
            discord_id: data.discord_id || '123456789',
            is_admin: false,
            monster_roller_settings: {
              pokemon: true,
              digimon: true,
              yokai: true,
              pals: true,
              nexomon: true
            }
          }
        }
      };
    }

    return { data };
  },

  delete: async (url, config = {}) => {
    console.log(`[Mock API] DELETE ${url}`, config);
    return { data: { success: true } };
  }
};

// Export the appropriate API based on configuration
export default API_CONFIG.useMockData ? mockApi : api;
