"use client";

import { useId, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
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
import { withdrawReview } from "@/services/review-service";
import type { ReviewItem } from "@/types/review";
import { getReviewId } from "@/utils/review";

type ReviewWithdrawDialogProps = {
  review: ReviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ReviewWithdrawDialog({
  review,
  open,
  onOpenChange,
  onSuccess,
}: ReviewWithdrawDialogProps) {
  const baseId = useId();
  const reasonInputId = `${baseId}-withdraw-reason`;
  const reasonHintId = `${baseId}-withdraw-reason-hint`;

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewId = review ? getReviewId(review) : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId) {
      toast.error("Không tìm thấy mã đánh giá.");
      return;
    }

    try {
      setIsSubmitting(true);
      await withdrawReview(
        reviewId,
        reason.trim() || "Tác giả chủ động rút lại đánh giá",
        review?.etag,
      );
      toast.success("Đã thu hồi đánh giá của bạn.");
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(
          err.details?.detail ||
            err.details?.message ||
            "Không thể thu hồi đánh giá lúc này.",
        );
        return;
      }
      toast.error("Không thể thu hồi đánh giá. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <RotateCcw className="size-4" aria-hidden="true" />
            </span>
            <span>Thu hồi đánh giá</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Sau khi thu hồi, đánh giá này sẽ không còn hiển thị công khai trên trang thiết bị.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label
              htmlFor={reasonInputId}
              className="block text-xs font-semibold text-foreground"
            >
              Lý do thu hồi{" "}
              <span className="font-normal text-muted-foreground">
                (Tùy chọn)
              </span>
            </label>
            <p id={reasonHintId} className="text-[11px] text-muted-foreground">
              Ghi chú ngắn gọn lý do bạn muốn rút lại đánh giá này.
            </p>
            <Textarea
              id={reasonInputId}
              aria-describedby={reasonHintId}
              rows={3}
              maxLength={300}
              disabled={isSubmitting}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Đánh giá nhầm đơn hàng hoặc đã giải quyết xong với nhà cung cấp..."
              className="resize-none text-xs"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-lg text-xs"
            >
              Giữ lại đánh giá
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
                  <span>Đang xử lý...</span>
                </>
              ) : (
                "Xác nhận thu hồi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
