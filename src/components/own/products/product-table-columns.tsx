import type { DataTableColumn } from "@/components/data-table";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Badge } from "@/components/ui/badge";
import type { EquipmentListing } from "@/types/inventory";
import {
  formatEquipmentListingDate,
  formatEquipmentListingRate,
  getEquipmentListingStatusLabel,
  getEquipmentListingStatusVariant,
  getEquipmentListingName,
} from "@/utils/inventory";

export const productColumns: DataTableColumn<EquipmentListing>[] = [
  {
    cell: (product) => (
      <div className="flex min-w-0 items-center gap-3">
        <AvatarWithSkeleton
          alt={getEquipmentListingName(product)}
          className="size-10 shrink-0 rounded border border-border"
          fallback={
            getEquipmentListingName(product)
              ?.trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() || "SP"
          }
          fallbackClassName="rounded bg-muted text-xs font-bold text-foreground"
          imageClassName="rounded object-contain"
          loading="lazy"
          src={product.thumbnailUrl}
        />
        <div className="min-w-0">
          <span
            className="block truncate font-semibold text-foreground"
            title={getEquipmentListingName(product)}
          >
            {getEquipmentListingName(product)}
          </span>
        </div>
      </div>
    ),
    header: "Tên sản phẩm",
    id: "product",
    minWidth: 260,
    width: 300,
  },
  {
    cell: (product) => (
      <span className="block truncate" title={product.model ?? undefined}>
        {product.model || "—"}
      </span>
    ),
    header: "Model",
    id: "model",
    width: 180,
  },
  {
    cell: (product) => (
      <Badge variant={getEquipmentListingStatusVariant(product.status)}>
        {getEquipmentListingStatusLabel(product.status)}
      </Badge>
    ),
    header: "Trạng thái",
    id: "status",
    width: 140,
  },
  {
    cell: (product) => (
      <span className="font-semibold tabular-nums">
        {new Intl.NumberFormat("vi-VN").format(product.totalQuantity)}
      </span>
    ),
    header: "Số lượng",
    id: "totalQuantity",
    width: 110,
  },
  ...(
    [
      ["dailyRate", "Giá thuê / ngày"],
      ["weeklyRate", "Giá thuê / tuần"],
      ["monthlyRate", "Giá thuê / tháng"],
    ] as const
  ).map(([key, label]): DataTableColumn<EquipmentListing> => ({
    cell: (product) => (
      <span className="whitespace-nowrap font-medium tabular-nums">
        {formatEquipmentListingRate(
          product.rentalRate?.[key],
          product.rentalRate?.currency,
        )}
      </span>
    ),
    header: label,
    id: key,
    width: 170,
  })),
  {
    cell: (product) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatEquipmentListingDate(product.createdAt)}
      </span>
    ),
    header: "Ngày tạo",
    id: "createdAt",
    width: 170,
  },
  {
    cell: (product) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatEquipmentListingDate(product.updatedAt)}
      </span>
    ),
    header: "Cập nhật",
    id: "updatedAt",
    width: 170,
  },
];
