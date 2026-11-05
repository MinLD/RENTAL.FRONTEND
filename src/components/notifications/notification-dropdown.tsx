"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NOTIFICATION_QUERY_KEYS,
  useNotification,
} from "@/providers/notification-provider";
import { getNotifications } from "@/services/notification-service";
import type {
  NotificationListItem,
  NotificationListResponse,
} from "@/types/notifications";
import { cn } from "@/utils/cn";
import {
  formatNotificationBody,
  formatNotificationTitle,
  formatVietnameseNotificationTime,
  NOTIFICATION_CATEGORY_LABELS,
} from "@/utils/notification-format";
import { isSafeRelativeUrl } from "@/utils/safe-url";

type NotificationDropdownProps = {
  isAuthenticated: boolean;
  className?: string;
  iconClassName?: string;
};

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity?.toUpperCase()) {
    case "SUCCESS":
      return <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />;
    case "WARNING":
      return <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden="true" />;
    case "ERROR":
      return <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />;
    case "INFO":
    default:
      return <Info className="size-4 shrink-0 text-blue-500" aria-hidden="true" />;
  }
}

export function NotificationDropdown({
  isAuthenticated,
  className,
  iconClassName,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const router = useRouter();
  const pathname = usePathname();

  const {
    userId,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
    hasUnreadCountError,
    initialNotifications,
    isItemRead,
  } = useNotification();

  const inboxHref = pathname?.startsWith("/admin")
    ? "/admin/notifications"
    : pathname?.startsWith("/own")
      ? "/own/notifications"
      : "/notifications";

  const { data, isLoading, isError, refetch } = useQuery<NotificationListResponse>({
    queryKey: NOTIFICATION_QUERY_KEYS.list(userId, { page: 1, pageSize: 10 }),
    queryFn: ({ signal }) => getNotifications({ page: 1, pageSize: 10 }, signal),
    enabled: isAuthenticated && Boolean(userId),
    initialData: initialNotifications ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (isOpen) {
      void refetch();
    }
  }, [isOpen, refetch]);

  const showBadge = isAuthenticated && !hasUnreadCountError && unreadCount > 0;
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  const handleItemClick = async (item: NotificationListItem) => {
    if (!isItemRead(item)) {
      try {
        await markAsRead(item.id);
      } catch {
        // Continue navigation
      }
    }

    const targetUrl =
      item.isActionable && item.actionUrl && isSafeRelativeUrl(item.actionUrl)
        ? item.actionUrl
        : item.deepLinkUrl && isSafeRelativeUrl(item.deepLinkUrl)
          ? item.deepLinkUrl
          : null;

    if (targetUrl) {
      setIsOpen(false);
      router.push(targetUrl);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          aria-label={
            showBadge
              ? `Thông báo (${badgeText} chưa đọc)`
              : "Thông báo"
          }
          className={cn(
            "relative inline-flex size-9 cursor-pointer items-center justify-center rounded border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=open]:border-primary data-[state=open]:text-primary",
            className,
          )}
          type="button"
        >
          <Bell aria-hidden="true" className={cn("size-5", iconClassName)} />
          {showBadge && (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground"
            >
              {badgeText}
            </span>
          )}
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
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold" id={titleId}>
                Thông báo
              </h2>
              {showBadge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  disabled={unreadCount === 0 || isMarkingAllRead}
                  onClick={() => void markAllAsRead().catch(() => {})}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                  title="Đánh dấu tất cả đã đọc"
                >
                  {isMarkingAllRead ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="size-3.5" />
                  )}
                  <span>Đã đọc tất cả</span>
                </button>
              )}
              <Popover.Close asChild>
                <button
                  aria-label="Đóng thông báo"
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-hover-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </Popover.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isAuthenticated ? (
              isLoading ? (
                <div
                  className="divide-y divide-border/60"
                  aria-busy="true"
                  aria-label="Đang tải thông báo"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5">
                      <div className="mt-0.5">
                        <Skeleton className="size-4 rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="size-8 text-destructive/70" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Không thể tải danh sách thông báo.
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 text-xs"
                    onClick={() => void refetch()}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : data?.items?.length ? (
                <ul className="divide-y divide-border/60" role="list">
                  {data.items.map((item) => {
                    const isRead = isItemRead(item);
                    const isClickable = Boolean(
                      (item.isActionable && item.actionUrl && isSafeRelativeUrl(item.actionUrl)) ||
                        (item.deepLinkUrl && isSafeRelativeUrl(item.deepLinkUrl)),
                    );

                    return (
                      <li key={item.id}>
                        <div
                          role={isClickable ? "button" : "article"}
                          tabIndex={isClickable ? 0 : undefined}
                          onClick={() => handleItemClick(item)}
                          onKeyDown={(e) => {
                            if (isClickable && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault();
                              handleItemClick(item);
                            }
                          }}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-muted/40 text-left",
                            !isRead && "bg-primary/5",
                          )}
                        >
                          <div className="mt-0.5">
                            <SeverityIcon severity={item.severity} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                {NOTIFICATION_CATEGORY_LABELS[item.category] ?? item.category}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatVietnameseNotificationTime(item.occurredAt)}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "mt-0.5 text-sm leading-snug line-clamp-1",
                                !isRead ? "font-semibold text-foreground" : "font-medium text-foreground/90",
                              )}
                            >
                              {formatNotificationTitle(item.title)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {formatNotificationBody(item.body)}
                            </p>
                          </div>
                          {!isRead && (
                            <span
                              className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                              title="Chưa đọc"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                  <Bell className="size-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground" role="status">
                    Hiện tại bạn chưa có thông báo nào
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center px-5 py-8 text-center">
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
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="shrink-0 border-t border-border bg-muted/20 p-2 text-center">
              <Link
                href={inboxHref}
                onClick={() => setIsOpen(false)}
                className="inline-block py-1 text-xs font-semibold text-primary transition-colors hover:underline"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
