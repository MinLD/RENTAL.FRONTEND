import type { ComponentProps } from "react";

import { cn } from "@/utils/cn";

export function Empty({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-h-72 flex-col items-center justify-center gap-6 rounded-lg p-6 text-center sm:p-10",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-3", className)}
      {...props}
    />
  );
}

export function EmptyMedia({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-media"
      className={cn(
        "flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-7",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="empty-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function EmptyDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

export function EmptyContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex flex-wrap items-center justify-center gap-3",
        className,
      )}
      {...props}
    />
  );
}
