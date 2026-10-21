"use client";

import { useState } from "react";
import { Expand } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EquipmentListingMedia } from "@/types/inventory";
import {
  PRODUCT_GALLERY_IMAGE_SIZES,
  PRODUCT_ZOOM_IMAGE_SIZES,
} from "@/config/product-images";
import { ProductImage } from "../product-image";

export function ProductGallery({
  images,
  name,
  model,
}: {
  images: EquipmentListingMedia[];
  name: string;
  model?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const selected = images[index];
  return (
    <section aria-label={`Hình ảnh ${name}`}>
      <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-border">
        <ProductImage
          src={selected?.url}
          name={name}
          role="large"
          imageClassName="object-contain"
          sizes={PRODUCT_GALLERY_IMAGE_SIZES}
          loading="eager"
          fetchPriority="high"
        />
        {selected?.url ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                aria-label="Phóng to ảnh thiết bị"
                className="absolute right-3 top-3 size-9 bg-secondary/80 text-white hover:bg-secondary"
                size="icon"
              >
                <Expand aria-hidden="true" className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>{name}</DialogTitle>
                <DialogDescription className="sr-only">
                  Chọn ảnh trong danh sách để xem ảnh phóng to của {name}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid h-[min(68vh,680px)] min-h-[240px] min-w-0 grid-cols-1 grid-rows-[minmax(0,1fr)_64px] gap-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:grid-rows-1 sm:gap-4">
                <div aria-label="Danh sách ảnh sản phẩm" className="order-2 flex min-h-0 flex-row gap-2 overflow-x-auto overflow-y-hidden pr-1 sm:order-1 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto">
                  {images.map((image, imageIndex) => (
                    <button
                      aria-label={`Xem ảnh ${imageIndex + 1}`}
                      aria-pressed={imageIndex === index}
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded border-2 bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:aspect-square sm:h-auto sm:w-full ${imageIndex === index ? "border-primary" : "border-transparent"}`}
                      key={`${image.id}-zoom-${imageIndex}`}
                      onClick={() => setIndex(imageIndex)}
                      type="button"
                    >
                      <ProductImage
                        src={image.url}
                        name={`${name} - ảnh ${imageIndex + 1}`}
                        role="thumbnail"
                        imageClassName="object-contain group-hover:scale-100"
                        sizes="76px"
                      />
                    </button>
                  ))}
                </div>
                <div className="relative order-1 min-h-0 min-w-0 overflow-hidden rounded bg-muted/20 sm:order-2">
                  <ProductImage
                    src={selected.url}
                    previewSrc={selected.url}
                    name={`${name} - ảnh ${index + 1}`}
                    role="large"
                    imageClassName="object-contain"
                    sizes={PRODUCT_ZOOM_IMAGE_SIZES}
                    loading="eager"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
        {model ? (
          <span className="absolute bottom-3 left-3 rounded bg-primary px-3 py-1.5 text-[10px] font-bold uppercase text-primary-foreground">
            {model}
          </span>
        ) : null}
      </div>
      {images.length ? (
        <div className="mt-3 flex w-full min-w-0 gap-2 overflow-x-auto py-1">
            {images.map((image, imageIndex) => (
              <button
                aria-label={`Xem ảnh ${imageIndex + 1}`}
                aria-pressed={imageIndex === index}
                className={`relative aspect-[16/9] w-32 shrink-0 cursor-pointer overflow-hidden rounded border-2 bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-primary ${imageIndex === index ? "border-primary" : "border-transparent"}`}
                key={`${image.id}-${imageIndex}`}
                onClick={() => setIndex(imageIndex)}
                type="button"
              >
                <ProductImage
                  src={image.url}
                  name={`${name} - ảnh ${imageIndex + 1}`}
                  role="thumbnail"
                  imageClassName="object-contain group-hover:scale-100"
                  sizes="128px"
                />
              </button>
            ))}
        </div>
      ) : null}
    </section>
  );
}
