"use client";

import { CreditCard } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { useOrderPayment } from "@/providers/order-payment-provider";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { normalizeOrderStatus } from "@/utils/order-payment";

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  EXPIRED: "Hết hạn thanh toán",
  CANCELLED: "Đã hủy",
  LATE_PAYMENT_REFUND: "Đang xử lý hoàn tiền",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="max-w-[68%] break-words text-right font-medium">{value}</dd>
  </div>;
}

export function OrderPaymentSummary({ rentalAmount, depositAmount }: { rentalAmount: number; depositAmount: number }) {
  const { order, isPaid, paymentStatus, paidAt, activeInvoiceRef, deadline, currency } = useOrderPayment();
  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Thanh toán</h2>
      </div>
      <dl className="space-y-3">
        <Row label="Trạng thái" value={isPaid ? "Đã thanh toán" : PAYMENT_LABELS[paymentStatus] ?? order.paymentState ?? "—"} />
        {activeInvoiceRef && <div className="text-sm">
          <dt className="text-muted-foreground">Mã hóa đơn</dt>
          <dd className="mt-1 break-all rounded border border-border px-2 py-2 font-mono text-xs leading-5">{activeInvoiceRef}</dd>
        </div>}
        {paidAt && <Row label="Thanh toán lúc" value={formatDate(paidAt)} />}
        {!isPaid && normalizeOrderStatus(order.status) === "PENDING_PAYMENT" && <Row label="Hạn thanh toán" value={formatDate(deadline)} />}
      </dl>
      <Separator className="my-4" />
      <dl className="space-y-3">
        <Row label="Tiền thuê" value={formatEquipmentListingRate(rentalAmount, currency)} />
        <Row label="Tiền cọc" value={formatEquipmentListingRate(depositAmount, currency)} />
        <div className="border-t border-border pt-3"><Row label="Tổng thanh toán" value={formatEquipmentListingRate(order.totalAmount, currency)} /></div>
      </dl>
    </section>
  );
}
