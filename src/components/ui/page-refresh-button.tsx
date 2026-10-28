"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PageRefreshButton({
  label = "Thử lại",
  size = "sm",
  variant = "primary",
  className,
}: {
  label?: string;
  size?: "sm" | "md" | "lg" | "icon";
  variant?: "primary" | "secondary" | "ghost" | "default";
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className={className}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      size={size}
      type="button"
      variant={variant}
    >
      {isPending ? "Đang tải..." : label}
    </Button>
  );
}
