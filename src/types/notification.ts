export type NotificationType = 'order' | 'offer' | 'alert' | 'service' | 'payment' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationListData {
  notifications: Notification[];
  unread_count: number;
}
