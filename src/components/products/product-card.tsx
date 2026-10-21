import Link from "next/link";
import { MapPin } from "lucide-react";

import { PRODUCT_CARD_IMAGE_SIZES } from "@/config/product-images";
import type { PublicEquipmentListing } from "@/types/inventory";
import { getProductThumbnailSrc } from "@/utils/product-image";
import {
  formatEquipmentListingRate,
  getEquipmentListingName,
  formatWarehouseArea,
} from "@/utils/inventory";
import { ProductImage } from "./product-image";

export function ProductCard({
  product,
  equipmentTypeName,
  prioritizeImage = false,
  imageSizes = PRODUCT_CARD_IMAGE_SIZES,
}: {
  product: PublicEquipmentListing;
  equipmentTypeName?: string;
  prioritizeImage?: boolean;
  imageSizes?: string;
}) {
  const name = getEquipmentListingName(product);
  const thumbnail = getProductThumbnailSrc(product);
  return (
    <article className="h-full">
      <Link
        aria-label={name}
        className="group flex h-full flex-col overflow-hidden rounded border border-border bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        href={`/products/${encodeURIComponent(product.id)}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <ProductImage
            name={name}
            role="medium"
            src={thumbnail}
            sizes={imageSizes}
            loading={prioritizeImage ? "eager" : "lazy"}
            fetchPriority={prioritizeImage ? "high" : undefined}
          />
        </div>
        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="mb-3 min-h-10 line-clamp-2 text-sm font-bold leading-5">
            {name}
          </h3>
          <p
            className="mb-1 flex items-start gap-1.5 text-[11px] leading-4 text-muted-foreground"
            title={formatWarehouseArea(product.warehouseArea)}
          >
            <MapPin
              aria-hidden="true"
              className="mt-0.5 size-3 shrink-0 text-primary"
            />
            <span className="line-clamp-2">
              {formatWarehouseArea(product.warehouseArea)}
            </span>
          </p>
          <dl className="space-y-2 py-2.5 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Model</dt>
              <dd className="max-w-[60%] truncate text-right font-medium">
                {product.model || "Chưa cập nhật"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Năm sản xuất</dt>
              <dd className="font-medium">
                {product.manufactureYear || "Chưa cập nhật"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Số lượng sẵn sàng</dt>
              <dd className="font-medium">
                {product.availableQuantity} thiết bị
              </dd>
            </div>
          </dl>
          <div className="mt-auto">
            <div className="flex flex-wrap items-end justify-between gap-1 pt-3">
              <span className="text-[10px] uppercase text-muted-foreground">
                Giá thuê:
              </span>
              <span className="text-base font-bold text-primary">
                {product.rentalRate?.dailyRate != null
                  ? formatEquipmentListingRate(
                      product.rentalRate.dailyRate,
                      product.rentalRate.currency,
                    )
                  : "Liên hệ"}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                  / ngày
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
