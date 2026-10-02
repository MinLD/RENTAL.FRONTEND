import { CircleAlert, FolderSearch, Inbox, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

type DataTableStateProps = {
  filtered?: boolean;
  message?: ReactNode;
  onRetry?: () => void;
  variant?: "empty" | "error";
};

export function DataTableState({
  filtered = false,
  message,
  onRetry,
  variant = "empty",
}: DataTableStateProps) {
  const isError = variant === "error";
  const isNotFound =
    typeof message === "string" &&
    /^(?:404[\s:-]*)?not\s*found[.!]?$/i.test(message.trim());
  const Icon = isError
    ? isNotFound
      ? FolderSearch
      : CircleAlert
    : filtered
      ? FolderSearch
      : Inbox;
  const title = isError
    ? "Không thể tải dữ liệu"
    : filtered
      ? "Không tìm thấy kết quả"
      : "Chưa có dữ liệu";
  const description = isNotFound
    ? "Không tìm thấy dữ liệu được yêu cầu. Vui lòng thử lại."
    : (message ??
      (isError
        ? "Đã xảy ra lỗi khi tải danh sách. Vui lòng thử lại."
        : filtered
          ? "Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại."
          : "Dữ liệu sẽ xuất hiện ở đây khi có bản ghi mới."));

  return (
    <div
      className="grid w-full max-w-lg justify-items-center gap-4 rounded-xl px-6 py-8 text-center sm:px-8 sm:py-10"
      data-slot="data-table-state"
      role={isError ? "alert" : "status"}
    >
      <div
        className={cn(
          "grid size-16 place-items-center rounded-2xl border shadow-sm",
        )}
      >
        <Icon aria-hidden="true" className="size-8" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 space-y-2">
        <h3 className="text-base font-bold text-foreground sm:text-lg">
          {title}
        </h3>
        <div className="max-w-sm whitespace-pre-line text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
          {description}
        </div>
      </div>
      {isError && onRetry ? (
        <Button onClick={onRetry} type="button">
          <RefreshCw aria-hidden="true" className="size-4" />
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
