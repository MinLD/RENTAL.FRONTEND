"use client";

import { HubConnectionState } from "@microsoft/signalr";
import {
  QueryClient,
  QueryClientContext,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { refreshSession } from "@/services/auth-service";
import {
  createNotificationHubConnection,
  NOTIFICATION_INBOX_CHANGED_EVENT,
} from "@/services/notification-hub";
import {
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notification-service";

import { NOTIFICATION_QUERY_KEYS } from "@/services/notification-keys";
export { NOTIFICATION_QUERY_KEYS };

const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
const FALLBACK_POLL_INTERVAL_MS = 30_000;
const COALESCE_WINDOW_MS = 250;

export type NotificationContextType = {
  userId?: string | null;
  unreadCount: number;
  isRealtimeConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetchUnreadCount: () => Promise<void>;
  isMarkingRead: (id: string) => boolean;
  isMarkingAllRead: boolean;
  hasUnreadCountError?: boolean;
  isUnreadCountLoading?: boolean;
};

const NotificationContext = createContext<NotificationContextType>({
  userId: null,
  unreadCount: 0,
  isRealtimeConnected: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refetchUnreadCount: async () => {},
  isMarkingRead: () => false,
  isMarkingAllRead: false,
  hasUnreadCountError: false,
  isUnreadCountLoading: false,
});

export type NotificationProviderProps = {
  children: ReactNode;
  userId?: string | null;
  hubUrl?: string;
  enabled?: boolean;
};

function NotificationProviderInner({
  children,
  userId = null,
  hubUrl,
  enabled = true,
}: NotificationProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [markingReadIds, setMarkingReadIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const prevUserIdRef = useRef<string | null>(userId);
  const resolvedHubUrl =
    hubUrl ||
    process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL?.trim() ||
    "/api/v1/notifications/hubs/inbox";

  const isGuest = !userId || !enabled;

  // On logout or user switch, remove queries for previous user
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    if (prevUserId && prevUserId !== userId) {
      void queryClient.removeQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all(prevUserId),
      });
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  // Unread count query
  const unreadCountQuery = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(userId),
    queryFn: ({ signal }) => getUnreadCount(signal),
    enabled: !isGuest,
    staleTime: 10_000,
  });

  const unreadCount = isGuest ? 0 : (unreadCountQuery.data?.unreadCount ?? 0);

  const reconcile = useCallback(async () => {
    if (isGuest) return;
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.lists(userId),
      }),
    ]);
    queryClient.resetQueries({
      queryKey: NOTIFICATION_QUERY_KEYS.lists(userId),
      exact: false,
    });
  }, [isGuest, queryClient, userId]);

  // Realtime SignalR lifecycle
  useEffect(() => {
    if (isGuest) return;

    let disposed = false;
    let accessRejected: "forbidden" | "unauthorized" | null = null;
    let retryTimer: NodeJS.Timeout | number | null = null;
    let coalesceTimer: NodeJS.Timeout | number | null = null;
    let retryIndex = 0;

    const hub = createNotificationHubConnection(resolvedHubUrl, {
      isDisposed: () => disposed,
      refreshSession,
      onUnauthorized: () => {
        accessRejected = "unauthorized";
        setIsRealtimeConnected(false);
        if (!disposed) router.refresh();
      },
      onForbidden: () => {
        accessRejected = "forbidden";
        setIsRealtimeConnected(false);
        if (!disposed) {
          console.warn(
            "NotificationHub access denied (403); retries stopped.",
          );
        }
      },
    });

    function connected() {
      if (disposed) return;
      retryIndex = 0;
      setIsRealtimeConnected(true);
      void reconcile();
    }

    function scheduleStart() {
      if (disposed || accessRejected || retryTimer !== null) return;
      const delay =
        RETRY_DELAYS_MS[Math.min(retryIndex, RETRY_DELAYS_MS.length - 1)];
      retryIndex += 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void start();
      }, delay);
    }

    async function start() {
      if (disposed || hub.state !== HubConnectionState.Disconnected) return;
      try {
        await hub.start();
        connected();
      } catch {
        if (disposed) return;
        setIsRealtimeConnected(false);
        scheduleStart();
      }
    }

    function handleInboxChanged() {
      if (disposed) return;
      // Coalesce multiple events within 250ms into a single refresh
      clearTimeout(coalesceTimer ?? undefined);
      coalesceTimer = setTimeout(() => {
        coalesceTimer = null;
        if (!disposed) {
          void reconcile();
        }
      }, COALESCE_WINDOW_MS);
    }

    hub.on(NOTIFICATION_INBOX_CHANGED_EVENT, handleInboxChanged);
    hub.onreconnecting(() => {
      if (!disposed) setIsRealtimeConnected(false);
    });
    hub.onreconnected(connected);
    hub.onclose(() => {
      if (disposed) return;
      setIsRealtimeConnected(false);
      scheduleStart();
    });

    queueMicrotask(() => void start());

    return () => {
      disposed = true;
      clearTimeout(retryTimer ?? undefined);
      clearTimeout(coalesceTimer ?? undefined);
      hub.off(NOTIFICATION_INBOX_CHANGED_EVENT, handleInboxChanged);
      void hub.stop();
      setIsRealtimeConnected(false);
    };
  }, [isGuest, reconcile, resolvedHubUrl, router]);

  // Fallback polling when not realtime connected
  useEffect(() => {
    if (isGuest) return;

    let pollInterval: NodeJS.Timeout | number | null = null;

    function pollIfVisible() {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(userId),
        });
      }
    }

    function handleVisibilityOrFocus() {
      pollIfVisible();
    }

    if (!isRealtimeConnected) {
      pollInterval = setInterval(pollIfVisible, FALLBACK_POLL_INTERVAL_MS);
    }

    window.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      clearInterval(pollInterval ?? undefined);
      window.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [isGuest, isRealtimeConnected, queryClient, userId]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (isGuest || markingReadIds.has(id)) return;
      setMarkingReadIds((prev) => new Set(prev).add(id));
      try {
        await markNotificationAsRead(id);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(userId),
          }),
          queryClient.invalidateQueries({
            queryKey: NOTIFICATION_QUERY_KEYS.lists(userId),
          }),
        ]);
      } catch (error) {
        // Refetch to reconcile in case of partial or failed state
        void queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(userId),
        });
        throw error;
      } finally {
        setMarkingReadIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [isGuest, markingReadIds, queryClient, userId],
  );

  const markAllAsRead = useCallback(async () => {
    if (isGuest || isMarkingAllRead) return;
    setIsMarkingAllRead(true);
    try {
      await markAllNotificationsAsRead();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.lists(userId),
        }),
      ]);
    } catch (error) {
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(userId),
      });
      throw error;
    } finally {
      setIsMarkingAllRead(false);
    }
  }, [isGuest, isMarkingAllRead, queryClient, userId]);

  const refetchUnreadCount = useCallback(async () => {
    if (isGuest) return;
    await unreadCountQuery.refetch();
  }, [isGuest, unreadCountQuery]);

  const isMarkingRead = useCallback(
    (id: string) => markingReadIds.has(id),
    [markingReadIds],
  );

  const value: NotificationContextType = {
    userId,
    unreadCount,
    isRealtimeConnected,
    markAsRead,
    markAllAsRead,
    refetchUnreadCount,
    isMarkingRead,
    isMarkingAllRead,
    hasUnreadCountError: unreadCountQuery.isError,
    isUnreadCountLoading: unreadCountQuery.isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function NotificationProvider(props: NotificationProviderProps) {
  const existingClient = useContext(QueryClientContext);
  const [localClient] = useState(() => existingClient ?? new QueryClient());

  if (!existingClient) {
    return (
      <QueryClientProvider client={localClient}>
        <NotificationProviderInner {...props} />
      </QueryClientProvider>
    );
  }

  return <NotificationProviderInner {...props} />;
}

export function useNotification(): NotificationContextType {
  return useContext(NotificationContext);
}

export function useNotifications(): NotificationContextType {
  return useContext(NotificationContext);
}
