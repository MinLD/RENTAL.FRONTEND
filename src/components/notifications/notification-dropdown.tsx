"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Bell, X } from "lucide-react";
import { Popover } from "radix-ui";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

type NotificationDropdownProps = {
  isAuthenticated: boolean;
  className?: string;
  iconClassName?: string;
};

export function NotificationDropdown({
  isAuthenticated,
  className,
  iconClassName,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          aria-label="Thông báo"
          className={cn(
            "relative inline-flex size-9 cursor-pointer items-center justify-center rounded border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=open]:border-primary data-[state=open]:text-primary",
            className,
          )}
          type="button"
        >
          <Bell aria-hidden="true" className={cn("size-5", iconClassName)} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          aria-labelledby={titleId}
          className="z-50 flex h-[min(40rem,var(--radix-popover-content-available-height))] max-h-[calc(100dvh-5rem)] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-xl outline-none sm:w-[400px]"
          collisionPadding={12}
          side="bottom"
          sideOffset={12}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
            <h2 className="text-base font-semibold" id={titleId}>
              Thông báo
            </h2>
            <Popover.Close asChild>
              <button
                aria-label="Đóng thông báo"
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </Popover.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6 text-center">
            {isAuthenticated ? (
              <p className="text-sm leading-6 text-muted-foreground" role="status">
                Hiện tại bạn chưa có thông báo nào
              </p>
            ) : (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  Vui lòng đăng nhập để xem danh sách hoạt động
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button asChild size="sm">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      Đăng ký
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
