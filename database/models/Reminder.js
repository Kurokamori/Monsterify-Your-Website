const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Reminder = sequelize.define('Reminder', {
  reminder_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_id: {
    type: DataTypes.INTEGER
  },
  trainer_id: {
    type: DataTypes.INTEGER
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  response: {
    type: DataTypes.STRING(50)
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
  tableName: 'reminders',
  timestamps: false
});

module.exports = Reminder;
