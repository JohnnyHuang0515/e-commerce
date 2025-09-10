const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { validateNotification } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');

// --- Notification Management ---
router.get('/', authenticateToken, notificationController.getNotifications);
router.post('/send', authenticateToken, notificationController.sendNotification); // Corresponds to document's POST /send
router.get('/:id', authenticateToken, notificationController.getNotificationById);
router.put('/:id/read', authenticateToken, notificationController.markAsRead); // Corresponds to document's PUT /read

// --- Template Management ---
router.get('/templates', authenticateToken, notificationController.getTemplates);
router.post('/templates', authenticateToken, authorize(['ADMIN', 'MANAGER']), notificationController.createTemplate);
router.put('/templates/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), notificationController.updateTemplate);
router.delete('/templates/:id', authenticateToken, authorize(['ADMIN', 'MANAGER']), notificationController.deleteTemplate);

// --- Analytics ---
router.get('/stats', authenticateToken, authorize(['ADMIN', 'MANAGER']), notificationController.getStats);

// --- System Management ---
router.post('/process-pending', authenticateToken, authorize(['ADMIN']), notificationController.processPending);
router.post('/retry-failed', authenticateToken, authorize(['ADMIN']), notificationController.retryFailed);

module.exports = router;