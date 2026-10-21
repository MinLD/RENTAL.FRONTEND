import Link from "next/link";
import { MapPin } from "lucide-react";

import type { PublicEquipmentListing } from "@/types/inventory";
import {
  formatEquipmentListingRate,
  formatWarehouseArea,
  getEquipmentListingName,
} from "@/utils/inventory";
import { getProductThumbnailSrc } from "@/utils/product-image";
import { ProductImage } from "./product-image";

export function ProductListRow({
  product,
  equipmentTypeName,
  brandName,
  prioritizeImage = false,
}: {
  product: PublicEquipmentListing;
  equipmentTypeName?: string;
  brandName?: string;
  prioritizeImage?: boolean;
}) {
  const name = getEquipmentListingName(product);
  const dailyRate = product.rentalRate?.dailyRate;
  const attributes = [
    product.model ? `Model ${product.model}` : null,
    product.manufactureYear ? `Năm ${product.manufactureYear}` : null,
    `${product.availableQuantity} thiết bị sẵn sàng`,
  ].filter(Boolean);

  return (
    <article>
      <Link
        aria-label={name}
        className="group grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:grid-cols-[184px_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[210px_minmax(0,1fr)_190px]"
        href={`/products/${encodeURIComponent(product.id)}`}
      >
        <div className="relative aspect-square overflow-hidden rounded bg-muted sm:aspect-[4/3]">
          <ProductImage
            name={name}
            role="medium"
            src={getProductThumbnailSrc(product)}
            sizes="(min-width: 1024px) 210px, (min-width: 640px) 184px, 104px"
            loading={prioritizeImage ? "eager" : "lazy"}
            fetchPriority={prioritizeImage ? "high" : undefined}
          />
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground group-hover:text-primary sm:text-base">
            {name}
          </h3>
          {equipmentTypeName || brandName ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {[equipmentTypeName, brandName].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {product.description ? (
            <p className="mt-2 hidden line-clamp-2 text-sm leading-5 text-muted-foreground sm:block">
              {product.description}
            </p>
          ) : null}
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:mt-3">
            {attributes.join(" · ")}
          </p>
          <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-primary" />
            <span className="line-clamp-2">{formatWarehouseArea(product.warehouseArea)}</span>
          </p>
          <p className="mt-3 font-bold text-primary lg:hidden">
            {dailyRate != null
              ? formatEquipmentListingRate(dailyRate, product.rentalRate?.currency)
              : "Liên hệ"}
            {dailyRate != null ? <span className="ml-1 text-xs font-normal text-muted-foreground">/ ngày</span> : null}
          </p>
        </div>
        <div className="hidden self-start text-right lg:block">
          <p className="text-lg font-bold text-primary">
            {dailyRate != null
              ? formatEquipmentListingRate(dailyRate, product.rentalRate?.currency)
              : "Liên hệ"}
          </p>
          {dailyRate != null ? <p className="text-xs text-muted-foreground">Giá thuê / ngày</p> : null}
        </div>
      </Link>
    </article>
  );
}
