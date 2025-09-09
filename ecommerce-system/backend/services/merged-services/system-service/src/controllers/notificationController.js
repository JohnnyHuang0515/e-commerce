const { Notification } = require('../models');
const nodemailer = require('nodemailer');

// 獲取通知列表
const getNotifications = async (req, res) => {
  try {
    const { status, type, priority, page = 1, limit = 10 } = req.query;
    
    const matchConditions = {};
    if (status) {
      matchConditions.status = status;
    }
    if (type) {
      matchConditions.type = type;
    }
    if (priority) {
      matchConditions.priority = priority;
    }

    const notifications = await Notification.find(matchConditions)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(matchConditions);

    res.json({
      success: true,
      data: {
        notifications: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取通知列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知列表時發生錯誤'
    });
  }
};

// 創建通知
const createNotification = async (req, res) => {
  try {
    const { user_id, type, title, message, data = {}, priority = 'normal', scheduled_at } = req.body;

    const notification = new Notification({
      user_id,
      type,
      title,
      message,
      data,
      priority,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : new Date()
    });

    await notification.save();

    // 如果是立即發送，則嘗試發送通知
    if (!scheduled_at || new Date(scheduled_at) <= new Date()) {
      await sendNotificationHelper(notification);
    }

    res.status(201).json({
      success: true,
      message: '通知創建成功',
      data: notification
    });
  } catch (error) {
    console.error('創建通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建通知時發生錯誤'
    });
  }
};

// 批量創建通知
const createBulkNotifications = async (req, res) => {
  try {
    const { user_ids, type, title, message, data = {}, priority = 'normal', scheduled_at } = req.body;

    const notifications = user_ids.map(user_id => ({
      user_id,
      type,
      title,
      message,
      data,
      priority,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : new Date()
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    // 如果是立即發送，則嘗試發送所有通知
    if (!scheduled_at || new Date(scheduled_at) <= new Date()) {
      for (const notification of createdNotifications) {
        await sendNotificationHelper(notification);
      }
    }

    res.status(201).json({
      success: true,
      message: '批量通知創建成功',
      data: {
        created_count: createdNotifications.length,
        notifications: createdNotifications
      }
    });
  } catch (error) {
    console.error('批量創建通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '批量創建通知時發生錯誤'
    });
  }
};

// 獲取通知詳情
const getNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
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
    console.error('獲取通知詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知詳情時發生錯誤'
    });
  }
};

// 更新通知
const updateNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { title, message, data, priority, scheduled_at } = req.body;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (data !== undefined) updateData.data = data;
    if (priority !== undefined) updateData.priority = priority;
    if (scheduled_at !== undefined) updateData.scheduled_at = new Date(scheduled_at);

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: '通知更新成功',
      data: updatedNotification
    });
  } catch (error) {
    console.error('更新通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新通知時發生錯誤'
    });
  }
};

// 刪除通知
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({
      success: true,
      message: '通知刪除成功'
    });
  } catch (error) {
    console.error('刪除通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除通知時發生錯誤'
    });
  }
};

// 發送通知
const sendNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await sendNotificationHelper(notification);

    res.json({
      success: true,
      message: '通知發送成功'
    });
  } catch (error) {
    console.error('發送通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '發送通知時發生錯誤'
    });
  }
};

// 標記通知為已讀
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await Notification.findByIdAndUpdate(notificationId, {
      status: 'read',
      read_at: new Date()
    });

    res.json({
      success: true,
      message: '通知已標記為已讀'
    });
  } catch (error) {
    console.error('標記通知已讀錯誤:', error);
    res.status(500).json({
      success: false,
      message: '標記通知已讀時發生錯誤'
    });
  }
};

// 獲取通知模板
const getTemplates = async (req, res) => {
  try {
    const { type } = req.query;
    
    const templates = [
      {
        id: 'welcome',
        name: '歡迎通知',
        type: 'email',
        subject: '歡迎加入我們！',
        content: '親愛的 {{user_name}}，歡迎加入我們的平台！',
        variables: ['user_name']
      },
      {
        id: 'order_confirmation',
        name: '訂單確認',
        type: 'email',
        subject: '訂單確認 - {{order_id}}',
        content: '您的訂單 {{order_id}} 已確認，總金額：{{total_amount}}',
        variables: ['order_id', 'total_amount']
      },
      {
        id: 'password_reset',
        name: '密碼重置',
        type: 'email',
        subject: '密碼重置請求',
        content: '請點擊以下連結重置您的密碼：{{reset_link}}',
        variables: ['reset_link']
      },
      {
        id: 'system_maintenance',
        name: '系統維護',
        type: 'in_app',
        subject: '系統維護通知',
        content: '系統將於 {{maintenance_time}} 進行維護，預計持續 {{duration}}',
        variables: ['maintenance_time', 'duration']
      }
    ];

    let filteredTemplates = templates;
    if (type) {
      filteredTemplates = templates.filter(template => template.type === type);
    }

    res.json({
      success: true,
      data: {
        templates: filteredTemplates
      }
    });
  } catch (error) {
    console.error('獲取通知模板錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知模板時發生錯誤'
    });
  }
};

