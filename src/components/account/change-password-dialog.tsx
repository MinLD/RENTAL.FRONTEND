"use client";

import { LockKeyhole, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PasswordField } from "@/components/forms/password-field";
import { Button } from "@/components/ui/button";
import { changePasswordAction } from "@/services/actions/account-actions";
import type { ChangePasswordActionState } from "@/services/actions/account-actions";

const initialChangePasswordActionState: ChangePasswordActionState = {
  success: false,
};

export function ChangePasswordDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialChangePasswordActionState,
  );

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.success) {
      toast.success(state.message);
      formRef.current?.reset();
      window.setTimeout(() => setIsOpen(false), 0);

      return;
    }

    toast.error(state.message);
  }, [state]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} type="button" variant="secondary">
        <LockKeyhole size={16} />
        Đổi mật khẩu
      </Button>

      {isOpen ? (
        <div
          aria-labelledby="change-password-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/55 px-4 py-6"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 text-primary">
                  <LockKeyhole size={18} />
                </span>
                <div>
                  <h3
                    className="text-lg font-bold text-foreground"
                    id="change-password-title"
                  >
                    Đổi mật khẩu
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cập nhật mật khẩu đăng nhập cho tài khoản hiện tại.
                  </p>
                </div>
              </div>
              <button
                aria-label="Đóng"
                className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <form action={formAction} className="space-y-4 p-5" ref={formRef}>
              <PasswordField
                autoComplete="current-password"
                error={state.fieldErrors?.currentPassword}
                id="change-current-password"
                label="Mật khẩu hiện tại"
                leftIcon={<LockKeyhole size={15} />}
                name="currentPassword"
                placeholder="Nhập mật khẩu hiện tại"
              />

              <PasswordField
                autoComplete="new-password"
                error={state.fieldErrors?.newPassword}
                id="change-new-password"
                label="Mật khẩu mới"
                leftIcon={<LockKeyhole size={15} />}
                name="newPassword"
                placeholder="Tối thiểu 8 ký tự"
              />

              <PasswordField
                autoComplete="new-password"
                error={state.fieldErrors?.confirmPassword}
                id="change-confirm-password"
                label="Xác nhận mật khẩu mới"
                leftIcon={<LockKeyhole size={15} />}
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
              />

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Hủy
                </Button>
                <Button disabled={isPending} type="submit">
                  {isPending ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
