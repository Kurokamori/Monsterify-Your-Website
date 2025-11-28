const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  getItems,
  createItem,
  updateItem,
  moveItem,
  deleteItem,
  getItemReferences,
  getItemReferenceMatrix,
  addItemReference,
  removeItemReference,
  getUserTrainers,
  getUserMonsters
} = require('../controllers/artTodoController');

// All routes require authentication
router.use(protect);

// List management routes
router.route('/lists')
  .get(getLists)
  .post(createList);

router.route('/lists/:id')
  .get(getListById)
  .put(updateList)
  .delete(deleteList);

// Item management routes
router.route('/lists/:listId/items')
  .get(getItems)
  .post(createItem);

router.route('/items/:id')
  .put(updateItem)
  .delete(deleteItem);

router.put('/items/:id/move', moveItem);

// Reference management routes
router.route('/items/:id/references')
  .get(getItemReferences)
  .post(addItemReference);

router.get('/items/:id/reference-matrix', getItemReferenceMatrix);

router.delete('/references/:id', removeItemReference);

// Helper routes for reference selection
router.get('/trainers', getUserTrainers);
router.get('/monsters', getUserMonsters);

module.exports = router;
