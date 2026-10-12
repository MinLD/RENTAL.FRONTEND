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
) {
  const [items, setItems] = useState<TItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    async (nextPage: number) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchOptions({ page: nextPage, pageSize: 20 });
        if (requestId !== requestIdRef.current) return;
        if (!result.success) {
          setError(result.error.message);
          return;
        }
        setItems((current) => {
          const merged =
            nextPage === 1
              ? result.data.data
              : [...current, ...result.data.data];
          return [...new Map(merged.map((item) => [item.id, item])).values()];
        });
        setPage(nextPage);
        setTotalPages(result.data.totalPages);
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
    const requestRef = requestIdRef;
    const timeout = window.setTimeout(() => void loadPage(1), 0);
    return () => {
      window.clearTimeout(timeout);
      ++requestRef.current;
    };
  }, [loadPage]);

  return {
    items,
    isLoading,
    error,
    hasMore: page < totalPages,
    loadMore: () => void loadPage(page + 1),
    retry: () => void loadPage(page + 1),
  };
}
