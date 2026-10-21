"use client";

import { Unlink } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { ChangePasswordDialog } from "@/components/account/change-password-dialog";
import {
  displayProfileValue,
  formatDate,
} from "@/components/account/account-utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getFirebaseGoogleLoginErrorMessage } from "@/hooks/use-firebase-google-login";
import {
  getExternalLogins,
  linkGoogleExternalLogin,
  unlinkExternalLogin,
} from "@/services/account-service";
import { signInWithFirebaseGoogle } from "@/services/firebase-google-auth-service";
import type { ExternalLoginResponse } from "@/types/auth";

type AccountExternalLoginCardProps = {
  initialExternalLogins: ExternalLoginResponse[];
};

export function AccountExternalLoginCard({
  initialExternalLogins,
}: AccountExternalLoginCardProps) {
  const [externalLogins, setExternalLogins] = useState(initialExternalLogins);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(
    null,
  );
  const [isUnlinkGoogleDialogOpen, setIsUnlinkGoogleDialogOpen] =
    useState(false);
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

  async function handleLinkGoogle() {
    setIsLinkingGoogle(true);

    try {
      const firebaseLogin = await signInWithFirebaseGoogle();

      await linkGoogleExternalLogin(firebaseLogin.idToken);
      toast.success("Đã liên kết Google.");
      await refreshExternalLogins();
    } catch (error) {
      const message = getFirebaseGoogleLoginErrorMessage(error);

      if (message) {
        toast.error(message);
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  }

  async function handleUnlinkGoogle() {
    if (!googleLogin?.provider) {
      return;
    }

    setUnlinkingProvider(googleLogin.provider);

    try {
      await unlinkExternalLogin(googleLogin.provider);
      toast.success("Đã hủy liên kết Google.");
      await refreshExternalLogins();
      setIsUnlinkGoogleDialogOpen(false);
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
      <div>
        <h2 className="text-xl font-bold text-foreground">Bảo mật</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý mật khẩu và phương thức đăng nhập.
        </p>
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-foreground">Mật khẩu</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cập nhật mật khẩu đăng nhập của bạn.
            </p>
          </div>
          <ChangePasswordDialog />
        </div>
        {googleLogin ? (
          <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
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
                  {formatDate(
                    googleLogin.linkedAtUtc ?? googleLogin.createdAtUtc,
                  )}
                </p>
              </div>
            </div>
            <Button
              disabled={unlinkingProvider === googleLogin.provider}
              onClick={() => setIsUnlinkGoogleDialogOpen(true)}
              type="button"
              variant="secondary"
            >
              {unlinkingProvider === googleLogin.provider
                ? "Đang hủy..."
                : "Hủy liên kết"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
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
                <h3 className="font-bold text-foreground">Google</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Liên kết để đăng nhập bằng Google.
                </p>
              </div>
            </div>
            <Button
              disabled={isLinkingGoogle}
              onClick={() => {
                void handleLinkGoogle();
              }}
              type="button"
            >
              {isLinkingGoogle ? "Đang liên kết..." : "Liên kết Google"}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Hủy liên kết"
        description="Sau khi hủy liên kết, bạn sẽ không thể dùng tài khoản Google này để đăng nhập cho đến khi liên kết lại."
        icon={<Unlink className="size-5" />}
        isSubmitting={unlinkingProvider === googleLogin?.provider}
        onConfirm={() => {
          void handleUnlinkGoogle();
        }}
        onOpenChange={setIsUnlinkGoogleDialogOpen}
        open={isUnlinkGoogleDialogOpen}
        submittingLabel="Đang hủy..."
        title="Hủy liên kết Google?"
        variant="danger"
      />
    </section>
  );
}
