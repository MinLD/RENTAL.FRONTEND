"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiResult } from "@/services/api-error";
import type { CatalogPagedResult } from "@/types/catalog";

export function useCatalogSelectOptions<
  TItem extends { id: string; name: string },
>(
  fetchOptions: (params: {
    page: number;
    pageSize: number;
  }) => Promise<ApiResult<CatalogPagedResult<TItem>>>,
  enabled = true,
  initialItems?: TItem[],
) {
  const [items, setItems] = useState<TItem[]>(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(
    !initialItems || initialItems.length === 0,
  );
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadOptions = useCallback(
    async () => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const options = new Map<string, TItem>();
        let nextPage = 1;
        let totalPages = 1;
        do {
          const result = await fetchOptions({ page: nextPage, pageSize: 100 });
          if (requestId !== requestIdRef.current) return;
          if (!result.success) {
            setError(result.error.message);
            return;
          }
          for (const item of result.data.data) options.set(item.id, item);
          setItems([...options.values()]);
          totalPages = result.data.totalPages;
          nextPage += 1;
        } while (nextPage <= totalPages);
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách lựa chọn.",
          );
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [fetchOptions],
  );

  useEffect(() => {
    if (!enabled) return;
    if (initialItems && initialItems.length > 0) return;
    const requestRef = requestIdRef;
    const timeout = window.setTimeout(() => void loadOptions(), 0);
    return () => {
      window.clearTimeout(timeout);
      ++requestRef.current;
    };
  }, [enabled, initialItems, loadOptions]);

  return {
    items,
    isLoading,
    error,
    retry: () => void loadOptions(),
  };
}
