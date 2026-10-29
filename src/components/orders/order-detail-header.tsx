"use client";

import { OrderCancelAction } from "@/components/orders/order-cancel-action";
import { useOrderPayment } from "@/providers/order-payment-provider";
import { normalizeOrderStatus } from "@/utils/order-payment";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  AWAITING_HANDOVER: "Chờ bàn giao",
  IN_RENTAL: "Đang thuê",
  PENDING_SETTLEMENT: "Chờ quyết toán",
  COMPLETED: "Hoàn tất",
  REJECTED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
  PAID: "Chờ xác nhận",
};

export function OrderDetailHeader({ createdAtLabel }: { createdAtLabel: string }) {
  const { order, isPaid, needsOrderSync } = useOrderPayment();
  const normalizedStatus = normalizeOrderStatus(order.status);
  const isPendingPayment = normalizedStatus === "PENDING_PAYMENT";
  const isWaitingConfirmation = normalizedStatus === "PAID";
  const canCancel = isWaitingConfirmation || (isPendingPayment && !isPaid);
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border bg-background p-5 shadow-sm sm:p-7">
      <div>
        <p className="text-sm text-muted-foreground">Chi tiết đơn thuê</p>
        <h1 className="mt-1 text-2xl font-bold">{order.orderCode ?? order.orderId}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đặt ngày {createdAtLabel}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${isPendingPayment && !isPaid ? "border-primary/30 text-primary" : "border-border text-foreground"}`}>
          {needsOrderSync ? "Đang cập nhật đơn" : ORDER_STATUS_LABELS[normalizedStatus] ?? order.status}
        </span>
        {canCancel && <OrderCancelAction orderId={order.orderId} />}
      </div>
    </header>
  );
}
