"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDown, RefreshCw, Search } from "lucide-react";

import { DataTableBodySkeletonRows } from "@/components/data-table/data-table-skeleton";
import { DataTableState } from "@/components/data-table/data-table-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import { cn } from "@/utils/cn";
import type { ApiResult } from "@/services/api-error";

export type DataTableColumn<TData> = {
  cell?: (row: TData) => ReactNode;
  className?: string;
  header: ReactNode;
  headerClassName?: string;
  id: string;
  minWidth?: number;
  skeleton?: ReactNode;
  width?: number | string;
};

export type DataTablePagination = {
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalItems: number;
};

export type DataTableFilter = {
  label: string;
  value?: string;
  onClick?: () => void;
};

export type DataTableCsvColumn<TData> = {
  header: string;
  value: keyof TData | ((row: TData) => unknown);
};

export type DataTableFilterContext<TFilters> = {
  filters: TFilters;
  isLoading: boolean;
  refresh: () => void;
  setFilters: (
    value: TFilters | ((currentFilters: TFilters) => TFilters),
  ) => void;
};

export type DataTableRowActionContext = {
  refresh: () => void;
};

export type DataTableToolbarContext = {
  refresh: () => void;
};

export type DataTableProps<TData, TFilters = Record<string, unknown>> = {
  actionsHeader?: ReactNode;
  bodyClassName?: string;
  className?: string;
  columns: DataTableColumn<TData>[];
  csvColumns?: DataTableCsvColumn<TData>[];
  csvFilename?: string;
  data?: TData[];
  description?: string;
  detailDescription?: (row: TData) => ReactNode;
  detailTitle?: (row: TData) => ReactNode;
  emptyState?: ReactNode;
  errorState?: (error: Error, retry: () => void) => ReactNode;
  fetchData?: (
    params: DataTableFetchParams<TFilters>,
  ) => Promise<
    DataTableFetchResult<TData> | ApiResult<DataTableFetchResult<TData>>
  >;
  fetchDependencies?: unknown[];
  filterParams?: TFilters;
  filters?: DataTableFilter[];
  getRowId: (row: TData) => string;
  initialFilterParams?: TFilters;
  initialKeyword?: string;
  initialPage?: number;
  initialPageSize?: number;
  loadingState?: ReactNode;
  skeletonRowCount?: number;
  onFilterParamsChange?: (filters: TFilters) => void;
  onRowDoubleClick?: (row: TData) => void;
  onSearchChange?: (value: string) => void;
  pagination?: DataTablePagination;
  pageSizeOptions?: number[];
  renderDetail?: (row: TData) => ReactNode;
  renderFilters?: (context: DataTableFilterContext<TFilters>) => ReactNode;
  renderRowActions?: (
    row: TData,
    context: DataTableRowActionContext,
  ) => ReactNode;
  renderToolbarActions?: (context: DataTableToolbarContext) => ReactNode;
  searchDebounceMs?: number;
  searchMaxLength?: number;
  searchPlaceholder?: string;
  searchTypes?: string[];
  showCsvExport?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  title: string;
  toolbarActions?: ReactNode;
};

