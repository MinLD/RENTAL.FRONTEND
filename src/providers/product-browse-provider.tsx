"use client";

import {
  createContext,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { productBrowseHref } from "@/config/product-browse";
import type { ProductBrowseFilters } from "@/types/product-browse";
import { usePublicArea } from "@/providers/public-area-provider";

type ProductBrowseNavigation = {
  isPending: boolean;
  navigate: (changes: Partial<ProductBrowseFilters>) => void;
  refresh: () => void;
  resetFilters: () => void;
};

export const ProductBrowseNavigationContext =
  createContext<ProductBrowseNavigation | null>(null);

export function ProductBrowseProvider({
  filters,
  children,
}: {
  filters: ProductBrowseFilters;
  children: ReactNode;
}) {
  const router = useRouter();
  const { clearArea } = usePublicArea();
  const [isPending, startTransition] = useTransition();
  function navigate(changes: Partial<ProductBrowseFilters>) {
    startTransition(() =>
      router.push(
        productBrowseHref({ ...filters, ...changes, page: changes.page ?? 1 }),
      ),
    );
  }
  function resetFilters() {
    clearArea();
    startTransition(() => {
      if (!window.location.search) router.refresh();
      else router.push("/products", { scroll: false });
    });
  }
  function followLink(event: MouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor =
      event.target instanceof Element ? event.target.closest("a") : null;
    if (
      !anchor ||
      anchor.hasAttribute("download") ||
      (anchor.target && anchor.target !== "_self")
    )
      return;
    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin || url.pathname !== "/products")
      return;
    event.preventDefault();
    startTransition(() =>
      router.push(`${url.pathname}${url.search}${url.hash}`),
    );
  }
  return (
    <ProductBrowseNavigationContext.Provider
      value={{
        isPending,
        navigate,
        resetFilters,
        refresh: () => startTransition(() => router.refresh()),
      }}
    >
      <div className="flex flex-1 flex-col" onClickCapture={followLink}>
        {children}
      </div>
    </ProductBrowseNavigationContext.Provider>
  );
}
