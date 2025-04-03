const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Habit = sequelize.define('Habit', {
  habit_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trainer_id: {
    type: DataTypes.INTEGER
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  difficulty: {
    type: DataTypes.STRING(50),
    defaultValue: 'medium'
  },
  frequency: {
    type: DataTypes.STRING(50),
    defaultValue: 'daily'
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  longest_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_completed: {
    type: DataTypes.DATE
  },
  level_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  coin_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  bound_to_mon_id: {
    type: DataTypes.INTEGER
  },
  bound_to_trainer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'habits',
  timestamps: false
});

module.exports = Habit;
