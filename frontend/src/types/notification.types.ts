export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  document_title: string | null;
  document_id: number | null;
  time_since: string;
}

export interface NotificationCount {
  unread_count: number;
}
