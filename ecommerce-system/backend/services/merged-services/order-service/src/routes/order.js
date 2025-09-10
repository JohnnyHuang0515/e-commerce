const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

// --- 🛒 Order Management ---
router.get('/', authenticateToken, orderController.getOrders);
router.post('/', authenticateToken, validateOrder.create, orderController.createOrder);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.put('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), validateOrder.update, orderController.updateOrder);
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.deleteOrder);

// --- Order Status Management ---
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder);
router.put('/:id/confirm', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.confirmOrder);
router.put('/:id/ship', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.shipOrder);
router.put('/:id/complete', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.completeOrder);
router.put('/:id/return', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.returnOrder);

// --- 📈 Order Statistics ---
router.get('/stats', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.getOrderStats);
router.get('/overview', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.getOrderOverview);

// --- 📄 Order Export ---
router.get('/export', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.exportOrders);

// --- 🔄 Batch Operations ---
router.put('/batch-status', authenticateToken, authorize(['ADMIN', 'MANAGER']), orderController.batchUpdateStatus);

module.exports = router;