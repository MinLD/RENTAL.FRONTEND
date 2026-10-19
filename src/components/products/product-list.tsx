import { AlertCircle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProductRefreshButton } from "./product-refresh-button";
import { ProductResetFiltersButton } from "./product-reset-filters-button";
import type { ProductBrowseData } from "@/types/product-browse";
import { ProductCard } from "./product-card";

export function ProductList({
  products,
  equipmentTypes,
}: Pick<ProductBrowseData, "products" | "equipmentTypes">) {
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
    return (
      <EmptyState
        className="min-h-80"
        title="Sản phẩm hiện chưa có"
        description="Chưa có sản phẩm phù hợp với khu vực và bộ lọc đã chọn. Bạn có thể đổi khu vực kho hoặc thử một từ khóa khác."
        action={<ProductResetFiltersButton />}
      />
    );
  }
  const typeNames = new Map(
    equipmentTypes.success
      ? equipmentTypes.data.data.map((item) => [item.id, item.name])
      : [],
  );
  return (
    <ul
      aria-label="Danh sách thiết bị"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {products.data.items.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            prioritizeImage={index === 0}
            equipmentTypeName={typeNames.get(product.equipmentTypeId)}
          />
        </li>
      ))}
    </ul>
  );
}
