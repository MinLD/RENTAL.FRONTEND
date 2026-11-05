export const NOTIFICATION_QUERY_KEYS = {
  all: (userId?: string | null) => ["notifications", userId ?? null] as const,
  unreadCount: (userId?: string | null) =>
    ["notifications", userId ?? null, "unread-count"] as const,
  lists: (userId?: string | null) =>
    ["notifications", userId ?? null, "list"] as const,
  list: (userId?: string | null, params?: unknown) =>
    ["notifications", userId ?? null, "list", params] as const,
};
