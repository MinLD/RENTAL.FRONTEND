"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, ImagePlus, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Textarea } from "@/components/ui/textarea";
import { respondRentalDeduction } from "@/services/rental-deductions-service";
import { formatEquipmentListingRate } from "@/utils/inventory";

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

type ItemDeductionCardProps = {
  itemId: string;
  settlement?: SettlementInfo | null;
  currency?: string | null;
};

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function ItemDeductionCard({
  itemId,
  settlement,
  currency = "VND",
}: ItemDeductionCardProps) {
  const router = useRouter();

  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ mediaId: string; previewUrl: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  if (!settlement || !settlement.deductionStatus) {
    return null;
  }

  const { deductionStatus, proposedDeductionAmount, finalDeductionAmount, renterResponseDeadline } = settlement;

  const handleAcceptDeduction = async () => {
    if (!window.confirm("Bạn có chắc chắn đồng ý với số tiền khấu trừ cọc này không?")) {
      return;
    }

    setIsAccepting(true);
    try {
      const result = await respondRentalDeduction(itemId, {
        decision: "ACCEPT",
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể xác nhận đồng ý trừ cọc.");
        return;
      }

      toast.success("Bạn đã chấp thuận đề xuất khấu trừ cọc.");
      router.refresh();
    } catch {
      toast.error("Đã xảy ra lỗi khi xác nhận.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedMedia((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDisputeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!disputeReason.trim()) {
      toast.error("Vui lòng nhập lý do khiếu nại đề xuất trừ cọc.");
      return;
    }

    setIsSubmitting(true);
    try {
      const mediaIds = uploadedMedia.map((m) => m.mediaId);
      const result = await respondRentalDeduction(itemId, {
        decision: "DISPUTE",
        disputeReason: disputeReason.trim(),
        evidenceMediaIds: mediaIds,
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể gửi khiếu nại.");
        return;
      }

      toast.success("Đã gửi khiếu nại thành công! Quản trị viên sẽ xem xét và phân xử tranh chấp cọc.");
      setIsDisputeOpen(false);
      router.refresh();
    } catch {
      toast.error("Đã xảy ra lỗi khi gửi khiếu nại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Proposed deduction is waiting for Renter response
  if (deductionStatus === "SUBMITTED") {
    return (
      <>
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950 space-y-2.5">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-amber-950 text-sm">
                Đề nghị khấu trừ tiền cọc từ Nhà cung cấp
              </h4>
              <p className="text-amber-900">
                Nhà cung cấp ghi nhận thiết bị có hư hại và đề xuất cấn trừ số tiền:{" "}
                <strong className="font-bold text-amber-950 text-sm">
                  {formatEquipmentListingRate(proposedDeductionAmount || 0, currency)}
                </strong>
              </p>
              {renterResponseDeadline && (
                <p className="flex items-center gap-1 text-amber-800 text-[11px]">
                  <Clock className="size-3" /> Hạn phản hồi: {formatDate(renterResponseDeadline, true)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={isAccepting}
              onClick={handleAcceptDeduction}
              size="sm"
              type="button"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                  Đồng ý trừ cọc
                </>
              )}
            </Button>
            <Button
              className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
              disabled={isAccepting}
              onClick={() => setIsDisputeOpen(true)}
              size="sm"
              type="button"
              variant="secondary"
            >
              <ShieldAlert className="mr-1.5 size-3.5 text-amber-700" />
              Khiếu nại đề xuất
            </Button>
          </div>
        </div>

        {/* Dispute Modal */}
        <Dialog onOpenChange={setIsDisputeOpen} open={isDisputeOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-700">
                <ShieldAlert className="size-5 shrink-0" />
                <DialogTitle>Khiếu nại đề xuất khấu trừ cọc</DialogTitle>
              </div>
              <DialogDescription>
                Nhập lý do và bằng chứng nếu bạn không đồng ý với đề xuất trừ{" "}
                <strong>{formatEquipmentListingRate(proposedDeductionAmount || 0, currency)}</strong> của nhà cung cấp.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4 py-2" onSubmit={handleDisputeSubmit}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="dispute-reason">
                  Lý do khiếu nại <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="dispute-reason"
                  maxLength={2000}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Ví dụ: Thiết bị đã có vết nứt từ lúc bàn giao, biên bản bàn giao có ghi chú..."
                  required
                  rows={3}
                  value={disputeReason}
                />
              </div>

              {/* Photo upload via MediaAvatarUpload */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ImagePlus className="size-3.5 text-primary" />
                  Ảnh bằng chứng đối chất ({uploadedMedia.length}/10)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <MediaAvatarUpload
                    accept="image/*"
                    disabled={isSubmitting}
                    mode="multiple"
                    onChange={(_, upload) => {
                      const uploads = Array.isArray(upload) ? upload : [upload];
                      setUploadedMedia((prev) => {
                        const newMedia = uploads.map((res) => ({
                          mediaId: res.mediaId,
                          previewUrl: res.previewUrl || `/api/v1/media/${encodeURIComponent(res.mediaId)}/content`,
                        }));
                        return [...prev, ...newMedia].slice(0, 10);
                      });
                    }}
                    size="md"
                    uploadLabel="Thêm ảnh"
                    variant="add"
                  />

                  {uploadedMedia.map((photo, idx) => (
                    <div
                      className="relative size-20 rounded-lg"
                      key={photo.mediaId}
                    >
                      <div className="size-full overflow-hidden rounded-lg border border-border bg-background">
                        <AvatarWithSkeleton
                          alt={`Ảnh đối chất ${idx + 1}`}
                          className="size-full rounded-lg"
                          fallback={`${idx + 1}`}
                          imageClassName="object-cover"
                          src={photo.previewUrl}
                        />
                      </div>
                      <button
                        aria-label={`Xóa ảnh ${idx + 1}`}
                        className="absolute -right-2 -top-2 z-20 flex size-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md ring-2 ring-white hover:bg-red-700 transition-transform hover:scale-110"
                        onClick={() => handleRemovePhoto(idx)}
                        title="Xóa ảnh này"
                        type="button"
                      >
                        <X className="size-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  disabled={isSubmitting}
                  onClick={() => setIsDisputeOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Hủy
                </Button>
                <Button
                  className="bg-amber-600 text-white hover:bg-amber-700"
                  disabled={isSubmitting || !disputeReason.trim()}
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi khiếu nại"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 2. Disputed status
  if (deductionStatus === "DISPUTED") {
    return (
      <div className="mt-3 rounded-md border border-amber-300 bg-amber-50/70 p-3 text-xs text-amber-950 flex items-start gap-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div className="space-y-1">
          <span className="font-semibold text-amber-950">
            Đang khiếu nại đề xuất khấu trừ cọc
          </span>
          <p className="text-amber-900">
            Bạn đã gửi khiếu nại đối với đề xuất trừ cọc ({formatEquipmentListingRate(proposedDeductionAmount || 0, currency)}). Quản trị viên đang xem xét bằng chứng hai bên để phân xử.
          </p>
        </div>
      </div>
    );
  }

  // 3. Accepted or Resolved
  if (deductionStatus === "ACCEPTED" || deductionStatus === "RESOLVED") {
    return (
      <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        <div className="space-y-1">
          <span className="font-semibold text-emerald-950">
            {deductionStatus === "RESOLVED"
              ? "Quản trị viên đã phân xử khấu trừ cọc"
              : "Đã đồng ý khấu trừ tiền cọc"}
          </span>
          <p className="text-emerald-900">
            Số tiền khấu trừ đã chốt:{" "}
            <strong>{formatEquipmentListingRate(finalDeductionAmount ?? proposedDeductionAmount ?? 0, currency)}</strong>.
            Phần tiền cọc còn lại (nếu có) sẽ được hoàn trả về tài khoản ngân hàng của bạn.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