// 獲取通知分析
const getAnalytics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const matchConditions = {};
    if (start_date && end_date) {
      matchConditions.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const analytics = await Notification.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total_notifications: { $sum: 1 },
          sent_notifications: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          delivered_notifications: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed_notifications: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          read_notifications: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } }
        }
      },
      {
        $project: {
          total_notifications: 1,
          sent_notifications: 1,
          delivered_notifications: 1,
          failed_notifications: 1,
          read_notifications: 1,
          delivery_rate: {
            $round: [
              { $divide: ['$delivered_notifications', '$sent_notifications'] },
              4
            ]
          },
          read_rate: {
            $round: [
              { $divide: ['$read_notifications', '$delivered_notifications'] },
              4
            ]
          }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          start_date: start_date,
          end_date: end_date
        },
        overview: analytics[0] || {
          total_notifications: 0,
          sent_notifications: 0,
          delivered_notifications: 0,
          failed_notifications: 0,
          read_notifications: 0,
          delivery_rate: 0,
          read_rate: 0
        },
        type_stats: typeStats
      }
    });
  } catch (error) {
    console.error('獲取通知分析錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知分析時發生錯誤'
    });
  }
};

// 輔助函數：發送通知
const sendNotificationHelper = async (notification) => {
  try {
    let success = false;
    let errorMessage = '';

    switch (notification.type) {
      case 'email':
        success = await sendEmail(notification);
        break;
      case 'sms':
        success = await sendSMS(notification);
        break;
      case 'push':
        success = await sendPushNotification(notification);
        break;
      case 'in_app':
        success = await sendInAppNotification(notification);
        break;
      case 'webhook':
        success = await sendWebhook(notification);
        break;
      default:
        errorMessage = '不支援的通知類型';
    }

    // 更新通知狀態
    await Notification.findByIdAndUpdate(notification._id, {
      status: success ? 'sent' : 'failed',
      sent_at: success ? new Date() : undefined,
      error_message: success ? undefined : errorMessage,
      $inc: { retry_count: 1 }
    });

    return success;
  } catch (error) {
    console.error('發送通知錯誤:', error);
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'failed',
      error_message: error.message,
      $inc: { retry_count: 1 }
    });
    return false;
  }
};

// 輔助函數：發送郵件
const sendEmail = async (notification) => {
  try {
    // 模擬郵件發送
    console.log(`發送郵件給用戶 ${notification.user_id}: ${notification.title}`);
    return true;
  } catch (error) {
    console.error('發送郵件錯誤:', error);
    return false;
  }
};

// 輔助函數：發送簡訊
const sendSMS = async (notification) => {
  try {
    // 模擬簡訊發送
    console.log(`發送簡訊給用戶 ${notification.user_id}: ${notification.message}`);
    return true;
  } catch (error) {
    console.error('發送簡訊錯誤:', error);
    return false;
  }
};

// 輔助函數：發送推送通知
const sendPushNotification = async (notification) => {
  try {
    // 模擬推送通知發送
    console.log(`發送推送通知給用戶 ${notification.user_id}: ${notification.title}`);
    return true;
  } catch (error) {
    console.error('發送推送通知錯誤:', error);
    return false;
  }
};

// 輔助函數：發送應用內通知
const sendInAppNotification = async (notification) => {
  try {
    // 模擬應用內通知發送
    console.log(`發送應用內通知給用戶 ${notification.user_id}: ${notification.title}`);
    return true;
  } catch (error) {
    console.error('發送應用內通知錯誤:', error);
    return false;
  }
};

// 輔助函數：發送 Webhook
const sendWebhook = async (notification) => {
  try {
    // 模擬 Webhook 發送
    console.log(`發送 Webhook 給用戶 ${notification.user_id}: ${notification.title}`);
    return true;
  } catch (error) {
    console.error('發送 Webhook 錯誤:', error);
    return false;
  }
};

module.exports = {
  getNotifications,
  createNotification,
  createBulkNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
  sendNotification,
  markAsRead,
  getTemplates,
  getAnalytics
};
