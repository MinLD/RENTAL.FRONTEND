"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  History,
  Mail,
  Phone,
  RefreshCw,
  Truck,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getOrderEntitiesDetailsAction,
  type ResolvedOrderEntities,
} from "@/services/actions/admin-financial-details-actions";
import { FormDrawer } from "@/components/forms/form-drawer";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type {
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrderSummary,
  AdminSubOrder,
} from "@/types/admin-orders";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import { OrderStatusBadge } from "@/components/own/orders/order-status-badge";

function formatActionLabel(action?: string | null): string {
  if (!action) return "Chuyển trạng thái";
  const key = action.toLowerCase().replace(/[\s_-]/g, "");
  const map: Record<string, string> = {
    createorder: "Tạo đơn hàng",
    cancelorder: "Khách hủy đơn",
    cancellation: "Hủy đơn hàng",
    paid: "Thanh toán thành công",
    acceptorder: "Nhà cung cấp nhận đơn",
    accept: "Nhà cung cấp nhận đơn",
    rejectorder: "Nhà cung cấp từ chối",
    reject: "Nhà cung cấp từ chối",
    handover: "Bàn giao thiết bị",
    acknowledgereceipt: "Xác nhận đã nhận máy",
    cancelnotdelivered: "Hủy do không nhận được máy",
    returns: "Thu hồi thiết bị",
    return: "Thu hồi thiết bị",
    deductions: "Đề nghị trừ tiền cọc",
    responddeduction: "Phản hồi trừ tiền cọc",
    resolvedispute: "Admin xử lý khiếu nại cọc",
  };
  return map[key] || action;
}

function formatActorRole(role?: string | null): string {
  if (!role) return "Hệ thống";
  const upper = role.toUpperCase();
  if (upper === "RENTER") return "Khách thuê";
  if (upper === "SUPPLIER") return "Nhà cung cấp";
  if (upper === "ADMIN") return "Quản trị viên";
  if (upper === "SYSTEM") return "Hệ thống tự động";
  return role;
}

function translateReason(reason?: string | null): string {
  if (!reason) return "";
  const lower = reason.toLowerCase();
  if (lower.includes("cancelled by renter before payment") || lower.includes("cancel by renter")) {
    return "Khách thuê hủy đơn trước khi thanh toán";
  }
  if (lower.includes("checkout payable order")) {
    return "Tạo đơn hàng chờ thanh toán";
  }
  if (lower.includes("payment expired") || lower.includes("expired")) {
    return "Hết hạn thanh toán";
  }
  if (lower.includes("timeout")) {
    return "Hết thời gian xác nhận";
  }
  return reason;
}

function formatUnitStatus(status?: string | null): string {
  if (!status) return "—";
  const map: Record<string, string> = {
    ASSIGNED: "Đã gán máy",
    RELEASED: "Đã hoàn kho",
    HANDED_OVER: "Đã bàn giao",
    RETURNED_NORMAL: "Đã trả (bình thường)",
    RETURNED_DAMAGED: "Đã trả (hư hỏng)",
  };
  return map[status.toUpperCase()] || status;
}

