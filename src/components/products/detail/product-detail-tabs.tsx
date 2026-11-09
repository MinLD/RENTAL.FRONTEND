"use client";

import { useState } from "react";

import { DetailTabs } from "@/components/layout/detail-page";
import { PRODUCT_DESCRIPTION_IMAGE_SIZES } from "@/config/product-images";
import type { ProductSpecification } from "@/utils/product-detail";
import { ProductImage } from "../product-image";
import type { EquipmentListingRentalRateResponse } from "@/types/inventory";
import { ProductRentalRateTable } from "./product-rental-rate-table";
import { ProductReviewsTab } from "@/components/reviews/product-reviews-tab";

export function ProductDetailTabs({
  listingId,
  description,
  name,
  thumbnailUrl,
  specifications,
  rentalRate,
  isAuthenticated = false,
}: {
  listingId: string;
  description: string | null;
  name: string;
  thumbnailUrl: string | null;
  specifications: ProductSpecification[];
  rentalRate: EquipmentListingRentalRateResponse | null;
  isAuthenticated?: boolean;
}) {
  const [tab, setTab] = useState("description");
  return (
    <DetailTabs
      value={tab}
      onValueChange={setTab}
      items={[
        {
          value: "description",
          label: "Mô tả thiết bị",
          content: (
            <div className="grid items-start gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)]">
              <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                {description || "Mô tả thiết bị đang được cập nhật."}
              </p>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                <ProductImage
                  src={thumbnailUrl}
                  name={name}
                  role="medium"
                  sizes={PRODUCT_DESCRIPTION_IMAGE_SIZES}
                />
              </div>
            </div>
          ),
        },
        {
          value: "specifications",
          label: "Thông số kỹ thuật",
          content: (
            <dl
              aria-label="Thông số kỹ thuật thiết bị"
              className="grid overflow-hidden rounded border border-border md:grid-cols-2"
            >
              {specifications.map((spec, index) => (
                <div
                  className={`flex min-w-0 justify-between gap-4 border-b border-border px-4 py-3 text-xs last:border-b-0 ${index % 2 === 0 ? "md:border-r" : ""}`}
                  key={`${spec.label}-${index}`}
                >
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="max-w-[60%] break-words text-right font-semibold">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          ),
        },
        {
          value: "rental-rates",
          label: "Bảng giá thuê",
          content: <ProductRentalRateTable rentalRate={rentalRate} />,
        },
        {
          value: "reviews",
          label: "Đánh giá khách hàng",
          content: (
            <ProductReviewsTab
              listingId={listingId}
              listingName={name}
              isAuthenticated={isAuthenticated}
            />
          ),
        },
      ]}
    />
  );
}
