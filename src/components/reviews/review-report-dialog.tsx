"use client";

import { useId, useState } from "react";
import { Flag, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/services/api-error";
import { reportReview } from "@/services/review-service";

export const REVIEW_REPORT_REASONS = [
  "Nội dung spam, quảng cáo hoặc lôi kéo",
  "Ngôn từ thô tục, xúc phạm hoặc công kích",
  "Thông tin sai sự thật, giả mạo hoặc không trung thực",
  "Đánh giá không liên quan đến thiết bị hoặc dịch vụ",
  "Lý do khác",
] as const;

type ReviewReportDialogProps = {
  reviewId: string;
  authorName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ReviewReportDialog({
  reviewId,
  authorName,
  open,
  onOpenChange,
  onSuccess,
}: ReviewReportDialogProps) {
  const baseId = useId();
  const detailInputId = `${baseId}-detail`;
  const detailHintId = `${baseId}-detail-hint`;

  const [selectedReason, setSelectedReason] = useState<string>(
    REVIEW_REPORT_REASONS[0],
  );
  const [customNote, setCustomNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOtherSelected = selectedReason === "Lý do khác";

  const handleClose = (nextOpen: boolean) => {
    if (isSubmitting) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewId) {
      toast.error("Không tìm thấy mã đánh giá cần báo cáo.");
      return;
    }

    const trimmedNote = customNote.trim();
    if (isOtherSelected && !trimmedNote) {
      toast.error("Vui lòng nhập mô tả chi tiết cho lý do báo cáo.");
      return;
    }

    const finalReason = isOtherSelected
      ? trimmedNote
      : trimmedNote
        ? `${selectedReason}: ${trimmedNote}`
        : selectedReason;

    try {
      setIsSubmitting(true);
      await reportReview(reviewId, finalReason);
      toast.success(
        "Đã gửi báo cáo vi phạm. Quản trị viên sẽ xem xét đánh giá này.",
      );
      setCustomNote("");
      setSelectedReason(REVIEW_REPORT_REASONS[0]);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          toast.error("Vui lòng đăng nhập để gửi báo cáo vi phạm.");
          return;
        }
        if (err.status === 409) {
          toast.error(
            err.details?.detail ||
              err.details?.message ||
              "Không thể gửi báo cáo: Đánh giá này đã được báo cáo trước đó hoặc là đánh giá của chính bạn.",
          );
          return;
        }
        toast.error(
          err.details?.detail ||
            err.details?.message ||
            "Không thể gửi báo cáo vi phạm lúc này.",
        );
        return;
      }
      toast.error(
        "Không thể gửi báo cáo. Vui lòng đăng nhập hoặc thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Flag className="size-4" aria-hidden="true" />
            </span>
            <span>Báo cáo đánh giá vi phạm</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {authorName
              ? `Báo cáo đánh giá của "${authorName}" nếu bạn nhận thấy nội dung vi phạm tiêu chuẩn cộng đồng.`
              : "Hãy chọn lý do bên dưới để giúp chúng tôi kiểm duyệt nội dung chính xác hơn."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <fieldset className="space-y-2" disabled={isSubmitting}>
            <legend className="text-xs font-semibold text-foreground">
              Lý do báo cáo <span className="text-destructive">*</span>
            </legend>
            <div className="space-y-2 pt-1">
              {REVIEW_REPORT_REASONS.map((reason, idx) => {
                const optionId = `${baseId}-reason-${idx}`;
                const isChecked = selectedReason === reason;
                return (
                  <label
                    key={reason}
                    htmlFor={optionId}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition-colors ${
                      isChecked
                        ? "border-primary bg-primary/5 font-medium text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                  >
                    <input
                      id={optionId}
                      type="radio"
                      name={`${baseId}-report-reason`}
                      value={reason}
                      checked={isChecked}
                      onChange={() => setSelectedReason(reason)}
                      className="size-4 accent-primary cursor-pointer"
                    />
                    <span>{reason}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label
              htmlFor={detailInputId}
              className="block text-xs font-semibold text-foreground"
            >
              Mô tả chi tiết{" "}
              {isOtherSelected ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="font-normal text-muted-foreground">
                  (Tùy chọn)
                </span>
              )}
            </label>
            <p id={detailHintId} className="text-[11px] text-muted-foreground">
              Cung cấp thêm thông tin cụ thể giúp quản trị viên xử lý nhanh hơn.
            </p>
            <Textarea
              id={detailInputId}
              aria-describedby={detailHintId}
              required={isOtherSelected}
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={
                isOtherSelected
                  ? "Vui lòng nhập lý do vi phạm cụ thể..."
                  : "Nhập thêm ghi chú nếu cần..."
              }
              className="resize-none text-xs"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => handleClose(false)}
              className="rounded-lg text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="rounded-lg bg-destructive text-xs text-white hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="mr-1.5 size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Đang gửi...</span>
                </>
              ) : (
                "Gửi báo cáo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
