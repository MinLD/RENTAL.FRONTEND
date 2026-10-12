"use client";

import { useCallback } from "react";
import { Eye, Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InventoryAsset } from "@/types/inventory";
import type { DataTableFetchParams } from "@/types/data-table";
import { formatEquipmentListingDate } from "@/utils/inventory";
import { formatShortId } from "@/utils/string";
import type { ProductPageActions } from "./product-management-types";

export function AssetBookingsBadge({
  acceptingBookings,
}: {
  acceptingBookings: boolean;
}) {
  return (
    <Badge variant={acceptingBookings ? "success" : "warning"}>
      {acceptingBookings ? "Nhận đặt thuê" : "Tạm ngừng nhận"}
    </Badge>
  );
}

const assetColumns: DataTableColumn<InventoryAsset>[] = [
  {
    id: "code",
    header: "Mã máy",
    width: 160,
    cell: (asset) => (
      <span
        className="block truncate font-semibold"
        title={asset.assetCode || undefined}
      >
        {asset.assetCode ? formatShortId(asset.assetCode) : "—"}
      </span>
    ),
  },
  {
    id: "serial",
    header: "Số serial",
    width: 200,
    cell: (asset) => asset.serialNumber || "—",
  },
  {
    id: "year",
    header: "Năm sản xuất",
    width: 130,
    cell: (asset) => asset.manufactureYear ?? "—",
  },
  {
    id: "bookings",
    header: "Nhận đặt thuê",
    width: 185,
    cell: (asset) => (
      <AssetBookingsBadge acceptingBookings={asset.acceptingBookings} />
    ),
  },
  {
    id: "reason",
    header: "Lý do tạm ngừng",
    width: 220,
    cell: (asset) => asset.suspensionReason || "—",
  },
  {
    id: "createdAt",
    header: "Ngày thêm",
    width: 170,
    cell: (asset) => formatEquipmentListingDate(asset.createdAt),
  },
];

export function ProductAssetsTable({
  productId,
  fetchAssets,
  revision,
  onCreate,
  onView,
}: {
  productId: string;
  fetchAssets: ProductPageActions["fetchAssets"];
  revision: number;
  onCreate: () => void;
  onView: (asset: InventoryAsset, mode: "view" | "edit") => void;
}) {
  const fetchData = useCallback(
    (params: DataTableFetchParams) => fetchAssets(productId, params),
    [fetchAssets, productId],
  );
  return (
    <div className="h-full min-h-0 min-w-0 overflow-hidden rounded border border-border">
      <DataTable<InventoryAsset>
        bodyClassName="min-h-0"
        columns={assetColumns}
        description="Mỗi máy là một thiết bị riêng. Chọn máy để xem thông tin và lịch sử dụng."
        emptyState="Chưa có máy vật lý cho sản phẩm này."
        fetchData={fetchData}
        fetchDependencies={[revision]}
        getRowId={(asset) => asset.id}
        initialPageSize={10}
        onRowDoubleClick={(asset) => onView(asset, "view")}
        pageSizeOptions={[10, 20, 50]}
        renderRowActions={(asset) => (
          <Button
            aria-label="Xem chi tiết máy"
            onClick={() => onView(asset, "view")}
            size="icon"
            title="Xem chi tiết máy"
            type="button"
            variant="default"
          >
            <Eye className="size-4" />
          </Button>
        )}
        renderToolbarActions={() => (
          <Button
            onClick={onCreate}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Plus className="size-4" />
            Thêm máy
          </Button>
        )}
        showCsvExport={false}
        showSearch={false}
        title="Danh sách máy vật lý"
      />
    </div>
  );
}
