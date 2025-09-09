const { NotificationTemplate, Notification, NotificationStats } = require('../models/Notification');
const nodemailer = require('nodemailer');
const moment = require('moment');

class NotificationController {
  constructor() {
    this.transporter = null;
    this.initializeEmailTransporter();
  }

  // 初始化郵件傳輸器
  initializeEmailTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // 創建通知模板
  async createTemplate(req, res) {
    try {
      const templateData = req.body;
      
      // 驗證必填欄位
      if (!templateData.name || !templateData.title || !templateData.content) {
        return res.status(400).json({
          success: false,
          message: '模板名稱、標題和內容為必填欄位'
        });
      }

      const template = new NotificationTemplate(templateData);
      await template.save();

      res.status(201).json({
        success: true,
        data: template,
        message: '通知模板創建成功'
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: '模板名稱已存在'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '創建通知模板失敗',
        error: error.message
      });
    }
  }

  // 獲取通知模板列表
  async getTemplates(req, res) {
    try {
      const { page = 1, limit = 10, type, category, isActive } = req.query;
      const filter = {};
      
      if (type) filter.type = type;
      if (category) filter.category = category;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const templates = await NotificationTemplate.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await NotificationTemplate.countDocuments(filter);

      res.json({
        success: true,
        data: templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取通知模板失敗',
        error: error.message
      });
    }
  }

