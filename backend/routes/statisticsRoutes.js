const express = require('express');
const router = express.Router();
const {
  getOverallStats,
  getMonsterStats,
  getTrainerStats,
  getTrainerComparisonStats,
  getLeaderboardStats,
  getAchievementStats
} = require('../controllers/statisticsController');

// Get overall statistics
router.get('/overall', getOverallStats);

// Get monster statistics
router.get('/monster', getMonsterStats);

// Get trainer statistics
router.get('/trainer/:trainerId', getTrainerStats);

// Get trainer comparison statistics
router.get('/trainer-comparison', getTrainerComparisonStats);

// Get leaderboard statistics
router.get('/leaderboards', getLeaderboardStats);

// Get achievement statistics
router.get('/achievement-stats', getAchievementStats);

// Mock achievements endpoint for development
router.get('/achievements', (req, res) => {
  // Return mock achievements data
  res.json({
    success: true,
    data: {
      achievements: [
        {
          id: 1,
          title: 'First Steps',
          description: 'Catch your first monster',
          category: 'collection',
          points: 10,
          progress: 1,
          total: 1,
          completed: true,
          completion_date: '2023-05-15T00:00:00Z',
          icon: 'fa-dragon'
        },
        {
          id: 2,
          title: 'Collector',
          description: 'Catch 10 different species of monsters',
          category: 'collection',
          points: 25,
          progress: 8,
          total: 10,
          completed: false,
          icon: 'fa-scroll'
        },
        {
          id: 3,
          title: 'Battle Champion',
          description: 'Win 50 battles',
          category: 'battle',
          points: 50,
          progress: 42,
          total: 50,
          completed: false,
          icon: 'fa-fist-raised'
        }
      ],
      categories: [
        { id: 'all', name: 'All' },
        { id: 'collection', name: 'Collection' },
        { id: 'battle', name: 'Battle' },
        { id: 'exploration', name: 'Exploration' },
        { id: 'social', name: 'Social' }
      ],
      stats: {
        total: 25,
        completed: 12,
        points_earned: 350,
        points_available: 750
      }
    }
  });
});

// Mock leaderboard endpoint for development
router.get('/leaderboard', (req, res) => {
  // Return mock leaderboard data
  res.json({
    success: true,
    data: {
      leaderboard_types: [
        { id: 'trainer_level', name: 'Trainer Level' },
        { id: 'monster_count', name: 'Monster Count' },
        { id: 'battle_wins', name: 'Battle Wins' },
        { id: 'achievement_points', name: 'Achievement Points' }
      ],
      timeframes: [
        { id: 'all_time', name: 'All Time' },
        { id: 'month', name: 'This Month' },
        { id: 'week', name: 'This Week' }
      ],
      rankings: [
        {
          id: 1,
          rank: 1,
          name: 'Red',
          avatar_url: 'https://via.placeholder.com/50/1e2532/d6a339?text=Red',
          value: 50,
          change: 0
        },
        {
          id: 2,
          rank: 2,
          name: 'Blue',
          avatar_url: 'https://via.placeholder.com/50/1e2532/d6a339?text=Blue',
          value: 45,
          change: 2
        },
        {
          id: 3,
          rank: 3,
          name: 'Green',
          avatar_url: 'https://via.placeholder.com/50/1e2532/d6a339?text=Green',
          value: 42,
          change: -1
        },
        {
          id: 4,
          rank: 4,
          name: 'Yellow',
          avatar_url: 'https://via.placeholder.com/50/1e2532/d6a339?text=Yellow',
          value: 38,
          change: 1
        },
        {
          id: 5,
          rank: 5,
          name: 'Silver',
          avatar_url: 'https://via.placeholder.com/50/1e2532/d6a339?text=Silver',
          value: 35,
          change: -2
        }
      ],
      current_user: {
        id: 1,
        rank: 1,
        name: 'Red',
        avatar_url: 'https://via.placeholder.com/50/1e2532/d6a339?text=Red',
        value: 50,
        change: 0
      }
    }
  });
});

module.exports = router;
