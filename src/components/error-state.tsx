import type { ReactNode } from "react";

import { ErrorIllustration } from "@/components/illustrations/error-illustration";
import { cn } from "@/utils/cn";

type ErrorStateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function ErrorState({ action, className, description, title }: ErrorStateProps) {
  return (
    <div className={cn("flex min-h-72 flex-col items-center justify-center text-center", className)} role="alert">
      <div className="w-48 max-w-full"><ErrorIllustration /></div>
      <h2 className="mt-2 text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
