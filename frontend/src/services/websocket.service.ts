/**
 * WebSocket service for real-time notifications
 */

import { Notification } from '@/types/notification.types';

// Define event types
export type WebSocketEvent = 
  | { type: 'notification_new'; data: Notification }
  | { type: 'notification_read'; data: { id: number } }
  | { type: 'notification_read_all'; data: null }
  | { type: 'document_processed'; data: { document_id: number } };

// Define event listeners type
type EventListener = (event: WebSocketEvent) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: EventListener[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private baseUrl: string;

  constructor() {
    // Determine WebSocket URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // Use Django's default port (8000) for WebSocket connections
    const port = localStorage.getItem('WS_PORT') || (host === 'localhost' ? '8000' : window.location.port);
    
    this.baseUrl = `${protocol}//${host}:${port}/ws/notifications/`;
  }

  /**
   * Connect to the WebSocket server with the user's auth token
   */
  public connect(token: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected');
      return;
    }

    try {
      // Include auth token in the WebSocket URL
      const url = `${this.baseUrl}?token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(url);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);

      console.log('WebSocket connection initiated');
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log('WebSocket disconnected');
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts = 0;
  }

  /**
   * Add an event listener for WebSocket events
   */
  public addEventListener(listener: EventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove an event listener
   */
  public removeEventListener(listener: EventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Send a message to the WebSocket server
   */
  public send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
    }
  }

  /**
   * Mark a notification as read through WebSocket
   */
  public markAsRead(notificationId: number): void {
    this.send({
      type: 'notification_read',
      data: { id: notificationId }
    });
  }

  /**
   * Mark all notifications as read through WebSocket
   */
  public markAllAsRead(): void {
    this.send({
      type: 'notification_read_all',
      data: null
    });
  }

  private handleOpen(_event: Event): void {
    console.log('WebSocket connection established');
    this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);

    // Attempt to reconnect if the connection was closed unexpectedly
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        const token = localStorage.getItem('token');
        if (token) {
          this.connect(token);
        } else {
          console.error('Cannot reconnect WebSocket: No authentication token found');
        }
      }, delay);
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WebSocketEvent;
      console.log('WebSocket message received:', data);
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        listener(data);
      });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
