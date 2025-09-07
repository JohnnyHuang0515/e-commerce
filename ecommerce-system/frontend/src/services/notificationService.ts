import { notificationApi, ApiResponse } from './api';

// 通知模板接口
export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'system';
  category: 'order' | 'payment' | 'user' | 'system' | 'promotion' | 'security';
  variables: Array<{
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 通知記錄接口
export interface Notification {
  id: string;
  templateId: string;
  recipientId: string;
  recipientType: 'user' | 'admin' | 'system';
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'system';
  category: 'order' | 'payment' | 'user' | 'system' | 'promotion' | 'security';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read' | 'unread';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  metadata: Record<string, any>;
  variables: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// 通知統計接口
export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalRead: number;
  byType: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
    read: number;
  }>;
  byCategory: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
    read: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

// 通知過濾器接口
export interface NotificationFilter {
  recipientId?: string;
  recipientType?: string;
  status?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// 模板過濾器接口
export interface TemplateFilter {
  type?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
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
  variables: Array<{
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
  isActive?: boolean;
}

// 分頁響應接口
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class NotificationService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // 模板管理
  async createTemplate(templateData: CreateTemplateRequest): Promise<ApiResponse<NotificationTemplate>> {
    const response = await notificationApi.post('/notifications/templates', templateData);
    return response.data;
  }

  async getTemplates(filter: TemplateFilter = {}): Promise<PaginatedResponse<NotificationTemplate>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await notificationApi.get(`/notifications/templates?${params.toString()}`);
    return response.data;
  }

  async getTemplate(id: string): Promise<ApiResponse<NotificationTemplate>> {
    const response = await notificationApi.get(`/notifications/templates/${id}`);
    return response.data;
  }

  async updateTemplate(id: string, templateData: Partial<CreateTemplateRequest>): Promise<ApiResponse<NotificationTemplate>> {
    const response = await notificationApi.put(`/notifications/templates/${id}`, templateData);
    return response.data;
  }

  async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    const response = await notificationApi.delete(`/notifications/templates/${id}`);
    return response.data;
  }

  // 通知管理
  async sendNotification(notificationData: SendNotificationRequest): Promise<ApiResponse<Notification>> {
    const response = await notificationApi.post('/notifications/send', notificationData);
    return response.data;
  }

  async getNotifications(filter: NotificationFilter = {}): Promise<PaginatedResponse<Notification>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await notificationApi.get(`/notifications/notifications?${params.toString()}`);
    return response.data;
  }

  async getNotification(id: string): Promise<ApiResponse<Notification>> {
    const response = await notificationApi.get(`/notifications/notifications/${id}`);
    return response.data;
  }

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await notificationApi.put(`/notifications/notifications/${id}/read`);
    return response.data;
  }

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    const response = await notificationApi.delete(`/notifications/notifications/${id}`);
    return response.data;
  }

  // 統計分析
  async getStats(startDate?: string, endDate?: string): Promise<ApiResponse<NotificationStats>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await notificationApi.get(`/notifications/stats?${params.toString()}`);
    return response.data;
  }

  // 處理操作
  async processPendingNotifications(limit: number = 100): Promise<ApiResponse<Array<{id: string, status: string, error?: string}>>> {
    const response = await notificationApi.post(`/notifications/process-pending?limit=${limit}`);
    return response.data;
  }

  async retryFailedNotifications(limit: number = 100): Promise<ApiResponse<Array<{id: string, status: string, error?: string}>>> {
    const response = await notificationApi.post(`/notifications/retry-failed?limit=${limit}`);
    return response.data;
  }

  // 健康檢查
  async getHealthStatus(): Promise<ApiResponse<any>> {
    const response = await notificationApi.get('/health');
    return response.data;
  }
}

// 創建服務實例
export const notificationService = new NotificationService(`${notificationApi.defaults.baseURL}`);
