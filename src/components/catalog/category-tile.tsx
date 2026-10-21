import { ProductImage } from "@/components/products/product-image";
import type { CatalogCategory } from "@/types/catalog";

export const CATEGORY_TILE_CLASS_NAME =
  "group flex h-full flex-col items-center gap-2 rounded-lg px-2 py-1 text-center transition-colors hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

export function CategoryTileContent({
  category,
  heading = false,
}: {
  category: Pick<CatalogCategory, "name" | "imageUrl">;
  heading?: boolean;
}) {
  const labelClassName = "line-clamp-2 min-h-8 text-[11px] leading-4 sm:text-xs";

  return (
    <>
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
        <ProductImage
          compact
          imageClassName="object-contain group-hover:scale-110"
          name={category.name}
          role="thumbnail"
          sizes="48px"
          src={category.imageUrl}
        />
      </div>
      {heading ? (
        <h3 className={labelClassName}>{category.name}</h3>
      ) : (
        <span className={labelClassName}>{category.name}</span>
      )}
    </>
  );
}

export function AllEquipmentTileContent() {
  return (
    <>
      <span aria-hidden="true" className="flex size-12 items-center justify-center">
        <span className="grid size-7 grid-cols-2 gap-1">
          <span className="rounded-[3px] bg-border" />
          <span className="rounded-[3px] bg-border" />
          <span className="rounded-[3px] bg-border" />
          <span className="rounded-full bg-primary" />
        </span>
      </span>
      <span className="min-h-8 text-[11px] leading-4 sm:text-xs">
        Tất cả<br />thiết bị
      </span>
    </>
  );
}
