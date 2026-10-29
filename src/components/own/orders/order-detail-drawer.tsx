"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileCheck,
  MapPin,
  Package,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { FormDrawer } from "@/components/forms/form-drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  SupplierOrderDetail,
  SupplierOrderItem,
  SupplierOrderSummary,
} from "@/types/supplier-orders";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate, isOrderPendingSupplierConfirmation } from "@/utils/supplier-orders";
import { OrderStatusBadge } from "./order-status-badge";
import { SupplierHandoverDrawer } from "./supplier-handover-drawer";

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
  const [handoverItem, setHandoverItem] = useState<SupplierOrderItem | null>(null);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  const pending = isOrderPendingSupplierConfirmation(order?.status);
  const isAwaitingHandover = order?.status === "AWAITING_HANDOVER";
  const firstHandoverItem = order?.items?.find(
    (it) => it.status === "AWAITING_HANDOVER",
  ) ?? order?.items?.[0] ?? null;
  return (
    <FormDrawer
      className="sm:max-w-2xl"
      description={
        selectedOrder?.subOrderCode ||
        selectedOrder?.subOrderId ||
        "Thông tin đơn thuê của bạn"
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button
            disabled={isLoading || isSubmitting}
            onClick={onRefresh}
            size="sm"
            type="button"
            variant="ghost"
          >
            <RefreshCw
              className={isLoading ? "size-4 animate-spin" : "size-4"}
            />
            Tải lại
          </Button>
          {isAwaitingHandover && firstHandoverItem ? (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={isLoading || isSubmitting}
              onClick={() => {
                setHandoverItem(firstHandoverItem);
                setIsHandoverOpen(true);
              }}
              size="sm"
              type="button"
            >
              <FileCheck className="size-4" /> Bằng chứng bàn giao
            </Button>
          ) : null}
          {pending ? (
            <>
              <Button
                className="text-error"
                disabled={!canDecide}
                onClick={onReject}
                size="sm"
                type="button"
                variant="secondary"
              >
                <XCircle className="size-4" /> Từ chối
              </Button>
              <Button
                disabled={!canDecide}
                onClick={onAccept}
                size="sm"
                type="button"
              >
                <CheckCircle2 className="size-4" /> Nhận đơn
              </Button>
            </>
          ) : null}
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
      }
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
      open={Boolean(selectedOrder)}
      title="Chi tiết đơn thuê"
    >
      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Đang tải chi tiết đơn thuê"
          className="space-y-5"
        >
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-20 w-full" key={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {error ? (
            <div
              className="space-y-3 rounded border border-error/20 bg-error/5 p-4 text-sm text-error"
              role="alert"
            >
              <p>{error}</p>
              <Button
                disabled={isSubmitting}
                onClick={onRefresh}
                size="sm"
                type="button"
                variant="secondary"
              >
                Thử lại
              </Button>
            </div>
          ) : null}
          {pending && !canDecide && disabledReason ? (
            <div
              className="rounded border border-warning/20 bg-warning/5 p-3 text-sm text-warning"
              role="alert"
            >
              <p>{disabledReason}</p>
            </div>
          ) : null}
          {order ? (
            <>
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="min-w-0 break-words text-lg font-bold">
                    {order.subOrderCode || order.subOrderId}
                  </h2>
                  <OrderStatusBadge status={order.status} />
                </div>
                <dl className="space-y-2 text-sm">
                  <InfoRow label="Mã đơn thuê" value={order.orderCode} />
                  <InfoRow
                    label="Ngày đặt"
                    value={formatSupplierOrderDate(order.createdAt)}
                  />
                  <InfoRow
                    label="Đã thanh toán lúc"
                    value={formatSupplierOrderDate(order.paidAt)}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-border p-4">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
                  <MapPin className="size-4 text-primary" />
                  Thông tin giao nhận
                </h2>
                <dl className="space-y-3 text-sm">
                  <InfoRow
                    label="Người nhận"
                    value={order.delivery?.recipientName}
                  />
                  <InfoRow
                    label="Số điện thoại"
                    value={order.delivery?.recipientPhone}
                  />
                  <InfoRow label="Địa chỉ" value={order.delivery?.address} />
                  <InfoRow label="Ghi chú" value={order.delivery?.note} />
                </dl>
              </section>

              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Package className="size-4 text-primary" />
                  Thiết bị trong đơn ({order.items?.length ?? 0} dòng)
                </h2>
                {order.items?.length ? (
                  order.items.map((item) => (
                    <OrderEquipmentItem
                      currency={order.currency}
                      item={item}
                      key={item.rentalItemId}
                      onOpenHandover={(it) => {
                        setHandoverItem(it);
                        setIsHandoverOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có thông tin thiết bị.
                  </p>
                )}
              </section>

              <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <h2 className="text-sm font-bold">Chi phí đơn thuê</h2>
                <dl className="space-y-3 text-sm">
                  <InfoRow
                    label="Tiền thuê"
                    value={formatEquipmentListingRate(
                      order.totalRentalAmount,
                      order.currency,
                    )}
                  />
                  <InfoRow
                    label="Tiền cọc"
                    value={formatEquipmentListingRate(
                      order.totalDepositAmount,
                      order.currency,
                    )}
                  />
                  <div className="border-t border-border pt-3 font-bold text-primary">
                    <InfoRow
                      label="Tổng tiền"
                      value={formatEquipmentListingRate(
                        order.totalAmount,
                        order.currency,
                      )}
                    />
                  </div>
                </dl>
              </section>
            </>
          ) : null}
        </div>
      )}
      <SupplierHandoverDrawer
        item={handoverItem}
        onOpenChange={setIsHandoverOpen}
        onSuccess={onRefresh}
        open={isHandoverOpen}
        subOrderCode={order?.subOrderCode || order?.subOrderId}
      />
    </FormDrawer>
  );
}

