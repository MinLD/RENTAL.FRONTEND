"use client";

import type { ReactNode } from "react";

import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import { ProductGridSkeleton } from "./product-browse-skeleton";
import { usePublicArea } from "@/providers/public-area-provider";

export function ProductResults({ children }: { children: ReactNode }) {
  const { isPending } = useProductBrowseNavigation();
  const { isApplyingArea } = usePublicArea();
  const isLoading = isPending || isApplyingArea;
  return (
    <div aria-busy={isLoading} className="space-y-4">
      {isLoading ? <ProductGridSkeleton /> : children}
    </div>
  );
}
