"use client";

import type { ReactNode } from "react";
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
import { adminOrganizationReasonSchema } from "@/lib/validations/admin-organizations";

type OrganizationReasonDialogProps = {
  confirmClassName?: string;
  confirmLabel: string;
  description: string;
  fieldLabel: string;
  icon: ReactNode;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  open: boolean;
  placeholder: string;
  submittingLabel: string;
  title: string;
};

export function OrganizationReasonDialog({
  confirmClassName,
  confirmLabel,
  description,
  fieldLabel,
  icon,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
  placeholder,
  submittingLabel,
  title,
}: OrganizationReasonDialogProps) {
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
    const parsed = adminOrganizationReasonSchema.safeParse({ reason });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Lý do không hợp lệ.");
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
              {icon}
              <DialogTitle>{title}</DialogTitle>
            </div>
            <DialogDescription className="leading-6">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <TextareaField
              characterCount={characterCount}
              disabled={isSubmitting}
              error={error}
              id="organization-action-reason"
              label={fieldLabel}
              maxLength={500}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(undefined);
              }}
              placeholder={placeholder}
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
              className={confirmClassName}
              disabled={isSubmitting}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? submittingLabel : confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