  // 獲取單個通知模板
  async getTemplate(req, res) {
    try {
      const template = await NotificationTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '通知模板不存在'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取通知模板失敗',
        error: error.message
      });
    }
  }

  // 更新通知模板
  async updateTemplate(req, res) {
    try {
      const template = await NotificationTemplate.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!template) {
        return res.status(404).json({
          success: false,
          message: '通知模板不存在'
        });
      }

      res.json({
        success: true,
        data: template,
        message: '通知模板更新成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新通知模板失敗',
        error: error.message
      });
    }
  }

  // 刪除通知模板
  async deleteTemplate(req, res) {
    try {
      const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '通知模板不存在'
        });
      }

      res.json({
        success: true,
        message: '通知模板刪除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '刪除通知模板失敗',
        error: error.message
      });
    }
  }

  // 發送通知
  async sendNotification(req, res) {
    try {
      const { templateId, recipientId, recipientType, variables = {}, scheduledAt } = req.body;

      // 獲取模板
      const template = await NotificationTemplate.findById(templateId);
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
      const notification = new Notification({
        templateId,
        recipientId,
        recipientType,
        title,
        content,
        type: template.type,
        category: template.category,
        variables,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date()
      });

      await notification.save();

      // 如果是立即發送，則處理發送
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        await this.processNotification(notification);
      }

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
  }

  // 處理通知發送
  async processNotification(notification) {
    try {
      switch (notification.type) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'push':
          await this.sendPush(notification);
          break;
        case 'in_app':
          await this.sendInApp(notification);
          break;
        case 'system':
          await this.sendSystem(notification);
          break;
        default:
          throw new Error(`不支援的通知類型: ${notification.type}`);
      }
    } catch (error) {
      await notification.markAsFailed(error.message);
      throw error;
    }
  }

  // 發送郵件
  async sendEmail(notification) {
    if (!this.transporter) {
      throw new Error('郵件傳輸器未初始化');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@ecommerce.com',
      to: notification.recipientEmail,
      subject: notification.title,
      html: notification.content
    };

    await this.transporter.sendMail(mailOptions);
    await notification.markAsSent();
  }

  // 發送簡訊 (模擬)
  async sendSMS(notification) {
    // 模擬簡訊發送
    console.log(`SMS sent to ${notification.recipientPhone}: ${notification.title}`);
    await notification.markAsSent();
  }

  // 發送推播 (模擬)
  async sendPush(notification) {
    // 模擬推播發送
    console.log(`Push notification sent to ${notification.recipientId}: ${notification.title}`);
    await notification.markAsSent();
  }

  // 發送應用內通知 (模擬)
  async sendInApp(notification) {
    // 模擬應用內通知
    console.log(`In-app notification sent to ${notification.recipientId}: ${notification.title}`);
    await notification.markAsSent();
  }

  // 發送系統通知 (模擬)
  async sendSystem(notification) {
    // 模擬系統通知
    console.log(`System notification sent to ${notification.recipientId}: ${notification.title}`);
    await notification.markAsSent();
  }

  // 獲取通知列表
  async getNotifications(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        recipientId, 
        recipientType, 
        status, 
        type, 
        category,
        startDate,
        endDate
      } = req.query;

      const filter = {};
      
      if (recipientId) filter.recipientId = recipientId;
      if (recipientType) filter.recipientType = recipientType;
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (category) filter.category = category;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const notifications = await Notification.find(filter)
        .populate('templateId', 'name type category')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Notification.countDocuments(filter);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取通知列表失敗',
        error: error.message
      });
    }
  }

  // 獲取單個通知
  async getNotification(req, res) {
    try {
      const notification = await Notification.findById(req.params.id)
        .populate('templateId', 'name type category');

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取通知失敗',
        error: error.message
      });
    }
  }

  // 標記通知為已讀
  async markAsRead(req, res) {
    try {
      const notification = await Notification.findById(req.params.id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        });
      }

      await notification.markAsRead();

      res.json({
        success: true,
        data: notification,
        message: '通知已標記為已讀'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '標記通知失敗',
        error: error.message
      });
    }
  }

  // 刪除通知
  async deleteNotification(req, res) {
    try {
      const notification = await Notification.findByIdAndDelete(req.params.id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        });
      }

      res.json({
        success: true,
        message: '通知刪除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '刪除通知失敗',
        error: error.message
      });
    }
  }

  // 獲取通知統計
  async getNotificationStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
      const end = endDate ? new Date(endDate) : new Date();

      const stats = await Notification.getStatsByDateRange(start, end);
      
      // 處理統計數據
      const result = {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalRead: 0,
        byType: {},
        byCategory: {},
        dateRange: { start, end }
      };

      if (stats.length > 0) {
        const stat = stats[0];
        result.totalSent = stat.totalSent;
        result.totalDelivered = stat.totalDelivered;
        result.totalFailed = stat.totalFailed;
        result.totalRead = stat.totalRead;

        // 按類型統計
        stat.byType.forEach(item => {
          if (!result.byType[item.type]) {
            result.byType[item.type] = { sent: 0, delivered: 0, failed: 0, read: 0 };
          }
          result.byType[item.type][item.status]++;
        });

        // 按類別統計
        stat.byCategory.forEach(item => {
          if (!result.byCategory[item.category]) {
            result.byCategory[item.category] = { sent: 0, delivered: 0, failed: 0, read: 0 };
          }
          result.byCategory[item.category][item.status]++;
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取通知統計失敗',
        error: error.message
      });
    }
  }

  // 處理待發送通知
  async processPendingNotifications(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const notifications = await Notification.getPendingNotifications(limit);
      
      const results = [];
      for (const notification of notifications) {
        try {
          await this.processNotification(notification);
          results.push({ id: notification._id, status: 'success' });
        } catch (error) {
          results.push({ id: notification._id, status: 'failed', error: error.message });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `處理了 ${notifications.length} 個待發送通知`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '處理待發送通知失敗',
        error: error.message
      });
    }
  }

  // 重試失敗的通知
  async retryFailedNotifications(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const notifications = await Notification.getFailedNotifications(limit);
      
      const results = [];
      for (const notification of notifications) {
        try {
          await this.processNotification(notification);
          results.push({ id: notification._id, status: 'success' });
        } catch (error) {
          results.push({ id: notification._id, status: 'failed', error: error.message });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `重試了 ${notifications.length} 個失敗通知`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '重試失敗通知失敗',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();
