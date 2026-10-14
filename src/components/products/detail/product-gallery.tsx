"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";

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
  function move(step: number) {
    if (images.length) setIndex((index + step + images.length) % images.length);
  }
  return (
    <section aria-label={`Hình ảnh ${name}`}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
        <ProductImage
          src={selected?.url}
          name={name}
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
                  Ảnh phóng to của {name}.
                </DialogDescription>
              </DialogHeader>
              <div className="relative aspect-[16/9] overflow-hidden rounded">
                <ProductImage
                  src={selected.url}
                  name={name}
                  imageClassName="object-contain"
                  sizes={PRODUCT_ZOOM_IMAGE_SIZES}
                  loading="eager"
                />
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
        <div className="mt-3 flex items-center gap-2">
          <Button
            aria-label="Ảnh trước"
            disabled={images.length < 2}
            onClick={() => move(-1)}
            size="icon"
            variant="secondary"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
            {images.map((image, imageIndex) => (
              <button
                aria-label={`Xem ảnh ${imageIndex + 1}`}
                aria-pressed={imageIndex === index}
                className={`relative aspect-[16/9] w-24 shrink-0 cursor-pointer overflow-hidden rounded border-2 outline-none focus-visible:ring-2 focus-visible:ring-primary ${imageIndex === index ? "border-primary" : "border-transparent"}`}
                key={`${image.id}-${imageIndex}`}
                onClick={() => setIndex(imageIndex)}
                type="button"
              >
                <ProductImage
                  src={image.url}
                  name={`${name} - ảnh ${imageIndex + 1}`}
                  sizes="96px"
                />
              </button>
            ))}
          </div>
          <Button
            aria-label="Ảnh sau"
            disabled={images.length < 2}
            onClick={() => move(1)}
            size="icon"
            variant="secondary"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
