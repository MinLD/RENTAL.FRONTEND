import Link from "next/link";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { NoResultsIllustration } from "@/components/illustrations/no-results-illustration";
import { OrderCancelAction } from "@/components/orders/order-cancel-action";
import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import { getCurrentUser } from "@/services/session-service";
import type { RenterOrdersPage } from "@/types/checkout";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { withReturnTo } from "@/utils/return-to";

const ORDER_STATUSES = [
  { value: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { value: "AWAITING_HANDOVER", label: "Chờ bàn giao" },
  { value: "IN_RENTAL", label: "Đang thuê" },
  { value: "PENDING_SETTLEMENT", label: "Chờ quyết toán" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "REJECTED", label: "Đã từ chối" },
  { value: "EXPIRED", label: "Hết hạn" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "PAID", label: "Đã thanh toán" },
] as const;

const PAGE_SIZE = 20;

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

function formatRentalPeriod(startDate: string, endDate: string) {
  const format = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
  };
  return `${format(startDate)} – ${format(endDate)}`;
}

function statusHref(status: string | null, page = 1) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (page > 1) query.set("page", String(page));
  return query.size ? `/orders?${query}` : "/orders";
}

export default async function RenterOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedStatus = typeof params.status === "string" && ORDER_STATUSES.some((item) => item.value === params.status)
    ? params.status
    : null;
  const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const user = await getCurrentUser();
  if (!user) redirect(withReturnTo("/login", statusHref(selectedStatus, page)));

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (selectedStatus) query.set("status", selectedStatus);
  const result = await serverApiResult(() => serverApiJson<RenterOrdersPage>(
    `${API_ENDPOINTS.backend.rental.orders}?${query}`,
    "Không thể tải danh sách đơn thuê.",
  ));
  if (!result.success) {
    return (
      <Container className="flex-1 py-12">
        <ErrorState
          action={<Button asChild><Link href={statusHref(selectedStatus, page)}>Thử lại</Link></Button>}
          description="Vui lòng thử tải lại danh sách đơn thuê."
          title="Không thể tải đơn thuê"
        />
      </Container>
    );
  }

  // The orders list response already contains product names, thumbnails, dates and quantities.
  // Render it directly instead of issuing one detail request per order.
  const orders = result.data.items ?? [];

  const totalPages = Math.max(1, result.data.totalPages || 1);
  const currentLabel = selectedStatus
    ? ORDER_STATUSES.find((item) => item.value === selectedStatus)?.label
    : "Tất cả";

  return (
    <div className="flex-1 bg-[#f5f7fa] py-6 sm:py-8">
      <Container className="max-w-5xl">
        <nav aria-label="Đường dẫn đơn thuê" className="mb-5 text-xs text-muted-foreground">
          <Link className="hover:text-primary" href="/">Trang chủ</Link> / <span className="text-foreground">Đơn thuê của tôi</span>
        </nav>
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Đơn thuê của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi thiết bị, thanh toán và trạng thái các đơn thuê.</p>
        </div>

        <nav aria-label="Lọc đơn theo trạng thái" className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <Link
            aria-current={!selectedStatus ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${!selectedStatus ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary hover:text-primary"}`}
            href="/orders"
          >
            Tất cả
          </Link>
          {ORDER_STATUSES.map((status) => (
            <Link
              aria-current={selectedStatus === status.value ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedStatus === status.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary hover:text-primary"}`}
              href={statusHref(status.value)}
              key={status.value}
            >
              {status.label}
            </Link>
          ))}
        </nav>

        <section aria-label={`${currentLabel} - danh sách đơn`} className="space-y-4">
          {orders.length === 0 ? (
            <EmptyState
              action={selectedStatus
                ? <Button asChild variant="secondary"><Link href="/orders">Xem tất cả đơn</Link></Button>
                : <Button asChild><Link href="/search">Tìm thiết bị</Link></Button>}
              className="min-h-[300px] gap-3 rounded-lg border border-border bg-background px-5 py-10"
              description={selectedStatus ? "Đơn thuê ở trạng thái này sẽ xuất hiện tại đây." : "Các đơn thuê của bạn sẽ xuất hiện tại đây."}
              illustration={<NoResultsIllustration />}
              title={selectedStatus ? `Chưa có đơn ở trạng thái “${currentLabel}”` : "Bạn chưa có đơn thuê nào"}
            />
          ) : orders.map((order) => {
            const items = order.items ?? [];
            const pending = order.status === "PENDING_PAYMENT";
            return (
              <article className="overflow-hidden rounded-lg border border-border bg-background shadow-sm" key={order.orderId}>
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-semibold">Đơn {order.orderCode ?? order.orderId}</span>
                    <span className="text-muted-foreground">{formatCreatedAt(order.createdAt)}</span>
                  </div>
                  <span className={`text-sm font-semibold ${pending ? "text-primary" : "text-foreground"}`}>
                    {ORDER_STATUSES.find((status) => status.value === order.status)?.label ?? order.status}
                  </span>
                </header>

                <div className="divide-y divide-border px-4 sm:px-5">
                  {items.length ? items.map((item) => {
                    const name = item.name?.trim() || "Thiết bị thuê";
                    const imageSrc = item.thumbnailMediaId
                      ? `/api/v1/media/${encodeURIComponent(item.thumbnailMediaId)}/content`
                      : null;
                    return (
                      <div className="flex items-center gap-3 py-4" key={item.rentalItemId}>
                        <div className="relative size-16 shrink-0 overflow-hidden rounded border border-border bg-background sm:size-20">
                          <ProductImage compact name={name} role="thumbnail" sizes="80px" src={imageSrc} />
                        </div>
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="line-clamp-2 font-semibold">{name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.quantity} thiết bị · {formatRentalPeriod(item.startDate, item.endDate)}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-4 text-sm text-muted-foreground">{order.itemCount} thiết bị trong đơn</div>
                  )}
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-5">
                  <p className="text-sm">Tổng cộng <strong className="ml-2 text-base text-primary">{formatEquipmentListingRate(order.totalAmount, order.currency ?? "VND")}</strong></p>
                  <div className="flex flex-wrap gap-2">
                    {pending && <Button asChild size="sm"><Link href={`/orders/${encodeURIComponent(order.orderId)}`}>Thanh toán</Link></Button>}
                    {pending && <OrderCancelAction orderId={order.orderId} />}
                    <Button asChild size="sm" variant="secondary"><Link href={`/orders/${encodeURIComponent(order.orderId)}`}>Xem chi tiết</Link></Button>
                  </div>
                </footer>
              </article>
            );
          })}
        </section>

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button asChild disabled={page <= 1} size="sm" variant="secondary">
              <Link aria-disabled={page <= 1} href={statusHref(selectedStatus, Math.max(1, page - 1))}>Trước</Link>
            </Button>
            <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
            <Button asChild disabled={page >= totalPages} size="sm" variant="secondary">
              <Link aria-disabled={page >= totalPages} href={statusHref(selectedStatus, Math.min(totalPages, page + 1))}>Sau</Link>
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
