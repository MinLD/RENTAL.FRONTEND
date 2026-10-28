import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { PageRefreshButton } from "@/components/ui/page-refresh-button";
import { OrderDetailHeader } from "@/components/orders/order-detail-header";
import { OrderPaymentPanel } from "@/components/orders/order-payment-panel";
import { OrderPaymentSummary } from "@/components/orders/order-payment-summary";
import { OrderPaymentProvider } from "@/providers/order-payment-provider";
import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import { getCurrentUser } from "@/services/session-service";
import type { Invoice, RenterOrderDetail } from "@/types/checkout";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { withReturnTo } from "@/utils/return-to";
import { getOrderPaymentSnapshot } from "@/utils/order-payment";

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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <PageRefreshButton />
              <Button asChild size="sm" variant="secondary">
                <Link href="/orders">Về danh sách đơn</Link>
              </Button>
            </div>
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
  const paymentOrder = getOrderPaymentSnapshot(order);

  return (
    <div className="flex-1 bg-[#f5f7fa] py-6 sm:py-8">
      <OrderPaymentProvider initialOrder={paymentOrder} initialInvoice={initialInvoice} key={order.orderId}>
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

          <OrderDetailHeader createdAtLabel={formatDate(order.createdAt, true)} />
          <OrderPaymentPanel />

          <div className="grid scroll-mt-36 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" id="order-details">
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
              <OrderPaymentSummary rentalAmount={order.totalRentalAmount} depositAmount={order.totalDepositAmount} />

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
      </OrderPaymentProvider>
    </div>
  );
}
