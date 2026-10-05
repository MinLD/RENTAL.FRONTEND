"use client";

import { Clock3, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DataTablePaginationBar } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminOrganizationHistoryResult } from "@/types/admin-organizations";
import { formatOrganizationDate } from "@/utils/organization";

export function OrganizationHistoryPanel({
  fetchHistory,
  organizationId,
}: {
  fetchHistory: (
    id: string,
    params: { page?: number; pageSize?: number; search?: string },
  ) => Promise<AdminOrganizationHistoryResult>;
  organizationId: string;
}) {
  const [pageSize, setPageSize] = useState(10);
  const [history, setHistory] = useState<AdminOrganizationHistoryResult | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const requestIdRef = useRef(0);

  const loadHistory = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const result = await fetchHistory(organizationId, {
        page,
        pageSize,
        search,
      });

      if (requestId === requestIdRef.current) {
        setHistory(result);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setHistoryError(error instanceof Error ? error.message : "Không thể tải lịch sử tổ chức.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingHistory(false);
      }
    }
  }, [fetchHistory, organizationId, page, pageSize, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistory();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [loadHistory]);

  const totalPages = Math.max(1, history?.totalPages ?? 1);
  const hasItems = Boolean(history?.items.length);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          className="sm:flex-1"
          maxLength={200}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Tìm hành động, kết quả hoặc lý do..."
          value={search}
        />
        <Button
          disabled={isLoadingHistory}
          onClick={() => void loadHistory()}
          type="button"
          variant="secondary"
        >
          <RefreshCw className={isLoadingHistory ? "size-4 animate-spin" : "size-4"} />
          Tải lại
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {historyError ? (
          <div className="space-y-3 rounded border border-error/20 bg-error/5 p-4" role="alert">
            <p className="text-sm text-error">{historyError}</p>
            <Button onClick={() => void loadHistory()} size="sm" type="button" variant="secondary">
              Thử lại
            </Button>
          </div>
        ) : isLoadingHistory && !history ? (
          <div aria-busy="true" aria-label="Đang tải lịch sử tổ chức" className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="space-y-2 rounded border border-border p-4" key={index}>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : hasItems ? (
          <div className="space-y-3">
            {history?.items.map((item) => (
              <article className="rounded border border-border p-4" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Clock3 className="size-4 text-muted-foreground" />
                    {formatOrganizationDate(item.timestamp)}
                  </p>
                  <span className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {item.result || "—"}
                  </span>
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <HistoryRow label="Hành động" value={item.action} />
                  <HistoryRow label="Người thao tác" value={item.actorId} />
                  {item.reason ? <HistoryRow label="Lý do" value={item.reason} /> : null}
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-border p-6 text-center">
            <p className="font-semibold text-foreground">
              {search.trim() ? "Không tìm thấy lịch sử phù hợp" : "Chưa có lịch sử"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search.trim()
                ? "Thử thay đổi từ khóa tìm kiếm."
                : "Các thao tác xét duyệt sẽ xuất hiện tại đây."}
            </p>
          </div>
        )}
      </div>

      <DataTablePaginationBar
        className="-mx-6 -mb-5 shrink-0 border-t-0 bg-transparent shadow-none"
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPage(1);
          setPageSize(nextPageSize);
        }}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50]}
        totalPages={totalPages}
      />
    </div>
  );
}

function HistoryRow({
  label,
  title,
  value,
}: {
  label: string;
  title?: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap break-words font-medium text-foreground" title={title}>
        {value || "—"}
      </dd>
    </div>
  );
}
