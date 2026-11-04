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
  activeTab?: string;
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  onTabChange?: (value: string) => void;
  open: boolean;
  tabs?: Array<{
    label: ReactNode;
    value: string;
  }>;
  title: ReactNode;
};

export function FormDrawer({
  activeTab,
  bodyClassName,
  children,
  className,
  description,
  footer,
  onOpenChange,
  onTabChange,
  open,
  tabs,
  title,
}: FormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("w-full gap-0 p-0 sm:max-w-lg", className)}>
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 border-b border-border px-6 py-5">
            <SheetTitle className="truncate">{title}</SheetTitle>
            {description ? (
              <SheetDescription asChild className="truncate">
                <div>{description}</div>
              </SheetDescription>
            ) : null}
          </SheetHeader>

          {tabs?.length ? (
            <div
              className="flex shrink-0 gap-1 overflow-x-auto px-6 pb-3 pt-4"
              role="tablist"
            >
              {tabs.map((tab) => {
                const isActive = tab.value === activeTab;

                return (
                  <button
                    aria-selected={isActive}
                    className={cn(
                      "h-9 rounded px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-hover-accent hover:text-hover-accent-foreground",
                    )}
                    key={tab.value}
                    onClick={() => onTabChange?.(tab.value)}
                    role="tab"
                    type="button"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : null}

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
