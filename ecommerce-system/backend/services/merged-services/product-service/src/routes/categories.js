const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorize } = require('../middleware/auth');

// --- Category Management ---
router.get('/', categoryController.getCategories);
router.post('/', authenticateToken, authorize(['ADMIN', 'MANAGER']), categoryController.createCategory);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), categoryController.updateCategory);
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), categoryController.deleteCategory);

module.exports = router;
