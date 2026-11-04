"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Gavel,
  Mail,
  Package,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import {
  getReturnRequestEntitiesDetailsAction,
  type ResolvedReturnRequestEntities,
} from "@/services/actions/admin-financial-details-actions";

import { FormDrawer } from "@/components/forms/form-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiResource } from "@/hooks/use-api-resource";
import { getAdminReturnRequestDetail } from "@/services/admin-return-requests-service";
import {
  formatAssignmentStatus,
  formatRentalItemStatus,
  formatReturnDecision,
  formatReturnRequestStatus,
  formatUnitCondition,
} from "@/utils/rental-returns";
import { AdminResolveReturnDialog } from "./admin-resolve-return-dialog";

type AdminReturnRequestDetailDrawerProps = {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
};

function formatDate(value: string | null | undefined, withTime = true) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}


export function AdminReturnRequestDetailDrawer({
  requestId,
  open,
  onOpenChange,
  onRefresh,
}: AdminReturnRequestDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "inventory">("overview");

  const fetchDetailRequest = useCallback(
    () =>
      requestId
        ? getAdminReturnRequestDetail(requestId)
        : Promise.resolve({
            success: false as const,
            error: { status: 400, message: "", fieldErrors: {} },
          }),
    [requestId],
  );
  const { data, isLoading, refresh } = useApiResource(
    fetchDetailRequest,
    open && Boolean(requestId),
  );

  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [entities, setEntities] = useState<ResolvedReturnRequestEntities | null>(null);

  useEffect(() => {
    if (!open || !data) return;

    let isMounted = true;
    void getReturnRequestEntitiesDetailsAction({
      renterId: data.renterId,
      supplierId: data.supplierId,
      orderId: data.orderId,
      itemId: data.request?.itemId,
    }).then((res) => {
      if (isMounted) {
        setEntities(res.success ? res.data : null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [open, data]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEntities(null);
    }
    onOpenChange(isOpen);
  };

  const handleRefresh = () => {
    void refresh();
    onRefresh?.();
  };

  const req = data?.request;
  const isActionable =
    req &&
    (req.status === "PendingSupplierConfirmation" ||
      req.status === "Disputed" ||
      req.units.some((u) => u.closedAt === null && u.rejectedAt === null));

  const statusInfo = formatReturnRequestStatus(req?.status);
  const itemStatusLabel = formatRentalItemStatus(data?.itemStatus);
  return (
    <>
      <FormDrawer
        activeTab={activeTab}
        className="sm:max-w-2xl"
        description={
          data ? `Đơn hàng: ${data.orderCode || data.orderId}` : "Xem thông tin yêu cầu trả thiết bị"
        }
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Button
              disabled={isLoading}
              onClick={handleRefresh}
              size="sm"
              type="button"
              variant="secondary"
            >
              <RefreshCw className={`mr-1.5 size-4 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {isActionable && data && (
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary-hover"
                  onClick={() => setIsResolveDialogOpen(true)}
                  size="sm"
                  type="button"
                >
                  <Gavel className="mr-1.5 size-4" />
                  Phân xử yêu cầu
                </Button>
              )}

              <Button onClick={() => onOpenChange(false)} size="sm" type="button" variant="secondary">
                Đóng
              </Button>
            </div>
          </div>
        }
        onOpenChange={handleOpenChange}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        open={open}
        tabs={[
          { label: "Tổng quan & Thiết bị", value: "overview" },
          { label: `Đồng bộ kho (${data?.inventoryUnits?.length ?? 0})`, value: "inventory" },
        ]}
        title="Chi tiết yêu cầu trả thiết bị"
      >
        {isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !data || !req ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Chưa có thông tin yêu cầu.
          </div>
        ) : (
          <div className="space-y-6 pt-1 text-xs">
            {/* TAB 1: TỔNG QUAN & THIẾT BỊ */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Header card tóm tắt */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Yêu cầu trả #{req.returnRequestId.slice(0, 8)}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Đơn hàng {data.orderCode || data.orderId} · Gửi lúc {formatDate(req.submittedAt, true)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      {req.isOverdue && (
                        <Badge variant="destructive">Quá hạn 24h</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-xs text-muted-foreground">Trạng thái mục thuê</span>
                    <span className="text-xs font-bold text-foreground">{itemStatusLabel}</span>
                  </div>
                </div>

                {/* Thẻ thiết bị đang yêu cầu trả */}
                {entities?.order?.device ? (
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
                    {entities.order.device.thumbnailUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        alt={entities.order.device.name}
                        className="size-14 shrink-0 rounded-lg border border-border bg-background object-contain"
                        src={entities.order.device.thumbnailUrl}
                      />
                    ) : (
                      <div className="grid size-14 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
                        <Package className="size-6 text-primary/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Thiết bị trong yêu cầu
                      </span>
                      <h4 className="font-bold text-sm text-foreground">
                        {entities.order.device.name}
                      </h4>
                      {entities.order.device.startDate && entities.order.device.endDate ? (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
                          <span>
                            {formatDate(entities.order.device.startDate, false)} – {formatDate(entities.order.device.endDate, false)} ({entities.order.device.rentalDays || 1} ngày · {entities.order.device.quantity || 1} máy)
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* Thẻ Khách thuê & Nhà cung cấp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Khách thuê */}
                  <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
                    <div className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <User className="size-4 text-primary" />
                      <span>Khách thuê</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10 shrink-0 rounded-full border border-border shadow-xs">
                        {entities?.renter?.avatarUrl ? (
                          <AvatarImage alt={entities.renter.name} src={entities.renter.avatarUrl} />
                        ) : null}
                        <AvatarFallback className="rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {entities?.renter?.name?.slice(0, 2).toUpperCase() || <User className="size-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1 text-xs sm:text-sm">
                        <h4 className="font-bold text-foreground text-sm">
                          {entities?.renter?.name || "Khách thuê"}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>ID:</span>
                          <ClickToCopy display={data.renterId.slice(0, 8) + "..."} text={data.renterId} />
                        </div>
                        {entities?.renter?.phoneNumber ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3.5 text-primary shrink-0" />
                            <a className="font-medium text-foreground hover:text-primary hover:underline" href={`tel:${entities.renter.phoneNumber}`}>
                              {entities.renter.phoneNumber}
                            </a>
                          </div>
                        ) : null}
                        {entities?.renter?.email ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3.5 text-primary shrink-0" />
                            <a className="hover:text-primary hover:underline break-all" href={`mailto:${entities.renter.email}`}>
                              {entities.renter.email}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Nhà cung cấp */}
                  <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
                    <div className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Building2 className="size-4 text-primary" />
                      <span>Nhà cung cấp</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10 shrink-0 rounded-lg border border-border shadow-xs">
                        {entities?.supplier?.logoUrl ? (
                          <AvatarImage alt={entities.supplier.name} src={entities.supplier.logoUrl} />
                        ) : null}
                        <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {entities?.supplier?.name?.slice(0, 2).toUpperCase() || <Building2 className="size-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1 text-xs sm:text-sm">
                        <h4 className="font-bold text-foreground text-sm">
                          {entities?.supplier?.name || "Nhà cung cấp"}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>ID:</span>
                          <ClickToCopy display={data.supplierId.slice(0, 8) + "..."} text={data.supplierId} />
                        </div>
                        {entities?.supplier?.contactPhone ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3.5 text-primary shrink-0" />
                            <a className="font-medium text-foreground hover:text-primary hover:underline" href={`tel:${entities.supplier.contactPhone}`}>
                              {entities.supplier.contactPhone}
                            </a>
                          </div>
                        ) : null}
                        {entities?.supplier?.contactEmail ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3.5 text-primary shrink-0" />
                            <a className="hover:text-primary hover:underline break-all" href={`mailto:${entities.supplier.contactEmail}`}>
                              {entities.supplier.contactEmail}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chi tiết yêu cầu */}
                <div className="space-y-2.5 rounded-xl border border-border bg-card p-4 shadow-xs">
                  <h4 className="text-sm font-semibold text-foreground">
                    Thông tin thời gian & Địa chỉ
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-muted-foreground">Thời điểm trả (khai báo):</span>
                      <span className="font-medium text-foreground">{formatDate(req.actualReturnAt, true)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-muted-foreground">Thời điểm gửi yêu cầu:</span>
                      <span className="font-medium text-foreground">{formatDate(req.submittedAt, true)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-muted-foreground">Hạn nhà cung cấp xác nhận:</span>
                      <span className="font-medium text-foreground">{formatDate(req.confirmationDeadlineAt, true)}</span>
                    </div>
                    {entities?.order?.recipientName ? (
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Người nhận máy:</span>
                        <span className="font-semibold text-foreground">
                          {entities.order.recipientName} {entities.order.recipientPhone ? `(${entities.order.recipientPhone})` : ""}
                        </span>
                      </div>
                    ) : null}
                    {entities?.order?.address ? (
                      <div className="flex flex-col gap-1 pt-1 border-t border-border/40">
                        <span className="text-muted-foreground text-xs">Địa chỉ công trình giao nhận:</span>
                        <p className="font-medium text-foreground leading-relaxed break-words bg-muted/40 p-2.5 rounded-lg border border-border/50 text-xs sm:text-sm">
                          {entities.order.address}
                        </p>
                      </div>
                    ) : null}
                    {req.note && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-border/40">
                        <span className="text-muted-foreground text-xs">Ghi chú của khách:</span>
                        <p className="italic text-foreground bg-muted/30 p-2 rounded text-xs">
                          &quot;{req.note}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danh sách máy trong yêu cầu */}
                <div className="space-y-2.5 px-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Thiết bị trong yêu cầu ({req.units.length} máy)
                  </h4>
                  <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-background overflow-hidden">
                    {req.units.map((unit, idx) => {
                      const uStatus = formatReturnRequestStatus(unit.status);
                      return (
                        <div
                          className="flex items-center justify-between p-3"
                          key={unit.rentalUnitAssignmentId}
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground text-xs">
                              Máy #{idx + 1}
                            </span>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {unit.rentalUnitAssignmentId}
                            </p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <Badge variant={uStatus.variant}>{uStatus.label}</Badge>
                            {unit.closedAt && (
                              <p className="text-[11px] text-muted-foreground">
                                Đã xác nhận: {formatDate(unit.closedAt, true)}
                              </p>
                            )}
                            {unit.rejectedAt && (
                              <p className="text-[11px] text-rose-600">
                                Đã từ chối: {formatDate(unit.rejectedAt, true)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Phán quyết của Quản trị viên (nếu có) */}
                {req.resolutions && req.resolutions.length > 0 && (
                  <div className="space-y-2 px-1">
                    <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-blue-600" />
                      Lịch sử phân xử của Quản trị viên
                    </h4>
                    <div className="space-y-2">
                      {req.resolutions.map((res) => (
                        <div
                          className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-1 text-blue-950"
                          key={res.resolutionId}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{formatReturnDecision(res.decision)}</span>
                            <span className="text-[11px] font-normal text-blue-800">
                              {formatDate(res.resolvedAt, true)}
                            </span>
                          </div>
                          {res.decisionNote && (
                            <p className="text-foreground">
                              <strong>Căn cứ:</strong> {res.decisionNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ĐỒNG BỘ KHO */}
            {activeTab === "inventory" && (
              <div className="space-y-4">
                {data.inventoryUnits && data.inventoryUnits.length > 0 ? (
                  <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-background overflow-hidden">
                    {data.inventoryUnits.map((inv, idx) => {
                      const asg = formatAssignmentStatus(inv.assignmentStatus);
                      const cond = formatUnitCondition(inv.returnCondition);
                      return (
                        <div className="p-3.5 space-y-2" key={inv.rentalUnitAssignmentId}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              Máy #{idx + 1}
                            </span>
                            <Badge variant={asg.isDamaged ? "destructive" : "default"}>
                              {asg.label}
                            </Badge>
                          </div>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
                            <div>
                              Assignment ID: <span className="font-mono text-foreground">{inv.rentalUnitAssignmentId.slice(0, 8)}</span>
                            </div>
                            <div>
                              Asset ID: <span className="font-mono text-foreground">{inv.assetId.slice(0, 8)}</span>
                            </div>
                            <div>
                              Allocation ID: <span className="font-mono text-foreground">{inv.allocationId.slice(0, 8)}</span>
                            </div>
                            <div>
                              Tình trạng máy: <strong className="text-foreground">{cond}</strong>
                            </div>
                            <div className="sm:col-span-2">
                              Kho đóng lúc:{" "}
                              <strong className="text-foreground">
                                {inv.allocationClosedAt ? formatDate(inv.allocationClosedAt, true) : "Chưa hoàn tất đóng"}
                              </strong>
                            </div>
                          </dl>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    Chưa có thông tin đồng bộ kho cho thiết bị này.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </FormDrawer>

      {/* Admin Resolve Return Dialog instance */}
      {isResolveDialogOpen && req && data && (
        <AdminResolveReturnDialog
          itemId={req.itemId}
          onOpenChange={setIsResolveDialogOpen}
          onSuccess={handleRefresh}
          open={isResolveDialogOpen}
          requestId={req.returnRequestId}
          units={req.units}
        />
      )}
    </>
  );
}
