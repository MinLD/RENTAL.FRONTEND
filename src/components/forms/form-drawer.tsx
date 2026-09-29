"use client";

import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/utils/cn";

type FormDrawerProps = {
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: ReactNode;
};

export function FormDrawer({
  bodyClassName,
  children,
  className,
  description,
  footer,
  onOpenChange,
  open,
  title,
}: FormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("w-full gap-0 p-0 sm:max-w-lg", className)}>
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 border-b border-border px-6 py-5">
            <SheetTitle className="truncate">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="truncate">
                {description}
              </SheetDescription>
            ) : null}
          </SheetHeader>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-6 py-5",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer ? (
            <SheetFooter className="shrink-0 border-t border-border px-6 py-4">
              {footer}
            </SheetFooter>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
