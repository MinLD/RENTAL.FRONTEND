"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import {
  CheckCircle2,
  Gavel,
  RefreshCw,
} from "lucide-react";

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
        onOpenChange={onOpenChange}
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

                {/* Chi tiết yêu cầu */}
                <div className="space-y-2 px-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Thông tin chi tiết yêu cầu
                  </h4>
                  <dl className="space-y-1">
                    <InfoRow
                      label="Thời điểm trả (khai báo)"
                      value={formatDate(req.actualReturnAt, true)}
                    />
                    <InfoRow
                      label="Thời điểm gửi yêu cầu"
                      value={formatDate(req.submittedAt, true)}
                    />
                    <InfoRow
                      label="Hạn nhà cung cấp xác nhận"
                      value={formatDate(req.confirmationDeadlineAt, true)}
                    />
                    <InfoRow
                      label="Mã khách thuê"
                      value={<span className="font-mono text-muted-foreground">{data.renterId}</span>}
                    />
                    <InfoRow
                      label="Mã nhà cung cấp"
                      value={<span className="font-mono text-muted-foreground">{data.supplierId}</span>}
                    />
                    {req.note && (
                      <InfoRow
                        label="Ghi chú của khách"
                        value={<span className="italic text-foreground">&quot;{req.note}&quot;</span>}
                      />
                    )}
                  </dl>
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
