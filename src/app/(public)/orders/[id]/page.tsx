import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { OrderCancelAction } from "@/components/orders/order-cancel-action";
import { OrderPaymentPanel } from "@/components/orders/order-payment-panel";
import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import { getCurrentUser } from "@/services/session-service";
import type { Invoice, RenterOrderDetail } from "@/types/checkout";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { withReturnTo } from "@/utils/return-to";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  AWAITING_HANDOVER: "Chờ bàn giao",
  IN_RENTAL: "Đang thuê",
  PENDING_SETTLEMENT: "Chờ quyết toán",
  COMPLETED: "Hoàn tất",
  REJECTED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
  PAID: "Đã thanh toán",
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING_SUPPLIER_CONFIRMATION: "Chờ nhà cung cấp xác nhận",
  AWAITING_HANDOVER: "Chờ bàn giao",
  IN_RENTAL: "Đang thuê",
  PENDING_SETTLEMENT: "Chờ quyết toán",
  COMPLETED: "Hoàn tất",
  REJECTED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  EXPIRED: "Hết hạn thanh toán",
  LATE_PAYMENT_REFUND: "Đang xử lý hoàn tiền",
};

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function getItemName(
  item: NonNullable<
    NonNullable<RenterOrderDetail["subOrders"]>[number]["items"]
  >[number],
) {
  return (
    item.name?.trim() ||
    [item.listing?.brandName, item.listing?.model].filter(Boolean).join(" ") ||
    "Thiết bị thuê"
  );
}

