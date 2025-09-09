const express = require('express');
const cors = require('cors');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3017;

// 中間件
app.use(cors());
app.use(express.json());

// 模擬數據
let notifications = [];
let templates = [];

// 健康檢查
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'notification-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      environment: 'development',
      notificationsInMemory: notifications.length,
      templatesInMemory: templates.length
    },
    message: 'Notification service is healthy'
  });
});

// 創建通知模板
app.post('/api/v1/notifications/templates', (req, res) => {
  try {
    const templateData = req.body;
    
    if (!templateData.name || !templateData.title || !templateData.content) {
      return res.status(400).json({
        success: false,
        message: '模板名稱、標題和內容為必填欄位'
      });
    }

    const template = {
      id: Date.now().toString(),
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    templates.push(template);

    res.status(201).json({
      success: true,
      data: template,
      message: '通知模板創建成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '創建通知模板失敗',
      error: error.message
    });
  }
});

// 獲取通知模板列表
app.get('/api/v1/notifications/templates', (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, isActive } = req.query;
    
    let filteredTemplates = [...templates];
    
    if (type) filteredTemplates = filteredTemplates.filter(t => t.type === type);
    if (category) filteredTemplates = filteredTemplates.filter(t => t.category === category);
    if (isActive !== undefined) filteredTemplates = filteredTemplates.filter(t => t.isActive === (isActive === 'true'));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedTemplates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredTemplates.length,
        pages: Math.ceil(filteredTemplates.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取通知模板失敗',
      error: error.message
    });
  }
});

// 發送通知
app.post('/api/v1/notifications/send', (req, res) => {
  try {
    const { templateId, recipientId, recipientType, variables = {}, scheduledAt } = req.body;

    // 查找模板
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '通知模板不存在'
      });
    }

    // 替換變數
    let title = template.title;
    let content = template.content;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(regex, variables[key]);
      content = content.replace(regex, variables[key]);
    });

    // 創建通知記錄
    const notification = {
      id: Date.now().toString(),
      templateId,
      recipientId,
      recipientType,
      title,
      content,
      type: template.type,
      category: template.category,
      status: 'sent',
      priority: 'normal',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      sentAt: new Date(),
      variables,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    notifications.push(notification);

    res.status(201).json({
      success: true,
      data: notification,
      message: '通知發送成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '發送通知失敗',
      error: error.message
    });
  }
});

// 獲取通知列表
app.get('/api/v1/notifications/notifications', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      recipientId, 
      recipientType, 
      status, 
      type, 
      category
    } = req.query;

    let filteredNotifications = [...notifications];
    
    if (recipientId) filteredNotifications = filteredNotifications.filter(n => n.recipientId === recipientId);
    if (recipientType) filteredNotifications = filteredNotifications.filter(n => n.recipientType === recipientType);
    if (status) filteredNotifications = filteredNotifications.filter(n => n.status === status);
    if (type) filteredNotifications = filteredNotifications.filter(n => n.type === type);
    if (category) filteredNotifications = filteredNotifications.filter(n => n.category === category);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredNotifications.length,
        pages: Math.ceil(filteredNotifications.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取通知列表失敗',
      error: error.message
    });
  }
});

// 獲取通知統計
app.get('/api/v1/notifications/stats', (req, res) => {
  try {
    const stats = {
      totalSent: notifications.filter(n => n.status === 'sent').length,
      totalDelivered: notifications.filter(n => n.status === 'delivered').length,
      totalFailed: notifications.filter(n => n.status === 'failed').length,
      totalRead: notifications.filter(n => n.status === 'read').length,
      byType: {},
      byCategory: {},
      dateRange: { start: new Date(), end: new Date() }
    };

    // 按類型統計
    notifications.forEach(notification => {
      if (!stats.byType[notification.type]) {
        stats.byType[notification.type] = { sent: 0, delivered: 0, failed: 0, read: 0 };
      }
      stats.byType[notification.type][notification.status]++;
    });

    // 按類別統計
    notifications.forEach(notification => {
      if (!stats.byCategory[notification.category]) {
        stats.byCategory[notification.category] = { sent: 0, delivered: 0, failed: 0, read: 0 };
      }
      stats.byCategory[notification.category][notification.status]++;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取通知統計失敗',
      error: error.message
    });
  }
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在'
  });
});

// 錯誤處理
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: '內部服務器錯誤',
    error: err.message
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🔔 Notification Service started on port ${PORT}`);
  console.log(`📍 Environment: development`);
  console.log(`📍 Using in-memory storage for testing`);
});
