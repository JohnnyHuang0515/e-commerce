const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticateToken, authorize } = require('../middleware/auth');

// --- Brand Management ---
router.get('/', brandController.getBrands);
router.post('/', authenticateToken, authorize(['ADMIN', 'MANAGER']), brandController.createBrand);
router.get('/:id', brandController.getBrandById);
router.put('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), brandController.updateBrand);
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), brandController.deleteBrand);

module.exports = router;
