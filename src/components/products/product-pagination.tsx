"use client";

import { ListPagination } from "@/components/list-pagination";
import { productBrowseHref } from "@/config/product-browse";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseFilters } from "@/types/product-browse";
import { ProductPageSize } from "./product-page-size";

export function ProductPagination({
  filters,
  totalPages,
}: {
  filters: ProductBrowseFilters;
  totalPages: number;
}) {
  const { isPending } = useProductBrowseNavigation();
  return (
    <ListPagination
      disabled={isPending}
      page={filters.page}
      totalPages={totalPages}
      pageSizeControl={<ProductPageSize filters={filters} />}
      getPageHref={(page) => productBrowseHref({ ...filters, page })}
    />
  );
}
