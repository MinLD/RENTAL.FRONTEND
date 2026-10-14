import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PRODUCT_CARD_IMAGE_SIZES } from "@/config/product-images";
import type { PublicEquipmentListing } from "@/types/inventory";
import { getProductThumbnailSrc } from "@/utils/product-image";
import {
  formatEquipmentListingRate,
  getEquipmentListingName,
} from "@/utils/inventory";
import { ProductImage } from "./product-image";

export function ProductCard({
  product,
  equipmentTypeName,
  prioritizeImage = false,
}: {
  product: PublicEquipmentListing;
  equipmentTypeName?: string;
  prioritizeImage?: boolean;
}) {
  const name = getEquipmentListingName(product);
  const thumbnail = getProductThumbnailSrc(product);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded border border-border bg-background">
      <div className="relative aspect-[16/10] overflow-hidden">
        <ProductImage
          name={name}
          src={thumbnail}
          sizes={PRODUCT_CARD_IMAGE_SIZES}
          loading={prioritizeImage ? "eager" : "lazy"}
          fetchPriority={prioritizeImage ? "high" : undefined}
        />
        <span
          className={`absolute left-2 top-2 rounded px-2 py-1 text-[10px] font-semibold uppercase text-white ${product.availableQuantity > 0 ? "bg-success" : "bg-secondary"}`}
        >
          {product.availableQuantity > 0
            ? "Sẵn sàng cho thuê"
            : "Chưa sẵn sàng"}
        </span>
        {equipmentTypeName ? (
          <span
            className="absolute bottom-2 right-2 max-w-[80%] truncate rounded bg-secondary/85 px-2 py-1 text-[10px] text-secondary-foreground"
            title={equipmentTypeName}
          >
            {equipmentTypeName}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="mb-3 min-h-10 line-clamp-2 text-sm font-bold leading-5">
          {name}
        </h3>
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
        <div className="mt-auto pt-3.5">
          <div className="mb-2.5 flex flex-wrap items-end justify-between gap-1 pt-3">
            <span className="text-[10px] uppercase text-muted-foreground">
              Giá thuê
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
          <Button
            asChild
            className="h-8 w-full bg-secondary text-[11px] uppercase text-secondary-foreground hover:bg-secondary/90"
          >
            <Link href={`/products/${encodeURIComponent(product.id)}`}>
              Xem chi tiết
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
