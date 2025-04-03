const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const HabitCompletion = sequelize.define('HabitCompletion', {
  completion_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  habit_id: {
    type: DataTypes.INTEGER
  },
  completed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  levels_gained: {
    type: DataTypes.INTEGER
  },
  coins_gained: {
    type: DataTypes.INTEGER
  },
  awarded_to_mon_id: {
    type: DataTypes.INTEGER
  },
  awarded_to_trainer_id: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'habit_completions',
  timestamps: false
});

module.exports = HabitCompletion;
