import type {
  SupplierDecisionAction,
  SupplierOrderDetail,
  SupplierRejectRequest,
} from "@/types/supplier-orders";

export const SUPPLIER_ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Chờ xác nhận",
  AWAITING_HANDOVER: "Chờ bàn giao",
  IN_RENTAL: "Đang thuê",
  PENDING_SETTLEMENT: "Chờ quyết toán",
  COMPLETED: "Hoàn tất",
  REJECTED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
};

export function isOrderPendingSupplierConfirmation(status?: string | null): boolean {
  return status === "PAID" || status === "PENDING_SUPPLIER_CONFIRMATION";
}

export function formatSupplierOrderDate(value: string | null | undefined, withTime = true) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00+07:00` : value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function getSupplierOrderDecisionState(order: SupplierOrderDetail, now: number) {
  const items = order.items ?? [];
  const deadlines = items.flatMap((item) => {
    if (!item.supplierConfirmationDeadline) return [];
    const timestamp = Date.parse(item.supplierConfirmationDeadline);
    return Number.isFinite(timestamp) ? [timestamp] : [];
  });
  const deadline = deadlines.length ? Math.min(...deadlines) : null;
  let reason: string | null = null;
  if (!isOrderPendingSupplierConfirmation(order.status)) {
    reason = order.status === "PENDING_PAYMENT"
      ? "Đơn đang chờ người thuê thanh toán."
      : "Đơn thuê đã chuyển trạng thái, không còn chờ xác nhận.";
  } else if (!order.paidAt) {
    reason = "Chưa có xác nhận thanh toán của người thuê. Vui lòng tải lại đơn.";
  } else if (!items.length || items.some((item) => !isOrderPendingSupplierConfirmation(item.status))) {
    reason = "Thông tin thiết bị đã thay đổi. Vui lòng tải lại đơn trước khi xác nhận.";
  } else if (deadline !== null && now >= deadline) {
    reason = "Đơn thuê đã hết hạn xác nhận. Vui lòng tải lại trạng thái.";
  }
  return { canDecide: reason === null, reason, deadline };
}

export type SupplierDecisionAttempt = { signature: string; key: string; storageKey: string };

export function getSupplierDecisionAttempt(
  userId: string,
  subOrderId: string,
  action: SupplierDecisionAction,
  request: SupplierRejectRequest | undefined,
  _previous?: SupplierDecisionAttempt | null,
): SupplierDecisionAttempt {
  const signature = JSON.stringify([userId, subOrderId, action, request ?? null]);
  const storageKey = `dprental:supplier-decision:${userId}:${subOrderId}:${action}`;
  try { sessionStorage.removeItem(storageKey); } catch {}
  return { signature, key: crypto.randomUUID(), storageKey };
}

export function clearSupplierDecisionAttempt(attempt: SupplierDecisionAttempt) {
  try { sessionStorage.removeItem(attempt.storageKey); } catch {}
}
