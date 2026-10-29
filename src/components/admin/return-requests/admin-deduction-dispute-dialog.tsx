"use client";

import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, DollarSign, ImagePlus, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  getRentalDeductionDispute,
  resolveRentalDeductionDispute,
} from "@/services/rental-deductions-service";
import { formatEquipmentListingRate } from "@/utils/inventory";

type AdminDeductionDisputeDialogProps = {
  itemId: string;
  orderCode?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function AdminDeductionDisputeDialog({
  itemId,
  orderCode,
  open,
  onOpenChange,
  onSuccess,
}: AdminDeductionDisputeDialogProps) {
  const fetchDispute = useCallback(
    () => getRentalDeductionDispute(itemId),
    [itemId],
  );
  const { data: dispute, isLoading } = useApiResource(
    fetchDispute,
    open && Boolean(itemId),
  );

  const [customAmountStr, setCustomAmountStr] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalAmountStr =
    customAmountStr ??
    (dispute?.totalProposedAmount != null
      ? String(dispute.totalProposedAmount)
      : "");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!dispute) return;

    const amount = Number(finalAmountStr.replace(/[^0-9]/g, ""));
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Vui lòng nhập số tiền khấu trừ hợp lệ (>= 0).");
      return;
    }

    if (amount > dispute.depositAmount) {
      toast.error(
        `Số tiền khấu trừ không được vượt quá tổng tiền cọc (${formatEquipmentListingRate(
          dispute.depositAmount,
          "VND",
        )}).`,
      );
      return;
    }

    if (!decisionNote.trim()) {
      toast.error("Bắt buộc nhập lý do và căn cứ phán quyết.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resolveRentalDeductionDispute(itemId, {
        finalDeductionAmount: amount,
        decisionNote: decisionNote.trim(),
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể hoàn tất phán quyết tranh chấp cọc.");
        return;
      }

      toast.success(
        `Đã chốt số tiền khấu trừ ${formatEquipmentListingRate(
          amount,
          "VND",
        )}! Tiền cọc còn lại sẽ được hoàn tất quyết toán.`,
      );

      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi phân xử.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldAlert className="size-5 shrink-0" />
            <DialogTitle>Giải quyết tranh chấp tiền cọc (Admin)</DialogTitle>
          </div>
          <DialogDescription>
            Đối soát hồ sơ đề xuất khấu trừ và khiếu nại cọc của đơn {orderCode ? `(${orderCode})` : ""}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="mt-2 text-sm">Đang tải dữ liệu hồ sơ đối chất...</span>
          </div>
        ) : !dispute ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Không tìm thấy thông tin tranh chấp cọc cho mục thuê này.
          </div>
        ) : (
          <form className="space-y-4 py-2" onSubmit={handleSubmit}>
            {/* Overview numbers */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">Tổng tiền cọc:</span>
                <p className="text-base font-bold text-foreground">
                  {formatEquipmentListingRate(dispute.depositAmount, "VND")}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">NCC đề xuất trừ:</span>
                <p className="text-base font-bold text-amber-700">
                  {formatEquipmentListingRate(dispute.totalProposedAmount, "VND")}
                </p>
              </div>
            </div>

            {/* Side-by-side arguments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Supplier side */}
              <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/50 p-3 text-amber-950">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-amber-600" />
                  Đề xuất từ Nhà cung cấp
                </h4>
                <p className="whitespace-pre-wrap">
                  <strong>Mô tả hư hại:</strong>{" "}
                  {dispute.damageDescription || "Không có mô tả chi tiết."}
                </p>
              </div>

              {/* Renter side */}
              <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50/50 p-3 text-blue-950">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 text-blue-600" />
                  Khiếu nại từ Khách thuê
                </h4>
                <p className="whitespace-pre-wrap">
                  <strong>Lý do khiếu nại:</strong>{" "}
                  {dispute.disputeReason || "Khách không đồng ý với mức khấu trừ."}
                </p>
              </div>
            </div>

            {/* Evidence photos */}
            {dispute.disputeMediaIds && dispute.disputeMediaIds.length > 0 && (
              <div className="space-y-2 rounded-md border border-border p-3 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <ImagePlus className="size-4 text-primary" />
                  Ảnh bằng chứng đối chất ({dispute.disputeMediaIds.length} ảnh):
                </span>
                <div className="flex flex-wrap gap-2">
                  {dispute.disputeMediaIds.map((mediaId, idx) => (
                    <a
                      className="relative size-16 overflow-hidden rounded border border-border bg-muted hover:opacity-80"
                      href={`/api/v1/media/${encodeURIComponent(mediaId)}/content`}
                      key={mediaId}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={`Ảnh bằng chứng ${idx + 1}`}
                        className="size-full object-cover"
                        src={`/api/v1/media/${encodeURIComponent(mediaId)}/content`}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Units condition comparison */}
            {dispute.units && dispute.units.length > 0 && (
              <div className="space-y-2 rounded-md border border-border p-3 text-xs">
                <span className="font-semibold">Chi tiết tình trạng từng máy:</span>
                <div className="space-y-2">
                  {dispute.units.map((unit, idx) => (
                    <div className="rounded bg-muted/40 p-2 border border-border text-[11px] space-y-1" key={unit.assignmentId}>
                      <div className="flex justify-between font-semibold">
                        <span>Máy #{idx + 1} ({unit.assignmentId.slice(-8)})</span>
                        <span className={unit.isAffected ? "text-rose-700 font-bold" : "text-emerald-700"}>
                          {unit.isAffected ? "Có hư hại / ảnh hưởng" : "Bình thường"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div>
                          <strong>Bàn giao:</strong> {unit.handoverCondition || "—"}{" "}
                          {unit.handoverNote && `(${unit.handoverNote})`}
                        </div>
                        <div>
                          <strong>Thu hồi:</strong> {unit.returnCondition || "—"}{" "}
                          {unit.returnNote && `(${unit.returnNote})`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision resolution inputs */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="font-bold text-sm text-foreground">Phán quyết của Quản trị viên:</h4>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold" htmlFor="admin-final-deduction-amount">
                  Số tiền khấu trừ chốt cuối cùng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    className="pl-8"
                    id="admin-final-deduction-amount"
                    max={dispute.depositAmount}
                    min={0}
                    onChange={(e) => setCustomAmountStr(e.target.value)}
                    placeholder="0"
                    required
                    type="number"
                    value={finalAmountStr}
                  />
                  <DollarSign className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Số tiền tối đa có thể khấu trừ: {formatEquipmentListingRate(dispute.depositAmount, "VND")}.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold" htmlFor="admin-dispute-decision-note">
                  Căn cứ & Ghi chú phân xử <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="admin-dispute-decision-note"
                  maxLength={2000}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Ghi rõ căn cứ (ví dụ: Chấp thuận 50% chi phí sửa chữa do phụ tùng hao mòn tự nhiên...)"
                  required
                  rows={3}
                  value={decisionNote}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
              >
                Hủy
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
                disabled={isSubmitting || !decisionNote.trim() || !finalAmountStr}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Đang chốt...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 size-4" />
                    Hoàn tất phân xử cọc
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
