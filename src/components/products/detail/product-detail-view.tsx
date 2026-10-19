import Link from "next/link";
import { CalendarDays, MapPin, Package, Tag } from "lucide-react";

import { Container } from "@/components/layout/container";
import { HomeLink } from "@/components/layout/home-link";
import { QueryProvider } from "@/providers/query-provider";
import type { PublicEquipmentListingDetail } from "@/types/inventory";
import type { CatalogSpecField } from "@/types/catalog";
import { formatWarehouseArea, getEquipmentListingName } from "@/utils/inventory";
import {
  getProductDetailImages,
  getProductSpecifications,
  getTodayRentalDate,
} from "@/utils/product-detail";
import { ProductDetailTabs } from "./product-detail-tabs";
import { ProductGallery } from "./product-gallery";
import { ProductRentalPanel } from "./product-rental-panel";

export function ProductDetailView({
  product,
  specificationFields,
}: {
  product: PublicEquipmentListingDetail;
  specificationFields?: CatalogSpecField[] | null;
}) {
  const name = getEquipmentListingName(product);
  return (
    <div className="flex-1 bg-background py-5 sm:py-6">
      <Container>
        <nav
          aria-label="Đường dẫn thiết bị"
          className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
        >
          <HomeLink className="hover:text-primary">
            Trang chủ
          </HomeLink>
          <span aria-hidden="true">/</span>
          <Link className="hover:text-primary" href="/products">
            Thiết bị cho thuê
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-primary">
            {name}
          </span>
        </nav>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
          <div className="min-w-0">
            <ProductGallery
              images={getProductDetailImages(product)}
              name={name}
              model={product.model}
            />
            <div className="mt-7 space-y-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {name}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {product.model ? (
                  <span className="flex items-center gap-1.5">
                    <Tag aria-hidden="true" className="size-3.5" />
                    {product.model}
                  </span>
                ) : null}
                {product.manufactureYear ? (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays aria-hidden="true" className="size-3.5" />
                    Năm sản xuất {product.manufactureYear}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <Package aria-hidden="true" className="size-3.5" />
                  {product.totalQuantity} thiết bị
                </span>
              </div>
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{formatWarehouseArea(product.warehouseArea)}</span>
              </p>
              <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                {product.description ||
                  "Thiết bị phục vụ nhu cầu thuê của bạn."}
              </p>
            </div>
          </div>
          <QueryProvider>
            <ProductRentalPanel
              key={product.id}
              listingId={product.id}
              name={name}
              rentalRate={product.rentalRate}
              depositAmount={product.depositAmount}
              totalQuantity={product.totalQuantity}
              today={getTodayRentalDate()}
            />
          </QueryProvider>
          <div className="min-w-0 lg:col-start-1">
            <ProductDetailTabs
              description={product.description}
              name={name}
              thumbnailUrl={product.thumbnailUrl}
              rentalRate={product.rentalRate}
              specifications={getProductSpecifications(
                product,
                specificationFields,
              )}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
