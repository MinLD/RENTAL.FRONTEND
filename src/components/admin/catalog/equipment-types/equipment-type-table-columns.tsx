import type { DataTableColumn } from "@/components/data-table";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Badge } from "@/components/ui/badge";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import {
  CATALOG_EQUIPMENT_TYPE_STATUS,
  type CatalogEquipmentTypeListItem,
  type CatalogEquipmentTypeStatus,
} from "@/types/catalog";
import { getCatalogEquipmentTypeStatusLabel } from "@/utils/catalog";

export const equipmentTypeColumns: DataTableColumn<CatalogEquipmentTypeListItem>[] =
  [
    {
      cell: (equipmentType) => (
        <div className="flex min-w-0 items-center gap-3">
          <AvatarWithSkeleton
            alt={equipmentType.name}
            className="size-10 rounded border border-border"
            fallback={getEquipmentTypeInitials(equipmentType)}
            fallbackClassName="rounded bg-muted text-xs font-bold text-foreground"
            imageClassName="rounded object-contain"
            loading="lazy"
            src={equipmentType.thumbnailUrl}
          />
          <div className="min-w-0">
            <span className="block truncate font-semibold text-foreground">
              {equipmentType.name}
            </span>
            <ClickToCopy
              className="mt-0.5 font-mono text-xs font-medium text-muted-foreground"
              text={equipmentType.id}
            />
          </div>
        </div>
      ),
      header: "Loại thiết bị",
      id: "equipmentType",
      minWidth: 300,
      width: 340,
    },
    {
      cell: (equipmentType) => (
        <ClickToCopy
          className="font-semibold text-foreground"
          text={equipmentType.code}
        />
      ),
      header: "Code",
      id: "code",
      minWidth: 150,
      width: 170,
    },
    {
      cell: (equipmentType) => (
        <span className="line-clamp-2 text-sm font-medium leading-5 text-muted-foreground">
          {equipmentType.categories.map((category) => category.name).join(", ") ||
            "-"}
        </span>
      ),
      header: "Danh mục",
      id: "categories",
      minWidth: 240,
      width: 300,
    },
    {
      cell: (equipmentType) => (
        <EquipmentTypeStatusBadge status={equipmentType.status} />
      ),
      header: "Trạng thái",
      id: "status",
      minWidth: 150,
      width: 170,
    },
    {
      cell: (equipmentType) => (
        <span className="block truncate font-medium text-muted-foreground">
          {equipmentType.currentSchemaVersion
            ? `v${equipmentType.currentSchemaVersion}`
            : "-"}
        </span>
      ),
      header: "Schema",
      id: "schema",
      minWidth: 120,
      width: 140,
    },
  ];

export function EquipmentTypeStatusBadge({
  status,
}: {
  status?: CatalogEquipmentTypeStatus;
}) {
  const variant =
    status === CATALOG_EQUIPMENT_TYPE_STATUS.Published
      ? "success"
      : status === CATALOG_EQUIPMENT_TYPE_STATUS.Disabled
        ? "destructive"
        : status === CATALOG_EQUIPMENT_TYPE_STATUS.Draft
          ? "warning"
          : "muted";

  return (
    <Badge variant={variant}>
      {getCatalogEquipmentTypeStatusLabel(status)}
    </Badge>
  );
}

function getEquipmentTypeInitials(equipmentType: CatalogEquipmentTypeListItem) {
  const source = equipmentType.name || equipmentType.code || "ET";

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
