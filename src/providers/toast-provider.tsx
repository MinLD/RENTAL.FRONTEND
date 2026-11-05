"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      closeButton
      duration={1000}
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "font-sans pointer-events-auto",
        },
      }}
    />
  );
}
