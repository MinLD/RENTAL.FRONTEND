"use client";

import { useId } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/products/product-card";
import type { PublicEquipmentListing } from "@/types/inventory";

const SLIDE_CLASS_NAME = "basis-4/5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4";
const ARROW_CLASS_NAME =
  "static size-8 translate-y-0 rounded border border-border bg-background text-foreground shadow-none backdrop-blur-none hover:bg-primary hover:text-primary-foreground";

export function ProductRelatedCarousel({
  products,
  title = "Thiết bị tương đương",
}: {
  products: PublicEquipmentListing[];
  title?: string;
}) {
  const titleId = useId();

  if (!products.length) return null;

  return (
    <section aria-labelledby={titleId} className="w-full">
      <Carousel opts={{ align: "start", loop: false }}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-5 w-1 rounded-full bg-primary"
            />
            <h2
              className="text-base font-bold tracking-tight text-foreground sm:text-lg"
              id={titleId}
            >
              {title}
            </h2>
          </div>

          <div className="flex shrink-0 gap-2">
            <CarouselPrevious
              aria-label="Thiết bị tương đương trước đó"
              className={ARROW_CLASS_NAME}
            />
            <CarouselNext
              aria-label="Thiết bị tương đương tiếp theo"
              className={ARROW_CLASS_NAME}
            />
          </div>
        </div>

        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem
              className={`pl-4 ${SLIDE_CLASS_NAME}`}
              key={product.id}
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
