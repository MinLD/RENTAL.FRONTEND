"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReturnRequestResponse } from "@/types/rental-returns";
import { formatActorRole, formatReturnDecision, formatReturnRequestStatus } from "@/utils/rental-returns";
import { AcknowledgeReceiptDialog } from "./acknowledge-receipt-dialog";
import { CancelNotDeliveredDialog } from "./cancel-not-delivered-dialog";
import { ItemDeductionCard } from "./item-deduction-card";
import { ReportIssueDialog } from "./report-issue-dialog";
import { ReturnRequestDialog } from "./return-request-dialog";

type AvailableUnit = {
  assignmentId: string;
  status: string;
  hasOpenReturnRequest?: boolean;
  canRequestReturn?: boolean;
};

type SettlementInfo = {
  returnsCompletedAt: string | null;
  deductionDeadline: string | null;
  deductionStatus: string | null;
  proposedDeductionAmount: number | null;
  renterResponseDeadline: string | null;
  finalDeductionAmount: number | null;
  depositRefundAmount: number | null;
  settledAt: string | null;
};

type RenterItemActionsProps = {
  itemId: string;
  itemName: string;
  itemStatus: string;
  startDate?: string | null;
  handover?: {
    actualHandoverAt?: string | null;
    renterAcknowledgedAt?: string | null;
  } | null;
  units?: AvailableUnit[] | null;
  returnRequests?: ReturnRequestResponse[] | null;
  settlement?: SettlementInfo | null;
  currency?: string | null;
};

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

function canCancelNotDelivered(startDate?: string | null, status?: string | null): boolean {
  if (status !== "AWAITING_HANDOVER" || !startDate) return false;
  const parts = startDate.slice(0, 10).split("-").map(Number);
  if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return false;
  // D is startDate. From 00:00 VN time on D+1 (UTC+7 -> -7 hours UTC)
  const dPlus1VN = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1, -7, 0, 0));
  return Date.now() >= dPlus1VN.getTime();
}

