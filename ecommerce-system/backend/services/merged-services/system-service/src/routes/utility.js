const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');
const { authenticateToken, authorize } = require('../middleware/auth');

// --- File Management ---
router.post('/files/upload', authenticateToken, utilityController.uploadFile);
router.get('/files', authenticateToken, authorize(['ADMIN', 'MANAGER']), utilityController.getFiles);
router.get('/files/:id/download', authenticateToken, utilityController.downloadFile);

// --- Backup & Restore ---
router.post('/backups', authenticateToken, authorize(['ADMIN']), utilityController.createBackup);
router.get('/backups', authenticateToken, authorize(['ADMIN']), utilityController.getBackups);
router.post('/restores', authenticateToken, authorize(['ADMIN']), utilityController.createRestore);

// --- System Stats & Export ---
router.get('/stats', authenticateToken, authorize(['ADMIN', 'MANAGER']), utilityController.getSystemStats);
router.get('/export/csv', authenticateToken, authorize(['ADMIN', 'MANAGER']), utilityController.exportToCsv);

module.exports = router;