"use client";

import { Copy, CreditCard, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useOrderPayment } from "@/providers/order-payment-provider";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { normalizeOrderStatus } from "@/utils/order-payment";

async function copy(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`Đã sao chép ${label}.`);
  } catch {
    toast.error("Không thể sao chép. Vui lòng thử lại.");
  }
}

export function OrderPaymentPanel() {
  const router = useRouter();
  const {
    order, invoice, isPaid, isExpired, remainingSeconds,
    orderQuery, invoiceQuery, statusQuery, amount, currency,
  } = useOrderPayment();
  const startedAwaitingPayment = useRef(normalizeOrderStatus(order.status) === "PENDING_PAYMENT");
  useEffect(() => {
    if (isPaid && startedAwaitingPayment.current) {
      router.replace(`/orders/${encodeURIComponent(order.orderId)}/success`);
    }
  }, [isPaid, order.orderId, router]);
  if (normalizeOrderStatus(order.status) !== "PENDING_PAYMENT" || isPaid) return null;
  const countdown = remainingSeconds === null
    ? "--:--"
    : `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const qrUrl = invoice?.qrUrl;
  const bank = invoice?.bank;
  const account = invoice?.account;
  const transferContent = invoice?.transferContent;

  return (
    <section className="mb-5 rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6" id="payment-qr">
      <div className="mb-5 flex items-center gap-2">
        <CreditCard aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Thanh toán đơn thuê</h2>
      </div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Quét mã QR để thanh toán</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Đơn sẽ tự cập nhật sau khi hệ thống xác nhận thanh toán.
          </p>
        </div>
        {!isPaid && !isExpired && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Thời gian còn lại</p>
            <p
              aria-live="off"
              className={`font-mono text-xl font-bold tabular-nums text-red-600`}
            >
              {remainingSeconds === 0 ? "00:00" : countdown}
            </p>
          </div>
        )}
      </div>

      {isExpired || remainingSeconds === 0 ? (
        <p
          className="border-t border-border py-4 text-sm text-muted-foreground"
          role="status"
        >
          Hạn thanh toán đã kết thúc. Hãy tải lại chi tiết đơn để kiểm tra trạng
          thái mới nhất.
        </p>
      ) : orderQuery.isError && !orderQuery.data?.invoiceRef ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-4">
          <p className="text-sm text-muted-foreground">
            Chưa kiểm tra được trạng thái hóa đơn.
          </p>
          <Button
            disabled={orderQuery.isFetching}
            onClick={() => void orderQuery.refetch()}
            size="sm"
            type="button"
            variant="secondary"
          >
            Thử lại
          </Button>
        </div>
      ) : invoiceQuery.isError && !invoice ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-4">
          <p className="text-sm text-muted-foreground">
            Chưa tải được mã QR. Bạn vẫn có thể thử tải lại.
          </p>
          <Button
            disabled={invoiceQuery.isFetching}
            onClick={() => void invoiceQuery.refetch()}
            size="sm"
            type="button"
            variant="secondary"
          >
            Thử lại
          </Button>
        </div>
      ) : invoice ? (
        <div className="grid gap-5 sm:grid-cols-[190px_minmax(0,1fr)]">
          <div className="flex min-h-[190px] items-center justify-center overflow-hidden rounded border border-border p-2">
            {qrUrl ? (
              <Image
                alt="Mã QR thanh toán đơn thuê"
                height={180}
                src={qrUrl}
                unoptimized
                width={180}
              />
            ) : (
              <p className="px-3 text-center text-sm text-muted-foreground">
                Hóa đơn chưa có mã QR.
              </p>
            )}
          </div>
          <div className="min-w-0">
            <dl className="space-y-3 text-sm">
              {bank && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Ngân hàng</dt>
                  <dd className="text-right font-medium">{bank}</dd>
                </div>
              )}
              {account && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Số tài khoản</dt>
                  <dd className="flex min-w-0 items-center gap-1 font-medium">
                    <span className="break-all text-right">{account}</span>
                    <Button
                      aria-label="Sao chép số tài khoản"
                      onClick={() => void copy(account, "số tài khoản")}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </dd>
                </div>
              )}
              {transferContent && (
                <div>
                  <dt className="text-muted-foreground">
                    Nội dung chuyển khoản
                  </dt>
                  <dd className="mt-1 flex items-start justify-between gap-2 rounded border border-border px-2 py-1.5 font-medium">
                    <span className="break-all">{transferContent}</span>
                    <Button
                      aria-label="Sao chép nội dung chuyển khoản"
                      onClick={() =>
                        void copy(transferContent, "nội dung chuyển khoản")
                      }
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3 pt-3 font-semibold">
                <dt>Số tiền</dt>
                <dd className="text-primary">
                  {formatEquipmentListingRate(amount, currency)}
                </dd>
              </div>
            </dl>
            {statusQuery.isError && (
              <p className="mt-3 text-xs text-muted-foreground">
                Chưa kiểm tra được trạng thái thanh toán. Trang vẫn sẽ tiếp tục
                kiểm tra.
              </p>
            )}
            {statusQuery.isFetching && !statusQuery.data && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <LoaderCircle
                  aria-hidden="true"
                  className="size-3 animate-spin"
                />
                Đang kiểm tra thanh toán
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          {orderQuery.data?.invoiceRef
            ? "Đang tải hóa đơn và mã QR..."
            : "Đang chờ hệ thống tạo hóa đơn..."}
        </div>
      )}
    </section>
  );
}
