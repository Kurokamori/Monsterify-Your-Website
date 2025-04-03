const express = require('express');
const router = express.Router();
const pool = require('../../db');
const Prompt = require('../../models/Prompt');
const PromptCompletion = require('../../models/PromptCompletion');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }
  next();
};

// Prompt Management Dashboard
router.get('/', isAdmin, async (req, res) => {
  try {
    // Ensure the prompt tables exist
    await Prompt.createTableIfNotExists();
    await PromptCompletion.createTableIfNotExists();

    // Get all prompts
    const prompts = await Prompt.getAll();

    // Group prompts by category
    const promptsByCategory = {
      general: [],
      progression: [],
      legendary: [],
      event: [],
      monthly: []
    };

    prompts.forEach(prompt => {
      if (promptsByCategory[prompt.category]) {
        promptsByCategory[prompt.category].push(prompt);
      }
    });

    res.render('admin/prompts/index', {
      title: 'Prompt Management',
      promptsByCategory,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error loading prompts:', error);
    res.status(500).render('error', {
      message: 'Error loading prompts',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Create Prompt Form
router.get('/create', isAdmin, (req, res) => {
  res.render('admin/prompts/form', {
    title: 'Create New Prompt',
    prompt: {},
    isNew: true,
    categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    itemCategories: [
      'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
    ]
  });
});

// Create Prompt Action
router.post('/create', isAdmin, async (req, res) => {
  try {
    const {
      category,
      title,
      description,
      image_url,
      min_trainer_level,
      month,
      repeatable,
      active,
      reward_coins,
      reward_levels,
      reward_items,
      reward_random_items_category,
      reward_random_items_quantity,
      reward_monster_params
    } = req.body;

    // Validate required fields
    if (!category || !title || !description) {
      return res.render('admin/prompts/form', {
        title: 'Create New Prompt',
        message: 'Category, title, and description are required fields',
        messageType: 'error',
        prompt: req.body,
        isNew: true,
        categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
        months: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ],
        itemCategories: [
          'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
        ]
      });
    }

    // Process reward items
    let processedRewardItems = null;
    if (reward_items && typeof reward_items === 'string' && reward_items.trim() !== '') {
      try {
        processedRewardItems = JSON.parse(reward_items);
      } catch (e) {
        console.error('Error parsing reward items:', e);
        return res.render('admin/prompts/form', {
          title: 'Create New Prompt',
          message: 'Invalid JSON format for reward items',
          messageType: 'error',
          prompt: req.body,
          isNew: true,
          categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
          months: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ],
          itemCategories: [
            'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
          ]
        });
      }
    }

    // Process random items
    let processedRandomItems = null;
    if (reward_random_items_category && reward_random_items_quantity) {
      const categories = Array.isArray(reward_random_items_category)
        ? reward_random_items_category
        : [reward_random_items_category];

      const quantities = Array.isArray(reward_random_items_quantity)
        ? reward_random_items_quantity
        : [reward_random_items_quantity];

      if (categories.length === quantities.length) {
        processedRandomItems = {};
        for (let i = 0; i < categories.length; i++) {
          if (categories[i] && quantities[i]) {
            processedRandomItems[categories[i]] = parseInt(quantities[i]);
          }
        }
      }
    }

    // Process monster params
    let processedMonsterParams = null;
    if (reward_monster_params && typeof reward_monster_params === 'string' && reward_monster_params.trim() !== '') {
      try {
        processedMonsterParams = JSON.parse(reward_monster_params);
      } catch (e) {
        console.error('Error parsing monster params:', e);
        return res.render('admin/prompts/form', {
          title: 'Create New Prompt',
          message: 'Invalid JSON format for monster parameters',
          messageType: 'error',
          prompt: req.body,
          isNew: true,
          categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
          months: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ],
          itemCategories: [
            'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
          ]
        });
      }
    }

    // Create the prompt
    const promptData = {
      category,
      title,
      description,
      image_url: image_url || null,
      min_trainer_level: min_trainer_level ? parseInt(min_trainer_level) : 0,
      month: category === 'monthly' ? month : null,
      repeatable: repeatable === 'on',
      active: active === 'on',
      reward_coins: reward_coins ? parseInt(reward_coins) : 0,
      reward_levels: reward_levels ? parseInt(reward_levels) : 0,
      reward_items: processedRewardItems,
      reward_random_items: processedRandomItems,
      reward_monster_params: processedMonsterParams
    };

    const prompt = await Prompt.create(promptData);

    if (!prompt) {
      return res.render('admin/prompts/form', {
        title: 'Create New Prompt',
        message: 'Error creating prompt',
        messageType: 'error',
        prompt: req.body,
        isNew: true,
        categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
        months: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ],
        itemCategories: [
          'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
        ]
      });
    }

    // Redirect to prompt list
    res.redirect('/admin/prompts?message=' + encodeURIComponent('Prompt created successfully'));
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).render('error', {
      message: 'Error creating prompt: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Edit Prompt Form
router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const promptId = req.params.id;

    // Get the prompt
    const prompt = await Prompt.getById(promptId);

    if (!prompt) {
      return res.redirect('/admin/prompts?message=' + encodeURIComponent('Prompt not found') + '&messageType=error');
    }

    // Parse JSON fields for display
    if (prompt.reward_items && typeof prompt.reward_items === 'string') {
      try {
        prompt.reward_items = JSON.parse(prompt.reward_items);
      } catch (e) {
        console.error('Error parsing reward items:', e);
        prompt.reward_items = [];
      }
    }

    if (prompt.reward_random_items && typeof prompt.reward_random_items === 'string') {
      try {
        prompt.reward_random_items = JSON.parse(prompt.reward_random_items);
      } catch (e) {
        console.error('Error parsing random items:', e);
        prompt.reward_random_items = {};
      }
    }

    if (prompt.reward_monster_params && typeof prompt.reward_monster_params === 'string') {
      try {
        prompt.reward_monster_params = JSON.parse(prompt.reward_monster_params);
      } catch (e) {
        console.error('Error parsing monster params:', e);
        prompt.reward_monster_params = null;
      }
    }

    res.render('admin/prompts/form', {
      title: 'Edit Prompt',
      prompt,
      isNew: false,
      categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
      months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      itemCategories: [
        'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
      ]
    });
  } catch (error) {
    console.error('Error loading prompt for edit:', error);
    res.status(500).render('error', {
      message: 'Error loading prompt for edit: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Update Prompt Action
router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const promptId = req.params.id;
    const {
      category,
      title,
      description,
      image_url,
      min_trainer_level,
      month,
      repeatable,
      active,
      reward_coins,
      reward_levels,
      reward_items,
      reward_random_items_category,
      reward_random_items_quantity,
      reward_monster_params
    } = req.body;

    // Validate required fields
    if (!category || !title || !description) {
      return res.render('admin/prompts/form', {
        title: 'Edit Prompt',
        message: 'Category, title, and description are required fields',
        messageType: 'error',
        prompt: { ...req.body, prompt_id: promptId },
        isNew: false,
        categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
        months: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ],
        itemCategories: [
          'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
        ]
      });
    }

    // Process reward items
    let processedRewardItems = null;
    if (reward_items && typeof reward_items === 'string' && reward_items.trim() !== '') {
      try {
        processedRewardItems = JSON.parse(reward_items);
      } catch (e) {
        console.error('Error parsing reward items:', e);
        return res.render('admin/prompts/form', {
          title: 'Edit Prompt',
          message: 'Invalid JSON format for reward items',
          messageType: 'error',
          prompt: { ...req.body, prompt_id: promptId },
          isNew: false,
          categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
          months: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ],
          itemCategories: [
            'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
          ]
        });
      }
    }

    // Process random items
    let processedRandomItems = null;
    if (reward_random_items_category && reward_random_items_quantity) {
      const categories = Array.isArray(reward_random_items_category)
        ? reward_random_items_category
        : [reward_random_items_category];

      const quantities = Array.isArray(reward_random_items_quantity)
        ? reward_random_items_quantity
        : [reward_random_items_quantity];

      if (categories.length === quantities.length) {
        processedRandomItems = {};
        for (let i = 0; i < categories.length; i++) {
          if (categories[i] && quantities[i]) {
            processedRandomItems[categories[i]] = parseInt(quantities[i]);
          }
        }
      }
    }

    // Process monster params
    let processedMonsterParams = null;
    if (reward_monster_params && typeof reward_monster_params === 'string' && reward_monster_params.trim() !== '') {
      try {
        processedMonsterParams = JSON.parse(reward_monster_params);
      } catch (e) {
        console.error('Error parsing monster params:', e);
        return res.render('admin/prompts/form', {
          title: 'Edit Prompt',
          message: 'Invalid JSON format for monster parameters',
          messageType: 'error',
          prompt: { ...req.body, prompt_id: promptId },
          isNew: false,
          categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
          months: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ],
          itemCategories: [
            'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
          ]
        });
      }
    }

    // Update the prompt
    const promptData = {
      category,
      title,
      description,
      image_url: image_url || null,
      min_trainer_level: min_trainer_level ? parseInt(min_trainer_level) : 0,
      month: category === 'monthly' ? month : null,
      repeatable: repeatable === 'on',
      active: active === 'on',
      reward_coins: reward_coins ? parseInt(reward_coins) : 0,
      reward_levels: reward_levels ? parseInt(reward_levels) : 0,
      reward_items: processedRewardItems,
      reward_random_items: processedRandomItems,
      reward_monster_params: processedMonsterParams
    };

    const prompt = await Prompt.update(promptId, promptData);

    if (!prompt) {
      return res.render('admin/prompts/form', {
        title: 'Edit Prompt',
        message: 'Error updating prompt',
        messageType: 'error',
        prompt: { ...req.body, prompt_id: promptId },
        isNew: false,
        categories: ['general', 'progression', 'legendary', 'event', 'monthly'],
        months: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ],
        itemCategories: [
          'BERRIES', 'BALLS', 'ITEMS', 'EVOLUTION', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'
        ]
      });
    }

    // Redirect to prompt list
    res.redirect('/admin/prompts?message=' + encodeURIComponent('Prompt updated successfully'));
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).render('error', {
      message: 'Error updating prompt: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Delete Prompt Action
router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const promptId = req.params.id;

    // Delete the prompt
    const success = await Prompt.delete(promptId);

    if (!success) {
      return res.redirect('/admin/prompts?message=' + encodeURIComponent('Error deleting prompt') + '&messageType=error');
    }

    // Redirect to prompt list
    res.redirect('/admin/prompts?message=' + encodeURIComponent('Prompt deleted successfully'));
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.redirect('/admin/prompts?message=' + encodeURIComponent('Error deleting prompt: ' + error.message) + '&messageType=error');
  }
});

// View Prompt Completions
router.get('/completions', isAdmin, async (req, res) => {
  try {
    // Get all completions
    const completions = await PromptCompletion.getAll();

    res.render('admin/prompts/completions', {
      title: 'Prompt Completions',
      completions,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error loading prompt completions:', error);
    res.status(500).render('error', {
      message: 'Error loading prompt completions: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

module.exports = router;
