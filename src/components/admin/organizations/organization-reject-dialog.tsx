"use client";

import { XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { rejectAdminOrganizationSchema } from "@/lib/validations/admin-organizations";

type OrganizationRejectDialogProps = {
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  open: boolean;
  organizationName?: string | null;
};

export function OrganizationRejectDialog({
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
  organizationName,
}: OrganizationRejectDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const characterCount = useMemo(() => reason.length, [reason]);

  function resetForm() {
    setReason("");
    setError(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!isSubmitting) {
      if (!nextOpen) resetForm();
      onOpenChange(nextOpen);
    }
  }

  function handleSubmit() {
    const parsed = rejectAdminOrganizationSchema.safeParse({ reason });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Lý do từ chối không hợp lệ.");
      return;
    }

    setError(undefined);
    onSubmit(parsed.data.reason);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[540px] p-0" showCloseButton={false}>
        <div className="p-8">
          <DialogHeader className="space-y-5 text-left">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <XCircle className="size-5" />
              </span>
              <DialogTitle>Từ chối hồ sơ tổ chức?</DialogTitle>
            </div>
            <DialogDescription className="leading-6">
              {`Nhập lý do từ chối hồ sơ "${organizationName || "này"}" để chủ tổ chức biết cần bổ sung gì.`}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <TextareaField
              characterCount={characterCount}
              disabled={isSubmitting}
              error={error}
              id="organization-reject-reason"
              label="Lý do từ chối"
              maxLength={500}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(undefined);
              }}
              placeholder="Ví dụ: Hồ sơ thiếu giấy phép kinh doanh hợp lệ."
              requiredIndicator
              rows={5}
              value={reason}
            />
          </div>

          <DialogFooter className="mt-10">
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="secondary"
            >
              Hủy
            </Button>
            <Button
              className="bg-red-100 text-red-600 hover:bg-red-200 focus-visible:outline-red-500"
              disabled={isSubmitting}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? "Đang từ chối..." : "Từ chối hồ sơ"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
