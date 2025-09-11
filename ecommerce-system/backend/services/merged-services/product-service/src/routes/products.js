const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorize } = require('../middleware/auth');

// --- Product Management ---
router.get('/', productController.getProducts);
router.post('/', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.createProduct);

// --- Product Statistics ---
router.get('/statistics', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.getProductStatistics);

// --- Individual Product Management ---
router.get('/:id', productController.getProductById);
router.put('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.updateProduct);
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.deleteProduct);
// router.delete('/batch', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.deleteProductsBatch);
// router.put('/:id/status', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.updateProductStatus);
// router.put('/:id/stock', authenticateToken, authorize(['ADMIN', 'MANAGER']), productController.updateProductStock);

// --- Image Management ---
router.post('/v1/images', productController.upload.single('image'), productController.uploadImage);
router.post('/v1/images/batch', productController.upload.array('images', 10), productController.uploadImages);
router.get('/v1/images', productController.getImages);
router.get('/v1/images/:id', productController.getImage);
router.delete('/v1/images/:id', productController.deleteImage);
router.get('/v1/images/stats', productController.getImageStats);

module.exports = router;
