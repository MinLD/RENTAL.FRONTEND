"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CalendarDays,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  QrCode,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormDrawer } from "@/components/forms/form-drawer";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import { Button } from "@/components/ui/button";
import {
  getPayoutEntitiesDetailsAction,
  type ResolvedPayoutEntities,
} from "@/services/actions/admin-financial-details-actions";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import type { AdminPayoutListItem } from "@/types/admin-payouts";
import { getPayoutStatusBadge } from "./admin-payout-columns";

type AdminPayoutDetailDrawerProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  payout: AdminPayoutListItem | null;
};

export function AdminPayoutDetailDrawer({
  onOpenChange,
  open,
  payout,
}: AdminPayoutDetailDrawerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [entities, setEntities] = useState<ResolvedPayoutEntities | null>(null);

  useEffect(() => {
    if (!open || !payout) return;

    let isMounted = true;
    void getPayoutEntitiesDetailsAction({
      supplierId: payout.supplierId,
      rentalOrderId: payout.rentalOrderId,
      rentalItemId: payout.rentalItemId,
      completedBy: payout.completedBy,
    }).then((res) => {
      if (isMounted) {
        setEntities(res.success ? res.data : null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [open, payout]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEntities(null);
    }
    onOpenChange(isOpen);
  };

  if (!payout) return null;

  const displayRef = payout.payoutRef || payout.payoutId.slice(0, 8);
  const isPending =
    payout.status === "PENDING_PAYOUT" ||
    payout.status === "PENDING" ||
    payout.status === "WAITING";

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rawPayout = payout as Record<string, unknown>;
  const effectiveQrUrl =
    payout.qrUrl ||
    (rawPayout.qRUrl as string | undefined) ||
    (rawPayout.QrUrl as string | undefined) ||
    (rawPayout.QRUrl as string | undefined) ||
    (payout.recipientBankCode && payout.recipientAccountNumber
      ? `https://img.vietqr.io/image/${payout.recipientBankCode}-${payout.recipientAccountNumber}-compact2.png?amount=${Math.round(payout.amount || 0)}&addInfo=${encodeURIComponent(payout.transferCode || "")}&accountName=${encodeURIComponent(payout.recipientAccountHolderName || "")}`
      : null);

  return (
    <FormDrawer
      className="sm:max-w-xl"
      description={
        <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <span>ID:</span>
          <ClickToCopy text={payout.payoutId} />
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {isPending
              ? "Quét mã QR để hoàn tất quyết toán tự động"
              : "Đã hoàn tất quyết toán"}
          </span>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          >
            Đóng
          </Button>
        </div>
      }
      onOpenChange={handleOpenChange}
      open={open}
      title={
        <div className="flex items-center gap-2">
          <span>Chi tiết quyết toán</span>
          <span className="font-mono font-bold text-primary">#{displayRef}</span>
        </div>
      }
    >
      <div className="space-y-2 p-2">
        {/* Khối nổi bật: Số tiền thực nhận & Trạng thái */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Số tiền chi trả
              </span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatEquipmentListingRate(payout.amount, payout.currency || "VND")}
              </p>
            </div>
            {getPayoutStatusBadge(payout.status)}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span>Tạo: {formatSupplierOrderDate(payout.createdAt)}</span>
            </div>
            {payout.completedAt ? (
              <div className="flex items-center gap-1">
                <Calendar className="size-3.5 text-emerald-600" />
                <span>Hoàn tất: {formatSupplierOrderDate(payout.completedAt)}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Khối tài khoản thụ hưởng & Mã QR */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="size-4 text-primary" />
            <span>Tài khoản nhận tiền</span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Tên chủ tài khoản:</span>
              <span className="font-semibold uppercase text-foreground">
                {payout.recipientAccountHolderName || "—"}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground">
                  {payout.recipientAccountNumber || "—"}
                </span>
                {payout.recipientAccountNumber ? (
                  <button
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => handleCopy(payout.recipientAccountNumber!, "account")}
                    title="Sao chép số tài khoản"
                    type="button"
                  >
                    {copiedKey === "account" ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Ngân hàng:</span>
              <span className="font-medium text-foreground">
                {payout.recipientBankCode || "—"}
              </span>
            </div>
          </div>

          {effectiveQrUrl ? (
            <div className="mt-3 flex flex-col items-center">
              <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <QrCode className="size-3.5 text-primary" />
                Mã QR chuyển khoản Napas 247
              </span>
              <div className="overflow-hidden rounded-lg border border-border bg-white p-2 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Mã QR chuyển khoản quyết toán"
                  className="size-44 object-contain"
                  src={effectiveQrUrl}
                />
              </div>
              <a
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                href={effectiveQrUrl}
                rel="noreferrer"
                target="_blank"
              >
                <span>Mở ảnh QR gốc</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          ) : (
            <div className="mt-2 flex flex-col items-center justify-center rounded p-3 text-center">
              <QrCode className="mb-1.5 size-6 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">
                Khoản quyết toán này chưa có mã QR hoặc thông tin ngân hàng thụ hưởng.
              </span>
            </div>
          )}
        </div>

        {/* Khối nội dung chuyển khoản */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <CreditCard className="size-4 text-primary" />
            <span>Nội dung chuyển khoản (bắt buộc)</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background p-2.5 border border-border/60">
            <span className="font-mono text-sm font-bold text-foreground">
              {payout.transferCode || "—"}
            </span>
            {payout.transferCode ? (
              <button
                className="flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                onClick={() => handleCopy(payout.transferCode!, "transferCode")}
                type="button"
              >
                {copiedKey === "transferCode" ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Vui lòng giữ nguyên nội dung chuyển khoản khi thao tác để hệ thống tự động ghi nhận thanh toán quyết toán.
          </p>
          {payout.externalTransferReference || payout.completedBy ? (
            <div className="mt-2.5 space-y-1.5 text-xs sm:text-sm">
              {payout.externalTransferReference ? (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground shrink-0">Mã tham chiếu ngân hàng:</span>
                  <ClickToCopy className="font-mono text-foreground" text={payout.externalTransferReference} />
                </div>
              ) : null}
              {payout.completedBy ? (
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-muted-foreground">Duyệt hoàn tất bởi:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {entities?.completedByUser?.name || "Quản trị viên"}
                    </span>
                    <ClickToCopy
                      className="font-mono text-xs text-muted-foreground"
                      text={payout.completedBy}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Khối Nhà cung cấp */}
        {payout.supplierId ? (
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
            <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="size-4 text-primary" />
              <span>Thông tin nhà cung cấp</span>
            </div>
            <div className="flex items-start gap-3">
              <Avatar className="size-11 shrink-0 rounded-xl border border-border shadow-xs">
                {entities?.supplier?.logoUrl ? (
                  <AvatarImage alt={entities.supplier.name} src={entities.supplier.logoUrl} />
                ) : null}
                <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-bold text-primary">
                  {entities?.supplier?.name?.slice(0, 2).toUpperCase() || <Building2 className="size-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1 text-xs sm:text-sm">
                <div>
                  <h4 className="font-bold text-foreground text-sm sm:text-base">{entities?.supplier?.name || "Nhà cung cấp"}</h4>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <span>ID:</span>
                    <ClickToCopy text={payout.supplierId} />
                  </div>
                </div>
                {entities?.supplier?.contactPhone ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                    <Phone className="size-3.5 text-primary shrink-0" />
                    <a className="font-medium text-foreground hover:text-primary hover:underline" href={`tel:${entities.supplier.contactPhone}`}>
                      {entities.supplier.contactPhone}
                    </a>
                  </div>
                ) : null}
                {entities?.supplier?.contactEmail ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3.5 text-primary shrink-0" />
                    <a className="hover:text-primary hover:underline" href={`mailto:${entities.supplier.contactEmail}`}>
                      {entities.supplier.contactEmail}
                    </a>
                  </div>
                ) : null}
                {entities?.supplier?.address ? (
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{entities.supplier.address}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Khối Đơn thuê & Thiết bị */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Package className="size-4 text-primary" />
            <span>Thông tin đơn thuê & Thiết bị</span>
          </div>
          {entities?.order?.device ? (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5">
              {entities.order.device.thumbnailUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={entities.order.device.name}
                  className="size-12 shrink-0 rounded-md border border-border bg-background object-contain"
                  src={entities.order.device.thumbnailUrl}
                />
              ) : (
                <div className="grid size-12 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground">
                  <Package className="size-5 text-primary/60" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <h5 className="truncate text-xs sm:text-sm font-bold text-foreground">{entities.order.device.name}</h5>
                {entities.order.device.startDate && entities.order.device.endDate ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {formatSupplierOrderDate(entities.order.device.startDate, false)} – {formatSupplierOrderDate(entities.order.device.endDate, false)} ({entities.order.device.rentalDays || 1} ngày · {entities.order.device.quantity || 1} máy)
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Mã đơn thuê:</span>
              <ClickToCopy className="font-semibold text-foreground" text={payout.orderCode || entities?.order?.orderCode} />
            </div>
            {entities?.order?.recipientName ? (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground shrink-0">Người nhận máy:</span>
                <span className="font-semibold text-foreground">
                  {entities.order.recipientName}
                </span>
              </div>
            ) : null}
            {entities?.order?.recipientPhone ? (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground shrink-0">Số điện thoại nhận máy:</span>
                <ClickToCopy
                  className="font-mono font-medium text-foreground"
                  text={entities.order.recipientPhone}
                />
              </div>
            ) : null}
            {entities?.order?.address ? (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-muted-foreground text-xs">Địa chỉ công trình giao nhận:</span>
                <p className="font-medium text-foreground leading-relaxed break-words bg-muted/40 p-2.5 rounded-lg border border-border/50 text-xs sm:text-sm">
                  {entities.order.address}
                </p>
              </div>
            ) : null}
            {payout.settlementRef ? (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">Mã quyết toán:</span>
                <ClickToCopy className="font-mono text-foreground" text={payout.settlementRef} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Khối tài chính: Phân tách chi phí */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Receipt className="size-4 text-primary" />
            <span>Chi tiết cấu thành tài chính</span>
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tiền thuê gốc:</span>
              <span className="font-medium tabular-nums text-foreground">
                {payout.rentalAmount !== undefined
                  ? formatEquipmentListingRate(payout.rentalAmount, payout.currency || "VND")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phí sàn khấu trừ:</span>
              <span className="font-medium tabular-nums text-foreground">
                {payout.platformFeeAmount !== undefined
                  ? formatEquipmentListingRate(payout.platformFeeAmount, payout.currency || "VND")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Khấu trừ bồi thường/phạt:</span>
              <span className="font-medium tabular-nums text-foreground">
                {payout.finalDeductionAmount !== undefined
                  ? formatEquipmentListingRate(payout.finalDeductionAmount, payout.currency || "VND")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm sm:text-base bg-primary/10 rounded-lg p-2 mt-1">
              <span className="text-foreground">Thực nhận chuyển khoản:</span>
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatEquipmentListingRate(payout.amount, payout.currency || "VND")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </FormDrawer>
  );
}
