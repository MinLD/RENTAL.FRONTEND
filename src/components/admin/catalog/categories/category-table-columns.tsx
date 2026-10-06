import type { DataTableColumn } from "@/components/data-table";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Badge } from "@/components/ui/badge";
import type { CatalogCategoryDetail } from "@/types/catalog";

export const categoryColumns: DataTableColumn<CatalogCategoryDetail>[] = [
  {
    cell: (category) => (
      <div className="flex min-w-0 items-center gap-3">
        <AvatarWithSkeleton
          alt={category.name}
          className="size-10 rounded border border-border"
          fallback={getCategoryInitials(category)}
          fallbackClassName="rounded bg-muted text-xs font-bold text-foreground"
          imageClassName="rounded object-contain"
          loading="lazy"
          src={category.imageUrl}
        />
        <div className="min-w-0">
          <span className="block truncate font-semibold text-foreground">
            {category.name}
          </span>
          <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">
            {category.id}
          </span>
        </div>
      </div>
    ),
    header: "Danh mục",
    id: "category",
    minWidth: 280,
    width: 320,
  },
  {
    cell: (category) => (
      <span className="block truncate font-medium text-muted-foreground">
        {category.slug || "-"}
      </span>
    ),
    header: "Slug",
    id: "slug",
    minWidth: 180,
    width: 220,
  },
  {
    cell: (category) => (
      <span className="line-clamp-2 text-sm font-medium leading-5 text-muted-foreground">
        {category.description || "-"}
      </span>
    ),
    header: "Mô tả",
    id: "description",
    minWidth: 260,
    width: 360,
  },
  {
    cell: (category) => <CategoryStatusBadge isActive={category.isActive} />,
    header: "Trạng thái",
    id: "status",
    minWidth: 150,
    width: 170,
  },
];

export function CategoryStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "destructive"}>
      {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
    </Badge>
  );
}

function getCategoryInitials(category: CatalogCategoryDetail) {
  const source = category.name || "DM";

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
