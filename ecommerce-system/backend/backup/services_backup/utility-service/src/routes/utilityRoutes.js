const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');

// 檔案管理路由
router.post('/files/upload', utilityController.uploadFiles.bind(utilityController));
router.get('/files', utilityController.getFiles.bind(utilityController));
router.get('/files/:id', utilityController.getFile.bind(utilityController));
router.get('/files/:id/download', utilityController.downloadFile.bind(utilityController));
router.delete('/files/:id', utilityController.deleteFile.bind(utilityController));

// 備份管理路由
router.post('/backups', utilityController.createBackup.bind(utilityController));
router.get('/backups', utilityController.getBackups.bind(utilityController));

// 還原管理路由
router.post('/restores', utilityController.createRestore.bind(utilityController));
router.get('/restores', utilityController.getRestores.bind(utilityController));

// 統計路由
router.get('/stats', utilityController.getSystemStats.bind(utilityController));

// 匯出路由
router.get('/export/csv', utilityController.exportToCSV.bind(utilityController));

module.exports = router;
