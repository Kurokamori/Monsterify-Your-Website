const { sequelize } = require('../db');

// Import models from src/models
const Trainer = require('../../src/models/Trainer');
const Monster = require('../../src/models/Monster');
const Trade = require('../../src/models/Trade');

// Import models from database/models
const Habit = require('./Habit');
const Task = require('./Task');
const Reminder = require('./Reminder');
const HabitCompletion = require('./HabitCompletion');

// Define Sequelize relationships for database models only
// Note: Trainer and Monster are not Sequelize models, so we can't use associations with them
Task.hasMany(Reminder, { foreignKey: 'task_id' });
Reminder.belongsTo(Task, { foreignKey: 'task_id' });

// Define relationships for Habit and HabitCompletion
Habit.hasMany(HabitCompletion, { foreignKey: 'habit_id' });
HabitCompletion.belongsTo(Habit, { foreignKey: 'habit_id' });

module.exports = {
  Trainer,
  Mon: Monster, // Use Monster as Mon
  Trade,
  Habit,
  Task,
  Reminder,
  HabitCompletion,
  sequelize
};