function formatPaymentState(state?: string | null): {
  label: string;
  variant: "warning" | "destructive" | "success" | "muted";
} {
  if (!state) return { label: "Chưa thanh toán", variant: "muted" };
  const upper = state.toUpperCase();
  if (upper === "EXPIRED") return { label: "Hết hạn thanh toán", variant: "destructive" };
  if (upper === "PENDING") return { label: "Chờ thanh toán", variant: "warning" };
  if (upper === "PAID") return { label: "Đã thanh toán", variant: "success" };
  if (upper === "LATE_PAYMENT_REFUND") return { label: "Thanh toán trễ (Chờ hoàn tiền)", variant: "warning" };
  return { label: state, variant: "muted" };
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-xs">
      <dt className="w-36 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-right font-medium text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export function AdminOrderDetailDrawer({
  selectedOrder,
  order,
  isLoading,
  error,
  onClose,
  onRefresh,
}: {
  selectedOrder: AdminOrderSummary | null;
  order: AdminOrderDetail | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "sub-orders" | "history">("overview");
  const [entities, setEntities] = useState<ResolvedOrderEntities | null>(null);

  useEffect(() => {
    if (!order) return;

    let isMounted = true;
    const supplierIds = order.subOrders?.map((s) => s.supplierId) || [];

    void getOrderEntitiesDetailsAction({
      renterId: order.renterId,
      supplierIds,
    }).then((res) => {
      if (isMounted) {
        setEntities(res.success ? res.data : null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [order]);

  const handleClose = () => {
    setEntities(null);
    onClose();
  };

  return (
    <FormDrawer
      activeTab={activeTab}
      className="sm:max-w-2xl"
      description={
        selectedOrder?.orderCode ||
        selectedOrder?.orderId ||
        "Thông tin đơn thuê toàn hệ thống"
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button
            disabled={isLoading}
            onClick={onRefresh}
            size="sm"
            type="button"
            variant="secondary"
          >
            <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
            Tải lại
          </Button>
          <Button onClick={handleClose} size="sm" type="button" variant="secondary">
            Đóng
          </Button>
        </div>
      }
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
      open={Boolean(selectedOrder)}
      tabs={[
        { label: "Tổng quan đơn", value: "overview" },
        { label: `Đơn con (${order?.subOrders?.length ?? 0})`, value: "sub-orders" },
        { label: `Lịch sử (${order?.history?.length ?? 0})`, value: "history" },
      ]}
      title="Chi tiết đơn thuê toàn hệ thống"
    >
      {isLoading ? (
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-lg border border-error/20 bg-error/5 p-4 text-xs text-error">
          <p>{error}</p>
          <Button onClick={onRefresh} size="sm" variant="secondary">
            Thử lại
          </Button>
        </div>
      ) : order ? (
        <div className="space-y-6 pt-1">
          {/* TAB 1: TỔNG QUAN ĐƠN */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Header card tóm tắt đơn */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-foreground">
                        {order.orderCode || order.orderId}
                      </h3>
                      <ClickToCopy text={order.orderCode || order.orderId} display="" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Đặt lúc {formatSupplierOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="text-xs text-muted-foreground">Tổng tiền thanh toán</span>
                  <span className="text-base font-bold text-primary">
                    {formatEquipmentListingRate(order.totalAmount, order.currency)}
                  </span>
                </div>
              </div>

              {/* Thông tin đơn & giao nhận */}
              <div className="space-y-2.5 px-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chi tiết đơn hàng
                </h4>
                <dl className="space-y-1.5 text-xs">
                  <InfoRow
                    label="Trạng thái thanh toán"
                    value={
                      <Badge variant={formatPaymentState(order.paymentState).variant}>
                        {formatPaymentState(order.paymentState).label}
                      </Badge>
                    }
                  />
                  {order.paidAt ? (
                    <InfoRow label="Thời điểm thanh toán" value={formatSupplierOrderDate(order.paidAt)} />
                  ) : null}
                  <InfoRow label="Hạn thanh toán" value={formatSupplierOrderDate(order.paymentDeadline)} />
                  <InfoRow label="Người nhận hàng" value={order.delivery?.recipientName} />
                  <InfoRow
                    label="Số điện thoại"
                    value={
                      order.delivery?.recipientPhone ? (
                        <ClickToCopy text={order.delivery.recipientPhone} />
                      ) : (
                        "—"
                      )
                    }
                  />
                  {order.delivery?.address ? (
                    <div className="flex flex-col gap-1 pt-1 border-t border-border/40">
                      <span className="text-muted-foreground text-xs">Địa chỉ công trình giao nhận:</span>
                      <p className="font-medium text-foreground leading-relaxed break-words bg-background p-2 rounded border border-border/40 text-xs">
                        {order.delivery.address}
                      </p>
                    </div>
                  ) : null}
                  {order.delivery?.note ? (
                    <InfoRow label="Ghi chú giao hàng" value={order.delivery?.note} />
                  ) : null}
                  {order.refundAccount ? (
                    <InfoRow
                      label="Tài khoản hoàn cọc"
                      value={
                        <span>
                          {order.refundAccount.bankCode} · {order.refundAccount.maskedAccountNumber} ({order.refundAccount.accountHolderName})
                        </span>
                      }
                    />
                  ) : null}
                </dl>
              </div>

              {/* Chi phí */}
              <div className="space-y-2 px-1 pt-3 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chi phí
                </h4>
                <dl className="space-y-1.5 text-xs">
                  <InfoRow label="Tiền thuê thiết bị" value={formatEquipmentListingRate(order.totalRentalAmount, order.currency)} />
                  <InfoRow label="Tiền đặt cọc" value={formatEquipmentListingRate(order.totalDepositAmount, order.currency)} />
                </dl>
              </div>

              {/* Thông tin Khách thuê */}
              {order.renterId ? (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <User className="size-3.5 text-primary" />
                    <span>Khách thuê</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 shrink-0 rounded-full border border-border shadow-xs">
                      {entities?.renter?.avatarUrl ? (
                        <AvatarImage alt={entities.renter.name} src={entities.renter.avatarUrl ?? undefined} />
                      ) : null}
                      <AvatarFallback className="rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {entities?.renter?.name?.slice(0, 2).toUpperCase() || <User className="size-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-foreground text-sm">
                          {entities?.renter?.name || "Khách thuê"}
                        </h4>
                        <ClickToCopy
                          className="font-mono text-xs text-muted-foreground"
                          display={order.renterId.slice(0, 8) + "..."}
                          text={order.renterId}
                        />
                      </div>
                      {entities?.renter?.phoneNumber ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="size-3 text-primary shrink-0" />
                          <a
                            className="font-medium text-foreground hover:text-primary hover:underline"
                            href={`tel:${entities.renter.phoneNumber}`}
                          >
                            {entities.renter.phoneNumber}
                          </a>
                        </div>
                      ) : null}
                      {entities?.renter?.email ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="size-3 text-primary shrink-0" />
                          <a
                            className="hover:text-primary hover:underline break-all"
                            href={`mailto:${entities.renter.email}`}
                          >
                            {entities.renter.email}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Mã đối soát */}
              <div className="space-y-2 px-1 pt-3 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mã đối soát hệ thống
                </h4>
                <dl className="space-y-1 text-[11px]">
                  <InfoRow
                    label="Mã hóa đơn (Invoice)"
                    value={<span className="font-mono text-muted-foreground select-all break-all">{order.invoiceRef || "—"}</span>}
                  />
                  <InfoRow
                    label="Mã đơn hàng ID"
                    value={<span className="font-mono text-muted-foreground select-all break-all">{order.orderId}</span>}
                  />
                </dl>
              </div>
            </div>
          )}

          {/* TAB 2: ĐƠN CON & THIẾT BỊ */}
          {activeTab === "sub-orders" && (
            <div className="space-y-6">
              {order.subOrders?.length ? (
                order.subOrders.map((subOrder: AdminSubOrder) => (
                  <div key={subOrder.subOrderId} className="rounded-xl border border-border bg-card p-4 space-y-4">
                    <div className="flex flex-col gap-2 border-b border-border pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Truck className="size-4 text-primary" />
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-1">
                            <span>Đơn con:</span>
                            <ClickToCopy text={subOrder.subOrderCode || subOrder.subOrderId} />
                          </h4>
                        </div>
                        <OrderStatusBadge status={subOrder.status} />
                      </div>

                      {/* Thông tin Nhà cung cấp */}
                      <div className="mt-1 flex items-start gap-2.5 rounded-lg border border-border/50 bg-background p-2.5">
                        <Avatar className="size-8 shrink-0 rounded-lg border border-border">
                          {entities?.suppliersMap?.[subOrder.supplierId]?.logoUrl ? (
                            <AvatarImage
                              alt={entities.suppliersMap[subOrder.supplierId].name}
                              src={entities.suppliersMap[subOrder.supplierId].logoUrl ?? undefined}
                            />
                          ) : null}
                          <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {entities?.suppliersMap?.[subOrder.supplierId]?.name?.slice(0, 2).toUpperCase() || (
                              <Building2 className="size-3.5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-0.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-foreground truncate">
                              {entities?.suppliersMap?.[subOrder.supplierId]?.name || "Nhà cung cấp"}
                            </span>
                            <ClickToCopy
                              className="font-mono text-xs text-muted-foreground shrink-0"
                              display={subOrder.supplierId.slice(0, 8) + "..."}
                              text={subOrder.supplierId}
                            />
                          </div>
                          {entities?.suppliersMap?.[subOrder.supplierId]?.contactPhone ||
                          entities?.suppliersMap?.[subOrder.supplierId]?.contactEmail ? (
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                              {entities.suppliersMap[subOrder.supplierId].contactPhone ? (
                                <a
                                  className="inline-flex items-center gap-1 hover:text-primary hover:underline text-foreground"
                                  href={`tel:${entities.suppliersMap[subOrder.supplierId].contactPhone}`}
                                >
                                  <Phone className="size-2.5 text-primary" />
                                  <span>{entities.suppliersMap[subOrder.supplierId].contactPhone}</span>
                                </a>
                              ) : null}
                              {entities.suppliersMap[subOrder.supplierId].contactEmail ? (
                                <a
                                  className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                                  href={`mailto:${entities.suppliersMap[subOrder.supplierId].contactEmail}`}
                                >
                                  <Mail className="size-2.5 text-primary shrink-0" />
                                  <span className="break-all">
                                    {entities.suppliersMap[subOrder.supplierId].contactEmail}
                                  </span>
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Danh sách thiết bị */}
                    <div className="space-y-3">
                      {subOrder.items?.map((item: AdminOrderItem) => {
                        const isDifferentStatus = item.status?.toUpperCase() !== subOrder.status?.toUpperCase();
                        return (
                          <div key={item.rentalItemId} className="rounded-lg bg-muted/40 p-3 space-y-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h5 className="font-semibold text-xs text-foreground">{item.name || "Thiết bị thuê"}</h5>
                              {isDifferentStatus ? <OrderStatusBadge status={item.status} /> : null}
                            </div>
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="size-3.5 shrink-0" />
                              {formatSupplierOrderDate(item.startDate, false)} – {formatSupplierOrderDate(item.endDate, false)} ({item.rentalDays} ngày · {item.quantity} máy)
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-border/40">
                              <span className="text-muted-foreground">Đơn giá: <strong className="text-foreground">{formatEquipmentListingRate(item.dailyRate, order.currency)}/ngày</strong></span>
                              <span>Tiền thuê: <strong className="text-primary">{formatEquipmentListingRate(item.rentalAmount, order.currency)}</strong></span>
                              {item.depositAmount > 0 ? (
                                <span className="text-muted-foreground">Tiền cọc: <strong className="text-foreground">{formatEquipmentListingRate(item.depositAmount, order.currency)}</strong></span>
                              ) : null}
                            </div>

                            {/* Máy vật lý đã gán */}
                            {item.units?.length ? (
                              <div className="pt-1.5">
                                <p className="text-[11px] font-semibold text-muted-foreground mb-1">Máy vật lý đã gán ({item.units.length} máy):</p>
                                <div className="space-y-1">
                                  {item.units.map((unit) => (
                                    <div key={unit.assignmentId} className="flex items-center justify-between text-[11px] bg-background px-2.5 py-1 rounded border border-border/60">
                                      <span className="font-mono text-foreground">{unit.assetId}</span>
                                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatUnitStatus(unit.status)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between border-t border-border pt-2 text-xs font-bold">
                      <span>Tổng tiền đơn con:</span>
                      <span className="text-primary">{formatEquipmentListingRate(subOrder.totalAmount, order.currency)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Chưa có thông tin đơn con.</p>
              )}
            </div>
          )}

          {/* TAB 3: LỊCH SỬ CHUYỂN TRẠNG THÁI */}
          {activeTab === "history" && (
            <div className="space-y-5">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <History className="size-4 text-primary" />
                Dòng thời gian chuyển trạng thái ({order.history?.length ?? 0} mốc)
              </h4>
              {order.history?.length ? (
                <div className="relative pl-6 space-y-6 border-l-2 border-primary/20 ml-2">
                  {order.history.map((record, index) => (
                    <div key={index} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {formatActionLabel(record.action)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatSupplierOrderDate(record.occurredAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {record.fromState ? (
                            <OrderStatusBadge status={record.fromState} />
                          ) : (
                            <span className="text-muted-foreground font-medium">Khởi tạo</span>
                          )}
                          <span className="text-muted-foreground">→</span>
                          <OrderStatusBadge status={record.toState} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>Vai trò: <strong className="font-medium text-foreground">{formatActorRole(record.actorRole)}</strong></span>
                          {record.reason ? (
                            <span>Lý do: <span className="font-medium text-foreground">{translateReason(record.reason)}</span></span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Chưa có lịch sử trạng thái.</p>
              )}
            </div>
          )}
        </div>
      ) : null}
    </FormDrawer>
  );
}
