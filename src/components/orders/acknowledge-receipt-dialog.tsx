"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PackageCheck } from "lucide-react";
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
import { acknowledgeReceipt } from "@/services/rental-returns-service";

type AcknowledgeReceiptDialogProps = {
  itemId: string;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function AcknowledgeReceiptDialog({
  itemId,
  itemName,
  open,
  onOpenChange,
  onSuccess,
}: AcknowledgeReceiptDialogProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      const result = await acknowledgeReceipt(itemId, {
        note: note.trim() || null,
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể xác nhận nhận thiết bị.");
        return;
      }

      toast.success("Xác nhận đã nhận thiết bị thành công!");
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi xác nhận nhận máy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600">
            <PackageCheck className="size-5 shrink-0" />
            <DialogTitle>Xác nhận đã nhận thiết bị</DialogTitle>
          </div>
          <DialogDescription>
            Xác nhận bạn đã nhận đủ máy ngoài công trình cho: <strong>{itemName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-2" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="ack-note">
              Ghi chú khi nhận máy (tùy chọn)
            </label>
            <Textarea
              id="ack-note"
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Đã nhận đủ máy và phụ kiện, máy hoạt động bình thường..."
              rows={3}
              value={note}
            />
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
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Đang ghi nhận...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Xác nhận đã nhận máy
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
