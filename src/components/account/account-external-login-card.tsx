"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { ChangePasswordDialog } from "@/components/account/change-password-dialog";
import {
  displayProfileValue,
  formatDate,
} from "@/components/account/account-utils";
import { Button } from "@/components/ui/button";
import {
  getExternalLogins,
  unlinkExternalLogin,
} from "@/services/account-service";
import type { ExternalLoginResponse } from "@/types/auth";

type AccountExternalLoginCardProps = {
  initialExternalLogins: ExternalLoginResponse[];
};

export function AccountExternalLoginCard({
  initialExternalLogins,
}: AccountExternalLoginCardProps) {
  const [externalLogins, setExternalLogins] = useState(initialExternalLogins);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(
    null,
  );
  const googleLogin = externalLogins.find((login) =>
    login.provider?.toLowerCase().includes("google"),
  );

  async function refreshExternalLogins() {
    try {
      setExternalLogins(await getExternalLogins());
    } catch {
      // External login is a secondary panel, keep the profile usable if it fails.
    }
  }

  async function handleUnlinkGoogle() {
    if (!googleLogin?.provider) {
      return;
    }

    const shouldUnlink = window.confirm(
      "Bạn có chắc muốn hủy liên kết tài khoản Google?",
    );

    if (!shouldUnlink) {
      return;
    }

    setUnlinkingProvider(googleLogin.provider);

    try {
      await unlinkExternalLogin(googleLogin.provider);
      toast.success("Đã hủy liên kết Google.");
      await refreshExternalLogins();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể hủy liên kết Google.",
      );
    } finally {
      setUnlinkingProvider(null);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">
          Bảo mật
        </h2>
        <ChangePasswordDialog />
      </div>

      <div className="mt-8">
        {googleLogin ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                <Image
                  alt="Google"
                  height={26}
                  src="/icons/google-logo.5462b711.svg"
                  width={26}
                />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-foreground">Google</p>
                  <span className="text-xs font-semibold text-success">
                    Đã kết nối
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {displayProfileValue(googleLogin.email)} · Liên kết lúc{" "}
                  {formatDate(googleLogin.linkedAtUtc)}
                </p>
              </div>
            </div>
            <Button
              disabled={unlinkingProvider === googleLogin.provider}
              onClick={handleUnlinkGoogle}
              type="button"
              variant="secondary"
            >
              {unlinkingProvider === googleLogin.provider
                ? "Đang hủy..."
                : "Hủy liên kết"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Thêm phương thức đăng nhập
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Có thể bổ sung provider khác khi hệ thống hỗ trợ.
              </p>
            </div>
            <Button disabled type="button">
              Chưa hỗ trợ
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
