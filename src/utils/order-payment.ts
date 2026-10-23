import type { OrderPaymentSnapshot } from "@/types/checkout";

export function getOrderPaymentSnapshot(order: OrderPaymentSnapshot): OrderPaymentSnapshot {
  return {
    orderId: order.orderId,
    orderCode: order.orderCode,
    status: order.status,
    paymentState: order.paymentState,
    invoiceRef: order.invoiceRef,
    paymentDeadline: order.paymentDeadline,
    totalAmount: order.totalAmount,
    currency: order.currency,
    paidAt: order.paidAt,
  };
}

export function normalizeOrderStatus(value: string | null | undefined) {
  return value?.toUpperCase().replaceAll("-", "_") ?? "";
}

export function getOrderPaymentProgress(orderStatus: string, orderPaymentState: string, invoiceStatus: string) {
  const status = normalizeOrderStatus(orderStatus);
  const isPaid = normalizeOrderStatus(invoiceStatus) === "PAID" || normalizeOrderStatus(orderPaymentState) === "PAID";
  // A paid invoice alone does not prove that RentalService has accepted the payment.
  const needsOrderSync = isPaid && (normalizeOrderStatus(orderPaymentState) !== "PAID" || status === "PENDING_PAYMENT");
  const showSuccess = isPaid && (needsOrderSync || status === "PAID" || status === "AWAITING_HANDOVER");
  return { isPaid, needsOrderSync, showSuccess };
}
