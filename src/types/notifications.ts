export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type NotificationStatusFilter = "all" | "unread";

export type NotificationCategoryFilter =
  | "ORDER"
  | "PAYMENT"
  | "HANDOVER"
  | "RETURN";

export type NotificationListItem = {
  id: string;
  notificationType: string;
  category: string;
  severity: NotificationSeverity | string;
  title: string;
  body: string;
  resourceType: string;
  resourceId: string;
  deepLinkUrl?: string | null;
  isActionable: boolean;
  actionUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  occurredAt: string;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type UnreadCountResponse = {
  unreadCount: number;
};

export type MarkAllReadResponse = {
  markedCount: number;
  cutoffUtc: string;
  readAt: string;
};

export type NotificationInboxChangedEvent = {
  changeType: string;
  notificationId?: string | null;
  category?: string | null;
  occurredAt?: string;
};

export type GetNotificationsParams = {
  page?: number;
  pageSize?: number;
  status?: NotificationStatusFilter | string;
  category?: NotificationCategoryFilter | string;
};
