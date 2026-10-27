import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/cn";

type DataTableSkeletonProps = {
  className?: string;
  columnCount?: number;
  filterCount?: number;
  rowCount?: number;
  showActions?: boolean;
  showHeader?: boolean;
  showPagination?: boolean;
  showToolbar?: boolean;
};

export function DataTableSkeleton({
  className,
  columnCount = 6,
  filterCount = 3,
  rowCount = 10,
  showActions = true,
  showHeader = true,
  showPagination = true,
  showToolbar = true,
}: DataTableSkeletonProps) {
  return (
    <section
      className={cn(
        "grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden",
        className,
      )}
      aria-busy="true"
      aria-label="Đang tải bảng dữ liệu"
    >
      {showToolbar ? (
        <div className="shrink-0 border-b border-border p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="grid gap-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Skeleton className="h-10 w-full sm:w-[360px]" />
            {Array.from({ length: filterCount }, (_, index) => (
              <Skeleton className="h-10 w-28" key={index} />
            ))}
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      ) : null}

      <div className="scrollbar-gutter-stable min-h-0 overflow-y-scroll overflow-x-auto">
        <DataTableRowsSkeleton
          columnCount={columnCount}
          rowCount={rowCount}
          showActions={showActions}
          showHeader={showHeader}
        />
      </div>

      {showPagination ? (
        <div className="z-20 flex justify-end gap-2 border-t border-border bg-background px-4 py-3">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      ) : null}
    </section>
  );
}

type DataTableRowsSkeletonProps = {
  columnCount: number;
  rowCount: number;
  showActions?: boolean;
  showHeader?: boolean;
};

type DataTableSkeletonColumn = {
  className?: string;
  skeleton?: ReactNode;
};

export function DataTableRowsSkeleton({
  columnCount,
  rowCount,
  showActions = true,
  showHeader = true,
}: DataTableRowsSkeletonProps) {
  const totalColumns = columnCount + (showActions ? 1 : 0);

  return (
    <Table className="min-w-[980px]">
      {showHeader ? (
        <TableHeader>
          <TableRow>
            {Array.from({ length: totalColumns }, (_, index) => (
              <TableHead
                className={cn(
                  "sticky top-0 z-20 bg-[#f8fafc]",
                  showActions &&
                    index === totalColumns - 1 &&
                    "right-0 z-30 w-px whitespace-nowrap text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]",
                )}
                key={index}
              >
                <Skeleton
                  className={cn(
                    "h-4 max-w-[80%]",
                    showActions && index === totalColumns - 1 ? "w-12" : "w-20",
                  )}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      ) : null}
      <TableBody>
        <DataTableBodySkeletonRows
          columnCount={columnCount}
          rowCount={rowCount}
          showActions={showActions}
        />
      </TableBody>
    </Table>
  );
}

export function DataTableBodySkeletonRows({
  columnCount,
  columns,
  rowCount,
  showActions = true,
}: Omit<DataTableRowsSkeletonProps, "columnCount" | "showHeader"> & {
  columnCount?: number;
  columns?: DataTableSkeletonColumn[];
}) {
  const skeletonColumns: DataTableSkeletonColumn[] =
    columns ??
    Array.from({ length: columnCount ?? 0 }, () => ({}));

  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {skeletonColumns.map((column, columnIndex) => (
            <TableCell
              className={cn("max-w-0 overflow-hidden", column.className)}
              key={columnIndex}
            >
              {column.skeleton ??
                (columnIndex === 0 ? (
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-28 max-w-[calc(100%-48px)]" />
                  </div>
                ) : (
                  <Skeleton
                    className={cn(
                      "h-4 max-w-[75%]",
                      columnIndex % 3 === 0
                        ? "w-16"
                        : columnIndex % 2 === 0
                          ? "w-24"
                          : "w-20",
                    )}
                  />
                ))}
            </TableCell>
          ))}
          {showActions ? (
            <TableCell className="sticky right-0 z-10 w-px whitespace-nowrap bg-background text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
              <div className="inline-flex w-max items-center justify-end">
                <Skeleton className="size-8" />
              </div>
            </TableCell>
          ) : null}
        </TableRow>
      ))}
    </>
  );
}
