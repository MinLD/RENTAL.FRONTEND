"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { usePaymentHub } from "@/providers/payment-hub-provider";
import { QueryProvider } from "@/providers/query-provider";
import { getInvoice, getInvoiceStatus } from "@/services/checkout-service";
import { getRenterOrderPayment } from "@/services/renter-order-service";
import type { Invoice, InvoiceStatus, OrderPaymentSnapshot } from "@/types/checkout";
import { getOrderPaymentProgress, normalizeOrderStatus } from "@/utils/order-payment";

type OrderPaymentProps = {
  initialOrder: OrderPaymentSnapshot;
  initialInvoice: Invoice | null;
  children: ReactNode;
};

const OrderPaymentContext = createContext<ReturnType<typeof useOrderPaymentState> | null>(null);

function useOrderPaymentState({ initialOrder, initialInvoice }: Omit<OrderPaymentProps, "children">) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const paymentHub = usePaymentHub();
  const [now, setNow] = useState(0);
  const refreshedState = useRef("");
  const latestPayment = paymentHub.payments.get(initialOrder.orderId);
  const completedPayment = latestPayment && (!initialOrder.invoiceRef || latestPayment.data.invoiceRef === initialOrder.invoiceRef)
    ? latestPayment
    : undefined;
  const initialPending = normalizeOrderStatus(initialOrder.status) === "PENDING_PAYMENT";

  // Checkout can return before its invoice reference is available.
  const orderQuery = useQuery({
    queryKey: ["order-payment-summary", initialOrder.orderId],
    queryFn: () => getRenterOrderPayment(initialOrder.orderId),
    initialData: initialOrder,
    enabled: initialPending && !initialOrder.invoiceRef && !completedPayment,
    refetchInterval: (query) => query.state.data?.invoiceRef || normalizeOrderStatus(query.state.data?.paymentState) === "PAID" ? false : 3_000,
    retry: 1,
  });
  const activeInvoiceRef = initialOrder.invoiceRef ?? orderQuery.data.invoiceRef ?? completedPayment?.data.invoiceRef ?? null;
  const alreadyPaid = Boolean(completedPayment) || normalizeOrderStatus(initialOrder.paymentState) === "PAID";
  const invoiceQuery = useQuery({
    queryKey: ["order-invoice", activeInvoiceRef],
    queryFn: () => getInvoice(activeInvoiceRef!),
    enabled: Boolean(activeInvoiceRef) && initialPending && !alreadyPaid,
    initialData: initialInvoice?.invoiceRef === activeInvoiceRef ? initialInvoice : undefined,
    staleTime: Infinity,
    retry: 1,
  });
  const invoice = invoiceQuery.data;
  const deadline = invoice?.paymentDeadline ?? orderQuery.data.paymentDeadline;
  const deadlineMs = new Date(deadline).getTime();
  const remainingSeconds = now && Number.isFinite(deadlineMs) ? Math.max(0, Math.floor((deadlineMs - now) / 1_000)) : null;
  const deadlineElapsed = remainingSeconds === 0;
  const statusQuery = useQuery({
    queryKey: ["order-invoice-status", activeInvoiceRef],
    queryFn: () => getInvoiceStatus(activeInvoiceRef!),
    enabled: Boolean(activeInvoiceRef) && initialPending && !alreadyPaid && normalizeOrderStatus(invoice?.status) !== "PAID",
    refetchInterval: (query) =>
      ["PAID", "EXPIRED", "CANCELLED", "LATE_PAYMENT_REFUND"].includes(normalizeOrderStatus(query.state.data?.status))
        ? false
        : paymentHub.status === "connected" && !deadlineElapsed ? false : 5_000,
    retry: 1,
  });
  const paymentStatus = normalizeOrderStatus(
    completedPayment?.data.status ?? statusQuery.data?.status ?? invoice?.status ?? orderQuery.data.paymentState,
  );
  const initialProgress = getOrderPaymentProgress(initialOrder.status, initialOrder.paymentState, paymentStatus);

  // Payment can be confirmed before RentalService consumes the payment event.
  // The same reconciliation works for SignalR, REST fallback and a page reload.
  const reconciliationQuery = useQuery({
    queryKey: ["renter-order-payment-reconciliation", initialOrder.orderId],
    queryFn: () => getRenterOrderPayment(initialOrder.orderId),
    initialData: initialOrder,
    enabled: initialProgress.needsOrderSync,
    refetchInterval: (query) => {
      const order = query.state.data;
      if (!order || !getOrderPaymentProgress(order.status, order.paymentState, paymentStatus).needsOrderSync) return false;
      return Math.min(2_000 * Math.max(1, query.state.dataUpdateCount), 10_000);
    },
    retry: 1,
  });
  const order = initialProgress.needsOrderSync ? reconciliationQuery.data : initialOrder;
  const progress = getOrderPaymentProgress(order.status, order.paymentState, paymentStatus);
  const isExpired = !progress.isPaid && ["EXPIRED", "CANCELLED", "LATE_PAYMENT_REFUND"].includes(paymentStatus);
  const paidAt = completedPayment?.data.paidAt ?? statusQuery.data?.paidAt ?? initialOrder.paidAt;

  useEffect(() => {
    if (!initialPending || progress.isPaid || isExpired) return;
    const tick = () => setNow(Date.now());
    const initialTick = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1_000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, [initialPending, progress.isPaid, isExpired]);

  useEffect(() => {
    if (!completedPayment) return;
    let disposed = false;
    const { data } = completedPayment;
    const statusKey = ["order-invoice-status", data.invoiceRef];
    const invoiceKey = ["order-invoice", data.invoiceRef];
    async function applyPayment() {
      // An older in-flight GET must not overwrite the paid event.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: statusKey }),
        queryClient.cancelQueries({ queryKey: invoiceKey }),
      ]);
      if (disposed) return;
      queryClient.setQueryData<InvoiceStatus>(statusKey, {
        invoiceRef: data.invoiceRef,
        rentalOrderId: data.rentalOrderId,
        status: data.status,
        paymentDeadline: deadline,
        paidAt: data.paidAt,
        totalAmount: data.totalAmount,
      });
      queryClient.setQueryData<Invoice>(invoiceKey, (current) => current ? {
        ...current, status: data.status, totalAmount: data.totalAmount, currency: data.currency,
      } : current);
    }
    void applyPayment();
    return () => { disposed = true; };
  }, [completedPayment, deadline, queryClient]);

  const refetchStatus = statusQuery.refetch;
  useEffect(() => {
    if (!initialPending || !activeInvoiceRef || completedPayment || progress.isPaid || isExpired) return;
    if (paymentHub.status === "connected" || deadlineElapsed) void refetchStatus();
  }, [initialPending, activeInvoiceRef, completedPayment, progress.isPaid, isExpired, paymentHub.connectionVersion, paymentHub.status, deadlineElapsed, refetchStatus]);

  useEffect(() => {
    if (!progress.isPaid || (order.status === initialOrder.status && order.paymentState === initialOrder.paymentState)) return;
    const signature = `${order.status}:${order.paymentState}`;
    if (refreshedState.current === signature) return;
    refreshedState.current = signature;
    router.refresh();
  }, [progress.isPaid, initialOrder.status, initialOrder.paymentState, order.status, order.paymentState, router]);

  return {
    ...progress,
    order, invoice, paymentStatus, paidAt, deadline, remainingSeconds, isExpired,
    activeInvoiceRef, orderQuery, invoiceQuery, statusQuery,
    amount: completedPayment?.data.totalAmount ?? invoice?.totalAmount ?? order.totalAmount,
    currency: completedPayment?.data.currency ?? invoice?.currency ?? order.currency ?? "VND",
  };
}

function OrderPaymentStateProvider({ children, ...props }: OrderPaymentProps) {
  const state = useOrderPaymentState(props);
  return <OrderPaymentContext.Provider value={state}>{children}</OrderPaymentContext.Provider>;
}

export function OrderPaymentProvider(props: OrderPaymentProps) {
  return <QueryProvider><OrderPaymentStateProvider {...props} /></QueryProvider>;
}

export function useOrderPayment() {
  const context = useContext(OrderPaymentContext);
  if (!context) throw new Error("useOrderPayment must be used inside OrderPaymentProvider");
  return context;
}
