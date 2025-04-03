const pool = require('../db');
const Mission = require('./Mission');

/**
 * Utility class to set up mission-related tables and ensure proper references
 */
class MissionSetup {
  /**
   * Initialize all mission-related tables
   * @returns {Promise<void>}
   */
  static async initializeTables() {
    try {
      console.log('Initializing mission tables...');
      
      // First create the mission_templates table
      await Mission.createTableIfNotExists();
      
      // Then create the missions table (which is actually just a view/alias of mission_templates)
      await this.createMissionsTable();
      
      console.log('Mission tables initialized successfully');
    } catch (error) {
      console.error('Error initializing mission tables:', error);
      throw error;
    }
  }
  
  /**
   * Create the missions table or view that maps to mission_templates
   * This is needed because some code references 'missions' but we're using 'mission_templates'
   * @returns {Promise<void>}
   */
  static async createMissionsTable() {
    try {
      // Check if the missions table already exists
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'missions'
        );
      `;
      
      const checkResult = await pool.query(checkQuery);
      const tableExists = checkResult.rows[0].exists;
      
      if (!tableExists) {
        console.log('Creating missions table as a view of mission_templates...');
        
        // Create a view named 'missions' that maps to mission_templates
        const createViewQuery = `
          CREATE VIEW missions AS
          SELECT * FROM mission_templates;
        `;
        
        await pool.query(createViewQuery);
        console.log('Missions view created successfully');
      } else {
        console.log('Missions table/view already exists');
      }
    } catch (error) {
      console.error('Error creating missions table/view:', error);
      throw error;
    }
  }
}

module.exports = MissionSetup;
