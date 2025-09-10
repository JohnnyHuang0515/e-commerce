const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorize } = require('../middleware/auth');

// --- Product Management ---
router.get('/', productController.getProducts);
router.post('/', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.createProduct);
router.get('/:id', productController.getProductById);
router.put('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.updateProduct);
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.deleteProduct);
router.delete('/batch', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.deleteProductsBatch);
router.put('/:id/status', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.updateProductStatus);
router.put('/:id/stock', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.updateProductStock);

// --- Image Management ---
router.post('/upload-image', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.uploadProductImage);

// --- Product Statistics ---
router.get('/stats', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.getProductStats);

module.exports = router;
