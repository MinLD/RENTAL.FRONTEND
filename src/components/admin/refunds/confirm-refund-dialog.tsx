"use client";

import { useState } from "react";
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
import { confirmAdminRefund } from "@/services/admin-refunds-service";
import type { AdminRefundQueueItemResponse } from "@/types/rental-returns";
import { formatEquipmentListingRate } from "@/utils/inventory";

type ConfirmRefundDialogProps = {
  item: AdminRefundQueueItemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ConfirmRefundDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmRefundDialogProps) {
  const [bankTransactionRef, setBankTransactionRef] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!item) return null;

  const refundAccount = item.refundAccount as {
    bankCode?: string;
    accountNumber?: string;
    maskedAccountNumber?: string;
    accountHolderName?: string;
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setBankTransactionRef("");
    setNote("");
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = bankTransactionRef.trim();
    if (!ref) {
      setErrorMessage("Vui lòng nhập mã giao dịch ngân hàng.");
      return;
    }
    if (ref.length > 64) {
      setErrorMessage("Mã giao dịch tối đa 64 ký tự.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await confirmAdminRefund(item.rentalItemId, {
        bankTransactionRef: ref,
        note: note.trim() || null,
      });

      if (result.success) {
        toast.success("Xác nhận chuyển khoản hoàn tiền thành công!");
        handleClose();
        onSuccess();
      } else {
        setErrorMessage(result.error.message || "Xác nhận hoàn tiền thất bại.");
      }
    } catch {
      setErrorMessage("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Xác nhận chuyển khoản hoàn tiền</DialogTitle>
          <DialogDescription>
            Đối chiếu thông tin tài khoản người nhận và nhập mã giao dịch ngân hàng để hoàn tất.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã đơn thuê:</span>
              <span className="font-semibold">{item.orderCode || item.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thiết bị:</span>
              <span className="font-medium text-right">{item.equipmentName || "Thiết bị thuê"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Khách thuê:</span>
              <span className="font-medium">{item.renterName} ({item.renterPhone})</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-primary">
              <span>Số tiền cần hoàn:</span>
              <span>{formatEquipmentListingRate(item.refundAmount, "VND")}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3.5 text-sm space-y-1.5">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Tài khoản nhận tiền của khách
            </h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ngân hàng:</span>
              <span className="font-semibold">{refundAccount?.bankCode || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Số tài khoản:</span>
              <span className="font-mono font-semibold">
                {refundAccount?.accountNumber || refundAccount?.maskedAccountNumber || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chủ tài khoản:</span>
              <span className="font-semibold uppercase">{refundAccount?.accountHolderName || "—"}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bankTransactionRef" className="text-sm font-medium">
              Mã giao dịch ngân hàng <span className="text-destructive">*</span>
            </label>
            <Input
              id="bankTransactionRef"
              placeholder="Nhập mã giao dịch sao kê (ví dụ: FT261029000123)..."
              value={bankTransactionRef}
              onChange={(e) => setBankTransactionRef(e.target.value)}
              disabled={isSubmitting}
              maxLength={64}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="note" className="text-sm font-medium">
              Ghi chú nội bộ (tùy chọn)
            </label>
            <Textarea
              id="note"
              placeholder="Ghi chú xác nhận chuyển khoản..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              maxLength={500}
              rows={2}
            />
          </div>

          {errorMessage && (
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận đã chuyển"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
