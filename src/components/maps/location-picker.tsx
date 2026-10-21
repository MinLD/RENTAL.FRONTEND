"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { LocationPickerProps } from "@/types/map";
import { cn } from "@/utils/cn";

// Leaflet reads window/document on import, so only load it in the browser.
const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  ssr: false,
  loading: () => (
    <div aria-label="Đang tải bản đồ" className="h-full w-full" role="status">
      <Skeleton className="h-full w-full rounded-none" />
      <span className="sr-only">Đang tải bản đồ...</span>
    </div>
  ),
});

export function LocationPicker({
  className,
  ariaLabel = "Chọn vị trí trên bản đồ",
  ...props
}: LocationPickerProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "relative isolate z-0 h-80 w-full overflow-hidden rounded-lg border border-border bg-muted/30",
        className,
      )}
      role="region"
    >
      <LocationPickerMap {...props} />
    </div>
  );
}
