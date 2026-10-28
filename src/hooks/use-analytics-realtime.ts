"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { HubConnectionState } from "@microsoft/signalr";
import { createSignalRConnection } from "@/services/signalr-transport";
import { refreshSession } from "@/services/auth-service";
import type {
  AnalyticsDataChangedEvent,
  AnalyticsScope,
} from "@/types/analytics";

const HUB_URL = "/hubs/analytics";
const MAX_RECENT_EVENT_IDS = 200;
const DEBOUNCE_DELAY_MS = 300;
const MAX_WAIT_DELAY_MS = 2_000;
const MAX_INITIAL_CONNECT_RETRIES = 3;

export type RealtimeConnectionStatus = "connected" | "reconnecting" | "polling";

export type UseAnalyticsRealtimeOptions = {
  enabled?: boolean;
  onDataChanged?: (scopes: Set<AnalyticsScope>) => void;
  onCatchUp?: () => void;
};

export type UseAnalyticsRealtimeResult = {
  status: RealtimeConnectionStatus;
  statusLabel: string;
  lastUpdatedAt: Date | null;
  markDataUpdated: () => void;
  reconnect: () => Promise<void>;
};

export function useAnalyticsRealtime({
  enabled = true,
  onDataChanged,
  onCatchUp,
}: UseAnalyticsRealtimeOptions = {}): UseAnalyticsRealtimeResult {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("polling");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    setLastUpdatedAt(new Date());
  }, []);

  const isDisposedRef = useRef(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const pendingScopesRef = useRef<Set<AnalyticsScope>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onDataChangedRef = useRef(onDataChanged);
  const onCatchUpRef = useRef(onCatchUp);

  useEffect(() => {
    onDataChangedRef.current = onDataChanged;
    onCatchUpRef.current = onCatchUp;
  });
  const markDataUpdated = useCallback(() => {
    setLastUpdatedAt(new Date());
  }, []);

  const flushPendingEvents = useCallback(() => {
    clearTimeout(debounceTimerRef.current ?? undefined);
    debounceTimerRef.current = null;
    clearTimeout(maxWaitTimerRef.current ?? undefined);
    maxWaitTimerRef.current = null;

    if (pendingScopesRef.current.size > 0) {
      const scopesToNotify = new Set(pendingScopesRef.current);
      pendingScopesRef.current.clear();
      onDataChangedRef.current?.(scopesToNotify);
    }
  }, []);

  const handleIncomingEvent = useCallback(
    (event: AnalyticsDataChangedEvent) => {
      if (isDisposedRef.current || !event || typeof event !== "object") return;

      // Contract validation: version and scope
      if (event.version !== 1) return;
      const scope = event.data?.scope;
      if (scope !== "Rental" && scope !== "Finance") return;

      // Deduplicate by eventId (bounded to 200 items)
      const eventId = event.eventId;
      if (eventId) {
        if (seenEventIdsRef.current.has(eventId)) return;
        seenEventIdsRef.current.add(eventId);
        if (seenEventIdsRef.current.size > MAX_RECENT_EVENT_IDS) {
          const firstKey = seenEventIdsRef.current.keys().next().value;
          if (firstKey) seenEventIdsRef.current.delete(firstKey);
        }
      }

      // Buffer scope
      pendingScopesRef.current.add(scope);

      // Start max wait timer if not already running
      if (!maxWaitTimerRef.current) {
        maxWaitTimerRef.current = setTimeout(() => {
          flushPendingEvents();
        }, MAX_WAIT_DELAY_MS);
      }

      // Reset debounce timer
      clearTimeout(debounceTimerRef.current ?? undefined);
      debounceTimerRef.current = setTimeout(() => {
        flushPendingEvents();
      }, DEBOUNCE_DELAY_MS);
    },
    [flushPendingEvents],
  );

  const startConnectionWithRetry = useCallback(
    async function attemptStart(
      conn: HubConnection,
      retriesLeft: number = MAX_INITIAL_CONNECT_RETRIES,
    ) {
      if (isDisposedRef.current || conn.state === HubConnectionState.Connected) return;

      try {
        await conn.start();
        if (!isDisposedRef.current) {
          setStatus("connected");
          onCatchUpRef.current?.();
        }
      } catch {
        if (isDisposedRef.current) return;

        if (retriesLeft > 0) {
          const backoff = (MAX_INITIAL_CONNECT_RETRIES - retriesLeft + 1) * 1_000;
          setTimeout(() => {
            if (!isDisposedRef.current) {
              void attemptStart(conn, retriesLeft - 1);
            }
          }, backoff);
        } else {
          // Fall back to REST polling
          setStatus("polling");
        }
      }
    },
    [],
  );

  const initConnection = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    if (connectionRef.current) {
      if (connectionRef.current.state === HubConnectionState.Disconnected) {
        void startConnectionWithRetry(connectionRef.current);
      }
      return;
    }

    const conn = createSignalRConnection(HUB_URL, {
      hubName: "AnalyticsHub",
      isDisposed: () => isDisposedRef.current,
      refreshSession: async () => {
        await refreshSession();
      },
      onForbidden: () => {
        if (!isDisposedRef.current) setStatus("polling");
      },
      onUnauthorized: () => {
        if (!isDisposedRef.current) setStatus("polling");
      },
    });

    conn.on("AnalyticsDataChanged", handleIncomingEvent);

    conn.onreconnecting(() => {
      if (!isDisposedRef.current) {
        setStatus("reconnecting");
      }
    });

    conn.onreconnected(() => {
      if (!isDisposedRef.current) {
        setStatus("connected");
        // Refetch visible reports to catch up on missed events
        onCatchUpRef.current?.();
      }
    });

    conn.onclose(() => {
      if (!isDisposedRef.current) {
        setStatus("polling");
      }
    });

    connectionRef.current = conn;
    void startConnectionWithRetry(conn);
  }, [enabled, handleIncomingEvent, startConnectionWithRetry]);

  useEffect(() => {
    isDisposedRef.current = false;
    initConnection();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const conn = connectionRef.current;
        if (!conn || conn.state === HubConnectionState.Disconnected) {
          initConnection();
        }
        onCatchUpRef.current?.();
      }
    };

    const handleOnline = () => {
      const conn = connectionRef.current;
      if (!conn || conn.state === HubConnectionState.Disconnected) {
        initConnection();
      }
      onCatchUpRef.current?.();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      clearTimeout(debounceTimerRef.current ?? undefined);
      debounceTimerRef.current = null;
      clearTimeout(maxWaitTimerRef.current ?? undefined);
      maxWaitTimerRef.current = null;

      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn) {
        conn.off("AnalyticsDataChanged");
        conn.stop().catch(() => {});
      }
    };
  }, [initConnection]);

  const reconnect = useCallback(async () => {
    const conn = connectionRef.current;
    if (conn && conn.state === HubConnectionState.Connected) {
      await conn.stop().catch(() => {});
    }
    initConnection();
  }, [initConnection]);

  const statusLabel =
    status === "connected"
      ? "Trực tiếp"
      : status === "reconnecting"
        ? "Đang kết nối lại"
        : "Cập nhật định kỳ";

  return {
    status,
    statusLabel,
    lastUpdatedAt,
    markDataUpdated,
    reconnect,
  };
}