function maskAccountNumber(value: string | null | undefined) {
  if (!value) return "—";
  return value.length <= 4
    ? value
    : `${"•".repeat(Math.min(value.length - 4, 8))}${value.slice(-4)}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[68%] break-words text-right font-medium">
        {value}
      </dd>
    </div>
  );
}

export default async function RenterOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const href = `/orders/${encodeURIComponent(id)}`;
  const user = await getCurrentUser();
  if (!user) redirect(withReturnTo("/login", href));

  const result = await serverApiResult(() =>
    serverApiJson<RenterOrderDetail>(
      API_ENDPOINTS.backend.rental.order(id),
      "Không thể tải đơn thuê.",
    ),
  );
  if (!result.success) {
    return (
      <Container className="py-12">
        <ErrorState
          action={
            <Button asChild>
              <Link href="/orders">Về danh sách đơn</Link>
            </Button>
          }
          description="Đơn thuê không tồn tại hoặc hiện chưa tải được. Vui lòng thử lại sau ít phút."
          title="Không thể tải đơn thuê"
        />
      </Container>
    );
  }

  const order = result.data;
  const currency = order.currency ?? "VND";
  const orderStatus = order.status?.toUpperCase() ?? "";
  const paymentState = order.paymentState?.toUpperCase() ?? "";
  const isPendingPayment =
    orderStatus === "PENDING_PAYMENT" && paymentState === "PENDING";
  const subOrders = order.subOrders ?? [];
  const invoiceResult =
    isPendingPayment && order.invoiceRef
      ? await serverApiResult(() =>
          serverApiJson<Invoice>(
            API_ENDPOINTS.backend.payment.invoice(order.invoiceRef!),
            "Không thể tải hóa đơn thanh toán.",
          ),
        )
      : null;
  const initialInvoice = invoiceResult?.success ? invoiceResult.data : null;

  return (
    <div className="flex-1 bg-[#f5f7fa] py-6 sm:py-8">
      <Container className="max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <nav
            aria-label="Đường dẫn đơn thuê"
            className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
          >
            <Link className="hover:text-primary" href="/">
              Trang chủ
            </Link>
            <span>/</span>
            <Link className="hover:text-primary" href="/orders">
              Đơn thuê của tôi
            </Link>
            <span>/</span>
            <span className="text-foreground">
              {order.orderCode ?? order.orderId}
            </span>
          </nav>
        </div>

        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border bg-background p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-sm text-muted-foreground">Chi tiết đơn thuê</p>
            <h1 className="mt-1 text-2xl font-bold">
              {order.orderCode ?? order.orderId}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Đặt ngày {formatDate(order.createdAt, true)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${isPendingPayment ? "border-primary/30 text-primary" : "border-border text-foreground"}`}
            >
              {ORDER_STATUS_LABELS[orderStatus] ?? order.status}
            </span>

            {isPendingPayment && <OrderCancelAction orderId={order.orderId} />}
          </div>
        </header>

        {isPendingPayment && (
          <section className="mb-5 rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
            <div className="mb-2 flex items-center gap-2">
              <CreditCard aria-hidden="true" className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Thanh toán đơn thuê</h2>
            </div>
            <OrderPaymentPanel
              currency={currency}
              initialInvoice={initialInvoice}
              initialOrder={order}
              initialPaymentState={order.paymentState}
              invoiceRef={order.invoiceRef}
              paymentDeadline={order.paymentDeadline}
              totalAmount={order.totalAmount}
            />
          </section>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Package aria-hidden="true" className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Thiết bị trong đơn</h2>
              </div>
              {subOrders.length ? (
                <div className="space-y-5">
                  {subOrders.map((subOrder) => (
                    <div
                      className="rounded-md border border-border"
                      key={subOrder.subOrderId}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm">
                        <span className="font-medium">
                          {subOrder.subOrderCode
                            ? `Đơn nhà cung cấp ${subOrder.subOrderCode}`
                            : "Đơn nhà cung cấp"}
                        </span>
                        <span className="text-muted-foreground">
                          {ITEM_STATUS_LABELS[subOrder.status] ??
                            subOrder.status}
                        </span>
                      </div>
                      <ul className="divide-y divide-border px-4">
                        {(subOrder.items ?? []).map((item) => {
                          const name = getItemName(item);
                          const imageSrc = item.listing?.thumbnailMediaId
                            ? `/api/v1/media/${encodeURIComponent(item.listing.thumbnailMediaId)}/content`
                            : null;
                          return (
                            <li
                              className="flex gap-4 py-4"
                              key={item.rentalItemId}
                            >
                              <div className="relative size-20 shrink-0 overflow-hidden rounded border border-border bg-background sm:size-24">
                                <ProductImage
                                  compact
                                  name={name}
                                  role="thumbnail"
                                  sizes="96px"
                                  src={imageSrc}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold">{name}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {item.listing?.equipmentTypeName
                                        ? `${item.listing.equipmentTypeName} · `
                                        : ""}
                                      {item.quantity} thiết bị
                                    </p>
                                  </div>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {ITEM_STATUS_LABELS[item.status] ??
                                      item.status}
                                  </span>
                                </div>
                                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                                  <CalendarDays
                                    aria-hidden="true"
                                    className="size-4"
                                  />
                                  {formatDate(item.startDate)} –{" "}
                                  {formatDate(item.endDate)} · {item.rentalDays}{" "}
                                  ngày
                                </p>
                                {item.rejectReason && (
                                  <p className="mt-2 text-sm text-red-600">
                                    Lý do từ chối: {item.rejectReason}
                                  </p>
                                )}
                                {item.handover?.actualHandoverAt && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    Đã bàn giao{" "}
                                    {formatDate(
                                      item.handover.actualHandoverAt,
                                      true,
                                    )}
                                    {item.handover.renterAcknowledgedAt
                                      ? " · Bạn đã xác nhận nhận thiết bị"
                                      : ""}
                                  </p>
                                )}
                                {item.refund &&
                                  item.refund.state !== "NONE" && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                      Hoàn tiền:{" "}
                                      {item.refund.state === "COMPLETED"
                                        ? "Đã hoàn tất"
                                        : "Đang xử lý"}
                                    </p>
                                  )}
                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                                  <span>
                                    {formatEquipmentListingRate(
                                      item.dailyRate,
                                      currency,
                                    )}{" "}
                                    × {item.quantity} × {item.rentalDays} ngày
                                  </span>
                                  <span className="font-semibold">
                                    Tiền thuê{" "}
                                    {formatEquipmentListingRate(
                                      item.rentalAmount,
                                      currency,
                                    )}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Cọc{" "}
                                    {formatEquipmentListingRate(
                                      item.depositAmount,
                                      currency,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  Đơn chưa có thông tin thiết bị.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Thông tin nhận thiết bị
                </h2>
              </div>
              <dl className="space-y-3">
                <InfoRow
                  label="Hình thức"
                  value={order.delivery?.method ?? "Giao hàng"}
                />
                <InfoRow
                  label="Người nhận"
                  value={order.delivery?.recipientName ?? "—"}
                />
                <InfoRow
                  label="Số điện thoại"
                  value={order.delivery?.recipientPhone ?? "—"}
                />
                <InfoRow
                  label="Địa chỉ"
                  value={order.delivery?.address ?? "—"}
                />
                {order.delivery?.note && (
                  <InfoRow label="Ghi chú" value={order.delivery.note} />
                )}
              </dl>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard
                  aria-hidden="true"
                  className="size-5 text-primary"
                />
                <h2 className="text-lg font-semibold">Thanh toán</h2>
              </div>
              <dl className="space-y-3">
                <InfoRow
                  label="Trạng thái"
                  value={
                    PAYMENT_STATUS_LABELS[paymentState] ??
                    order.paymentState ??
                    "—"
                  }
                />
                {order.invoiceRef && (
                  <div className="text-sm">
                    <dt className="text-muted-foreground">Mã hóa đơn</dt>
                    <dd className="mt-1 rounded border border-border px-2 py-2 font-mono text-xs leading-5 break-all">
                      {order.invoiceRef}
                    </dd>
                  </div>
                )}
                {order.paidAt && (
                  <InfoRow
                    label="Thanh toán lúc"
                    value={formatDate(order.paidAt, true)}
                  />
                )}
                {isPendingPayment && (
                  <InfoRow
                    label="Hạn thanh toán"
                    value={formatDate(order.paymentDeadline, true)}
                  />
                )}
              </dl>
              <Separator className="my-4" />
              <dl className="space-y-3 text-sm">
                <InfoRow
                  label="Tiền thuê"
                  value={formatEquipmentListingRate(
                    order.totalRentalAmount,
                    currency,
                  )}
                />
                <InfoRow
                  label="Tiền cọc"
                  value={formatEquipmentListingRate(
                    order.totalDepositAmount,
                    currency,
                  )}
                />
                <div className="border-t border-border pt-3">
                  <InfoRow
                    label="Tổng thanh toán"
                    value={formatEquipmentListingRate(
                      order.totalAmount,
                      currency,
                    )}
                  />
                </div>
              </dl>
            </section>

            {order.refundAccount && (
              <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <UserRound
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                  <h2 className="text-lg font-semibold">
                    Tài khoản nhận hoàn tiền
                  </h2>
                </div>
                <dl className="space-y-3">
                  <InfoRow
                    label="Ngân hàng"
                    value={order.refundAccount.bankCode ?? "—"}
                  />
                  <InfoRow
                    label="Số tài khoản"
                    value={maskAccountNumber(order.refundAccount.accountNumber)}
                  />
                  <InfoRow
                    label="Chủ tài khoản"
                    value={order.refundAccount.accountHolderName ?? "—"}
                  />
                </dl>
              </section>
            )}
          </aside>
        </div>
      </Container>
    </div>
  );
}
