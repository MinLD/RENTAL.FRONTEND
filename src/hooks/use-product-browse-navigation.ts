"use client";

import { useContext } from "react";
import { ProductBrowseNavigationContext } from "@/providers/product-browse-provider";

export function useProductBrowseNavigation() {
  const context = useContext(ProductBrowseNavigationContext);
  if (!context)
    throw new Error("Product browsing requires ProductBrowseProvider.");
  return context;
}
