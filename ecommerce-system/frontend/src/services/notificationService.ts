import { notificationApi } from './api';
import type { ApiResponse } from '../types/api';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'system';
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'failed' | 'read' | 'unread';

export interface NotificationRecipient {
  id: string;
  name?: string;
  email?: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  content: string;
  type: NotificationChannel;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
  recipients: NotificationRecipient[];
  metadata?: Record<string, unknown>;
}

export type Notification = NotificationRecord;

export interface NotificationListParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus | '';
  type?: NotificationChannel | '';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface NotificationListResponse {
  items: NotificationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  read: number;
  unread: number;
}

export interface SendNotificationRequest {
  title: string;
  content: string;
  type: NotificationChannel;
  recipients: NotificationRecipient[];
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
}

const normalizeNotification = (notification: NotificationRecord): NotificationRecord => ({
  ...notification,
  recipients: notification.recipients?.map((recipient) => ({
    id: recipient.id,
    name: recipient.name,
    email: recipient.email,
  })) ?? [],
});

export class NotificationService {
  static async getNotifications(
    params: NotificationListParams = {}
  ): Promise<ApiResponse<NotificationListResponse>> {
    const response = await notificationApi.get('/v1/notifications', { params });
    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: response.data.data.items.map(normalizeNotification),
      },
    };
  }

  static async getStats(): Promise<ApiResponse<NotificationStats>> {
    const response = await notificationApi.get('/v1/notifications/stats');
    return response.data;
  }

  static async sendNotification(_request: SendNotificationRequest): Promise<never> {
    return Promise.reject(new Error('通知發送 API 尚未在後端提供。'));
  }

  static async createNotification(): Promise<never> {
    return Promise.reject(new Error('通知建立 API 尚未解鎖。'));
  }

  static async updateNotification(): Promise<never> {
    return Promise.reject(new Error('通知更新 API 尚未解鎖。'));
  }

  static async deleteNotification(): Promise<never> {
    return Promise.reject(new Error('通知刪除 API 尚未解鎖。'));
  }
}

export default NotificationService;
