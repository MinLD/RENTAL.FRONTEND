import type { ReactNode } from "react";
import { DataTableState } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";

export function ResourcePanel({
  isLoading,
  error,
  onRetry,
  children,
}: {
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (isLoading)
    return (
      <div aria-busy="true" aria-label="Đang tải dữ liệu" className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  if (error)
    return (
      <div className="grid min-h-64 justify-items-center content-center">
        <DataTableState message={error} onRetry={onRetry} variant="error" />
      </div>
    );
  return children;
}
