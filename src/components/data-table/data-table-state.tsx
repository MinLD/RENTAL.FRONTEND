import { FolderSearch } from "lucide-react";
import type { ReactNode } from "react";

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
  variant = "empty",
}: DataTableStateProps) {
  const isError = variant === "error";
  const isNotFound =
    typeof message === "string" &&
    /^(?:404[\s:-]*)?not\s*found[.!]?$/i.test(message.trim());
  const shouldShowAsError = isError && !isNotFound;
  const Icon = FolderSearch;
  const title = "Không tìm thấy kết quả";
  const description = isNotFound
    ? filtered
      ? "Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại."
      : "Dữ liệu sẽ xuất hiện ở đây khi có bản ghi mới."
    : (message ??
      (shouldShowAsError
        ? "Đã xảy ra lỗi khi tải danh sách. Vui lòng thử lại."
        : filtered
          ? "Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại."
          : "Dữ liệu sẽ xuất hiện ở đây khi có bản ghi mới."));

  return (
    <div
      className="grid w-full max-w-lg justify-items-center gap-4 rounded-xl px-6 py-8 text-center sm:px-8 sm:py-10"
      data-slot="data-table-state"
      role={shouldShowAsError ? "alert" : "status"}
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
    </div>
  );
}
