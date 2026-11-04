import type { DataTableColumn } from "@/components/data-table";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Badge } from "@/components/ui/badge";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import type { CatalogBrand } from "@/types/catalog";
import { getCatalogBrandStatusLabel } from "@/utils/catalog";

export const brandColumns: DataTableColumn<CatalogBrand>[] = [
  {
    cell: (brand) => (
      <div className="flex min-w-0 items-center gap-3">
        <AvatarWithSkeleton
          alt={brand.name}
          className="size-10 rounded border border-border"
          fallback={getBrandInitials(brand)}
          fallbackClassName="rounded bg-muted text-xs font-bold text-foreground"
          imageClassName="rounded object-contain"
          loading="lazy"
          src={brand.logoUrl}
        />
        <div className="min-w-0">
          <span className="block truncate font-semibold text-foreground">
            {brand.name}
          </span>
          <ClickToCopy
            className="mt-0.5 font-mono text-xs font-medium text-muted-foreground"
            text={brand.id}
          />
        </div>
      </div>
    ),
    header: "Thương hiệu",
    id: "brand",
    minWidth: 260,
    width: 300,
  },
  {
    cell: (brand) => (
      <ClickToCopy
        className="font-semibold text-foreground"
        text={brand.code}
      />
    ),
    header: "Code",
    id: "code",
    minWidth: 140,
    width: 160,
  },
  {
    cell: (brand) => (
      <ClickToCopy
        className="font-mono text-xs text-muted-foreground"
        text={brand.slug}
      />
    ),
    header: "Slug",
    id: "slug",
    minWidth: 180,
    width: 220,
  },
  {
    cell: (brand) => <BrandStatusBadge isActive={brand.isActive} />,
    header: "Trạng thái",
    id: "status",
    minWidth: 150,
    width: 170,
  },
  {
    cell: (brand) => (
      <span className="block truncate font-medium text-muted-foreground">
        {formatDateTime(brand.createdAt)}
      </span>
    ),
    header: "Ngày tạo",
    id: "createdAt",
    minWidth: 170,
    width: 190,
  },
  {
    cell: (brand) => (
      <span className="block truncate font-medium text-muted-foreground">
        {formatDateTime(brand.updatedAt)}
      </span>
    ),
    header: "Cập nhật",
    id: "updatedAt",
    minWidth: 170,
    width: 190,
  },
];

export function BrandStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "destructive"}>
      {getCatalogBrandStatusLabel(isActive)}
    </Badge>
  );
}

function getBrandInitials(brand: CatalogBrand) {
  const source = brand.name || brand.code || "BR";

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
