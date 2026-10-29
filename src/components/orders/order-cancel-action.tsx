"use client";

import { useMutation } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { QueryProvider } from "@/providers/query-provider";
import { ApiError } from "@/services/api-error";
import { cancelRenterOrder } from "@/services/renter-order-service";
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

type CancelAttempt = { idempotencyKey: string; reason: string };

export function OrderCancelAction({ orderId }: { orderId: string }) {
  return (
    <QueryProvider>
      <OrderCancelActionContent orderId={orderId} />
    </QueryProvider>
  );
}

function OrderCancelActionContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [attempt, setAttempt] = useState<CancelAttempt | null>(null);
  const mutation = useMutation({
    mutationFn: (attempt: CancelAttempt) => cancelRenterOrder(orderId, attempt.reason, attempt.idempotencyKey),
  });

  async function confirmCancel() {
    if (mutation.isPending) return;
    const currentAttempt = attempt ?? {
      idempotencyKey: crypto.randomUUID(),
      reason: reason.trim(),
    };
    setAttempt(currentAttempt);
    try {
      const result = await mutation.mutateAsync(currentAttempt);
      setAttempt(null);
      setOpen(false);
      toast.success(`Đã hủy đơn ${result.orderCode ?? ""}.`.trim());
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setAttempt(null);
        setOpen(false);
        toast.error(error.message || "Không thể hủy đơn thuê ở trạng thái hiện tại.");
        router.refresh();
      } else if (error instanceof ApiError && error.status === 400) {
        setAttempt(null);
        toast.error(error.message || "Lý do hủy chưa hợp lệ.");
      } else {
        toast.error(error instanceof Error ? error.message : "Chưa hủy được đơn. Hãy thử lại.");
      }
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (mutation.isPending) return;
    setOpen(nextOpen);
    if (!nextOpen && !attempt) {
      setReason("");
      mutation.reset();
    }
  }

  return (
    <>
      <Button
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="secondary"
      >
        <Ban aria-hidden="true" className="size-3.5" />
        Hủy đơn
      </Button>
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn thuê này?</DialogTitle>
            <DialogDescription>
              Sau khi hủy, nếu đơn đã thanh toán thì hệ thống sẽ tự động tạo yêu cầu hoàn tiền vào tài khoản ngân hàng của bạn. Bạn cần tạo đơn mới nếu vẫn muốn thuê thiết bị.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor={`cancel-reason-${orderId}`}>
              Lý do hủy <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
            </label>
            <Textarea
              disabled={Boolean(attempt) || mutation.isPending}
              id={`cancel-reason-${orderId}`}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Nhập lý do nếu bạn muốn"
              value={attempt?.reason ?? reason}
            />
            {mutation.isError && mutation.error instanceof ApiError && mutation.error.status === 503 && (
              <p className="mt-2 text-sm text-muted-foreground" role="status">
                Hệ thống chưa hoàn tất việc hủy. Bấm thử lại để gửi lại cùng yêu cầu.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button disabled={mutation.isPending} onClick={() => handleOpenChange(false)} type="button" variant="secondary">
              Đóng
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600"
              disabled={mutation.isPending}
              onClick={() => void confirmCancel()}
              type="button"
            >
              {mutation.isPending ? "Đang hủy..." : attempt ? "Thử lại" : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
