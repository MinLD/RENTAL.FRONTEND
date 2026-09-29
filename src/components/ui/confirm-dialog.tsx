"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";

type ConfirmDialogVariant = "danger" | "primary";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  icon?: ReactNode;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  submittingLabel?: string;
  title: string;
  variant?: ConfirmDialogVariant;
};

export function ConfirmDialog({
  cancelLabel = "Hủy",
  confirmLabel,
  description,
  icon,
  isSubmitting = false,
  onConfirm,
  onOpenChange,
  open,
  submittingLabel = "Đang xử lý...",
  title,
  variant = "primary",
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-w-[490px] p-0" showCloseButton={false}>
        <div className="grid grid-cols-[32px_1fr] gap-4 p-8">
          {icon ? (
            <div
              className={cn(
                "mt-1 flex size-8 items-center justify-center rounded-full",
          
              )}
            >
              {icon}
            </div>
          ) : null}

          <div className={icon ? undefined : "col-span-2"}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="max-w-[360px] leading-6">
                {description}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-16">
              <Button
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
              >
                {cancelLabel}
              </Button>
              <Button
                className={cn(
                  isDanger
                    ? "bg-red-100 text-red-600 hover:bg-red-200 focus-visible:outline-red-500"
                    : undefined,
                )}
                disabled={isSubmitting}
                onClick={onConfirm}
                type="button"
              >
                {isSubmitting ? submittingLabel : confirmLabel}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
