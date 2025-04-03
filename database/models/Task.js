const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Task = sequelize.define('Task', {
  task_id: {
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
  due_date: {
    type: DataTypes.DATE
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completed_at: {
    type: DataTypes.DATE
  },
  level_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  coin_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  bound_to_mon_id: {
    type: DataTypes.INTEGER
  },
  bound_to_trainer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_time: {
    type: DataTypes.DATE
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
  tableName: 'tasks',
  timestamps: false
});

module.exports = Task;
