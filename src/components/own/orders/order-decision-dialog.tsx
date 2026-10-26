"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supplierRejectRequestSchema } from "@/lib/validations/supplier-orders";
import type { ApiErrorDetails } from "@/services/api-error";
import type { SupplierDecisionAction, SupplierRejectRequest } from "@/types/supplier-orders";

export function OrderDecisionDialog({
  action, orderCode, error, canDecide, disabledReason, isSubmitting, onClose, onSubmit,
}: {
  action: SupplierDecisionAction;
  orderCode: string;
  error: ApiErrorDetails | null;
  canDecide: boolean;
  disabledReason?: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (request?: SupplierRejectRequest) => Promise<void>;
}) {
  const isReject = action === "reject";
  const uncertain = error !== null && (error.status === 0 || error.status >= 500);
  const { register, control, handleSubmit, formState: { errors } } = useForm<SupplierRejectRequest>({
    defaultValues: { rejectReason: "", optionalNote: "" },
    resolver: zodResolver(supplierRejectRequestSchema),
  });
  const reason = useWatch({ control, name: "rejectReason" });
  const note = useWatch({ control, name: "optionalNote" });

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isSubmitting) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-5">
            {isReject ? <XCircle className="size-5 shrink-0 text-error" /> : <CheckCircle2 className="size-5 shrink-0 text-primary" />}
            {isReject ? "Từ chối đơn thuê?" : "Nhận đơn thuê?"}
          </DialogTitle>
          <DialogDescription className="break-words leading-6">
            {isReject
              ? `Từ chối toàn bộ thiết bị trong đơn con ${orderCode}. Vui lòng cho người thuê biết lý do.`
              : `Nhận toàn bộ thiết bị trong đơn con ${orderCode}. Các thiết bị sẽ chuyển sang trạng thái chờ bàn giao.`}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (isSubmitting || !canDecide) return;
            if (isReject) void handleSubmit((values) => onSubmit(values))(event);
            else void onSubmit();
          }}
        >
          {isReject ? (
            <>
              <TextareaField
                {...register("rejectReason")}
                characterCount={reason?.length ?? 0}
                className="min-h-28"
                disabled={isSubmitting}
                readOnly={uncertain}
                error={errors.rejectReason?.message ?? error?.fieldErrors.rejectReason?.[0]}
                id="supplier-reject-reason"
                label="Lý do từ chối"
                maxLength={500}
                placeholder="Ví dụ: Thiết bị đang cần bảo trì, chưa thể đáp ứng lịch thuê."
                required
              />
              <TextareaField
                {...register("optionalNote")}
                characterCount={note?.length ?? 0}
                className="min-h-24"
                disabled={isSubmitting}
                readOnly={uncertain}
                error={errors.optionalNote?.message ?? error?.fieldErrors.optionalNote?.[0]}
                id="supplier-reject-note"
                label="Ghi chú thêm"
                maxLength={2000}
                placeholder="Thông tin bổ sung (không bắt buộc)"
              />
            </>
          ) : null}
          {error ? (
            <div className="space-y-1 rounded border border-error/20 bg-error/5 p-3 text-sm text-error" role="alert">
              <p>{error.message}</p>
              {uncertain ? <p>Chưa xác nhận được kết quả. Bấm thử lại để tiếp tục cùng yêu cầu.</p> : null}
            </div>
          ) : null}
          {!canDecide && !isSubmitting && disabledReason ? <p className="text-sm text-error" role="alert">{disabledReason}</p> : null}
          <DialogFooter>
            <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">Hủy</Button>
            <Button
              className={isReject ? "bg-red-100 text-red-600 hover:bg-red-200 focus-visible:outline-red-500" : undefined}
              disabled={isSubmitting || !canDecide}
              type="submit"
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {isSubmitting ? "Đang xử lý..." : uncertain ? "Thử lại" : isReject ? "Từ chối đơn" : "Xác nhận nhận đơn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
