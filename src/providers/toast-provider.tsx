"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      closeButton
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast: "font-sans pointer-events-auto",
        },
      }}
    />
  );
}
