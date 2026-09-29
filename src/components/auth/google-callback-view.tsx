"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import type { CurrentUserResponse } from "@/types/auth";

function getSafeReturnUrl(returnUrl: string | null) {
  if (!returnUrl?.startsWith("/")) {
    return "/";
  }

  if (returnUrl.startsWith("//")) {
    return "/";
  }

  return returnUrl;
}

export function GoogleCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const returnUrl = getSafeReturnUrl(searchParams.get("returnUrl"));
    const error = searchParams.get("error");

    if (error) {
      toast.error("Đăng nhập Google không thành công. Vui lòng thử lại.");
      router.replace("/login?error=google-login-failed");
      return;
    }

    let isMounted = true;

    async function completeGoogleLogin() {
      try {
        await authApiClientJson<CurrentUserResponse>(
          API_ENDPOINTS.backend.currentUser.me,
          {
            method: "GET",
          },
        );

        if (!isMounted) {
          return;
        }

        toast.success("Đăng nhập Google thành công.");
        router.replace(returnUrl);
        router.refresh();
      } catch {
        if (!isMounted) {
          return;
        }

        toast.error("Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.");
        router.replace("/login?error=google-login-failed");
      }
    }

    void completeGoogleLogin();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="text-center">
      <LoaderCircle
        aria-hidden="true"
        className="mx-auto size-9 animate-spin text-primary"
      />
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
        Đang hoàn tất đăng nhập Google
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Vui lòng chờ trong giây lát, hệ thống đang kiểm tra phiên đăng nhập của
        bạn.
      </p>
    </div>
  );
}