export function RenterItemActions({
  itemId,
  itemName,
  itemStatus,
  startDate,
  handover,
  units,
  returnRequests,
  settlement,
  currency = "VND",
}: RenterItemActionsProps) {
  const [isAckDialogOpen, setIsAckDialogOpen] = useState(false);
  const [isCancelNotDeliveredOpen, setIsCancelNotDeliveredOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [reportingRequest, setReportingRequest] = useState<ReturnRequestResponse | null>(null);

  // Condition 1: Can acknowledge receipt if Supplier handed over and Renter has not acknowledged yet
  const canAcknowledge = Boolean(handover?.actualHandoverAt && !handover?.renterAcknowledgedAt);

  // Condition 2: Can cancel not delivered if AWAITING_HANDOVER and past D+1 VN time
  const canCancel = canCancelNotDelivered(startDate, itemStatus);

  // Condition 3: Can declare return if IN_RENTAL and has eligible units
  const availableUnits = units ?? [];
  const canDeclareReturn =
    itemStatus === "IN_RENTAL" &&
    availableUnits.some(
      (u) =>
        u.canRequestReturn !== false &&
        !u.hasOpenReturnRequest &&
        u.status !== "RELEASED" &&
        !u.status.startsWith("RETURNED"),
    );

  const requests = returnRequests ?? [];

  return (
    <div className="mt-3 space-y-3">
      {/* Primary Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Acknowledge Receipt Button */}
        {canAcknowledge && (
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => setIsAckDialogOpen(true)}
            size="sm"
            type="button"
          >
            <PackageCheck className="mr-1.5 size-4" />
            Đã nhận thiết bị
          </Button>
        )}

        {/* Cancel Not Delivered Button */}
        {canCancel && (
          <Button
            className="border-rose-300 text-rose-700 hover:bg-rose-50"
            onClick={() => setIsCancelNotDeliveredOpen(true)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <XCircle className="mr-1.5 size-4 text-rose-600" />
            Hủy vì chưa nhận máy
          </Button>
        )}

        {/* Declare Return Button */}
        {canDeclareReturn && (
          <Button
            className="border-primary text-primary hover:bg-primary/5"
            onClick={() => setIsReturnDialogOpen(true)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ArrowDownLeft className="mr-1.5 size-4" />
            Khai báo trả thiết bị
          </Button>
        )}
      </div>

      {/* Return Requests History List */}
      {requests.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
          <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
            <RotateCcw className="size-3.5 text-primary" />
            Yêu cầu trả thiết bị ({requests.length})
          </h4>

          <div className="space-y-2.5">
            {requests.map((request) => {
              const statusInfo = formatReturnRequestStatus(request.status);
              const isActionable =
                request.status === "PendingSupplierConfirmation" ||
                request.units.some((u) => u.closedAt === null && u.rejectedAt === null);

              return (
                <div
                  className="rounded-md border border-border/80 bg-background p-3 space-y-2 shadow-2xs"
                  key={request.returnRequestId}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      {request.isOverdue && (
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 size-3" /> Quá hạn 24h
                        </Badge>
                      )}
                    </div>

                    {isActionable && (
                      <Button
                        className="h-7 text-xs text-amber-700 hover:text-amber-800"
                        onClick={() => setReportingRequest(request)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <ShieldAlert className="mr-1 size-3.5" />
                        Báo sự cố
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-muted-foreground text-[11px]">
                    <div>
                      Thời điểm trả: <strong className="text-foreground">{formatDate(request.actualReturnAt, true)}</strong>
                    </div>
                    <div>
                      Gửi lúc: <span className="text-foreground">{formatDate(request.submittedAt, true)}</span>
                    </div>
                    {request.confirmationDeadlineAt && (
                      <div>
                        Hạn NCC xác nhận: <span className="text-foreground">{formatDate(request.confirmationDeadlineAt, true)}</span>
                      </div>
                    )}
                    {request.note && (
                      <div className="sm:col-span-2 text-foreground italic border-t border-border/40 pt-1">
                        &quot;{request.note}&quot;
                      </div>
                    )}
                  </div>

                  {/* Units in this request */}
                  {request.units && request.units.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border/40">
                      <span className="font-semibold text-muted-foreground text-[10px] uppercase">
                        Máy trong yêu cầu ({request.units.length}):
                      </span>
                      <div className="space-y-1">
                        {request.units.map((unit, uIdx) => {
                          const uStatus = formatReturnRequestStatus(unit.status);
                          return (
                            <div
                              className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-[11px]"
                              key={unit.rentalUnitAssignmentId}
                            >
                              <span className="font-medium">
                                Máy #{uIdx + 1}{" "}
                                <span className="font-mono text-muted-foreground text-[10px]">
                                  ({unit.rentalUnitAssignmentId.slice(-8)})
                                </span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Badge variant={uStatus.variant}>{uStatus.label}</Badge>
                                {unit.closedAt && (
                                  <span className="text-muted-foreground text-[10px]">
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

                  {/* Issues reported */}
                  {request.issues && request.issues.length > 0 && (
                    <div className="border-t border-amber-200 bg-amber-50/50 p-2.5 rounded text-[11px] space-y-1.5">
                      <span className="font-semibold text-amber-950 flex items-center gap-1">
                        <AlertTriangle className="size-3 text-amber-600" />
                        Sự cố đã báo cáo ({request.issues.length}):
                      </span>
                      {request.issues.map((issue) => (
                        <div className="space-y-0.5 text-amber-900 border-l-2 border-amber-400 pl-2" key={issue.issueId}>
                          <p className="font-semibold">
                            [{formatActorRole(String(issue.reporterRole))}]: {issue.reason}
                          </p>
                          {issue.note && <p className="italic text-muted-foreground">&quot;{issue.note}&quot;</p>}
                          <p className="text-[10px] text-amber-800">
                            Báo lúc: {formatDate(issue.reportedAt, true)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resolutions */}
                  {request.resolutions && request.resolutions.length > 0 && (
                    <div className="border-t border-blue-200 bg-blue-50/50 p-2.5 rounded text-[11px] space-y-1">
                      <span className="font-semibold text-blue-950 flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-blue-600" />
                        Phán quyết từ Quản trị viên:
                      </span>
                      {request.resolutions.map((res) => (
                        <div className="text-blue-900 border-l-2 border-blue-400 pl-2" key={res.resolutionId}>
                          <p className="font-semibold">{formatReturnDecision(res.decision)}</p>
                          {res.decisionNote && (
                            <p className="italic text-muted-foreground">&quot;{res.decisionNote}&quot;</p>
                          )}
                          <p className="text-[10px] text-blue-800">
                            Xử lý lúc: {formatDate(res.resolvedAt, true)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deduction proposal & response card */}
      <ItemDeductionCard currency={currency} itemId={itemId} settlement={settlement} />

      {/* Dialog instances */}
      <AcknowledgeReceiptDialog
        itemId={itemId}
        itemName={itemName}
        onOpenChange={setIsAckDialogOpen}
        open={isAckDialogOpen}
      />

      <CancelNotDeliveredDialog
        itemId={itemId}
        itemName={itemName}
        onOpenChange={setIsCancelNotDeliveredOpen}
        open={isCancelNotDeliveredOpen}
      />

      <ReturnRequestDialog
        itemId={itemId}
        itemName={itemName}
        onOpenChange={setIsReturnDialogOpen}
        open={isReturnDialogOpen}
        units={availableUnits}
      />

      {reportingRequest && (
        <ReportIssueDialog
          itemId={itemId}
          onOpenChange={(open) => {
            if (!open) setReportingRequest(null);
          }}
          open={Boolean(reportingRequest)}
          requestId={reportingRequest.returnRequestId}
          units={reportingRequest.units}
        />
      )}
    </div>
  );
}
