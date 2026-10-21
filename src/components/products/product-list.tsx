import { AlertCircle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { NoResultsIllustration } from "@/components/no-results-illustration";
import { PRODUCT_FEED_GRID_CLASS_NAME, PRODUCT_FEED_IMAGE_SIZES } from "@/config/product-images";
import { ProductRefreshButton } from "./product-refresh-button";
import { ProductResetFiltersButton } from "./product-reset-filters-button";
import type { ProductBrowseData } from "@/types/product-browse";
import { ProductCard } from "./product-card";
import { ProductListRow } from "./product-list-row";
import { ProductSearchAgainButton } from "./product-search-again-button";

export function ProductList({
  products,
  filters,
  view,
  equipmentTypes,
  brands,
}: Pick<ProductBrowseData, "products" | "filters" | "equipmentTypes" | "brands"> & { view?: "list" }) {
  if (!products.success) {
    return (
      <EmptyState
        className="min-h-80"
        title="Không thể tải sản phẩm"
        description={products.error.message}
        icon={<AlertCircle />}
        role="alert"
        action={<ProductRefreshButton />}
      />
    );
  }
  if (!products.data.items.length) {
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
  if (view === "list") {
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
      <ul aria-label="Danh sách thiết bị" className="divide-y divide-border border-y border-border">
        {products.data.items.map((product, index) => (
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
    );
  }
  return (
    <ul
      aria-label="Danh sách thiết bị"
      className={PRODUCT_FEED_GRID_CLASS_NAME}
    >
      {products.data.items.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            prioritizeImage={index === 0}
            imageSizes={PRODUCT_FEED_IMAGE_SIZES}
          />
        </li>
      ))}
    </ul>
  );
}
