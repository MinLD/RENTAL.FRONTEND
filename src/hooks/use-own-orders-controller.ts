"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ApiErrorDetails } from "@/services/api-error";
import type {
  SupplierDecisionAction,
  SupplierOrderDetail,
  SupplierOrderSummary,
  SupplierOrdersActions,
  SupplierRejectRequest,
} from "@/types/supplier-orders";
import {
  clearSupplierDecisionAttempt,
  getSupplierDecisionAttempt,
  getSupplierOrderDecisionState,
  type SupplierDecisionAttempt,
} from "@/utils/supplier-orders";

export function useOwnOrdersController({
  userId, fetchOrder, acceptOrder, rejectOrder, onChanged,
}: Pick<SupplierOrdersActions, "fetchOrder" | "acceptOrder" | "rejectOrder"> & {
  userId: string;
  onChanged: () => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrderSummary | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [order, setOrder] = useState<SupplierOrderDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<SupplierDecisionAction | null>(null);
  const [decisionError, setDecisionError] = useState<ApiErrorDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [now, setNow] = useState(0);
  const selectedId = useRef<string | null>(null);
  const requestId = useRef(0);
  const submitting = useRef(false);
  const attempt = useRef<SupplierDecisionAttempt | null>(null);

  const loadOrder = useCallback(async (id: string, quiet = false) => {
    const currentRequest = ++requestId.current;
    if (!quiet) setIsLoading(true);
    setDetailError(null);
    try {
      const result = await fetchOrder(id);
      if (currentRequest !== requestId.current || selectedId.current !== id) return;
      if (result.success) {
        setNow(Date.now());
        setOrder(result.data);
      } else setDetailError(result.error.message);
    } catch (error) {
      if (currentRequest === requestId.current && selectedId.current === id) {
        setDetailError(error instanceof Error ? error.message : "Không thể tải chi tiết đơn thuê.");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [fetchOrder]);

  useEffect(() => () => { ++requestId.current; }, []);

  const pending = order?.status === "PENDING_SUPPLIER_CONFIRMATION";
  useEffect(() => {
    if (!selectedOrder || !pending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [selectedOrder, pending]);

  useEffect(() => {
    if (!selectedOrder || !pending || action || isSubmitting) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadOrder(selectedOrder.subOrderId, true);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [selectedOrder, pending, action, isSubmitting, loadOrder]);

  function openOrder(summary: SupplierOrderSummary) {
    if (submitting.current) return;
    selectedId.current = summary.subOrderId;
    setIsDrawerOpen(true);
    setSelectedOrder(summary);
    setOrder(null);
    setAction(null);
    setDecisionError(null);
    void loadOrder(summary.subOrderId);
  }

  function closeOrder() {
    if (submitting.current) return;
    selectedId.current = null;
    ++requestId.current;
    setIsDrawerOpen(false);
    setSelectedOrder(null);
    setOrder(null);
    setDetailError(null);
    setIsLoading(false);
    setAction(null);
    setDecisionError(null);
  }

  async function openQuickDecision(
    summary: SupplierOrderSummary,
    nextAction: SupplierDecisionAction,
  ) {
    if (submitting.current) return;
    selectedId.current = summary.subOrderId;
    setIsDrawerOpen(false);
    setSelectedOrder(summary);
    setOrder(null);
    setAction(null);
    setDecisionError(null);
    setIsLoading(true);
    try {
      const result = await fetchOrder(summary.subOrderId);
      if (selectedId.current !== summary.subOrderId) return;
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      setNow(Date.now());
      setOrder(result.data);
      const state = getSupplierOrderDecisionState(result.data, Date.now());
      if (!state.canDecide) {
        toast.error(state.reason);
        return;
      }
      setAction(nextAction);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết đơn thuê.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function openDecision(nextAction: SupplierDecisionAction) {
    if (submitting.current || isLoading || detailError || !order) return;
    const state = getSupplierOrderDecisionState(order, Date.now());
    if (!state.canDecide) {
      toast.error(state.reason);
      return;
    }
    setAction(nextAction);
    setDecisionError(null);
  }

  function closeDecision() {
    if (submitting.current) return;
    setAction(null);
    setDecisionError(null);
    if (!isDrawerOpen) {
      selectedId.current = null;
      setSelectedOrder(null);
      setOrder(null);
    }
  }

  async function submitDecision(request?: SupplierRejectRequest) {
    if (!order || !action || submitting.current || isLoading || detailError) return;
    const state = getSupplierOrderDecisionState(order, Date.now());
    if (!state.canDecide) {
      toast.error(state.reason);
      return;
    }
    if (action === "reject" && !request) return;
    submitting.current = true;
    setIsSubmitting(true);
    setDecisionError(null);
    const id = order.subOrderId;
    try {
      attempt.current = getSupplierDecisionAttempt(userId, id, action, request, attempt.current);
      const result = action === "accept"
        ? await acceptOrder(id, attempt.current.key)
        : await rejectOrder(id, request!, attempt.current.key);
      if (!result.success) {
        setDecisionError(result.error);
        toast.error(result.error.message);
        if ([404, 409, 410].includes(result.error.status)) {
          setAction(null);
          onChanged();
          await loadOrder(id);
        }
        return;
      }
      // The POST body can contain the previous status. Read the current state
      // through GET, and invalidate any older read before refreshing.
      ++requestId.current;
      clearSupplierDecisionAttempt(attempt.current);
      attempt.current = null;
      setAction(null);
      onChanged();
      toast.success(action === "accept" ? "Đã xác nhận nhận đơn thuê." : "Đã từ chối đơn thuê.");
      if (isDrawerOpen) {
        await loadOrder(id);
      } else {
        selectedId.current = null;
        setSelectedOrder(null);
        setOrder(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chưa xác định được kết quả. Vui lòng thử lại.";
      setDecisionError({ status: 0, message, fieldErrors: {} });
      toast.error(message);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }


  const decisionState = order ? getSupplierOrderDecisionState(order, now) : null;
  return {
    selectedOrder, order, detailError, isLoading, action, decisionError,
    isSubmitting, decisionState, isDrawerOpen,
    canDecide: Boolean(decisionState?.canDecide && !isLoading && !detailError && !isSubmitting),
    openOrder, closeOrder, openDecision, closeDecision, submitDecision,
    openQuickDecision,
    refreshOrder: () => {
      if (selectedId.current && !submitting.current) void loadOrder(selectedId.current);
    },
  };
}
