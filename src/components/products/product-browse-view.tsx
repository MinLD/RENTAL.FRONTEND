import Link from "next/link";

import { Container } from "@/components/layout/container";
import { HomeLink } from "@/components/layout/home-link";
import { productBrowseHref } from "@/config/product-browse";
import type { ProductBrowseData } from "@/types/product-browse";
import { ProductFilters } from "./product-filters";
import { ProductList } from "./product-list";
import { ProductPagination } from "./product-pagination";
import { ProductResults } from "./product-results";
import { ProductDiscoveryFilters } from "./product-discovery-filters";
import { ProductResultsToolbar } from "./product-results-toolbar";
import { ProductRecommendations } from "./product-recommendations";
import { ProductBrowseProvider } from "@/providers/product-browse-provider";

export function ProductBrowseView({
  filters,
  categories,
  equipmentTypes,
  brands,
  products,
  specificationFields,
}: ProductBrowseData) {
  const result = products.success ? products.data : null;
  const selectedType = equipmentTypes.success
    ? equipmentTypes.data.data.find((type) => type.id === filters.equipmentTypeId)
    : undefined;
  const selectedCategory = categories.success
    ? categories.data.data.find((category) => category.id === filters.categoryId)
      ?? categories.data.data.find((category) =>
        selectedType?.categories.some((typeCategory) => typeCategory.id === category.id),
      )
    : undefined;
  const hasCatalogBreadcrumb = Boolean(selectedCategory || selectedType);

  return (
    <ProductBrowseProvider filters={filters}>
      <div className="flex-1 bg-background py-5 sm:py-6">
        <Container>
          <nav
            aria-label="Đường dẫn trang"
            className="mb-4 text-xs text-muted-foreground"
          >
            <HomeLink className="hover:text-primary">Trang chủ</HomeLink>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            {hasCatalogBreadcrumb ? (
              <Link className="hover:text-primary" href={productBrowseHref({ ...filters, categoryId: undefined, equipmentTypeId: undefined, filters: undefined, page: 1 })}>
                Tìm kiếm thiết bị cho thuê
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">Tìm kiếm thiết bị cho thuê</span>
            )}
            {selectedCategory ? (
              <>
                <span className="mx-2" aria-hidden="true">/</span>
                {selectedType ? (
                  <Link className="hover:text-primary" href={productBrowseHref({ ...filters, categoryId: selectedCategory.id, equipmentTypeId: undefined, filters: undefined, page: 1 })}>
                    {selectedCategory.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">{selectedCategory.name}</span>
                )}
              </>
            ) : null}
            {selectedType ? (
              <>
                <span className="mx-2" aria-hidden="true">/</span>
                <span aria-current="page" className="text-foreground">{selectedType.name}</span>
              </>
            ) : null}
          </nav>

          <ProductFilters
            categories={categories}
            equipmentTypes={equipmentTypes}
            brands={brands}
            filters={filters}
            specificationFields={specificationFields}
          />
          <ProductDiscoveryFilters
            categories={categories}
            equipmentTypes={equipmentTypes}
            filters={filters}
            products={products}
            specificationFields={specificationFields}
          />
          <section
            aria-labelledby="product-list-title"
            className="min-w-0 space-y-4 pt-4"
          >
            <h2 className="sr-only" id="product-list-title">
              Danh sách sản phẩm
            </h2>
            <ProductResultsToolbar filters={filters} />
            <ProductResults view={filters.view}>
              <ProductList
                products={products}
                filters={filters}
                view={filters.view}
                equipmentTypes={equipmentTypes}
                brands={brands}
              />
              {result && result.items.length === 0 ? <ProductRecommendations /> : null}
            </ProductResults>
            {result && result.items.length > 0 ? (
              <ProductPagination
                filters={filters}
                totalPages={result.totalPages}
              />
            ) : null}
          </section>
        </Container>
      </div>
    </ProductBrowseProvider>
  );
}
