"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileCheck,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Warehouse,
  XCircle,
} from "lucide-react";

import { FormDrawer } from "@/components/forms/form-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReturnRequestResponse } from "@/types/rental-returns";
import type {
  SupplierOrderDetail,
  SupplierOrderItem,
  SupplierOrderSummary,
} from "@/types/supplier-orders";
import { formatEquipmentListingRate } from "@/utils/inventory";
import {
  formatAssignmentStatus,
  formatReturnDecision,
  formatReturnRequestStatus,
  formatUnitCondition,
} from "@/utils/rental-returns";
import {
  formatSupplierOrderDate,
  isOrderPendingSupplierConfirmation,
} from "@/utils/supplier-orders";
import { OrderStatusBadge } from "./order-status-badge";
import { SupplierDeductionDialog } from "./supplier-deduction-dialog";
import { SupplierHandoverDrawer } from "./supplier-handover-drawer";
import { SupplierReturnDialog } from "./supplier-return-dialog";

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
      <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-right font-medium text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export function OrderDetailDrawer({
  selectedOrder,
  order,
  isLoading,
  error,
  canDecide,
  disabledReason,
  isSubmitting,
  onClose,
  onRefresh,
  onAccept,
  onReject,
}: {
  selectedOrder: SupplierOrderSummary | null;
  order: SupplierOrderDetail | null;
  isLoading: boolean;
  error: string | null;
  canDecide: boolean;
  disabledReason?: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "items" | "returns" | "settlement">("overview");

  // Dialog states
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  const [returnItem, setReturnItem] = useState<SupplierOrderItem | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const [deductionItem, setDeductionItem] = useState<SupplierOrderItem | null>(null);
  const [isDeductionOpen, setIsDeductionOpen] = useState(false);


  const pending = isOrderPendingSupplierConfirmation(order?.status);
  const isAwaitingHandover = order?.status === "AWAITING_HANDOVER";

  const totalReturnRequests = order?.items?.reduce(
    (sum, it) => sum + (it.returnRequests?.length ?? 0),
    0,
  ) ?? 0;

  return (
    <>
      <FormDrawer
        activeTab={activeTab}
        className="sm:max-w-2xl"
        description={
          selectedOrder?.subOrderCode ||
          selectedOrder?.subOrderId ||
          "Thông tin đơn thuê của bạn"
        }
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Button
              disabled={isLoading || isSubmitting}
              onClick={onRefresh}
              size="sm"
              type="button"
              variant="secondary"
            >
              <RefreshCw className={isLoading ? "mr-1.5 size-4 animate-spin" : "mr-1.5 size-4"} />
              Tải lại
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {isAwaitingHandover && (
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary-hover"
                  disabled={isLoading || isSubmitting}
                  onClick={() => setIsHandoverOpen(true)}
                  size="sm"
                  type="button"
                >
                  <FileCheck className="mr-1.5 size-4" />
                  Bàn giao
                </Button>
              )}

              {pending && (
                <>
                  <Button
                    className="border-error text-error hover:bg-error/10"
                    disabled={!canDecide || isSubmitting}
                    onClick={onReject}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <XCircle className="mr-1.5 size-4" /> Từ chối
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary-hover"
                    disabled={!canDecide || isSubmitting}
                    onClick={onAccept}
                    size="sm"
                    type="button"
                  >
                    <CheckCircle2 className="mr-1.5 size-4" /> Nhận đơn
                  </Button>
                </>
              )}

              <Button
                disabled={isSubmitting}
                onClick={onClose}
                size="sm"
                type="button"
                variant="secondary"
              >
                Đóng
              </Button>
            </div>
          </div>
        }
        onOpenChange={(open) => {
          if (!open && !isSubmitting) onClose();
        }}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        open={Boolean(selectedOrder)}
        tabs={[
          { label: "Tổng quan đơn", value: "overview" },
          { label: `Thiết bị & Bàn giao (${order?.items?.length ?? 0})`, value: "items" },
          { label: `Yêu cầu trả & Thu hồi (${totalReturnRequests})`, value: "returns" },
          { label: "Quyết toán & Cọc", value: "settlement" },
        ]}
        title="Chi tiết đơn thuê của tổ chức"
      >
        {isLoading ? (
          <div aria-busy="true" className="space-y-4 p-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <div className="space-y-3 rounded-lg border border-error/20 bg-error/5 p-4 text-xs text-error">
            <p>{error}</p>
            <Button disabled={isSubmitting} onClick={onRefresh} size="sm" variant="secondary">
              Thử lại
            </Button>
          </div>
        ) : order ? (
          <div className="space-y-5 pt-1 text-xs">
            {pending && !canDecide && disabledReason && (
              <div className="rounded border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                <p>{disabledReason}</p>
              </div>
            )}

            {/* TAB 1: TỔNG QUAN ĐƠN */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Header Card */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {order.subOrderCode || order.subOrderId}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Đơn cha: {order.orderCode || "—"} · Đặt lúc {formatSupplierOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-xs text-muted-foreground">Tổng tiền đơn con</span>
                    <span className="text-base font-bold text-primary">
                      {formatEquipmentListingRate(order.totalAmount, order.currency)}
                    </span>
                  </div>
                </div>

                {/* Thông tin đơn hàng & Giao nhận */}
                <div className="space-y-2 px-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    Thông tin giao nhận & công trình
                  </h4>
                  <dl className="space-y-1">
                    <InfoRow
                      label="Thời điểm thanh toán"
                      value={order.paidAt ? formatSupplierOrderDate(order.paidAt) : "Chưa thanh toán"}
                    />
                    <InfoRow label="Người nhận hàng" value={order.delivery?.recipientName} />
                    <InfoRow label="Số điện thoại" value={order.delivery?.recipientPhone} />
                    <InfoRow label="Địa chỉ giao máy" value={order.delivery?.address} />
                    {order.delivery?.note && (
                      <InfoRow
                        label="Ghi chú giao hàng"
                        value={<span className="italic text-foreground">&quot;{order.delivery.note}&quot;</span>}
                      />
                    )}
                    {order.items?.[0]?.pickupLocation && (
                      <InfoRow
                        label="Kho xuất máy của NCC"
                        value={order.items[0].pickupLocation}
                      />
                    )}
                  </dl>
                </div>

                {/* Chi phí đơn con */}
                <div className="space-y-2 px-1 border-t border-border/60 pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Chi tiết tài chính
                  </h4>
                  <dl className="space-y-1">
                    <InfoRow
                      label="Tiền thuê thiết bị"
                      value={formatEquipmentListingRate(order.totalRentalAmount, order.currency)}
                    />
                    <InfoRow
                      label="Tiền cọc thiết bị"
                      value={formatEquipmentListingRate(order.totalDepositAmount, order.currency)}
                    />
                    <div className="border-t border-border/50 pt-1 font-bold text-foreground">
                      <InfoRow
                        label="Tổng thu dự kiến"
                        value={formatEquipmentListingRate(order.totalAmount, order.currency)}
                      />
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* TAB 2: THIẾT BỊ & BÀN GIAO */}
            {activeTab === "items" && (
              <div className="space-y-4">
                {order.items?.map((item) => {
                  const units = item.units ?? [];
                  return (
                    <article
                      className="rounded-xl border border-border/70 bg-background p-4 space-y-3.5 shadow-2xs"
                      key={item.rentalItemId}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/50 pb-2.5">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">
                            {item.name || "Thiết bị thuê"}
                          </h4>
                          <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="size-3.5" />
                            {formatSupplierOrderDate(item.startDate, false)} – {formatSupplierOrderDate(item.endDate, false)} · {item.rentalDays} ngày · {item.quantity} máy
                          </p>
                        </div>
                        <OrderStatusBadge status={item.status} />
                      </div>

                      {/* Đơn giá & Cọc */}
                      <dl className="grid grid-cols-2 gap-2 text-muted-foreground border-b border-border/40 pb-2.5">
                        <div>Giá thuê/ngày/máy: <strong className="text-foreground">{formatEquipmentListingRate(item.dailyRate, order.currency)}</strong></div>
                        <div>Tiền thuê dòng: <strong className="text-foreground">{formatEquipmentListingRate(item.rentalAmount, order.currency)}</strong></div>
                        <div>Cọc/máy: <strong className="text-foreground">{formatEquipmentListingRate(item.depositPerUnit, order.currency)}</strong></div>
                        <div>Tiền cọc dòng: <strong className="text-foreground">{formatEquipmentListingRate(item.depositAmount, order.currency)}</strong></div>
                      </dl>

                      {/* Thông tin bàn giao */}
                      {item.handover?.actualHandoverAt ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 space-y-1 text-emerald-950">
                          <p className="font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            Đã bàn giao cho bên thuê lúc {formatDate(item.handover.actualHandoverAt, true)}
                          </p>
                          {item.handover.note && (
                            <p className="text-muted-foreground italic">&quot;{item.handover.note}&quot;</p>
                          )}
                          {item.handover.renterAcknowledgedAt ? (
                            <p className="text-[11px] text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                              Bên thuê đã xác nhận nhận thiết bị lúc {formatDate(item.handover.renterAcknowledgedAt, true)}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <Clock className="size-3.5 text-muted-foreground shrink-0" />
                              Đang chờ bên thuê xác nhận đã nhận máy ngoài công trường.
                            </p>
                          )}
                        </div>
                      ) : null}
                      {/* Danh sách máy con đã gán */}
                      {units.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider flex items-center gap-1">
                            <Warehouse className="size-3 text-primary" />
                            Danh sách máy đã gán ({units.length} máy):
                          </span>
                          <div className="divide-y divide-border/60 rounded-md border border-border bg-muted/20">
                            {units.map((unit, uIdx) => {
                              const asg = formatAssignmentStatus(unit.status);
                              const cond = formatUnitCondition(unit.returnCondition);
                              return (
                                <div
                                  className="flex items-center justify-between p-2.5 text-[11px]"
                                  key={unit.assignmentId}
                                >
                                  <div>
                                    <span className="font-semibold text-foreground">Máy #{uIdx + 1}</span>{" "}
                                    <span className="font-mono text-muted-foreground">
                                      ({unit.assignmentId.slice(-8)})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={asg.isDamaged ? "destructive" : "default"}>
                                      {asg.label}
                                    </Badge>
                                    {unit.returnCondition && (
                                      <span className={unit.returnCondition === "DAMAGED" ? "text-rose-700 font-semibold" : "text-emerald-700"}>
                                        · {cond}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* TAB 3: YÊU CẦU TRẢ & THU HỒI */}
            {activeTab === "returns" && (
              <div className="space-y-4">
                {order.items?.map((item) => {
                  const reqs = (item.returnRequests as ReturnRequestResponse[] | undefined) ?? [];
                  const units = item.units ?? [];
                  const pendingUnits = units.filter(
                    (u) =>
                      u.status !== "RETURNED_NORMAL" &&
                      u.status !== "RETURNED_DAMAGED" &&
                      u.status !== "RELEASED",
                  );
                  const canRecordReturn =
                    pendingUnits.length > 0 &&
                    (item.status === "IN_RENTAL" ||
                      item.status === "AWAITING_HANDOVER" ||
                      item.status === "PENDING_SETTLEMENT");

                  return (
                    <div className="rounded-xl border border-border/70 bg-background p-4 space-y-3.5 shadow-2xs" key={item.rentalItemId}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-foreground">
                          {item.name || "Thiết bị thuê"}
                        </h4>
                      </div>

                      {reqs.length === 0 ? (
                        <p className="text-muted-foreground text-xs py-1">
                          Chưa có yêu cầu trả máy nào từ khách thuê cho dòng thiết bị này.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {reqs.map((req) => {
                            const statusInfo = formatReturnRequestStatus(req.status);

                            return (
                              <div
                                className="rounded-lg bg-muted/40 p-3.5 space-y-2.5"
                                key={req.returnRequestId}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                    {req.isOverdue && (
                                      <Badge variant="destructive">
                                        <AlertTriangle className="mr-1 size-3" /> Quá hạn 24h
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {canRecordReturn && (
                                      <Button
                                        className="h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                                        onClick={() => {
                                          setReturnItem(item);
                                          setIsReturnOpen(true);
                                        }}
                                        size="sm"
                                        type="button"
                                      >
                                        <ArrowDownLeft className="mr-1 size-3.5" />
                                        Thu hồi máy
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-muted-foreground text-xs">
                                  <div>Khách khai báo trả lúc: <strong className="text-foreground">{formatDate(req.actualReturnAt, true)}</strong></div>
                                  <div>Gửi lúc: <span className="text-foreground">{formatDate(req.submittedAt, true)}</span></div>
                                  <div>Hạn xác nhận: <span className="text-foreground">{formatDate(req.confirmationDeadlineAt, true)}</span></div>
                                  {req.note && <div className="sm:col-span-2 text-foreground italic">&quot;{req.note}&quot;</div>}
                                </dl>

                                {/* Units list */}
                                {req.units && req.units.length > 0 && (
                                  <div className="space-y-1 pt-1">
                                    <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                                      Máy khách trả ({req.units.length} máy):
                                    </span>
                                    <div className="space-y-1">
                                      {req.units.map((unit, uIdx) => {
                                        const uStatus = formatReturnRequestStatus(unit.status);
                                        return (
                                          <div
                                            className="flex items-center justify-between py-1 text-xs"
                                            key={unit.rentalUnitAssignmentId}
                                          >
                                            <span>
                                              Máy #{uIdx + 1}{" "}
                                              <span className="font-mono text-muted-foreground text-[11px]">
                                                ({unit.rentalUnitAssignmentId.slice(-8)})
                                              </span>
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                              <Badge variant={uStatus.variant}>{uStatus.label}</Badge>
                                              {unit.closedAt && (
                                                <span className="text-muted-foreground text-[11px]">
                                                  ({formatDate(unit.closedAt, true)})
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}


                                {/* Resolutions */}
                                {req.resolutions && req.resolutions.length > 0 && (
                                  <div className="rounded-md bg-blue-50/60 p-2.5 text-xs text-blue-950 space-y-1">
                                    <span className="font-semibold flex items-center gap-1 text-[11px]">
                                      <CheckCircle2 className="size-3 text-blue-600" />
                                      Phán quyết từ Quản trị viên:
                                    </span>
                                    {req.resolutions.map((res) => (
                                      <div className="border-l-2 border-blue-400 pl-2" key={res.resolutionId}>
                                        <p className="font-medium">{formatReturnDecision(res.decision)}</p>
                                        {res.decisionNote && <p className="italic text-muted-foreground">&quot;{res.decisionNote}&quot;</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: QUYẾT TOÁN & CỌC */}
            {activeTab === "settlement" && (
              <div className="space-y-4">
                {order.items?.map((item) => {
                  const settlement = item.settlement;
                  const units = item.units ?? [];
                  const damagedUnits = units.filter(
                    (u) => u.returnCondition === "DAMAGED" || u.status === "RETURNED_DAMAGED",
                  );
                  const canProposeDeduction =
                    item.status === "PENDING_SETTLEMENT" &&
                    item.depositAmount > 0 &&
                    damagedUnits.length > 0 &&
                    settlement?.deductionStatus !== "SUBMITTED" &&
                    settlement?.deductionStatus !== "ACCEPTED" &&
                    settlement?.deductionStatus !== "RESOLVED";

                  return (
                    <article
                      className="rounded-xl border border-border/70 bg-background p-4 space-y-3 shadow-2xs"
                      key={item.rentalItemId}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">
                            {item.name || "Thiết bị thuê"}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Tiền cọc thiết bị: <strong>{formatEquipmentListingRate(item.depositAmount, order.currency)}</strong>
                          </p>
                        </div>
                        {canProposeDeduction && (
                          <Button
                            className="bg-amber-600 text-white hover:bg-amber-700"
                            onClick={() => {
                              setDeductionItem(item);
                              setIsDeductionOpen(true);
                            }}
                            size="sm"
                            type="button"
                          >
                            <ShieldAlert className="mr-1.5 size-3.5" />
                            Đề nghị trừ tiền cọc
                          </Button>
                        )}
                      </div>

                      {/* Settlement state alerts */}
                      {settlement?.deductionStatus === "SUBMITTED" && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 flex items-start gap-2">
                          <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                          <div className="space-y-0.5">
                            <p className="font-semibold">Đã gửi đề nghị khấu trừ tiền cọc</p>
                            <p className="text-amber-900">
                              Số tiền đề xuất: <strong>{formatEquipmentListingRate(settlement.proposedDeductionAmount || 0, order.currency)}</strong>. Đang chờ khách thuê phản hồi.
                            </p>
                            {settlement.renterResponseDeadline && (
                              <p className="text-[11px] text-amber-800">
                                Hạn khách phản hồi: {formatDate(settlement.renterResponseDeadline, true)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {settlement?.deductionStatus === "DISPUTED" && (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-950 flex items-start gap-2">
                          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-600" />
                          <div className="space-y-0.5">
                            <p className="font-semibold">Khách thuê đã khiếu nại đề xuất trừ cọc</p>
                            <p className="text-red-900">
                              Đề xuất đang chờ Quản trị viên (Admin) xem xét và phân xử.
                            </p>
                          </div>
                        </div>
                      )}

                      {(settlement?.deductionStatus === "ACCEPTED" || settlement?.deductionStatus === "RESOLVED") && (
                        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                          <div className="space-y-0.5">
                            <p className="font-semibold">
                              {settlement.deductionStatus === "RESOLVED"
                                ? "Admin đã giải quyết khấu trừ cọc"
                                : "Khách thuê đã đồng ý khấu trừ cọc"}
                            </p>
                            <p className="text-emerald-900">
                              Số tiền khấu trừ chốt: <strong>{formatEquipmentListingRate(settlement.finalDeductionAmount ?? settlement.proposedDeductionAmount ?? 0, order.currency)}</strong>.
                              {settlement.depositRefundAmount != null && (
                                <span> Phần tiền cọc hoàn lại khách: {formatEquipmentListingRate(settlement.depositRefundAmount, order.currency)}.</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {!settlement?.deductionStatus && (
                        <p className="text-xs text-muted-foreground">
                          {damagedUnits.length > 0
                            ? "Dòng thiết bị có máy hư hại. Sau khi thu hồi đủ tất cả máy, bạn có thể gửi đề nghị khấu trừ cọc."
                            : "Không có đề xuất cấn trừ tiền cọc nào cho thiết bị này."}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </FormDrawer>

      {/* Handover Drawer instance */}
      <SupplierHandoverDrawer
        items={order?.items ?? []}
        onOpenChange={setIsHandoverOpen}
        onSuccess={onRefresh}
        open={isHandoverOpen}
        subOrderCode={order?.subOrderCode || order?.subOrderId}
      />

      {/* Return Dialog instance */}
      {returnItem && (
        <SupplierReturnDialog
          itemId={returnItem.rentalItemId}
          itemName={returnItem.name || "Thiết bị thuê"}
          onOpenChange={(op) => {
            setIsReturnOpen(op);
            if (!op) setReturnItem(null);
          }}
          onSuccess={onRefresh}
          open={isReturnOpen}
          units={(returnItem.units ?? []).map((u) => ({
            assignmentId: u.assignmentId,
            assetId: u.assetId,
            status: u.status,
            returnCondition: u.returnCondition ?? null,
          }))}
        />
      )}

      {/* Deduction Dialog instance */}
      {deductionItem && (
        <SupplierDeductionDialog
          currency={order?.currency}
          damagedAssets={(deductionItem.units ?? [])
            .filter((u) => u.returnCondition === "DAMAGED" || u.status === "RETURNED_DAMAGED")
            .map((u) => ({ assignmentId: u.assignmentId, assetId: u.assetId }))}
          itemId={deductionItem.rentalItemId}
          itemName={deductionItem.name || "Thiết bị thuê"}
          maxDepositAmount={deductionItem.depositAmount}
          onOpenChange={(op) => {
            setIsDeductionOpen(op);
            if (!op) setDeductionItem(null);
          }}
          onSuccess={onRefresh}
          open={isDeductionOpen}
        />
      )}

    </>
  );
}
