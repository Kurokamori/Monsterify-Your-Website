const Faction = require('../models/Faction');
const FactionStanding = require('../models/FactionStanding');
const FactionStore = require('../models/FactionStore');
const FactionTribute = require('../models/FactionTribute');
const FactionSubmission = require('../models/FactionSubmission');
const FactionPrompt = require('../models/FactionPrompt');
const FactionPerson = require('../models/FactionPerson');
const FactionPersonMeeting = require('../models/FactionPersonMeeting');
const Submission = require('../models/Submission');

/**
 * Get all factions
 * @route GET /api/factions
 * @access Public
 */
const getAllFactions = async (req, res) => {
  try {
    const factions = await Faction.getAll();
    res.json({
      success: true,
      factions
    });
  } catch (error) {
    console.error('Error getting factions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get factions'
    });
  }
};

/**
 * Get faction by ID
 * @route GET /api/factions/:id
 * @access Public
 */
const getFactionById = async (req, res) => {
  try {
    const faction = await Faction.getById(req.params.id);
    if (!faction) {
      return res.status(404).json({
        success: false,
        message: 'Faction not found'
      });
    }

    // Get faction titles
    const titles = await Faction.getTitles(faction.id);
    
    // Get faction relationships
    const relationships = await Faction.getRelationships(faction.id);

    res.json({
      success: true,
      faction: {
        ...faction,
        titles,
        relationships
      }
    });
  } catch (error) {
    console.error('Error getting faction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faction'
    });
  }
};

/**
 * Get trainer's standings with all factions
 * @route GET /api/trainers/:trainerId/factions/standings
 * @access Protected
 */
const getTrainerStandings = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Initialize standings if they don't exist
    await FactionStanding.initializeTrainerStandings(trainerId);
    
    const standings = await FactionStanding.getTrainerStandings(trainerId);
    
    res.json({
      success: true,
      standings
    });
  } catch (error) {
    console.error('Error getting trainer standings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer standings'
    });
  }
};

/**
 * Get trainer's standing with a specific faction
 * @route GET /api/trainers/:trainerId/factions/:factionId/standing
 * @access Protected
 */
const getTrainerFactionStanding = async (req, res) => {
  try {
    const { trainerId, factionId } = req.params;
    
    const standing = await FactionStanding.getTrainerFactionStanding(trainerId, factionId);
    
    if (!standing) {
      // Initialize standing if it doesn't exist
      await FactionStanding.initializeTrainerStandings(trainerId);
      const newStanding = await FactionStanding.getTrainerFactionStanding(trainerId, factionId);
      
      return res.json({
        success: true,
        standing: newStanding
      });
    }

    // Get available titles
    const titles = await FactionStanding.getAvailableTitles(trainerId, factionId);

    res.json({
      success: true,
      standing: {
        ...standing,
        availableTitles: titles
      }
    });
  } catch (error) {
    console.error('Error getting trainer faction standing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer faction standing'
    });
  }
};

/**
 * Update trainer's standing with a faction
 * @route POST /api/trainers/:trainerId/factions/:factionId/standing
 * @access Protected (Admin only for manual updates)
 */
const updateTrainerStanding = async (req, res) => {
  try {
    const { trainerId, factionId } = req.params;
    const { standingChange, reason } = req.body;

    if (!standingChange || typeof standingChange !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Standing change amount is required and must be a number'
      });
    }

    const updatedStanding = await FactionStanding.updateStanding(trainerId, factionId, standingChange);

    res.json({
      success: true,
      standing: updatedStanding,
      message: `Standing updated by ${standingChange}${reason ? ` (${reason})` : ''}`
    });
  } catch (error) {
    console.error('Error updating trainer standing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trainer standing'
    });
  }
};

/**
 * Get faction store items
 * @route GET /api/factions/:factionId/store
 * @access Public
 */
const getFactionStore = async (req, res) => {
  try {
    const { factionId } = req.params;
    const { trainerId } = req.query;

    const items = await FactionStore.getStoreItems(factionId, trainerId);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error getting faction store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faction store'
    });
  }
};

