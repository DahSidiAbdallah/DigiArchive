import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/services/notification.service';
import { Notification } from '@/types/notification.types';
import websocketService, { WebSocketEvent } from '@/services/websocket.service';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to track if this hook is mounted to avoid state updates after unmount
  const isMounted = useRef(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getRecentNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch recent notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { unread_count } = await notificationService.getUnreadCount();
      setUnreadCount(unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      // Try to use WebSocket first for real-time updates
      try {
        websocketService.markAsRead(id);
      } catch (wsError) {
        console.warn('WebSocket unavailable for mark as read, falling back to HTTP:', wsError);
      }
      
      // Always make the HTTP request for reliability
      await notificationService.markAsRead(id);
      
      // Update local state immediately
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Try to use WebSocket first for real-time updates
      try {
        websocketService.markAllAsRead();
      } catch (wsError) {
        console.warn('WebSocket unavailable for mark all as read, falling back to HTTP:', wsError);
      }
      
      // Always make the HTTP request for reliability
      await notificationService.markAllAsRead();
      
      // Update local state immediately
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Connect to WebSocket and handle real-time notification updates
  useEffect(() => {
    // Set the component as mounted
    isMounted.current = true;
    
    // Set up WebSocket event listener
    const handleWebSocketEvent = (event: WebSocketEvent) => {
      if (!isMounted.current) return;
      
      switch (event.type) {
        case 'notification_new':
          // Add new notification to the list and update unread count
          setNotifications(prev => [event.data, ...prev]);
          setUnreadCount(prev => prev + 1);
          break;
          
        case 'notification_read':
          // Update a notification as read
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === event.data.id 
                ? { ...notification, is_read: true } 
                : notification
            )
          );
          fetchUnreadCount(); // Update the unread count
          break;
          
        case 'notification_read_all':
          // Mark all notifications as read
          setNotifications(prev => 
            prev.map(notification => ({ ...notification, is_read: true }))
          );
          setUnreadCount(0);
          break;
          
        case 'document_processed':
          // When a document is processed (OCR, etc.), fetch notifications
          // as there might be new notifications related to it
          fetchRecentNotifications();
          break;
      }
    };
    
    // Initial data fetch
    fetchUnreadCount();
    
    // Try to connect to WebSocket
    const token = localStorage.getItem('token');
    if (token) {
      // Try to connect WebSocket
      try {
        websocketService.addEventListener(handleWebSocketEvent);
        websocketService.connect(token);
      } catch (err) {
        console.error('Failed to connect to WebSocket:', err);
      }
    }
    
    // Fallback polling mechanism for environments where WebSockets might be blocked
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Check every minute
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      clearInterval(interval);
      websocketService.removeEventListener(handleWebSocketEvent);
      // Don't disconnect the websocket here, as it may be used by other components
      // websocketService.disconnect(); 
    };
  }, [fetchUnreadCount, fetchRecentNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchRecentNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
  };
};
