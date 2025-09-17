import type { AxiosError } from 'axios';
import { notificationApi } from './api';
import type { ApiResponse } from '../types/api';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'system';
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'failed' | 'read' | 'unread';

export interface NotificationRecipient {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  channel?: NotificationChannel;
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

const MOCK_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif-1001',
    title: '訂單已出貨通知',
    content: '訂單 #A-23001 已出貨，預計 3 天內送達。',
    type: 'email',
    status: 'sent',
    createdAt: '2024-03-01T09:30:00Z',
    sentAt: '2024-03-01T09:31:00Z',
    recipients: [
      { id: 'user-1', name: '王小明', email: 'user1@example.com', channel: 'email' },
    ],
  },
  {
    id: 'notif-1002',
    title: '庫存預警通知',
    content: '商品「無線藍牙耳機」庫存不足，請盡快補貨。',
    type: 'in_app',
    status: 'unread',
    createdAt: '2024-03-02T02:10:00Z',
    recipients: [
      { id: 'admin-1', name: '系統管理員', channel: 'in_app' },
    ],
  },
  {
    id: 'notif-1003',
    title: '行銷活動簡訊',
    content: '限時 24 小時，全站 88 折，立即搶購！',
    type: 'sms',
    status: 'failed',
    createdAt: '2024-03-02T08:00:00Z',
    sentAt: '2024-03-02T08:01:00Z',
    recipients: [
      { id: 'user-2', name: '李佳', phone: '+886901234567', channel: 'sms' },
      { id: 'user-3', name: '陳俊', phone: '+886912345678', channel: 'sms' },
    ],
  },
  {
    id: 'notif-1004',
    title: '系統維護通知',
    content: '系統將於 3/5 00:00~02:00 進行維護，期間服務暫停。',
    type: 'push',
    status: 'sent',
    createdAt: '2024-03-03T07:45:00Z',
    sentAt: '2024-03-03T07:46:00Z',
    recipients: [
      { id: 'user-4', name: '張偉', channel: 'push' },
      { id: 'user-5', name: '林怡', channel: 'push' },
    ],
  },
];

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' && error !== null && 'isAxiosError' in error;

const buildMockResponse = (params: NotificationListParams = {}): NotificationListResponse => {
  const { status, type, search, page = 1, limit = 10 } = params;

  let items = [...MOCK_NOTIFICATIONS];

  if (status) {
    items = items.filter((notification) => notification.status === status);
  }

  if (type) {
    items = items.filter((notification) => notification.type === type);
  }

  if (search) {
    const keyword = search.toLowerCase();
    items = items.filter((notification) =>
      notification.title.toLowerCase().includes(keyword) ||
      notification.content.toLowerCase().includes(keyword)
    );
  }

  const start = (page - 1) * limit;
  const pagedItems = items.slice(start, start + limit);

  return {
    items: pagedItems,
    total: items.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
  };
};

const buildMockStats = (notifications: NotificationRecord[]): NotificationStats => {
  return {
    total: notifications.length,
    sent: notifications.filter((item) => item.status === 'sent').length,
    failed: notifications.filter((item) => item.status === 'failed').length,
    read: notifications.filter((item) => item.status === 'read').length,
    unread: notifications.filter((item) => item.status === 'unread').length,
  };
};

export class NotificationService {
  static async getNotifications(params: NotificationListParams = {}): Promise<ApiResponse<NotificationListResponse>> {
    try {
      const response = await notificationApi.get('/v1/notifications', { params });
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入通知資料失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockResponse(params),
    };
  }

  static async getStats(): Promise<ApiResponse<NotificationStats>> {
    try {
      const response = await notificationApi.get('/v1/notifications/stats');
      if (response.data?.success) {
        return response.data;
      }
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error('載入通知統計失敗:', error);
      }
    }

    return {
      success: true,
      data: buildMockStats(MOCK_NOTIFICATIONS),
    };
  }

  static async sendNotification(_request: SendNotificationRequest): Promise<never> {
    return Promise.reject(new Error('通知發送 API 尚未實作，請稍後再試。'));
  }

  static async createNotification(): Promise<never> {
    return Promise.reject(new Error('通知建立 API 尚未實作。'));
  }

  static async updateNotification(): Promise<never> {
    return Promise.reject(new Error('通知更新 API 尚未實作。'));
  }

  static async deleteNotification(): Promise<never> {
    return Promise.reject(new Error('通知刪除 API 尚未實作。'));
  }
}

export default NotificationService;