/**
 * Purchase item from faction store
 * @route POST /api/factions/:factionId/store/purchase
 * @access Protected
 */
const purchaseFromFactionStore = async (req, res) => {
  try {
    const { factionId } = req.params;
    const { trainerId, itemId, quantity = 1 } = req.body;

    if (!trainerId || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and item ID are required'
      });
    }

    const result = await FactionStore.purchaseItem(trainerId, itemId, quantity);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error purchasing from faction store:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to purchase item'
    });
  }
};

/**
 * Submit tribute for faction title
 * @route POST /api/factions/:factionId/tributes
 * @access Protected
 */
const submitTribute = async (req, res) => {
  try {
    const { factionId } = req.params;
    const tributeData = req.body;

    // Validate required fields
    const { title_id, trainer_id, submission_type, submission_url, submission_description } = tributeData;
    
    if (!title_id || !trainer_id || !submission_type || !submission_url || !submission_description) {
      return res.status(400).json({
        success: false,
        message: 'All tribute fields are required'
      });
    }

    const tribute = await FactionTribute.submitTribute(tributeData);

    res.json({
      success: true,
      tribute,
      message: 'Tribute submitted successfully and is pending review'
    });
  } catch (error) {
    console.error('Error submitting tribute:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit tribute'
    });
  }
};

/**
 * Get trainer's tributes
 * @route GET /api/trainers/:trainerId/tributes
 * @access Protected
 */
const getTrainerTributes = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { factionId } = req.query;

    let tributes;
    if (factionId) {
      tributes = await FactionTribute.getTrainerFactionTributes(trainerId, factionId);
    } else {
      tributes = await FactionTribute.getTrainerTributes(trainerId);
    }

    res.json({
      success: true,
      tributes
    });
  } catch (error) {
    console.error('Error getting trainer tributes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer tributes'
    });
  }
};

/**
 * Review tribute (Admin only)
 * @route PUT /api/tributes/:tributeId/review
 * @access Protected (Admin)
 */
const reviewTribute = async (req, res) => {
  try {
    const { tributeId } = req.params;
    const { status, reviewerId } = req.body;

    if (!status || !reviewerId) {
      return res.status(400).json({
        success: false,
        message: 'Status and reviewer ID are required'
      });
    }

    const tribute = await FactionTribute.reviewTribute(tributeId, status, reviewerId);

    res.json({
      success: true,
      tribute,
      message: `Tribute ${status} successfully`
    });
  } catch (error) {
    console.error('Error reviewing tribute:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to review tribute'
    });
  }
};

/**
 * Get pending tributes (Admin only)
 * @route GET /api/tributes/pending
 * @access Protected (Admin)
 */
const getPendingTributes = async (req, res) => {
  try {
    const tributes = await FactionTribute.getPendingTributes();

    res.json({
      success: true,
      tributes
    });
  } catch (error) {
    console.error('Error getting pending tributes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending tributes'
    });
  }
};

/**
 * Get faction prompts
 * @route GET /api/factions/:factionId/prompts
 * @access Public
 */
const getFactionPrompts = async (req, res) => {
  try {
    const { factionId } = req.params;
    const prompts = await FactionPrompt.getFactionPrompts(factionId);

    res.json({
      success: true,
      prompts
    });
  } catch (error) {
    console.error('Error getting faction prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faction prompts'
    });
  }
};

/**
 * Get trainer's available submissions for faction
 * @route GET /api/trainers/:trainerId/submissions/available
 * @access Protected
 */
const getAvailableSubmissions = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Get all submissions for the trainer
    const query = `
      SELECT s.* FROM submissions s
      WHERE s.trainer_id = $1
      AND s.id NOT IN (
        SELECT fs.submission_id FROM faction_submissions fs
        WHERE fs.trainer_id = $1
      )
      ORDER BY s.created_at DESC
    `;
    
    const db = require('../config/db');
    const submissions = await db.asyncAll(query, [trainerId]);

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error getting available submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available submissions'
    });
  }
};

/**
 * Create faction submission
 * @route POST /api/factions/:factionId/submissions
 * @access Protected
 */
