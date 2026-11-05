"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  NOTIFICATION_QUERY_KEYS,
  useNotification,
} from "@/providers/notification-provider";
import { getNotifications } from "@/services/notification-service";
import type {
  NotificationCategoryFilter,
  NotificationListItem,
  NotificationSeverity,
  NotificationStatusFilter,
} from "@/types/notifications";
import { cn } from "@/utils/cn";
import {
  formatVietnameseNotificationTime,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_SEVERITY_LABELS,
} from "@/utils/notification-format";
import { isSafeRelativeUrl } from "@/utils/safe-url";

const CATEGORY_OPTIONS: Array<{
  value: NotificationCategoryFilter | "all";
  label: string;
}> = [
  { value: "all", label: "Tất cả danh mục" },
  { value: "ORDER", label: "Đơn hàng" },
  { value: "PAYMENT", label: "Thanh toán" },
  { value: "HANDOVER", label: "Bàn giao" },
  { value: "RETURN", label: "Trả thiết bị" },
];

const STATUS_OPTIONS: Array<{
  value: NotificationStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
];

function SeverityBadge({ severity }: { severity: NotificationSeverity | string }) {
  const norm = severity?.toUpperCase();
  switch (norm) {
    case "SUCCESS":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          <span>{NOTIFICATION_SEVERITY_LABELS.SUCCESS}</span>
        </span>
      );
    case "WARNING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          <span>{NOTIFICATION_SEVERITY_LABELS.WARNING}</span>
        </span>
      );
    case "ERROR":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive dark:bg-destructive/20">
          <AlertCircle className="size-3.5" aria-hidden="true" />
          <span>{NOTIFICATION_SEVERITY_LABELS.ERROR}</span>
        </span>
      );
    case "INFO":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
          <Info className="size-3.5" aria-hidden="true" />
          <span>{NOTIFICATION_SEVERITY_LABELS.INFO}</span>
        </span>
      );
  }
}