function OrderEquipmentItem({
  item,
  currency,
  onOpenHandover,
}: {
  item: SupplierOrderItem;
  currency: string | null;
  onOpenHandover?: (item: SupplierOrderItem) => void;
}) {
  const price = (value: number) => formatEquipmentListingRate(value, currency);
  return (
    <article className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 break-words font-semibold">
          {item.name || "Thiết bị thuê"}
        </h3>
        <OrderStatusBadge status={item.status} />
      </div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <CalendarDays className="size-4 shrink-0" />
        {formatSupplierOrderDate(item.startDate, false)} –{" "}
        {formatSupplierOrderDate(item.endDate, false)}
        <span>
          · {item.rentalDays} ngày · {item.quantity} máy
        </span>
      </p>
      <dl className="space-y-2 text-sm">
        <InfoRow label="Giá thuê / máy / ngày" value={price(item.dailyRate)} />
        <InfoRow label="Tiền thuê" value={price(item.rentalAmount)} />
        <InfoRow label="Cọc / máy" value={price(item.depositPerUnit)} />
        <InfoRow label="Tiền cọc" value={price(item.depositAmount)} />
        {item.pickupLocation ? (
          <InfoRow label="Địa chỉ kho" value={item.pickupLocation} />
        ) : null}
        <InfoRow
          label="Hạn xác nhận"
          value={formatSupplierOrderDate(item.supplierConfirmationDeadline)}
        />
        {item.supplierDecisionAt ? (
          <InfoRow
            label="Đã xử lý lúc"
            value={formatSupplierOrderDate(item.supplierDecisionAt)}
          />
        ) : null}
      </dl>
      {item.status === "AWAITING_HANDOVER" && onOpenHandover && (
        <div className="pt-2 border-t border-border">
          <Button
            className="border-primary text-primary hover:bg-primary/5"
            onClick={() => onOpenHandover(item)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <FileCheck className="mr-1.5 size-3.5" />
            Bằng chứng bàn giao
          </Button>
        </div>
      )}
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap break-words text-right font-medium">
        {value || "—"}
      </dd>
    </div>
  );
}
