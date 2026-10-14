"use client";

import type { ReactNode } from "react";

import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import { ProductGridSkeleton } from "./product-browse-skeleton";

export function ProductResults({ children }: { children: ReactNode }) {
  const { isPending } = useProductBrowseNavigation();
  return (
    <div aria-busy={isPending} className="space-y-4">
      {isPending ? <ProductGridSkeleton /> : children}
    </div>
  );
}