const createFactionSubmission = async (req, res) => {
  try {
    const { factionId } = req.params;
    const submissionData = { ...req.body, factionId };

    // Validate required fields
    const { trainerId, submissionId, trainerStatus, taskSize } = submissionData;
    
    if (!trainerId || !submissionId || !trainerStatus || !taskSize) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID, submission ID, trainer status, and task size are required'
      });
    }

    // Check if trainer has already used this submission
    const hasUsed = await FactionSubmission.hasTrainerUsedSubmission(trainerId, submissionId);
    if (hasUsed) {
      return res.status(400).json({
        success: false,
        message: 'This trainer has already used this submission for faction standing'
      });
    }

    // Check if submission exists and belongs to trainer
    const submission = await Submission.getById(submissionId);
    if (!submission || submission.trainer_id !== parseInt(trainerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission or submission does not belong to this trainer'
      });
    }

    // Create the faction submission
    const factionSubmission = await FactionSubmission.create(submissionData);

    // Apply the standing
    const standingResult = await FactionSubmission.applyStanding(factionSubmission.id);

    res.json({
      success: true,
      submission: factionSubmission,
      standingResult,
      message: 'Faction submission created and standing applied successfully'
    });
  } catch (error) {
    console.error('Error creating faction submission:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create faction submission'
    });
  }
};

/**
 * Get trainer's faction submissions
 * @route GET /api/trainers/:trainerId/faction-submissions
 * @access Protected
 */
const getTrainerFactionSubmissions = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { factionId } = req.query;

    const submissions = await FactionSubmission.getTrainerSubmissions(trainerId, factionId);

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error getting trainer faction submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer faction submissions'
    });
  }
};

/**
 * Create faction prompt (Admin only)
 * @route POST /api/factions/:factionId/prompts
 * @access Protected (Admin)
 */
const createFactionPrompt = async (req, res) => {
  try {
    const { factionId } = req.params;
    const promptData = { ...req.body, factionId };

    const prompt = await FactionPrompt.create(promptData);

    res.json({
      success: true,
      prompt,
      message: 'Faction prompt created successfully'
    });
  } catch (error) {
    console.error('Error creating faction prompt:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create faction prompt'
    });
  }
};

/**
 * Update faction prompt (Admin only)
 * @route PUT /api/prompts/:promptId
 * @access Protected (Admin)
 */
const updateFactionPrompt = async (req, res) => {
  try {
    const { promptId } = req.params;
    const promptData = req.body;

    const prompt = await FactionPrompt.update(promptId, promptData);

    res.json({
      success: true,
      prompt,
      message: 'Faction prompt updated successfully'
    });
  } catch (error) {
    console.error('Error updating faction prompt:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update faction prompt'
    });
  }
};

/**
 * Get tribute requirement for trainer
 * @route GET /api/trainers/:trainerId/factions/:factionId/tribute-requirement
 * @access Protected
 */
const getTributeRequirement = async (req, res) => {
  try {
    const { trainerId, factionId } = req.params;
    
    const requirement = await FactionStanding.getTributeRequirement(trainerId, factionId);
    
    res.json({
      success: true,
      requirement
    });
  } catch (error) {
    console.error('Error getting tribute requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tribute requirement'
    });
  }
};

/**
 * Get trainer's available submissions for tribute (not used in faction submissions or tributes)
 * @route GET /api/trainers/:trainerId/submissions/available-for-tribute
 * @access Protected
 */
const getAvailableSubmissionsForTribute = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Get all submissions for the trainer that haven't been used for faction submissions or tributes
    const query = `
      SELECT s.* FROM submissions s
      WHERE s.trainer_id = $1
      AND s.id NOT IN (
        SELECT fs.submission_id FROM faction_submissions fs
        WHERE fs.trainer_id = $1 AND fs.submission_id IS NOT NULL
      )
      AND s.id NOT IN (
        SELECT ft.submission_id FROM faction_tributes ft
        WHERE ft.trainer_id = $1 AND ft.submission_id IS NOT NULL
      )
      ORDER BY s.created_at DESC
    `;
    
    const db = require('../config/db');
    const submissions = await db.asyncAll(query, [trainerId]);

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error getting available submissions for tribute:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available submissions for tribute'
    });
  }
};

