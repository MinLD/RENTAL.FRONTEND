"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { NoResultsIllustration } from "@/components/illustrations/no-results-illustration";
import { Button } from "@/components/ui/button";
import { PRODUCT_FEED_GRID_CLASS_NAME, PRODUCT_FEED_IMAGE_SIZES } from "@/config/product-images";
import { fetchPublicEquipmentListings } from "@/services/public-inventory-service";
import type { PublicEquipmentListingDetail } from "@/types/inventory";
import type { ProductBrowseData } from "@/types/product-browse";
import { ProductCard } from "./product-card";
import { ProductListRow } from "./product-list-row";
import { ProductRefreshButton } from "./product-refresh-button";
import { ProductResetFiltersButton } from "./product-reset-filters-button";
import { ProductSearchAgainButton } from "./product-search-again-button";

export function ProductList({
  products,
  filters,
  view,
  equipmentTypes,
  brands,
}: Pick<ProductBrowseData, "products" | "filters" | "equipmentTypes" | "brands"> & { view?: "list" }) {
  const initialData = products.success ? products.data : null;
  const [items, setItems] = useState<PublicEquipmentListingDetail[]>(
    initialData?.items ?? [],
  );
  const [page, setPage] = useState(initialData?.page ?? 1);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages ?? 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [prevProducts, setPrevProducts] = useState(products);

  if (products !== prevProducts) {
    setPrevProducts(products);
    const nextData = products.success ? products.data : null;
    setItems(nextData?.items ?? []);
    setPage(nextData?.page ?? 1);
    setTotalPages(nextData?.totalPages ?? 1);
    setIsLoadingMore(false);
    setLoadMoreError(null);
  }

  async function loadMore() {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const nextPage = page + 1;
      const response = await fetchPublicEquipmentListings({
        ...filters,
        page: nextPage,
        pageSize: filters.pageSize ?? 20,
        sort: "created_desc",
      });
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = response.items.filter(
          (item) => !existingIds.has(item.id),
        );
        return [...prev, ...newItems];
      });
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (error) {
      setLoadMoreError(
        error instanceof Error
          ? error.message
          : "Không thể tải thêm thiết bị. Vui lòng thử lại.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!products.success) {
    return (
      <ErrorState
        className="min-h-80"
        title="Không thể tải sản phẩm"
        description={products.error.message}
        action={<ProductRefreshButton />}
      />
    );
  }

  if (!items.length) {
    const query = filters.q?.trim();
    const hasActiveFilters = Boolean(
      filters.categoryId || filters.equipmentTypeId || filters.brandId ||
      filters.provinceCode || filters.wardCode || filters.filters ||
      filters.from || filters.to || filters.requestedQuantity,
    );
    return (
      <EmptyState
        className="min-h-[360px] gap-4 py-8 sm:min-h-[400px]"
        illustration={<NoResultsIllustration />}
        title={query ? `Không tìm thấy “${query.length > 60 ? `${query.slice(0, 60)}…` : query}”` : hasActiveFilters ? "Không tìm thấy thiết bị phù hợp" : "Chưa có thiết bị cho thuê"}
        description={query
          ? "Hãy thử từ khóa khác để xem thêm thiết bị phù hợp."
          : hasActiveFilters
            ? "Thử đổi khu vực hoặc xóa bộ lọc để xem thêm thiết bị."
            : "Các thiết bị cho thuê sẽ xuất hiện tại đây khi được nhà cung cấp đăng tải."}
        action={query
          ? <ProductSearchAgainButton />
          : hasActiveFilters
            ? <ProductResetFiltersButton className="rounded-full px-6" variant="primary" />
            : undefined}
      />
    );
  }

  const typeNames = new Map(
    equipmentTypes.success
      ? equipmentTypes.data.data.map((type) => [type.id, type.name] as const)
      : [],
  );
  const brandNames = new Map(
    brands.success
      ? brands.data.data.map((brand) => [brand.id, brand.name] as const)
      : [],
  );

  return (
    <div className="space-y-4">
      {view === "list" ? (
        <ul aria-label="Danh sách thiết bị" className="divide-y divide-border border-y border-border">
          {items.map((product, index) => (
            <li key={product.id}>
              <ProductListRow
                product={product}
                equipmentTypeName={typeNames.get(product.equipmentTypeId)}
                brandName={brandNames.get(product.brandId)}
                prioritizeImage={index === 0}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul
          aria-label="Danh sách thiết bị"
          className={PRODUCT_FEED_GRID_CLASS_NAME}
        >
          {items.map((product, index) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                prioritizeImage={index === 0}
                imageSizes={PRODUCT_FEED_IMAGE_SIZES}
              />
            </li>
          ))}
        </ul>
      )}

      {page < totalPages && (
        <div className="flex min-h-16 items-center justify-center py-6">
          {loadMoreError ? (
            <div
              className="flex flex-col items-center gap-3 text-center"
              role="alert"
            >
              <p className="text-sm text-muted-foreground">{loadMoreError}</p>
              <Button
                disabled={isLoadingMore}
                onClick={() => void loadMore()}
                size="sm"
                variant="secondary"
              >
                Thử lại
              </Button>
            </div>
          ) : (
            <Button
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
              size="md"
              variant="secondary"
              className="min-w-44 rounded-full font-semibold shadow-xs hover:border-primary hover:text-primary"
            >
              {isLoadingMore ? (
                <>
                  <LoaderCircle className="size-4 animate-spin text-primary" />
                  <span>Đang tải thêm...</span>
                </>
              ) : (
                "Xem thêm thiết bị"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
