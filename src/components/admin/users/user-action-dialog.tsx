import { LockKeyhole, Trash2, UnlockKeyhole } from "lucide-react";
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
import { cn } from "@/utils/cn";

import type { UserPendingAction } from "./users-management-types";

type UserActionDialogProps = {
  action: UserPendingAction;
  deleteUser: (id: string) => Promise<void>;
  lockUser: (id: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  unlockUser: (id: string) => Promise<void>;
};

export function UserActionDialog({
  action,
  deleteUser,
  lockUser,
  onOpenChange,
  unlockUser,
}: UserActionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLock = action?.action === "lock";
  const isUnlock = action?.action === "unlock";
  const title = isLock
    ? "Tạm khóa người dùng?"
    : isUnlock
      ? "Mở khóa người dùng?"
      : "Xóa người dùng?";
  const description = isLock
    ? "User sẽ không thể đăng nhập cho đến khi quản trị viên kích hoạt lại bằng API activate."
    : isUnlock
      ? "User sẽ có thể đăng nhập lại sau khi tài khoản được kích hoạt."
      : "Thao tác này sẽ xóa user khỏi danh sách quản trị giả định.";
  const confirmLabel = isLock ? "Tạm khóa" : isUnlock ? "Mở khóa" : "Xóa";

  async function handleConfirm() {
    if (!action) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (action.action === "delete") {
        await deleteUser(action.user.id);
      }

      if (action.action === "lock") {
        await lockUser(action.user.id);
      }

      if (action.action === "unlock") {
        await unlockUser(action.user.id);
      }

      toast.success("Thao tác thành công.");
      action.refresh();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể thực hiện thao tác.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[490px] p-0" showCloseButton={false}>
        {action ? (
          <div className="grid grid-cols-[32px_1fr] gap-4 p-8">
            <div
              className={cn(
                "mt-1 flex size-8 items-center justify-center rounded-full",
                isUnlock
                  ? "bg-green-50 text-green-600"
                  : isLock
                    ? "bg-orange-50 text-primary"
                    : "bg-red-50 text-red-600",
              )}
            >
              {isUnlock ? (
                <UnlockKeyhole className="size-5" />
              ) : isLock ? (
                <LockKeyhole className="size-5" />
              ) : (
                <Trash2 className="size-5" />
              )}
            </div>
            <div>
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription className="max-w-[340px] leading-6">
                  {description}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-24">
                <Button
                  disabled={isSubmitting}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="secondary"
                >
                  Hủy
                </Button>
                <Button
                  className={cn(
                    isUnlock
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-100 text-red-600 hover:bg-red-200",
                  )}
                  onClick={() => {
                    void handleConfirm();
                  }}
                  disabled={isSubmitting}
                  type="button"
                >
                  {isSubmitting ? "Đang xử lý..." : confirmLabel}
                </Button>
              </DialogFooter>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
