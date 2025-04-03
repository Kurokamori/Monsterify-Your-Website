const pool = require('../db');
const Task = require('./Task');

// Create the task_templates table if it doesn't exist
const createTableIfNotExists = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS task_templates (
        template_id SERIAL PRIMARY KEY,
        trainer_id INTEGER,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        tasks JSONB DEFAULT '[]'::jsonb,
        preserve_times BOOLEAN DEFAULT false,
        preserve_notifications BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_task_templates_trainer_id ON task_templates (trainer_id);
    `;

    await pool.query(query);
  } catch (error) {
    console.error('Error creating task_templates table:', error);
    throw error;
  }
};

// Call the function to create the table
createTableIfNotExists();

class TaskTemplate {
  /**
   * Create a new task template
   * @param {Object} templateData - Template data
   * @param {number} templateData.trainer_id - Trainer ID
   * @param {string} templateData.name - Template name
   * @param {string} templateData.description - Template description (optional)
   * @param {Array} templateData.tasks - Array of task objects
   * @param {boolean} templateData.preserve_times - Whether to preserve task times when applying
   * @param {boolean} templateData.preserve_notifications - Whether to preserve notification settings when applying
   * @returns {Promise<Object>} - Created template
   */
  static async create({
    trainer_id,
    name,
    description = '',
    tasks = [],
    preserve_times = false,
    preserve_notifications = false
  }) {
    try {
      // First, ensure the table has the required columns
      await this.ensureColumnsExist();

      // Convert preserve_times to boolean if it's a string
      if (typeof preserve_times === 'string') {
        preserve_times = preserve_times === 'true' || preserve_times === 'on';
      }

      // Convert preserve_notifications to boolean if it's a string
      if (typeof preserve_notifications === 'string') {
        preserve_notifications = preserve_notifications === 'true' || preserve_notifications === 'on';
      }

      // Process tasks to handle empty time values
      if (Array.isArray(tasks)) {
        tasks = tasks.map(task => {
          if (task.time === '') delete task.time;
          if (task.reminder_time === '') delete task.reminder_time;
          return task;
        });
      }

      console.log('Creating template with data:', {
        trainer_id,
        name,
        description,
        tasksCount: tasks.length,
        preserve_times,
        preserve_notifications
      });

      const query = `
        INSERT INTO task_templates (
          trainer_id, name, description, tasks, preserve_times, preserve_notifications
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        trainer_id, name, description, JSON.stringify(tasks), preserve_times, preserve_notifications
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating task template:', error);
      throw error;
    }
  }

  /**
   * Ensure the task_templates table has the required columns
   * @private
   */
  static async ensureColumnsExist() {
    try {
      // Check if columns already exist
      const checkColumnsQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'task_templates'
        AND column_name IN ('preserve_times', 'preserve_notifications');
      `;

      const checkResult = await pool.query(checkColumnsQuery);
      const existingColumns = checkResult.rows.map(row => row.column_name);

      // Add columns if they don't exist
      if (!existingColumns.includes('preserve_times')) {
        console.log('Adding preserve_times column to task_templates table');
        await pool.query(`
          ALTER TABLE task_templates
          ADD COLUMN preserve_times BOOLEAN DEFAULT false;
        `);
      }

      if (!existingColumns.includes('preserve_notifications')) {
        console.log('Adding preserve_notifications column to task_templates table');
        await pool.query(`
          ALTER TABLE task_templates
          ADD COLUMN preserve_notifications BOOLEAN DEFAULT false;
        `);
      }
    } catch (error) {
      console.error('Error ensuring columns exist:', error);
      // Don't throw the error, just log it and continue
    }
  }

  /**
   * Get all task templates for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of task templates
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = `
        SELECT *
        FROM task_templates
        WHERE trainer_id = $1
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting task templates by trainer ID:', error);
      throw error;
    }
  }

  /**
   * Get a task template by ID
   * @param {number} templateId - Template ID
   * @returns {Promise<Object>} - Template object
   */
  static async getById(templateId) {
    try {
      const query = `
        SELECT *
        FROM task_templates
        WHERE template_id = $1
      `;

      const result = await pool.query(query, [templateId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting task template by ID:', error);
      throw error;
    }
  }

  /**
   * Update a task template
   * @param {number} templateId - Template ID
   * @param {Object} templateData - Template data to update
   * @returns {Promise<Object>} - Updated template
   */
  static async update(templateId, templateData) {
    try {
      // Build the query dynamically based on the fields to update
      const fields = Object.keys(templateData)
        .filter(key => templateData[key] !== undefined)
        .map((key, index) => {
          // Handle the tasks field specially to convert to JSON
          if (key === 'tasks') {
            return `tasks = $${index + 2}`;
          }
          return `${key} = $${index + 2}`;
        });

      if (fields.length === 0) {
        return await this.getById(templateId);
      }

      const query = `
        UPDATE task_templates
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE template_id = $1
        RETURNING *
      `;

      const values = [
        templateId,
        ...Object.keys(templateData)
          .filter(key => templateData[key] !== undefined)
          .map(key => {
            // Convert tasks array to JSON string
            if (key === 'tasks') {
              return JSON.stringify(templateData[key]);
            }
            return templateData[key];
          })
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating task template:', error);
      throw error;
    }
  }

  /**
   * Apply a task template to create actual tasks
   * @param {number} templateId - Template ID
   * @param {Date} dueDate - Due date for the tasks
   * @returns {Promise<Array>} - Array of created tasks
   */
  static async apply(templateId, dueDate) {
    try {
      // Start a transaction
      await pool.query('BEGIN');

      // Get the template
      const template = await this.getById(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Parse the tasks if they're stored as a string, otherwise use the object directly
      const tasks = typeof template.tasks === 'string' ? JSON.parse(template.tasks) : template.tasks;

      // Create the tasks
      const createdTasks = [];

      for (const taskData of tasks) {
        // Prepare task data for creation
        const newTaskData = {
          ...taskData,
          trainer_id: template.trainer_id
        };

        // Set the due date based on template settings
        try {
          if (template.preserve_times && taskData.time) {
            // If preserving times, use the time from the template but the date from the parameter
            const [hours, minutes] = taskData.time.split(':').map(Number);
            const targetDate = new Date(dueDate);

            // Combine the target date with the template time
            targetDate.setHours(hours);
            targetDate.setMinutes(minutes);
            targetDate.setSeconds(0);

            newTaskData.due_date = targetDate;
          } else {
            // Otherwise just use the provided date
            newTaskData.due_date = dueDate;
          }

          // Remove the time field as it's not part of the Task model
          delete newTaskData.time;

          // Ensure due_date is a valid date object or null
          if (newTaskData.due_date && !(newTaskData.due_date instanceof Date)) {
            if (typeof newTaskData.due_date === 'string' && newTaskData.due_date.trim() === '') {
              newTaskData.due_date = null;
            } else {
              newTaskData.due_date = new Date(newTaskData.due_date);
              if (isNaN(newTaskData.due_date.getTime())) {
                newTaskData.due_date = null;
              }
            }
          }
        } catch (timeError) {
          console.error('Error processing time for task:', timeError);
          // Fallback to just using the provided date
          newTaskData.due_date = dueDate;
          delete newTaskData.time;
        }

        // Handle notification settings
        if (!template.preserve_notifications) {
          // If not preserving notification settings, disable them
          newTaskData.reminder_enabled = false;
          newTaskData.reminder_time = null;
        } else if (taskData.reminder_enabled && taskData.reminder_time) {
          // If preserving and the template has reminder settings
          try {
            // Set the reminder time based on the new due date
            if (taskData.reminder_time) {
              const [hours, minutes] = taskData.reminder_time.split(':').map(Number);
              const reminderDate = new Date(newTaskData.due_date);

              // Set the reminder time
              reminderDate.setHours(hours);
              reminderDate.setMinutes(minutes);
              reminderDate.setSeconds(0);

              newTaskData.reminder_time = reminderDate;
            }

            // Ensure reminder_time is a valid date object or null
            if (newTaskData.reminder_time && !(newTaskData.reminder_time instanceof Date)) {
              if (typeof newTaskData.reminder_time === 'string' && newTaskData.reminder_time.trim() === '') {
                newTaskData.reminder_time = null;
              } else {
                newTaskData.reminder_time = new Date(newTaskData.reminder_time);
                if (isNaN(newTaskData.reminder_time.getTime())) {
                  newTaskData.reminder_time = null;
                  newTaskData.reminder_enabled = false;
                }
              }
            }
          } catch (reminderError) {
            console.error('Error processing reminder time for task:', reminderError);
            // Disable reminder if there's an error
            newTaskData.reminder_time = null;
            newTaskData.reminder_enabled = false;
          }
        }

        // Create the task
        const task = await Task.create(newTaskData);

        // If reminder is enabled, create a reminder
        if (task.reminder_enabled && task.reminder_time) {
          await require('./Reminder').create({
            task_id: task.task_id,
            trainer_id: task.trainer_id,
            scheduled_time: new Date(task.reminder_time)
          });
        }

        createdTasks.push(task);
      }

      // Commit the transaction
      await pool.query('COMMIT');

      return createdTasks;
    } catch (error) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      console.error('Error applying task template:', error);
      throw error;
    }
  }

  /**
   * Delete a task template
   * @param {number} templateId - Template ID
   * @returns {Promise<boolean>} - Whether the template was deleted
   */
  static async delete(templateId) {
    try {
      const query = 'DELETE FROM task_templates WHERE template_id = $1 RETURNING *';
      const result = await pool.query(query, [templateId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting task template:', error);
      throw error;
    }
  }
}

module.exports = TaskTemplate;
