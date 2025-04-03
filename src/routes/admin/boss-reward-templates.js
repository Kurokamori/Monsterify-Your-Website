const express = require('express');
const router = express.Router();
const BossRewardTemplate = require('../../models/BossRewardTemplate');
const Boss = require('../../models/Boss');
const { ensureAdmin } = require('../../middleware/auth');

// List all templates
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const templates = await BossRewardTemplate.getAll();

    res.render('admin/bosses/reward-templates', {
      title: 'Boss Reward Templates',
      templates,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error loading boss reward templates:', error);
    res.status(500).render('error', {
      message: 'Error loading boss reward templates',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Create template form
router.get('/create', ensureAdmin, (req, res) => {
  res.render('admin/bosses/reward-template-form', {
    title: 'Create Boss Reward Template',
    template: null,
    isEditing: false
  });
});

// Edit template form
router.get('/edit/:id', ensureAdmin, async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await BossRewardTemplate.getById(templateId);

    if (!template) {
      return res.redirect('/admin/bosses/reward-templates?message=Template not found&messageType=error');
    }

    res.render('admin/bosses/reward-template-form', {
      title: 'Edit Boss Reward Template',
      template,
      isEditing: true
    });
  } catch (error) {
    console.error('Error loading template for editing:', error);
    res.status(500).render('error', {
      message: 'Error loading template for editing',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Create template POST
router.post('/create', ensureAdmin, async (req, res) => {
  try {
    // Extract basic data
    const { name, description, coins, levels } = req.body;
    const is_top_damager = req.body.is_top_damager === 'on';

    // Process items
    const items = { items: [] };
    if (Array.isArray(req.body.item_name)) {
      for (let i = 0; i < req.body.item_name.length; i++) {
        const itemName = req.body.item_name[i];
        if (itemName && itemName.trim()) {
          items.items.push({
            name: itemName.trim(),
            quantity: parseInt(req.body.item_quantity[i]) || 1,
            description: req.body.item_description[i] || '',
            category: req.body.item_category[i] || 'ITEMS'
          });
        }
      }
    }

    // Process monsters
    const monsters = { monsters: [] };
    if (Array.isArray(req.body.monster_name)) {
      // Get all the monster_type values
      const monsterTypes = {};
      if (req.body.monster_type) {
        Object.keys(req.body.monster_type).forEach(key => {
          monsterTypes[key] = req.body.monster_type[key];
        });
      }

      for (let i = 0; i < req.body.monster_name.length; i++) {
        const monsterName = req.body.monster_name[i];
        if (monsterName && monsterName.trim()) {
          // Determine if this is a static monster or a roll
          const isStatic = Object.values(monsterTypes)[i] === 'static';

          const monsterData = {
            name: monsterName.trim(),
            description: req.body.monster_description[i] || '',
            is_special: req.body.monster_is_special && req.body.monster_is_special[i] === 'on',
            is_static: isStatic
          };

          // Add static monster fields if applicable
          if (isStatic) {
            monsterData.species1 = req.body.monster_species1 && req.body.monster_species1[i] ? req.body.monster_species1[i].trim() : null;
            monsterData.species2 = req.body.monster_species2 && req.body.monster_species2[i] ? req.body.monster_species2[i].trim() : null;
            monsterData.species3 = req.body.monster_species3 && req.body.monster_species3[i] ? req.body.monster_species3[i].trim() : null;
            monsterData.type1 = req.body.monster_type1 && req.body.monster_type1[i] ? req.body.monster_type1[i].trim() : null;
            monsterData.type2 = req.body.monster_type2 && req.body.monster_type2[i] ? req.body.monster_type2[i].trim() : null;
            monsterData.type3 = req.body.monster_type3 && req.body.monster_type3[i] ? req.body.monster_type3[i].trim() : null;
            monsterData.type4 = req.body.monster_type4 && req.body.monster_type4[i] ? req.body.monster_type4[i].trim() : null;
            monsterData.type5 = req.body.monster_type5 && req.body.monster_type5[i] ? req.body.monster_type5[i].trim() : null;
            monsterData.attribute = req.body.monster_attribute && req.body.monster_attribute[i] ? req.body.monster_attribute[i].trim() : null;
          }

          monsters.monsters.push(monsterData);
        }
      }
    }

    // Create template
    const templateData = {
      name,
      description: description || '',
      coins: parseInt(coins) || 0,
      levels: parseInt(levels) || 0,
      items,
      monsters,
      is_top_damager
    };

    const template = await BossRewardTemplate.create(templateData);

    if (!template) {
      return res.status(500).render('admin/bosses/reward-template-form', {
        title: 'Create Boss Reward Template',
        template: templateData,
        isEditing: false,
        message: 'Error creating template',
        messageType: 'error'
      });
    }

    res.redirect('/admin/bosses/reward-templates?message=Template created successfully');
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).render('error', {
      message: 'Error creating template',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Update template POST
router.post('/edit/:id', ensureAdmin, async (req, res) => {
  try {
    const templateId = req.params.id;

    // Extract basic data
    const { name, description, coins, levels } = req.body;
    const is_top_damager = req.body.is_top_damager === 'on';

    // Process items
    const items = { items: [] };
    if (Array.isArray(req.body.item_name)) {
      for (let i = 0; i < req.body.item_name.length; i++) {
        const itemName = req.body.item_name[i];
        if (itemName && itemName.trim()) {
          items.items.push({
            name: itemName.trim(),
            quantity: parseInt(req.body.item_quantity[i]) || 1,
            description: req.body.item_description[i] || '',
            category: req.body.item_category[i] || 'ITEMS'
          });
        }
      }
    }

    // Process monsters
    const monsters = { monsters: [] };
    if (Array.isArray(req.body.monster_name)) {
      // Get all the monster_type values
      const monsterTypes = {};
      if (req.body.monster_type) {
        Object.keys(req.body.monster_type).forEach(key => {
          monsterTypes[key] = req.body.monster_type[key];
        });
      }

      for (let i = 0; i < req.body.monster_name.length; i++) {
        const monsterName = req.body.monster_name[i];
        if (monsterName && monsterName.trim()) {
          // Determine if this is a static monster or a roll
          const isStatic = Object.values(monsterTypes)[i] === 'static';

          const monsterData = {
            name: monsterName.trim(),
            description: req.body.monster_description[i] || '',
            is_special: req.body.monster_is_special && req.body.monster_is_special[i] === 'on',
            is_static: isStatic
          };

          // Add static monster fields if applicable
          if (isStatic) {
            monsterData.species1 = req.body.monster_species1 && req.body.monster_species1[i] ? req.body.monster_species1[i].trim() : null;
            monsterData.species2 = req.body.monster_species2 && req.body.monster_species2[i] ? req.body.monster_species2[i].trim() : null;
            monsterData.species3 = req.body.monster_species3 && req.body.monster_species3[i] ? req.body.monster_species3[i].trim() : null;
            monsterData.type1 = req.body.monster_type1 && req.body.monster_type1[i] ? req.body.monster_type1[i].trim() : null;
            monsterData.type2 = req.body.monster_type2 && req.body.monster_type2[i] ? req.body.monster_type2[i].trim() : null;
            monsterData.type3 = req.body.monster_type3 && req.body.monster_type3[i] ? req.body.monster_type3[i].trim() : null;
            monsterData.type4 = req.body.monster_type4 && req.body.monster_type4[i] ? req.body.monster_type4[i].trim() : null;
            monsterData.type5 = req.body.monster_type5 && req.body.monster_type5[i] ? req.body.monster_type5[i].trim() : null;
            monsterData.attribute = req.body.monster_attribute && req.body.monster_attribute[i] ? req.body.monster_attribute[i].trim() : null;
          }

          monsters.monsters.push(monsterData);
        }
      }
    }

    // Update template
    const templateData = {
      name,
      description: description || '',
      coins: parseInt(coins) || 0,
      levels: parseInt(levels) || 0,
      items,
      monsters,
      is_top_damager
    };

    const template = await BossRewardTemplate.update(templateId, templateData);

    if (!template) {
      return res.status(500).render('admin/bosses/reward-template-form', {
        title: 'Edit Boss Reward Template',
        template: { ...templateData, template_id: templateId },
        isEditing: true,
        message: 'Error updating template',
        messageType: 'error'
      });
    }

    res.redirect('/admin/bosses/reward-templates?message=Template updated successfully');
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).render('error', {
      message: 'Error updating template',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Delete template
router.get('/delete/:id', ensureAdmin, async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await BossRewardTemplate.getById(templateId);

    if (!template) {
      return res.redirect('/admin/bosses/reward-templates?message=Template not found&messageType=error');
    }

    res.render('admin/bosses/delete-template', {
      title: 'Delete Boss Reward Template',
      template
    });
  } catch (error) {
    console.error('Error loading template for deletion:', error);
    res.status(500).render('error', {
      message: 'Error loading template for deletion',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Delete template POST
router.post('/delete/:id', ensureAdmin, async (req, res) => {
  try {
    const templateId = req.params.id;
    const success = await BossRewardTemplate.delete(templateId);

    if (!success) {
      return res.redirect('/admin/bosses/reward-templates?message=Error deleting template&messageType=error');
    }

    res.redirect('/admin/bosses/reward-templates?message=Template deleted successfully');
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).render('error', {
      message: 'Error deleting template',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Assign templates to boss
router.get('/assign/:bossId', ensureAdmin, async (req, res) => {
  try {
    const bossId = req.params.bossId;
    const boss = await Boss.getById(bossId);

    if (!boss) {
      return res.redirect('/admin/bosses?message=Boss not found&messageType=error');
    }

    const assignedTemplates = await BossRewardTemplate.getAssignedTemplates(bossId);
    const availableTemplates = await BossRewardTemplate.getAvailableTemplates(bossId);

    res.render('admin/bosses/assign-templates', {
      title: `Assign Reward Templates to ${boss.name}`,
      boss,
      assignedTemplates,
      availableTemplates,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error loading templates for assignment:', error);
    res.status(500).render('error', {
      message: 'Error loading templates for assignment',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Assign templates to boss POST
router.post('/assign-template', ensureAdmin, async (req, res) => {
  try {
    const { boss_id, template_ids } = req.body;

    if (!boss_id) {
      return res.redirect('/admin/bosses?message=Boss ID is required&messageType=error');
    }

    if (!template_ids || !Array.isArray(template_ids) || template_ids.length === 0) {
      return res.redirect(`/admin/bosses/reward-templates/assign/${boss_id}?message=No templates selected&messageType=error`);
    }

    // Assign each template
    for (const templateId of template_ids) {
      await BossRewardTemplate.assignToBoss(boss_id, templateId);
    }

    res.redirect(`/admin/bosses/reward-templates/assign/${boss_id}?message=Templates assigned successfully`);
  } catch (error) {
    console.error('Error assigning templates:', error);
    res.status(500).render('error', {
      message: 'Error assigning templates',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Unassign template from boss POST
router.post('/unassign-template', ensureAdmin, async (req, res) => {
  try {
    const { boss_id, template_id } = req.body;

    if (!boss_id || !template_id) {
      return res.redirect('/admin/bosses?message=Boss ID and Template ID are required&messageType=error');
    }

    const success = await BossRewardTemplate.unassignFromBoss(boss_id, template_id);

    if (!success) {
      return res.redirect(`/admin/bosses/reward-templates/assign/${boss_id}?message=Error unassigning template&messageType=error`);
    }

    res.redirect(`/admin/bosses/reward-templates/assign/${boss_id}?message=Template unassigned successfully`);
  } catch (error) {
    console.error('Error unassigning template:', error);
    res.status(500).render('error', {
      message: 'Error unassigning template',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

module.exports = router;
