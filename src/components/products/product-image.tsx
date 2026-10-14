"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { PackageOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PRODUCT_CARD_IMAGE_SIZES,
  PRODUCT_IMAGE_LOAD_TIMEOUT_MS,
} from "@/config/product-images";
import { cn } from "@/utils/cn";
import { getProductImageSrc } from "@/utils/product-image";

type ProductImageProps = {
  src?: string | null;
  name: string;
  sizes?: string;
  imageClassName?: string;
  loading?: "lazy" | "eager";
  compact?: boolean;
  fetchPriority?: "high" | "low" | "auto";
};

export function ProductImage({
  src,
  ...props
}: ProductImageProps) {
  const normalizedSrc = getProductImageSrc(src);
  if (!normalizedSrc) return <ProductImageFallback {...props} />;
  // Remount only the image state when its source changes, including A → B → A.
  return (
    <LoadingProductImage key={normalizedSrc} src={normalizedSrc} {...props} />
  );
}

function ProductImageFallback({
  name,
  compact = false,
}: Pick<ProductImageProps, "name" | "compact">) {
  return (
    <div
      aria-label={`Chưa có ảnh ${name}`}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background text-muted-foreground/50"
      role="img"
    >
      <PackageOpen
        aria-hidden="true"
        className={cn(compact ? "size-6" : "size-12", "stroke-1")}
      />
      {!compact ? <span className="text-xs">Chưa có hình ảnh</span> : null}
    </div>
  );
}

function LoadingProductImage({
  src,
  name,
  sizes = PRODUCT_CARD_IMAGE_SIZES,
  imageClassName,
  loading = "lazy",
  compact = false,
  fetchPriority,
}: Omit<ProductImageProps, "src"> & { src: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const imageRef = useRef<HTMLImageElement | null>(null);
  const handleImageRef = useCallback((image: HTMLImageElement | null) => {
    imageRef.current = image;
    // A cached image can finish before hydration attaches load/error handlers.
    if (image?.complete) {
      setStatus(image.naturalWidth > 0 ? "loaded" : "error");
    }
  }, []);

  useEffect(() => {
    if (status !== "loading") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startTimeout = () => {
      if (!timer) {
        timer = setTimeout(() => setStatus("error"), PRODUCT_IMAGE_LOAD_TIMEOUT_MS);
      }
    };
    let observer: IntersectionObserver | undefined;
    if (loading === "eager" || typeof IntersectionObserver === "undefined") {
      startTimeout();
    } else if (imageRef.current) {
      // Offscreen lazy images must not expire before the browser starts them.
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            startTimeout();
            observer?.disconnect();
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(imageRef.current);
    }
    return () => {
      if (timer) clearTimeout(timer);
      observer?.disconnect();
    };
  }, [loading, status]);

  if (status === "error") {
    return <ProductImageFallback name={name} compact={compact} />;
  }
  return (
    <div aria-busy={status === "loading"} className="absolute inset-0">
      {status === "loading" ? (
        <Skeleton aria-hidden="true" className="absolute inset-0 rounded-none" />
      ) : null}
      <Image
        alt={name}
        className={cn(
          "object-cover transition-[opacity,transform,translate,scale,rotate] duration-300 group-hover:scale-105 motion-reduce:transition-none",
          status === "loaded" ? "opacity-100" : "opacity-0",
          imageClassName,
        )}
        fill
        fetchPriority={fetchPriority}
        loading={loading}
        onError={() => setStatus("error")}
        onLoad={() => setStatus("loaded")}
        quality={75}
        ref={handleImageRef}
        sizes={sizes}
        src={src}
      />
    </div>
  );
}
