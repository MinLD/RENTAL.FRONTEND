"use client";

import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { loginWithFirebaseIdToken } from "@/services/auth-service";
import { signInWithFirebaseGoogle } from "@/services/firebase-google-auth-service";

type FirebaseGoogleLoginOptions = {
  returnUrl?: string;
};

export function useFirebaseGoogleLogin({
  returnUrl = "/",
}: FirebaseGoogleLoginOptions = {}) {
  const router = useRouter();
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);

  async function handleFirebaseGoogleLogin() {
    setIsSigningInWithGoogle(true);

    try {
      const firebaseLogin = await signInWithFirebaseGoogle();

      await loginWithFirebaseIdToken({
        idToken: firebaseLogin.idToken,
      });

      toast.success("Đăng nhập Google thành công.");
      router.replace(returnUrl);
      router.refresh();
    } catch (error) {
      const message = getFirebaseGoogleLoginErrorMessage(error);

      if (message) {
        toast.error(message);
      }
    } finally {
      setIsSigningInWithGoogle(false);
    }
  }

  return {
    handleFirebaseGoogleLogin,
    isSigningInWithGoogle,
  };
}

function getFirebaseGoogleLoginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request"
    ) {
      return null;
    }

    if (error.code === "auth/popup-blocked") {
      return "Trình duyệt đã chặn popup Google. Vui lòng cho phép popup và thử lại.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Không thể đăng nhập Google. Vui lòng thử lại.";
}
