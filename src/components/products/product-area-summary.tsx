"use client";

import { MapPin } from "lucide-react";
import { usePublicArea } from "@/providers/public-area-provider";
import {
  ALL_PUBLIC_AREAS,
  getPublicAreaLabel,
  parsePublicArea,
} from "@/lib/locations/public-area";
import type { ProductBrowseFilters } from "@/types/product-browse";

export function ProductAreaSummary({
  filters,
}: {
  filters: Pick<ProductBrowseFilters, "provinceCode" | "wardCode">;
}) {
  const { area } = usePublicArea();
  const appliedArea = parsePublicArea({
    provinceCode: filters.provinceCode ?? "",
    wardCode: filters.wardCode ?? "",
  }) ?? ALL_PUBLIC_AREAS;
  const selectedArea = area ?? appliedArea;
  return (
    <div className="px-3 py-2.5 text-xs">
      <p className="flex min-w-0 items-start gap-1.5 text-muted-foreground">
        <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
        <span>
          Khu vực tìm kiếm:{" "}
          <span className="font-semibold text-foreground">
            {getPublicAreaLabel(selectedArea)}
          </span>
        </span>
      </p>
    </div>
  );
}
