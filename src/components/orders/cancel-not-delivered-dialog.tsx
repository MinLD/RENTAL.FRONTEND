"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
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
import { cancelNotDelivered } from "@/services/rental-returns-service";

type CancelNotDeliveredDialogProps = {
  itemId: string;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CancelNotDeliveredDialog({
  itemId,
  itemName,
  open,
  onOpenChange,
  onSuccess,
}: CancelNotDeliveredDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      const result = await cancelNotDelivered(itemId, {
        reason: reason.trim() || null,
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể gửi yêu cầu hủy mục thuê.");
        return;
      }

      toast.success(
        "Đã hủy mục thuê thành công do nhà cung cấp không giao máy! Toàn bộ tiền thuê và tiền cọc sẽ được hoàn lại.",
      );
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi hủy mục thuê.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="size-5 shrink-0" />
            <DialogTitle>Hủy thiết bị do chưa nhận được máy</DialogTitle>
          </div>
          <DialogDescription>
            Đã quá thời hạn bắt đầu thuê nhưng nhà cung cấp chưa bàn giao thiết bị: <strong>{itemName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-2" onSubmit={handleSubmit}>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Chính sách hoàn tiền khi hủy:</p>
            <p>
              Hệ thống sẽ hoàn lại <strong>100% tiền thuê</strong> và <strong>100% tiền cọc</strong> của mục thuê này vào tài khoản ngân hàng nhận hoàn tiền của bạn.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="cancel-reason">
              Lý do hủy (tùy chọn)
            </label>
            <Input
              id="cancel-reason"
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Đã quá 24h từ ngày thuê nhưng không liên hệ được nhà cung cấp..."
              value={reason}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              Quay lại
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <XCircle className="mr-1.5 size-4" />
                  Xác nhận hủy mục thuê
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
