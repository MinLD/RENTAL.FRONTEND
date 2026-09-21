import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <section
      className={cn(
        "w-full max-w-[460px] border border-border bg-background p-7 shadow-lg md:p-8",
        className,
      )}
    >
      {children}
    </section>
  );
}
