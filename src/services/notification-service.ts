import { API_ENDPOINTS } from "../config/api-endpoints.ts";
import { authApiClient, authApiClientJson } from "./api-client.ts";
import type {
  GetNotificationsParams,
  MarkAllReadResponse,
  NotificationListResponse,
  UnreadCountResponse,
} from "../types/notifications.ts";

export async function getNotifications(
  params?: GetNotificationsParams,
  signal?: AbortSignal,
): Promise<NotificationListResponse> {
  return authApiClientJson<NotificationListResponse>(
    API_ENDPOINTS.backend.notifications.list(params ?? {}),
    { cache: "no-store", signal },
  );
}

export async function getUnreadCount(
  signal?: AbortSignal,
): Promise<UnreadCountResponse> {
  return authApiClientJson<UnreadCountResponse>(
    API_ENDPOINTS.backend.notifications.unreadCount,
    { cache: "no-store", signal },
  );
}

export async function markNotificationAsRead(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await authApiClient(
    API_ENDPOINTS.backend.notifications.markAsRead(id),
    {
      method: "PATCH",
      signal,
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.status}`);
  }
}

export async function markAllNotificationsAsRead(
  signal?: AbortSignal,
): Promise<MarkAllReadResponse> {
  return authApiClientJson<MarkAllReadResponse>(
    API_ENDPOINTS.backend.notifications.markAllAsRead,
    {
      method: "PATCH",
      signal,
    },
  );
}