/**
 * Get faction people with trainer's meeting status
 * @route GET /api/factions/:factionId/people
 * @access Public
 */
const getFactionPeople = async (req, res) => {
  try {
    const { factionId } = req.params;
    const { trainerId } = req.query;

    const people = await FactionPerson.getFactionPeople(factionId);
    
    if (trainerId) {
      // Add meeting status and can meet status for each person
      for (let person of people) {
        const hasMet = await FactionPersonMeeting.hasMet(trainerId, person.id);
        const canMeet = await FactionPersonMeeting.canMeet(trainerId, person.id);
        
        person.has_met = !!hasMet;
        person.can_meet = canMeet;
        person.met_at = hasMet ? hasMet.met_at : null;
        
        // Parse images if it's a string
        if (typeof person.images === 'string') {
          try {
            person.images = JSON.parse(person.images);
          } catch (e) {
            person.images = [];
          }
        }
      }
    }

    res.json({
      success: true,
      people
    });
  } catch (error) {
    console.error('Error getting faction people:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faction people'
    });
  }
};

/**
 * Get person details by ID
 * @route GET /api/people/:personId
 * @access Public
 */
const getPersonById = async (req, res) => {
  try {
    const { personId } = req.params;
    const { trainerId } = req.query;

    const person = await FactionPerson.getById(personId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    // Parse images if it's a string
    if (typeof person.images === 'string') {
      try {
        person.images = JSON.parse(person.images);
      } catch (e) {
        person.images = [];
      }
    }

    // Get monster team
    const team = await FactionPerson.getPersonTeam(personId);
    person.team = team.map(monster => ({
      ...monster,
      species: typeof monster.species === 'string' ? JSON.parse(monster.species) : monster.species,
      types: typeof monster.types === 'string' ? JSON.parse(monster.types) : monster.types
    }));

    if (trainerId) {
      const hasMet = await FactionPersonMeeting.hasMet(trainerId, personId);
      const canMeet = await FactionPersonMeeting.canMeet(trainerId, personId);
      
      person.has_met = !!hasMet;
      person.can_meet = canMeet;
      person.met_at = hasMet ? hasMet.met_at : null;
    }

    res.json({
      success: true,
      person
    });
  } catch (error) {
    console.error('Error getting person:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get person'
    });
  }
};

/**
 * Meet a person (submit artwork)
 * @route POST /api/people/:personId/meet
 * @access Protected
 */
const meetPerson = async (req, res) => {
  try {
    const { personId } = req.params;
    const { trainerId, submissionId } = req.body;

    if (!trainerId || !submissionId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and submission ID are required'
      });
    }

    // Check if trainer can meet this person
    const canMeet = await FactionPersonMeeting.canMeet(trainerId, personId);
    if (!canMeet) {
      return res.status(400).json({
        success: false,
        message: 'You do not meet the standing requirements to meet this person'
      });
    }

    // Check if trainer has already met this person
    const hasMet = await FactionPersonMeeting.hasMet(trainerId, personId);
    if (hasMet) {
      return res.status(400).json({
        success: false,
        message: 'You have already met this person'
      });
    }

    // Check if submission is available
    const availableSubmissions = await FactionPersonMeeting.getAvailableSubmissionsForMeeting(trainerId);
    const isSubmissionAvailable = availableSubmissions.some(s => s.id === parseInt(submissionId));
    
    if (!isSubmissionAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This submission has already been used or does not belong to you'
      });
    }

    const result = await FactionPersonMeeting.meetPerson({
      trainer_id: trainerId,
      person_id: personId,
      submission_id: submissionId
    });

    res.json({
      success: true,
      meeting: result.meeting,
      standingReward: result.standingReward,
      person: result.person,
      message: `You have successfully met ${result.person.name} and gained ${result.standingReward} standing!`
    });
  } catch (error) {
    console.error('Error meeting person:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to meet person'
    });
  }
};

