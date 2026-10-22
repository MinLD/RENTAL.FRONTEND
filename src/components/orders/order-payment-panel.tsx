"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Copy, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { QueryProvider } from "@/providers/query-provider";
import { Button } from "@/components/ui/button";
import { getInvoice, getInvoiceStatus } from "@/services/checkout-service";
import { getRenterOrderPayment } from "@/services/renter-order-service";
import type { Invoice, RenterOrderPayment } from "@/types/checkout";
import { formatEquipmentListingRate } from "@/utils/inventory";

function normalized(value: string | null | undefined) {
  return value?.toUpperCase().replaceAll("-", "_") ?? "";
}

async function copy(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`Đã sao chép ${label}.`);
  } catch {
    toast.error("Không thể sao chép. Vui lòng thử lại.");
  }
}

export function OrderPaymentPanel(props: {
  invoiceRef: string | null;
  initialOrder: RenterOrderPayment;
  initialInvoice: Invoice | null;
  initialPaymentState: string;
  paymentDeadline: string;
  totalAmount: number;
  currency: string;
}) {
  return (
    <QueryProvider>
      <OrderPaymentPanelContent {...props} />
    </QueryProvider>
  );
}

function OrderPaymentPanelContent({
  invoiceRef,
  initialOrder,
  initialInvoice,
  initialPaymentState,
  paymentDeadline,
  totalAmount,
  currency,
}: {
  invoiceRef: string | null;
  initialOrder: RenterOrderPayment;
  initialInvoice: Invoice | null;
  initialPaymentState: string;
  paymentDeadline: string;
  totalAmount: number;
  currency: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState(0);
  const orderQuery = useQuery({
    queryKey: ["order-payment-summary", initialOrder.orderId],
    queryFn: () => getRenterOrderPayment(initialOrder.orderId),
    enabled: !invoiceRef,
    initialData: initialOrder,
    refetchInterval: (query) => (query.state.data?.invoiceRef ? false : 3_000),
    retry: 1,
  });
  const activeInvoiceRef = invoiceRef ?? orderQuery.data?.invoiceRef ?? null;
  const invoiceQuery = useQuery({
    queryKey: ["order-invoice", activeInvoiceRef],
    queryFn: () => getInvoice(activeInvoiceRef!),
    enabled: Boolean(activeInvoiceRef),
    initialData:
      initialInvoice?.invoiceRef === activeInvoiceRef
        ? initialInvoice
        : undefined,
    retry: 1,
    staleTime: Infinity,
  });
  const invoice = invoiceQuery.data;
  const statusQuery = useQuery({
    queryKey: ["order-invoice-status", activeInvoiceRef],
    queryFn: () => getInvoiceStatus(activeInvoiceRef!),
    enabled: Boolean(activeInvoiceRef),
    refetchInterval: (query) =>
      ["PAID", "EXPIRED", "CANCELLED", "LATE_PAYMENT_REFUND"].includes(
        normalized(query.state.data?.status),
      )
        ? false
        : 5_000,
    retry: 1,
  });
  const paymentStatus = normalized(
    statusQuery.data?.status ??
      invoice?.status ??
      orderQuery.data?.paymentState ??
      initialPaymentState,
  );
  const isPaid = paymentStatus === "PAID";
  const isExpired = ["EXPIRED", "CANCELLED", "LATE_PAYMENT_REFUND"].includes(
    paymentStatus,
  );
  const deadline =
    invoice?.paymentDeadline ??
    orderQuery.data?.paymentDeadline ??
    paymentDeadline;
  const deadlineMs = new Date(deadline).getTime();
  const remainingMs =
    now && Number.isFinite(deadlineMs) ? Math.max(0, deadlineMs - now) : null;
  const remainingSeconds =
    remainingMs === null ? null : Math.floor(remainingMs / 1_000);
  const countdown =
    remainingSeconds === null
      ? "--:--"
      : `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    const initialTick = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isPaid) router.refresh();
  }, [isPaid, router]);

  const qrUrl = invoice?.qrUrl;
  const bank = invoice?.bank;
  const account = invoice?.account;
  const transferContent = invoice?.transferContent;
  const amount = invoice?.totalAmount ?? totalAmount;
  const invoiceCurrency = invoice?.currency ?? currency;

  return (
    <div className="mt-5 pt-2" id="payment-qr">
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

      {isPaid ? (
        <div
          className="flex items-center gap-3 border-t border-border py-4 text-sm"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-5 text-primary" />
          <span className="font-medium">
            Đã nhận được thanh toán cho hóa đơn này.
          </span>
        </div>
      ) : isExpired || remainingSeconds === 0 ? (
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
                  {formatEquipmentListingRate(amount, invoiceCurrency)}
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
    </div>
  );
}
