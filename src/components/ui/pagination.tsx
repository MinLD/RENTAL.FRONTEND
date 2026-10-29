import type { ComponentProps } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils/cn";

function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      className={cn("flex w-full items-center justify-end", className)}
      data-slot="pagination"
      role="navigation"
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-2", className)}
      data-slot="pagination-content"
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      className={cn("flex items-center", className)}
      data-slot="pagination-item"
      {...props}
    />
  );
}

function PaginationButton({
  className,
  size = "md",
  variant = "ghost",
  ...props
}: ButtonProps) {
  return (
    <Button
      className={cn("whitespace-nowrap", className)}
      data-slot="pagination-button"
      size={size}
      suppressHydrationWarning
      variant={variant}
      {...props}
    />
  );
}

function PaginationPrevious({ children = "Previous", ...props }: ButtonProps) {
  return (
    <PaginationButton {...props}>
      <ChevronLeft className="size-4" />
      {children}
    </PaginationButton>
  );
}

function PaginationNext({ children = "Next", ...props }: ButtonProps) {
  return (
    <PaginationButton {...props}>
      {children}
      <ChevronRight className="size-4" />
    </PaginationButton>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex size-9 items-center justify-center", className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
};
