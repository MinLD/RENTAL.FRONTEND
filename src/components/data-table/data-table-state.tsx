import { FolderSearch } from "lucide-react";
import type { ReactNode } from "react";

import { ErrorState } from "@/components/error-state";

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
  if (variant === "error") {
    return (
      <div className="w-full max-w-lg" data-slot="data-table-state">
        <ErrorState
          className="min-h-0 px-6 py-8 sm:px-8 sm:py-10"
          description="Dữ liệu đang tạm thời không hiển thị. Vui lòng thử lại."
          title="Không thể tải dữ liệu"
        />
      </div>
    );
  }

  const description = message ?? (filtered
    ? "Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại."
    : "Dữ liệu sẽ xuất hiện ở đây khi có bản ghi mới.");

  return (
    <div
      className="grid w-full max-w-lg justify-items-center gap-4 rounded-xl px-6 py-8 text-center sm:px-8 sm:py-10"
      data-slot="data-table-state"
      role="status"
    >
      <div className="grid size-16 place-items-center rounded-2xl border shadow-sm">
        <FolderSearch aria-hidden="true" className="size-8" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 space-y-2">
        <h3 className="text-base font-bold text-foreground sm:text-lg">
          Không tìm thấy kết quả
        </h3>
        <div className="max-w-sm whitespace-pre-line text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
          {description}
        </div>
      </div>
    </div>
  );
}
