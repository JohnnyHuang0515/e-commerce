import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  NotificationService,
  type Notification,
  type NotificationListParams,
  type NotificationListResponse,
  type NotificationStats,
  type SendNotificationRequest,
} from '../services/notificationService';
import type { ApiResponse } from '../types/api';

const NOTIFICATION_STALE_TIME = 2 * 60 * 1000;

export const useNotifications = (params?: NotificationListParams) =>
  useQuery<ApiResponse<NotificationListResponse>>({
    queryKey: ['notifications', params ?? {}],
    queryFn: () => NotificationService.getNotifications(params),
    staleTime: NOTIFICATION_STALE_TIME,
  });

export const useNotificationStats = () =>
  useQuery<ApiResponse<NotificationStats>>({
    queryKey: ['notifications', 'stats'],
    queryFn: () => NotificationService.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export const useSendNotification = () =>
  useMutation<never, Error, SendNotificationRequest>({
    mutationFn: (request) => NotificationService.sendNotification(request),
  });

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NotificationService.createNotification,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'stats'] });
    },
  });
};

export const useUpdateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NotificationService.updateNotification,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'stats'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NotificationService.deleteNotification,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'stats'] });
    },
  });
};

export type { Notification, NotificationListParams };
