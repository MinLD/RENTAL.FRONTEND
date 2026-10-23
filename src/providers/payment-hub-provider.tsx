"use client";

import { HubConnectionState } from "@microsoft/signalr";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { paymentCompletedSchema, type PaymentCompletedEvent } from "@/lib/validations/payment-hub";
import { createPaymentHubConnection, PAYMENT_COMPLETED_EVENT, rememberPaymentCompletion } from "@/services/payment-hub";
import { refreshSession } from "@/services/auth-service";

type PaymentHubStatus = "disabled" | "connecting" | "connected" | "reconnecting" | "disconnected" | "forbidden" | "unauthorized";

type PaymentHubState = {
  status: PaymentHubStatus;
  connectionVersion: number;
  payments: ReadonlyMap<string, PaymentCompletedEvent>;
};

const PaymentHubContext = createContext<PaymentHubState>({
  status: "disabled",
  connectionVersion: 0,
  payments: new Map(),
});

const HUB_URL = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL?.trim() ?? "";
const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

export function PaymentHubProvider({ children, enabled }: {
  children: ReactNode;
  enabled: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<PaymentHubState>({
    status: "connecting",
    connectionVersion: 0,
    payments: new Map(),
  });
  const active = enabled && Boolean(HUB_URL);

  useEffect(() => {
    if (!active) return;
    // Each effect owns its connection, including React Strict Mode's setup/cleanup cycle.
    let disposed = false;
    let accessRejected: "forbidden" | "unauthorized" | null = null;
    const hub = createPaymentHubConnection(HUB_URL, {
      isDisposed: () => disposed,
      refreshSession,
      onUnauthorized: () => {
        accessRejected = "unauthorized";
        // Re-render the authenticated layout after refresh proves the session invalid.
        if (!disposed) router.refresh();
      },
      onForbidden: () => {
        accessRejected = "forbidden";
        if (!disposed) console.warn("PaymentHub access denied; automatic retries stopped. Check backend Hub policy and AllowedOrigins.", {
          status: 403,
          origin: window.location.origin,
        });
      },
    });
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryIndex = 0;

    function connected() {
      if (disposed) return;
      retryIndex = 0;
      if (process.env.NODE_ENV === "development") {
        console.info("[PaymentHub] Connected", {
          state: hub.state,
          transport: "WebSockets",
          origin: window.location.origin,
        });
      }
      setState((current) => ({ ...current, status: "connected", connectionVersion: current.connectionVersion + 1 }));
    }

    function scheduleStart() {
      if (disposed || accessRejected || retryTimer !== null) return;
      const delay = RETRY_DELAYS_MS[Math.min(retryIndex, RETRY_DELAYS_MS.length - 1)];
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
        setState((current) => ({ ...current, status: accessRejected ?? "disconnected" }));
        scheduleStart();
      }
    }

    function paymentCompleted(payload: unknown) {
      if (disposed) return;
      const parsed = paymentCompletedSchema.safeParse(payload);
      if (!parsed.success) {
        // Reconcile through REST if the server sends a payload we cannot interpret.
        setState((current) => ({ ...current, connectionVersion: current.connectionVersion + 1 }));
        return;
      }
      const event = parsed.data;
      setState((current) => {
        const payments = rememberPaymentCompletion(current.payments, event);
        if (payments === current.payments) return current;
        return { ...current, payments };
      });
    }

    // Register before start so an immediate payment event cannot be lost.
    hub.on(PAYMENT_COMPLETED_EVENT, paymentCompleted);
    hub.onreconnecting(() => {
      if (!disposed) setState((current) => ({ ...current, status: "reconnecting" }));
    });
    hub.onreconnected(connected);
    hub.onclose(() => {
      if (disposed) return;
      setState((current) => ({ ...current, status: accessRejected ?? "disconnected" }));
      // Continue recovery after automatic reconnect exhausts its attempts.
      scheduleStart();
    });
    // Skip Strict Mode's throwaway effect before it starts an HTTP negotiation.
    queueMicrotask(() => void start());

    return () => {
      disposed = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      hub.off(PAYMENT_COMPLETED_EVENT, paymentCompleted);
      void hub.stop();
    };
  }, [active, router]);

  return (
    <PaymentHubContext.Provider value={active ? state : { ...state, status: "disabled" }}>
      {children}
    </PaymentHubContext.Provider>
  );
}

export function usePaymentHub() {
  return useContext(PaymentHubContext);
}