function NotificationInboxItem({
  item,
  onItemClick,
  isMarkingRead,
}: {
  item: NotificationListItem;
  onItemClick: (item: NotificationListItem, actionUrl?: string) => void;
  isMarkingRead: boolean;
}) {
  const hasSafeAction = Boolean(
    item.isActionable && item.actionUrl && isSafeRelativeUrl(item.actionUrl),
  );
  const hasSafeDeepLink = Boolean(
    item.deepLinkUrl && isSafeRelativeUrl(item.deepLinkUrl),
  );
  const isNavigable = hasSafeAction || hasSafeDeepLink;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between gap-3 rounded-lg border border-border p-4 transition-all sm:flex-row sm:items-start",
        !item.isRead ? "bg-primary/[0.03] border-primary/30" : "bg-card hover:border-border/80",
        isNavigable && "cursor-pointer hover:shadow-xs",
      )}
      onClick={() => onItemClick(item)}
      role={isNavigable ? "button" : "article"}
      tabIndex={isNavigable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isNavigable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onItemClick(item);
        }
      }}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={item.severity} />
          <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {NOTIFICATION_CATEGORY_LABELS[item.category] ?? item.category}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatVietnameseNotificationTime(item.occurredAt)}
          </span>
          {!item.isRead && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Chưa đọc
            </span>
          )}
        </div>

        <h3
          className={cn(
            "text-base leading-snug",
            !item.isRead ? "font-bold text-foreground" : "font-semibold text-foreground/90",
          )}
        >
          {item.title}
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.body}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:self-center">
        {hasSafeAction && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onItemClick(item, item.actionUrl ?? undefined);
            }}
          >
            <span>Thực hiện</span>
            <ExternalLink className="size-3" aria-hidden="true" />
          </Button>
        )}
        {isMarkingRead && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function NotificationInboxContent({ basePath = "/notifications" }: { basePath?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    userId,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isMarkingRead,
    isMarkingAllRead,
  } = useNotification();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const statusParam = (searchParams.get("status") ?? "all") as NotificationStatusFilter;
  const currentStatus: NotificationStatusFilter =
    statusParam === "unread" ? "unread" : "all";
  const categoryParam = searchParams.get("category") ?? "all";
  const currentCategory = categoryParam;

  const updateFilters = useCallback(
    (updates: {
      status?: NotificationStatusFilter;
      category?: string;
      page?: number;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.status !== undefined) {
        if (updates.status === "all") {
          params.delete("status");
        } else {
          params.set("status", updates.status);
        }
        params.delete("page");
      }

      if (updates.category !== undefined) {
        if (updates.category === "all") {
          params.delete("category");
        } else {
          params.set("category", updates.category);
        }
        params.delete("page");
      }

      if (updates.page !== undefined) {
        if (updates.page <= 1) {
          params.delete("page");
        } else {
          params.set("page", String(updates.page));
        }
      }

      const qs = params.toString();
      router.push(qs ? `${pathname || basePath}?${qs}` : (pathname || basePath));
    },
    [basePath, pathname, router, searchParams],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(userId, {
      page,
      pageSize: 20,
      status: currentStatus === "all" ? undefined : currentStatus,
      category: currentCategory === "all" ? undefined : currentCategory,
    }),
    queryFn: ({ signal }) =>
      getNotifications(
        {
          page,
          pageSize: 20,
          status: currentStatus === "all" ? undefined : currentStatus,
          category: currentCategory === "all" ? undefined : currentCategory,
        },
        signal,
      ),
    enabled: Boolean(userId),
    staleTime: 5_000,
  });

  const handleItemClick = async (item: NotificationListItem, explicitUrl?: string) => {
    const url =
      explicitUrl ??
      (item.isActionable && item.actionUrl && isSafeRelativeUrl(item.actionUrl)
        ? item.actionUrl
        : item.deepLinkUrl && isSafeRelativeUrl(item.deepLinkUrl)
          ? item.deepLinkUrl
          : null);

    if (!item.isRead) {
      try {
        await markAsRead(item.id);
      } catch {
        toast.error("Không thể đánh dấu đã đọc thông báo.");
      }
    }

    if (url) {
      router.push(url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc.");
    } catch {
      toast.error("Không thể đánh dấu tất cả đã đọc.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Hộp thư thông báo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi tất cả cập nhật đơn thuê, thanh toán, bàn giao và hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={unreadCount === 0 || isMarkingAllRead}
            onClick={() => void handleMarkAllRead()}
            className="gap-1.5 cursor-pointer"
          >
            {isMarkingAllRead ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="size-4 text-primary" aria-hidden="true" />
            )}
            <span>Đánh dấu tất cả đã đọc</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex items-center gap-1.5 rounded-md bg-muted p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateFilters({ status: opt.value })}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                currentStatus === opt.value
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
              {opt.value === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.2 text-[10px] text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category select / buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => updateFilters({ category: cat.value })}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                currentCategory === cat.value
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Đang tải thông báo">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex animate-pulse flex-col gap-3 rounded-lg border border-border/60 bg-card p-4"
              >
                <div className="flex gap-2">
                  <div className="h-5 w-20 rounded bg-muted" />
                  <div className="h-5 w-16 rounded bg-muted/70" />
                </div>
                <div className="h-5 w-3/5 rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted/60" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-10 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              Không thể tải danh sách thông báo
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Đã xảy ra lỗi khi kết nối tới máy chủ thông báo.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void refetch()}
              className="mt-4 gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span>Thử lại</span>
            </Button>
          </div>
        ) : data?.items?.length ? (
          <div className="space-y-2.5">
            {data.items.map((item) => (
              <NotificationInboxItem
                key={item.id}
                item={item}
                onItemClick={handleItemClick}
                isMarkingRead={isMarkingRead(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">
              Không có thông báo nào
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentStatus === "unread" || currentCategory !== "all"
                ? "Không có thông báo nào phù hợp với bộ lọc hiện tại."
                : "Hộp thư thông báo của bạn đang trống."}
            </p>
            {(currentStatus !== "all" || currentCategory !== "all") && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-4"
                onClick={() => updateFilters({ status: "all", category: "all" })}
              >
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Trang {data.page} / {data.totalPages} ({data.totalCount} thông báo)
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={!data.hasPrevious || page <= 1}
              onClick={() => updateFilters({ page: page - 1 })}
              className="gap-1 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Trang trước</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!data.hasNext || page >= data.totalPages}
              onClick={() => updateFilters({ page: page + 1 })}
              className="gap-1 cursor-pointer"
            >
              <span>Trang sau</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationInboxView({ basePath = "/notifications" }: { basePath?: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NotificationInboxContent basePath={basePath} />
    </Suspense>
  );
}