/**
 * Get trainer's met people for a faction
 * @route GET /api/trainers/:trainerId/factions/:factionId/met-people
 * @access Protected
 */
const getTrainerMetPeople = async (req, res) => {
  try {
    const { trainerId, factionId } = req.params;

    const metPeople = await FactionPersonMeeting.getTrainerMetPeople(trainerId, factionId);

    res.json({
      success: true,
      metPeople
    });
  } catch (error) {
    console.error('Error getting trainer met people:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer met people'
    });
  }
};

/**
 * Get trainer's available submissions for meeting people
 * @route GET /api/trainers/:trainerId/submissions/available-for-meeting
 * @access Protected
 */
const getAvailableSubmissionsForMeeting = async (req, res) => {
  try {
    const { trainerId } = req.params;

    const submissions = await FactionPersonMeeting.getAvailableSubmissionsForMeeting(trainerId);

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error getting available submissions for meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available submissions for meeting'
    });
  }
};

// ============== ADMIN ENDPOINTS ==============

/**
 * Get all faction people for admin (Admin only)
 * @route GET /api/admin/faction-people
 * @access Protected (Admin)
 */
const getAllFactionPeopleAdmin = async (req, res) => {
  try {
    const { factionId } = req.query;
    let people;
    
    if (factionId) {
      people = await FactionPerson.getFactionPeople(factionId);
    } else {
      // Get all people across all factions
      const query = `
        SELECT fp.*, f.name as faction_name, f.color as faction_color
        FROM faction_people fp
        JOIN factions f ON fp.faction_id = f.id
        ORDER BY f.name, fp.standing_requirement ASC, fp.name ASC
      `;
      const db = require('../config/db');
      people = await db.asyncAll(query);
    }

    // Parse images for each person
    people.forEach(person => {
      if (typeof person.images === 'string') {
        try {
          person.images = JSON.parse(person.images);
        } catch (e) {
          person.images = [];
        }
      }
    });

    res.json({
      success: true,
      people
    });
  } catch (error) {
    console.error('Error getting faction people for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faction people'
    });
  }
};

/**
 * Create faction person (Admin only)
 * @route POST /api/admin/faction-people
 * @access Protected (Admin)
 */
const createFactionPersonAdmin = async (req, res) => {
  try {
    const personData = req.body;

    // Validate required fields
    const { faction_id, name, alias, standing_requirement } = personData;
    
    if (!faction_id || !name || !alias || standing_requirement === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Faction ID, name, alias, and standing requirement are required'
      });
    }

    const person = await FactionPerson.create(personData);

    res.json({
      success: true,
      person,
      message: 'Faction person created successfully'
    });
  } catch (error) {
    console.error('Error creating faction person:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create faction person'
    });
  }
};

/**
 * Update faction person (Admin only)
 * @route PUT /api/admin/faction-people/:personId
 * @access Protected (Admin)
 */
const updateFactionPersonAdmin = async (req, res) => {
  try {
    const { personId } = req.params;
    const updateData = req.body;

    const person = await FactionPerson.update(personId, updateData);

    res.json({
      success: true,
      person,
      message: 'Faction person updated successfully'
    });
  } catch (error) {
    console.error('Error updating faction person:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update faction person'
    });
  }
};

/**
 * Delete faction person (Admin only)
 * @route DELETE /api/admin/faction-people/:personId
 * @access Protected (Admin)
 */
const deleteFactionPersonAdmin = async (req, res) => {
  try {
    const { personId } = req.params;

    const success = await FactionPerson.delete(personId);

    if (success) {
      res.json({
        success: true,
        message: 'Faction person deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Faction person not found'
      });
    }
  } catch (error) {
    console.error('Error deleting faction person:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete faction person'
    });
  }
};

/**
 * Get person's monster team for admin (Admin only)
 * @route GET /api/admin/faction-people/:personId/team
 * @access Protected (Admin)
 */
