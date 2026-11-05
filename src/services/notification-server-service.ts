import "server-only";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson } from "@/services/server-api";
import type {
  GetNotificationsParams,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/notifications";

export async function getUnreadCountForServer(): Promise<number | null> {
  try {
    const res = await serverApiJson<UnreadCountResponse>(
      API_ENDPOINTS.backend.notifications.unreadCount,
      "Không thể tải số thông báo chưa đọc.",
    );
    return typeof res?.unreadCount === "number" ? res.unreadCount : 0;
  } catch {
    return null;
  }
}

export async function getNotificationsForServer(
  params?: GetNotificationsParams,
): Promise<NotificationListResponse | null> {
  try {
    const res = await serverApiJson<NotificationListResponse>(
      API_ENDPOINTS.backend.notifications.list(params ?? {}),
      "Không thể tải danh sách thông báo.",
    );
    return res ?? null;
  } catch {
    return null;
  }
}

export async function getInitialNotificationsForServer(): Promise<NotificationListResponse | null> {
  return getNotificationsForServer({ page: 1, pageSize: 10 });
}
