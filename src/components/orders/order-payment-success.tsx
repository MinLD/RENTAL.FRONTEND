"use client";

import { Check, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { SuccessIllustration } from "@/components/illustrations/success-illustration";
import { Button } from "@/components/ui/button";
import { useOrderPayment } from "@/providers/order-payment-provider";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { normalizeOrderStatus } from "@/utils/order-payment";

export function OrderPaymentSuccess() {
  const { order, amount, currency, needsOrderSync } = useOrderPayment();
  const awaitingHandover = normalizeOrderStatus(order.status) === "AWAITING_HANDOVER";

  return (
    <section aria-labelledby="payment-success-title" className="rounded-lg border border-border bg-background px-5 py-8 text-center shadow-sm sm:px-8 sm:py-10">
      <div className="mx-auto mb-4 w-56 max-w-full"><SuccessIllustration /></div>
      <div aria-live="polite" role="status">
        <h1 className="text-xl font-bold sm:text-2xl" id="payment-success-title">
          {needsOrderSync ? "Thanh toán thành công" : "Thanh toán và đặt thuê thành công"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {needsOrderSync
            ? "Đã nhận được thanh toán của bạn. Đơn thuê đang được cập nhật, bạn không cần thanh toán lại."
            : awaitingHandover
              ? "Nhà cung cấp đã xác nhận đơn thuê. Vui lòng theo dõi thông tin bàn giao thiết bị trong chi tiết đơn."
              : "Đơn thuê đang chờ nhà cung cấp xác nhận. Bạn có thể theo dõi tiến độ trong Đơn thuê của tôi."}
        </p>
        <p className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium">
          {needsOrderSync
            ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-primary motion-reduce:animate-none" />
            : <Check aria-hidden="true" className="size-4 text-primary" />}
          {needsOrderSync ? "Đang cập nhật đơn thuê" : awaitingHandover ? "Chờ bàn giao thiết bị" : "Chờ nhà cung cấp xác nhận"}
        </p>
      </div>
      <p className="mt-4 text-sm">
        <span className="text-muted-foreground">Mã đơn </span>
        <span className="font-semibold">{order.orderCode ?? order.orderId}</span>
        <span aria-hidden="true" className="mx-2 text-muted-foreground">·</span>
        <span className="font-semibold">{formatEquipmentListingRate(amount, currency)}</span>
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild><Link href={`/orders/${encodeURIComponent(order.orderId)}`}>Xem chi tiết đơn</Link></Button>
        <Button asChild variant="secondary"><Link href="/orders">Đơn thuê của tôi</Link></Button>
      </div>
    </section>
  );
}
