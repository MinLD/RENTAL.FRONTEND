"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult } from "@/services/api-error";

export function useApiResource<T>(
  request: () => Promise<ApiResult<T>>,
  enabled = true,
  initialResult?: ApiResult<T> | null,
) {
  const [data, setData] = useState<T | null>(() =>
    initialResult?.success ? initialResult.data : null,
  );
  const [error, setError] = useState<string | null>(() =>
    initialResult && !initialResult.success
      ? initialResult.error.message
      : null,
  );
  const [isLoading, setIsLoading] = useState(!initialResult && enabled);
  const initialRequestRef = useRef(request);
  const hasInitialResultRef = useRef(Boolean(initialResult));
  const requestIdRef = useRef(0);
  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await request();
      if (requestId !== requestIdRef.current) return;
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setData(result.data);
    } catch (failure) {
      if (requestId === requestIdRef.current)
        setError(
          failure instanceof Error ? failure.message : "Không thể tải dữ liệu.",
        );
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    const requestRef = requestIdRef;
    const timer = window.setTimeout(() => {
      // SSR results (including failures) are already resolved. Fetch only on
      // explicit refresh or when the request dependencies change.
      const skipInitialFetch =
        hasInitialResultRef.current && request === initialRequestRef.current;
      hasInitialResultRef.current = false;
      if (skipInitialFetch) return;
      setData(null);
      setError(null);
      if (enabled) void refresh();
      else setIsLoading(false);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      ++requestRef.current;
    };
  }, [enabled, refresh, request]);

  return { data, error, isLoading, refresh, setData };
}
