const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/items/use-berry:
 *   post:
 *     summary: Use a berry on a monster
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monsterId
 *               - berryName
 *               - trainerId
 *             properties:
 *               monsterId:
 *                 type: integer
 *                 description: Monster ID
 *               berryName:
 *                 type: string
 *                 description: Berry name
 *               trainerId:
 *                 type: integer
 *                 description: Trainer ID
 *     responses:
 *       200:
 *         description: Berry successfully applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Successfully applied berry to the monster
 *                 monster:
 *                   type: object
 *                   description: Updated monster data
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monster not found
 *       500:
 *         description: Server error
 */
router.post('/use-berry', authenticateToken, itemsController.useBerry);

/**
 * @swagger
 * /api/items/use-pastry:
 *   post:
 *     summary: Use a pastry on a monster
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monsterId
 *               - pastryName
 *               - trainerId
 *             properties:
 *               monsterId:
 *                 type: integer
 *                 description: Monster ID
 *               pastryName:
 *                 type: string
 *                 description: Pastry name
 *               trainerId:
 *                 type: integer
 *                 description: Trainer ID
 *     responses:
 *       200:
 *         description: Pastry successfully applied or selection required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Please select a value for the pastry
 *                 requiresSelection:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monster not found
 *       500:
 *         description: Server error
 */
router.post('/use-pastry', authenticateToken, itemsController.usePastry);

/**
 * @swagger
 * /api/items/apply-pastry:
 *   post:
 *     summary: Apply a pastry with a selected value
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monsterId
 *               - pastryName
 *               - trainerId
 *               - selectedValue
 *             properties:
 *               monsterId:
 *                 type: integer
 *                 description: Monster ID
 *               pastryName:
 *                 type: string
 *                 description: Pastry name
 *               trainerId:
 *                 type: integer
 *                 description: Trainer ID
 *               selectedValue:
 *                 type: string
 *                 description: Selected value for the pastry
 *     responses:
 *       200:
 *         description: Pastry successfully applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Successfully applied pastry to the monster
 *                 monster:
 *                   type: object
 *                   description: Updated monster data
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monster not found
 *       500:
 *         description: Server error
 */
router.post('/apply-pastry', authenticateToken, itemsController.applyPastry);

module.exports = router;
