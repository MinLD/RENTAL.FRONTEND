import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProductRefreshButton } from "./product-refresh-button";
import { Button } from "@/components/ui/button";
import type { ProductBrowseData } from "@/types/product-browse";
import { ProductCard } from "./product-card";

export function ProductList({
  products,
  equipmentTypes,
}: Pick<ProductBrowseData, "products" | "equipmentTypes">) {
  if (!products) {
    return (
      <EmptyState
        className="min-h-80"
        title="Chọn loại thiết bị"
        description="Chọn một loại thiết bị ở bộ lọc bên trái để xem sản phẩm trong danh mục này."
      />
    );
  }
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
        description="Chưa có sản phẩm phù hợp với bộ lọc đã chọn. Bạn có thể thử một loại thiết bị hoặc từ khóa khác."
        action={
          <Button asChild variant="secondary">
            <Link href="/products" prefetch={false}>
              Xóa bộ lọc
            </Link>
          </Button>
        }
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
      {products.data.items.map((product) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            equipmentTypeName={typeNames.get(product.equipmentTypeId)}
          />
        </li>
      ))}
    </ul>
  );
}