const getPersonTeamAdmin = async (req, res) => {
  try {
    const { personId } = req.params;

    const team = await FactionPerson.getPersonTeam(personId);
    
    // Parse JSON fields
    const parsedTeam = team.map(monster => ({
      ...monster,
      species: typeof monster.species === 'string' ? JSON.parse(monster.species) : monster.species,
      types: typeof monster.types === 'string' ? JSON.parse(monster.types) : monster.types
    }));

    res.json({
      success: true,
      team: parsedTeam
    });
  } catch (error) {
    console.error('Error getting person team for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get person team'
    });
  }
};

/**
 * Add monster to person's team (Admin only)
 * @route POST /api/admin/faction-people/:personId/team
 * @access Protected (Admin)
 */
const addMonsterToTeamAdmin = async (req, res) => {
  try {
    const { personId } = req.params;
    const monsterData = { ...req.body, person_id: personId };

    // Validate required fields
    const { name, species, types, attribute } = monsterData;
    
    if (!name || !species || !types || !attribute) {
      return res.status(400).json({
        success: false,
        message: 'Name, species, types, and attribute are required'
      });
    }

    const monster = await FactionPerson.addMonsterToTeam(monsterData);

    res.json({
      success: true,
      monster,
      message: 'Monster added to team successfully'
    });
  } catch (error) {
    console.error('Error adding monster to team:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add monster to team'
    });
  }
};

/**
 * Update monster in team (Admin only)
 * @route PUT /api/admin/monsters/:monsterId
 * @access Protected (Admin)
 */
const updateMonsterAdmin = async (req, res) => {
  try {
    const { monsterId } = req.params;
    const updateData = req.body;

    const query = `
      UPDATE faction_person_monsters
      SET name = ?, species = ?, types = ?, attribute = ?, image = ?, position = ?
      WHERE id = ?
    `;

    const db = require('../config/db');
    await db.asyncRun(query, [
      updateData.name,
      JSON.stringify(updateData.species),
      JSON.stringify(updateData.types),
      updateData.attribute,
      updateData.image,
      updateData.position,
      monsterId
    ]);

    // Get updated monster
    const monster = await db.asyncGet('SELECT * FROM faction_person_monsters WHERE id = ?', [monsterId]);

    res.json({
      success: true,
      monster: {
        ...monster,
        species: JSON.parse(monster.species),
        types: JSON.parse(monster.types)
      },
      message: 'Monster updated successfully'
    });
  } catch (error) {
    console.error('Error updating monster:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update monster'
    });
  }
};

/**
 * Delete monster from team (Admin only)
 * @route DELETE /api/admin/monsters/:monsterId
 * @access Protected (Admin)
 */
const deleteMonsterAdmin = async (req, res) => {
  try {
    const { monsterId } = req.params;

    const db = require('../config/db');
    const result = await db.asyncRun('DELETE FROM faction_person_monsters WHERE id = ?', [monsterId]);

    if (result.changes > 0) {
      res.json({
        success: true,
        message: 'Monster deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Monster not found'
      });
    }
  } catch (error) {
    console.error('Error deleting monster:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete monster'
    });
  }
};

module.exports = {
  getAllFactions,
  getFactionById,
  getTrainerStandings,
  getTrainerFactionStanding,
  updateTrainerStanding,
  getFactionStore,
  purchaseFromFactionStore,
  submitTribute,
  getTrainerTributes,
  reviewTribute,
  getPendingTributes,
  getFactionPrompts,
  getAvailableSubmissions,
  createFactionSubmission,
  getTrainerFactionSubmissions,
  createFactionPrompt,
  updateFactionPrompt,
  getTributeRequirement,
  getAvailableSubmissionsForTribute,
  getFactionPeople,
  getPersonById,
  meetPerson,
  getTrainerMetPeople,
  getAvailableSubmissionsForMeeting,
  // Admin endpoints
  getAllFactionPeopleAdmin,
  createFactionPersonAdmin,
  updateFactionPersonAdmin,
  deleteFactionPersonAdmin,
  getPersonTeamAdmin,
  addMonsterToTeamAdmin,
  updateMonsterAdmin,
  deleteMonsterAdmin
};
