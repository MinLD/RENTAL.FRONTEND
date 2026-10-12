"use client";

import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Tabs } from "radix-ui";
import { useId, type ReactNode } from "react";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

export function DetailPageHeader({
  backHref,
  backLabel,
  title,
  imageUrl,
  description,
  status,
  actions,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  imageUrl?: string | null;
  description?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-5">
      <nav
        aria-label="Đường dẫn"
        className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"
      >
        <Link className="shrink-0 hover:text-primary" href={backHref}>
          {backLabel}
        </Link>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
        <span
          aria-current="page"
          className="truncate font-semibold text-foreground"
        >
          {title}
        </span>
      </nav>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <AvatarWithSkeleton
            alt={title}
            className="size-16 shrink-0 rounded border border-border"
            fallback={<Package className="size-7" />}
            fallbackClassName="rounded bg-muted text-muted-foreground"
            imageClassName="rounded object-contain"
            src={imageUrl}
          />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words text-xl font-bold">{title}</h1>
              {status}
            </div>
            {description ? (
              <div className="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {description}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function StatisticCards({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    description?: string;
    isLoading?: boolean;
    tone?: "default" | "accent" | "success" | "warning";
  }>;
}) {
  const tones = {
    default: "text-foreground",
    accent: "text-blue-700",
    success: "text-green-700",
    warning: "text-amber-700",
  };
  return (
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <div
          className="min-w-0 space-y-2 rounded border border-border p-4"
          key={item.label}
        >
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd
            className={cn(
              "text-2xl font-bold tabular-nums",
              tones[item.tone ?? "default"],
            )}
          >
            {item.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (item.value ?? "—")
            )}
          </dd>
          {item.description ? (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

export function DetailTabs({
  value,
  onValueChange,
  items,
  fill = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  fill?: boolean;
  items: Array<{
    value: string;
    label: ReactNode;
    content: ReactNode;
    scrollable?: boolean;
  }>;
}) {
  const id = useId();
  return (
    <Tabs.Root
      className={
        fill ? "flex min-h-0 flex-1 flex-col overflow-hidden" : undefined
      }
      onValueChange={onValueChange}
      value={value}
    >
      <Tabs.List
        aria-label="Nội dung chi tiết"
        className="flex shrink-0 gap-5 overflow-x-auto border-b border-border"
      >
        {items.map((item) => (
          <Tabs.Trigger
            className="shrink-0 cursor-pointer border-b-2 border-transparent px-1 py-3 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:border-primary data-[state=active]:text-primary"
            key={item.value}
            value={item.value}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {items.map((item) => (
        <Tabs.Content
          className={cn(
            "min-w-0 pt-5 outline-none data-[state=inactive]:hidden",
            fill && "min-h-0 flex-1",
            fill &&
              (item.scrollable === false
                ? "overflow-hidden"
                : "overflow-y-auto"),
          )}
          forceMount
          key={`${id}-${item.value}`}
          value={item.value}
        >
          {item.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
