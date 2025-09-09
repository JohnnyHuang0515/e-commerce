const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// 通知模板路由
router.post('/templates', notificationController.createTemplate);
router.get('/templates', notificationController.getTemplates);
router.get('/templates/:id', notificationController.getTemplate);
router.put('/templates/:id', notificationController.updateTemplate);
router.delete('/templates/:id', notificationController.deleteTemplate);

// 通知路由
router.post('/send', notificationController.sendNotification);
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/:id', notificationController.getNotification);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

// 統計路由
router.get('/stats', notificationController.getNotificationStats);

// 處理路由
router.post('/process-pending', notificationController.processPendingNotifications);
router.post('/retry-failed', notificationController.retryFailedNotifications);

module.exports = router;
