import { notificationApi, ApiResponse, PaginatedResponse } from './api';

// 通知模板接口
export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'system';
  category: 'order' | 'payment' | 'user' | 'system' | 'promotion' | 'security';
  variables: string[];
  isActive: boolean;
}

// 通知記錄接口
export interface Notification {
  id: string;
  templateId: string;
  recipientId: string;
  title: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read' | 'unread';
  sentAt?: string;
  scheduledAt?: string;
}

// 通知統計接口
export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalRead: number;
  deliveryRate: number;
  readRate: number;
  byType: Record<string, { sent: number; delivered: number; failed: number; read: number }>;
}

// 通知過濾器接口
export interface NotificationFilter {
  page?: number;
  limit?: number;
  status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read' | 'unread';
  type?: 'email' | 'sms' | 'push' | 'in_app' | 'system';
  category?: 'order' | 'payment' | 'user' | 'system' | 'promotion' | 'security';
  recipientId?: string;
  startDate?: string;
  endDate?: string;
}

// 模板過濾器接口
export interface TemplateFilter {
  type?: string;
  category?: string;
  isActive?: boolean;
}

// 發送通知請求接口
export interface SendNotificationRequest {
  templateId: string;
  recipientId: string;
  recipientType: 'user' | 'admin' | 'system';
  recipientEmail?: string;
  recipientPhone?: string;
  variables: Record<string, any>;
  scheduledAt?: string;
}

// 創建模板請求接口
export interface CreateTemplateRequest {
  name: string;
  title: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'system';
  category: 'order' | 'payment' | 'user' | 'system' | 'promotion' | 'security';
  variables: string[];
  isActive?: boolean;
}


export class NotificationService {

  // 模板管理
  static async createTemplate(templateData: CreateTemplateRequest): Promise<ApiResponse<{ template: NotificationTemplate }>> {
    const response = await notificationApi.post('/templates', templateData);
    return response.data;
  }

  static async getTemplates(filter: TemplateFilter = {}): Promise<ApiResponse<{ templates: NotificationTemplate[] }>> {
    const response = await notificationApi.get('/templates', { params: filter });
    return response.data;
  }

  static async updateTemplate(id: string, templateData: Partial<CreateTemplateRequest>): Promise<ApiResponse<{ template: NotificationTemplate }>> {
    const response = await notificationApi.put(`/templates/${id}`, templateData);
    return response.data;
  }

  static async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    const response = await notificationApi.delete(`/templates/${id}`);
    return response.data;
  }

  // 通知管理
  static async sendNotification(notificationData: SendNotificationRequest): Promise<ApiResponse<{ notification: Notification }>> {
    const response = await notificationApi.post('/send', notificationData);
    return response.data;
  }

  static async getNotifications(filter: NotificationFilter = {}): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const response = await notificationApi.get('/', { params: filter });
    return response.data;
  }

  static async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    const response = await notificationApi.put(`/${notificationId}/read`);
    return response.data;
  }

  // 統計分析
  static async getStats(params?: { startDate?: string, endDate?: string }): Promise<ApiResponse<NotificationStats>> {
    const response = await notificationApi.get('/stats', { params });
    return response.data;
  }

  // 處理操作
  static async processPendingNotifications(limit: number = 100): Promise<ApiResponse<{ processed: number, failed: number }>> {
    const response = await notificationApi.post('/process-pending', { limit });
    return response.data;
  }

  static async retryFailedNotifications(limit: number = 100): Promise<ApiResponse<{ retried: number, failed: number }>> {
    const response = await notificationApi.post('/retry-failed', { limit });
    return response.data;
  }
}

export default NotificationService;
