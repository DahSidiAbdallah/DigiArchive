import api from './api';
import { Notification, NotificationCount } from '@/types/notification.types';

const NOTIFICATIONS_URL = '/notifications';

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get(NOTIFICATIONS_URL);
    return response.data;
  },
  
  /**
   * Get recent notifications (last 5)
   */
  getRecentNotifications: async (): Promise<Notification[]> => {
    const response = await api.get(`${NOTIFICATIONS_URL}/recent/`);
    return response.data;
  },
  
  /**
   * Get count of unread notifications
   */
  getUnreadCount: async (): Promise<NotificationCount> => {
    const response = await api.get(`${NOTIFICATIONS_URL}/unread_count/`);
    return response.data;
  },
  
  /**
   * Mark a notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    await api.post(`${NOTIFICATIONS_URL}/${id}/mark_as_read/`);
  },
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post(`${NOTIFICATIONS_URL}/mark_all_as_read/`);
  }
};
