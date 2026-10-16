import Link from "next/link";

import { Container } from "@/components/layout/container";
import type { ProductBrowseData } from "@/types/product-browse";
import { ProductFilters } from "./product-filters";
import { ProductList } from "./product-list";
import { ProductPagination } from "./product-pagination";
import { ProductResults } from "./product-results";
import { ProductAreaSummary } from "./product-area-summary";
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
  return (
    <ProductBrowseProvider filters={filters}>
      <div className="flex-1 bg-background py-5 sm:py-6">
        <Container>
          <nav
            aria-label="Đường dẫn trang"
            className="mb-4 text-xs text-muted-foreground"
          >
            <Link className="hover:text-primary" href="/">
              Trang chủ
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span className="text-foreground">Thiết bị cho thuê</span>
          </nav>
          <h1 className="sr-only">Thiết bị cho thuê</h1>
          <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <ProductFilters
              categories={categories}
              equipmentTypes={equipmentTypes}
              brands={brands}
              filters={filters}
              specificationFields={specificationFields}
            />
            <section
              aria-labelledby="product-list-title"
              className="min-w-0 space-y-4"
            >
              <h2 className="sr-only" id="product-list-title">
                Danh sách sản phẩm
              </h2>
              <ProductAreaSummary filters={filters} />
              <ProductResults>
                <ProductList
                  equipmentTypes={equipmentTypes}
                  products={products}
                />
              </ProductResults>
              {result && result.items.length > 0 ? (
                <ProductPagination
                  filters={filters}
                  totalPages={result.totalPages}
                />
              ) : null}
            </section>
          </div>
        </Container>
      </div>
    </ProductBrowseProvider>
  );
}