export function DataTable<TData, TFilters = Record<string, unknown>>({
  actionsHeader = "Thao tác",
  bodyClassName,
  className,
  columns,
  csvColumns,
  csvFilename,
  data,
  description,
  detailDescription,
  detailTitle,
  emptyState,
  errorState,
  fetchData,
  fetchDependencies = [],
  filterParams,
  filters,
  getRowId,
  initialFilterParams,
  initialKeyword = "",
  initialPage = 1,
  initialPageSize = 25,
  loadingState = "Đang tải dữ liệu...",
  onFilterParamsChange,
  onRowDoubleClick,
  onSearchChange,
  pagination,
  pageSizeOptions,
  renderDetail,
  renderFilters,
  renderRowActions,
  renderToolbarActions,
  searchDebounceMs = 350,
  searchMaxLength,
  searchPlaceholder = "Tìm kiếm...",
  searchTypes,
  showCsvExport = true,
  showSearch = true,
  skeletonRowCount,
  searchValue,
  title,
  toolbarActions,
}: DataTableProps<TData, TFilters>) {
  const [selectedRow, setSelectedRow] = useState<TData | null>(null);
  const [internalKeyword, setInternalKeyword] = useState(initialKeyword);
  const [internalFilterParams, setInternalFilterParams] = useState<TFilters>(
    initialFilterParams ?? ({} as TFilters),
  );
  const [internalPage, setInternalPage] = useState(initialPage);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);
  const [remoteData, setRemoteData] = useState<TData[]>([]);
  const [remoteTotalItems, setRemoteTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompletedRemoteLoad, setHasCompletedRemoteLoad] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const fetchRequestIdRef = useRef(0);
  const hasActions = Boolean(renderRowActions);
  const canOpenDetail = Boolean(renderDetail);
  const canInteractWithRow = canOpenDetail || Boolean(onRowDoubleClick);
  const isRemoteDataTable = Boolean(fetchData);
  const activeKeyword = searchValue ?? internalKeyword;
  const activeFilterParams = filterParams ?? internalFilterParams;
  const activePage = pagination?.page ?? internalPage;
  const activePageSize = pagination?.pageSize ?? internalPageSize;
  const activeData = isRemoteDataTable ? remoteData : (data ?? []);
  const activeTotalItems =
    pagination?.totalItems ??
    (isRemoteDataTable ? remoteTotalItems : activeData.length);
  const isWaitingForFirstRemoteLoad =
    isRemoteDataTable && !hasCompletedRemoteLoad && !fetchError;
  const isTableLoading = isLoading || isWaitingForFirstRemoteLoad;
  const showTableState =
    !isTableLoading &&
    (!isRemoteDataTable || hasCompletedRemoteLoad) &&
    (Boolean(fetchError) || !activeData.length);
  const hasSearchOrFilters =
    Boolean(activeKeyword.trim()) ||
    Object.values(activeFilterParams ?? {}).some(
      (value) => value !== undefined && value !== null && value !== "",
    );
  const totalPages = useMemo(() => {
    const size = Number(activePageSize) > 0 ? Number(activePageSize) : 20;
    const total = Number(activeTotalItems) > 0 ? Number(activeTotalItems) : 0;
    return Math.max(1, Math.ceil(total / size));
  }, [activePageSize, activeTotalItems]);
  const tableMinWidth = useMemo(() => {
    const columnsWidth = columns.reduce((totalWidth, column) => {
      if (typeof column.width === "number") {
        return totalWidth + column.width;
      }

      return totalWidth + (column.minWidth ?? 160);
    }, 0);

    return columnsWidth + (hasActions ? 90 : 0);
  }, [columns, hasActions]);
  const dependencyKey = JSON.stringify(fetchDependencies);
  const filterKey = JSON.stringify(activeFilterParams);
  const searchTypesKey = searchTypes?.join("\u001F") ?? "";
  const activeSearchTypes = useMemo(
    () => (searchTypesKey ? searchTypesKey.split("\u001F") : undefined),
    [searchTypesKey],
  );

  const loadRemoteData = useCallback(
    async (params?: Partial<DataTableFetchParams<TFilters>>) => {
      if (!fetchData) {
        return;
      }

      const requestId = fetchRequestIdRef.current + 1;
      fetchRequestIdRef.current = requestId;
      setHasCompletedRemoteLoad(false);
      setIsLoading(true);
      setFetchError(null);

      try {
        const result = await fetchData({
          filters: params?.filters ?? activeFilterParams,
          keyword: params?.keyword ?? activeKeyword,
          page: params?.page ?? activePage,
          pageSize: params?.pageSize ?? activePageSize,
          searchTypes: activeSearchTypes,
        });

        if (fetchRequestIdRef.current !== requestId) {
          return;
        }

        if ("success" in result && !result.success) {
          setFetchError(new Error(result.error.message));
          return;
        }

        const data = "success" in result ? result.data : result;
        setRemoteData(data.data);
        setRemoteTotalItems(data.totalItems);
      } catch (error) {
        if (fetchRequestIdRef.current !== requestId) {
          return;
        }

        setFetchError(
          error instanceof Error ? error : new Error("Không thể tải dữ liệu."),
        );
      } finally {
        if (fetchRequestIdRef.current === requestId) {
          setHasCompletedRemoteLoad(true);
          setIsLoading(false);
        }
      }
    },
    [
      activeKeyword,
      activeFilterParams,
      activePage,
      activePageSize,
      activeSearchTypes,
      fetchData,
    ],
  );

  useEffect(() => {
    if (!fetchData) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadRemoteData();
    }, searchDebounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeKeyword,
    activePage,
    activePageSize,
    dependencyKey,
    fetchData,
    filterKey,
    loadRemoteData,
    refreshIndex,
    searchDebounceMs,
    searchTypesKey,
  ]);

  function handleSearchChange(value: string) {
    onSearchChange?.(value);
    setInternalKeyword(value);

    if (!pagination) {
      setInternalPage(1);
    } else {
      pagination.onPageChange?.(1);
    }
  }

  function handlePageChange(page: number) {
    pagination?.onPageChange?.(page);
    setInternalPage(page);
  }

  function handlePageSizeChange(pageSize: number) {
    pagination?.onPageSizeChange?.(pageSize);
    setInternalPageSize(pageSize);
    handlePageChange(1);
  }

  function triggerRefresh() {
    setHasCompletedRemoteLoad(false);
    setIsLoading(Boolean(fetchData));
    setRefreshIndex((currentValue) => currentValue + 1);
  }

  function handleFilterParamsChange(
    value: TFilters | ((currentFilters: TFilters) => TFilters),
  ) {
    const nextFilters =
      typeof value === "function"
        ? (value as (currentFilters: TFilters) => TFilters)(activeFilterParams)
        : value;

    onFilterParamsChange?.(nextFilters);
    setInternalFilterParams(nextFilters);
    handlePageChange(1);
  }

  function handleCsvExport() {
    exportRowsToCsv({
      columns: csvColumns,
      filename: csvFilename ?? `${toKebabCase(title)}.csv`,
      rows: activeData,
    });
  }

  return (
    <>
      <section
        className={cn(
          "grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden",
          className,
        )}
      >
        <div className="shrink-0 border-b border-border p-4 md:p-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {showSearch && (onSearchChange || fetchData) ? (
              <div className="relative w-full min-w-0 sm:w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  maxLength={searchMaxLength}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  value={activeKeyword}
                />
              </div>
            ) : null}
            {filters?.length ? (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.label}
                    onClick={filter.onClick}
                    type="button"
                    variant="secondary"
                  >
                    {filter.value ?? filter.label}
                  </Button>
                ))}
              </div>
            ) : null}
            {renderFilters?.({
              filters: activeFilterParams,
              isLoading: isTableLoading,
              refresh: triggerRefresh,
              setFilters: handleFilterParamsChange,
            })}
            {fetchData ? (
              <Button
                disabled={isLoading}
                onClick={triggerRefresh}
                type="button"
                variant="secondary"
              >
                <RefreshCw
                  className={cn("size-4", isLoading && "animate-spin")}
                />
                Làm mới
              </Button>
            ) : null}
            {showCsvExport || toolbarActions || renderToolbarActions ? (
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {showCsvExport ? (
                  <Button
                    disabled={!activeData.length}
                    onClick={handleCsvExport}
                    type="button"
                    variant="secondary"
                  >
                    <FileDown className="size-4" />
                    Xuất CSV
                  </Button>
                ) : null}
                {toolbarActions}
                {renderToolbarActions?.({ refresh: triggerRefresh })}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "scrollbar-gutter-stable min-h-0 flex-1 overscroll-contain",
            showTableState
              ? "grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
              : "overflow-y-scroll overflow-x-auto",
            bodyClassName,
          )}
        >
          <div
            className={showTableState ? "min-w-0 overflow-x-auto" : undefined}
          >
            <Table
              className="min-w-full table-auto"
              style={{ minWidth: tableMinWidth }}
            >
              <colgroup>
                {columns.map((column) => (
                  <col
                    key={column.id}
                    style={{
                      width: column.width ?? column.minWidth,
                    }}
                  />
                ))}
                {hasActions ? <col className="w-auto" /> : null}
              </colgroup>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      className={cn(
                        "sticky top-0 z-20 bg-[#f8fafc]",
                        column.headerClassName,
                      )}
                      key={column.id}
                      style={
                        column.minWidth
                          ? { minWidth: column.minWidth }
                          : undefined
                      }
                    >
                      {column.header}
                    </TableHead>
                  ))}
                  {hasActions ? (
                    <TableHead className="sticky top-0 right-0 z-30 whitespace-nowrap bg-[#f8fafc] text-right">
                      {actionsHeader}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {showTableState ? null : isTableLoading ? (
                  typeof loadingState === "string" &&
                  loadingState === "Đang tải dữ liệu..." ? (
                    <DataTableBodySkeletonRows
                      columns={columns}
                      rowCount={
                        skeletonRowCount ?? Math.min(activePageSize, 10)
                      }
                      showActions={hasActions}
                    />
                  ) : (
                    <TableRow>
                      <TableCell
                        className="h-28 text-center text-muted-foreground"
                        colSpan={columns.length + (hasActions ? 1 : 0)}
                      >
                        {loadingState}
                      </TableCell>
                    </TableRow>
                  )
                ) : activeData.length ? (
                  activeData.map((row) => (
                    <TableRow
                      className={cn(
                        "group transition-none",
                        canInteractWithRow && "cursor-pointer",
                      )}
                      key={getRowId(row)}
                      onDoubleClick={() => {
                        if (onRowDoubleClick) {
                          onRowDoubleClick(row);
                        } else if (canOpenDetail) {
                          setSelectedRow(row);
                        }
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell
                          className={cn("max-w-0", column.className)}
                          key={column.id}
                        >
                          {column.cell?.(row)}
                        </TableCell>
                      ))}
                      {hasActions ? (
                        <TableCell className="sticky right-0 z-10 whitespace-nowrap bg-background text-right group-hover:bg-[#f1f5f9] group-data-[state=selected]:bg-[#e2e8f0]">
                          <div className="inline-flex w-max items-center justify-end gap-1">
                            {renderRowActions?.(row, {
                              refresh: triggerRefresh,
                            })}
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : null}
              </TableBody>
            </Table>
          </div>
          {showTableState ? (
            <div className="grid min-h-64 min-w-0 place-items-center overflow-y-auto p-5 sm:p-8">
              {fetchError ? (
                (errorState?.(fetchError, triggerRefresh) ?? (
                  <DataTableState
                    filtered={hasSearchOrFilters}
                    message={fetchError.message}
                    onRetry={triggerRefresh}
                    variant="error"
                  />
                ))
              ) : emptyState !== undefined &&
                typeof emptyState !== "string" &&
                typeof emptyState !== "number" ? (
                emptyState
              ) : (
                <DataTableState
                  filtered={hasSearchOrFilters}
                  message={emptyState}
                />
              )}
            </div>
          ) : null}
        </div>

        {pagination || fetchData ? (
          <DataTablePaginationBar
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            page={activePage}
            pageSize={activePageSize}
            pageSizeOptions={pagination?.pageSizeOptions ?? pageSizeOptions}
            totalPages={totalPages}
          />
        ) : null}
      </section>

      <Sheet
        open={Boolean(selectedRow)}
        onOpenChange={(open) => !open && setSelectedRow(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedRow ? (
            <>
              <SheetHeader className="border-b border-border px-6 py-5">
                <SheetTitle>
                  {detailTitle?.(selectedRow) ?? "Chi tiết"}
                </SheetTitle>
                {detailDescription ? (
                  <SheetDescription>
                    {detailDescription(selectedRow)}
                  </SheetDescription>
                ) : null}
              </SheetHeader>
              <div className="px-6 pb-6">{renderDetail?.(selectedRow)}</div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function exportRowsToCsv<TData>({
  columns,
  filename,
  rows,
}: {
  columns?: DataTableCsvColumn<TData>[];
  filename: string;
  rows: TData[];
}) {
  if (!rows.length) {
    return;
  }

  const csvColumns = columns?.length
    ? columns
    : inferCsvColumnsFromRow(rows[0]);
  const csvLines = [
    csvColumns.map((column) => escapeCsvValue(column.header)).join(","),
    ...rows.map((row) =>
      csvColumns
        .map((column) => escapeCsvValue(getCsvColumnValue(row, column)))
        .join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${csvLines.join("\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function inferCsvColumnsFromRow<TData>(
  row: TData,
): DataTableCsvColumn<TData>[] {
  if (!row || typeof row !== "object") {
    return [];
  }

  return Object.keys(row).map((key) => ({
    header: key,
    value: key as keyof TData,
  }));
}

function getCsvColumnValue<TData>(
  row: TData,
  column: DataTableCsvColumn<TData>,
) {
  return typeof column.value === "function"
    ? column.value(row)
    : row[column.value];
}

function escapeCsvValue(value: unknown) {
  const normalizedValue =
    value === null || value === undefined ? "" : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function toKebabCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type DataTablePaginationBarProps = {
  className?: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalPages: number;
};

export function DataTablePaginationBar({
  className,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  totalPages,
}: DataTablePaginationBarProps) {
  const safeTotalPages = Number(totalPages) > 0 ? Number(totalPages) : 1;
  const safePage = Number(page) > 0 ? Number(page) : 1;
  return (
    <div
      className={cn(
        "z-20 min-w-0 overflow-x-auto border-t border-border bg-background px-4 py-3 shadow-[0_-8px_18px_-18px_rgba(15,23,42,0.55)]",
        className,
      )}
    >
      <Pagination className="min-w-max">
        <PaginationContent>
          <PaginationItem className="gap-2">
            <select
              aria-label="Rows per page"
              className="h-10 rounded border border-border bg-background px-3 text-base font-semibold text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              disabled={!onPageSizeChange}
              onChange={(event) =>
                onPageSizeChange?.(Number(event.target.value))
              }
              value={pageSize}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              aria-label="Trang trước"
              disabled={safePage <= 1}
              onClick={() => onPageChange?.(safePage - 1)}
              suppressHydrationWarning
              type="button"
            >
              <span></span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <span className="whitespace-nowrap px-4 text-sm font-semibold text-muted-foreground ">
              Trang {safePage} / {safeTotalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              aria-label="Trang sau"
              disabled={safePage >= safeTotalPages}
              onClick={() => onPageChange?.(safePage + 1)}
              suppressHydrationWarning
              type="button"
            >
              <span></span>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
