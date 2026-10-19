"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PRODUCT_CARD_IMAGE_SIZES,
  PRODUCT_IMAGE_LOAD_TIMEOUT_MS,
} from "@/config/product-images";
import { cn } from "@/utils/cn";
import {
  getMediaOriginalUrl,
  getProductImageSrc,
  isMediaServiceUrl,
  shouldBypassProductImageOptimization,
  type ProductImageRole,
} from "@/utils/product-image";

type ProductImageProps = {
  src?: string | null;
  name: string;
  role?: ProductImageRole;
  sizes?: string;
  imageClassName?: string;
  loading?: "lazy" | "eager";
  compact?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  fallback?: ReactNode;
  maxRetries?: number;
};

export function ProductImage({
  src,
  role = "medium",
  ...props
}: ProductImageProps) {
  const primarySrc = getProductImageSrc(src, role);
  if (!primarySrc) return <ProductImageFallback {...props} />;

  const isMedia = isMediaServiceUrl(src);
  const fallbackSrc = isMedia ? getMediaOriginalUrl(src) : null;

  // Remount state khi primarySrc thay đổi để reset fallback/retry
  return (
    <LoadingProductImage
      key={primarySrc}
      fallbackSrc={fallbackSrc}
      isMediaService={isMedia}
      primarySrc={primarySrc}
      {...props}
    />
  );
}

function ProductImageFallback({
  name,
  compact = false,
  fallback,
  failed = false,
}: Pick<ProductImageProps, "name" | "compact" | "fallback"> & { failed?: boolean }) {
  return (
    <div
      aria-label={fallback != null ? name : `${failed ? "Không tải được ảnh" : "Chưa có ảnh"} ${name}`}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background text-muted-foreground/50"
      role="img"
    >
      {fallback ?? (
        <>
          <PackageOpen
            aria-hidden="true"
            className={cn(compact ? "size-6" : "size-12", "stroke-1")}
          />
          {!compact ? <span className="text-xs">{failed ? "Không tải được ảnh" : "Chưa có hình ảnh"}</span> : null}
        </>
      )}
    </div>
  );
}

function LoadingProductImage({
  primarySrc,
  fallbackSrc,
  isMediaService,
  name,
  sizes = PRODUCT_CARD_IMAGE_SIZES,
  imageClassName,
  loading = "lazy",
  compact = false,
  fetchPriority,
  fallback,
  maxRetries = 0,
}: Omit<ProductImageProps, "src"> & {
  primarySrc: string;
  fallbackSrc: string | null;
  isMediaService: boolean;
}) {
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [hasAttemptedFallback, setHasAttemptedFallback] = useState(false);
  const [useDirectOriginal, setUseDirectOriginal] = useState(false);
  const [status, setStatus] = useState<"loading" | "slow" | "loaded" | "error">("loading");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleImageRef = useCallback((image: HTMLImageElement | null) => {
    imageRef.current = image;
    if (image?.complete && image.naturalWidth > 0) {
      setStatus("loaded");
    }
  }, []);

  const handleImageError = useCallback(() => {
    // Try the original through Next.js first; if optimization fails, allow one
    // direct original request before displaying an error.
    if (isMediaService && !hasAttemptedFallback && fallbackSrc && fallbackSrc !== currentSrc) {
      setHasAttemptedFallback(true);
      setCurrentSrc(fallbackSrc);
      setStatus("loading");
      return;
    }

    if (hasAttemptedFallback && !useDirectOriginal) {
      setUseDirectOriginal(true);
      setStatus("loading");
      return;
    }

    setStatus("error");
  }, [currentSrc, fallbackSrc, hasAttemptedFallback, isMediaService, useDirectOriginal]);

  useEffect(() => {
    if (status !== "loading") return;
    let timer: NodeJS.Timeout | undefined;
    const startTimeout = () => {
      if (!timer) {
        timer = setTimeout(() => {
          // A slow connection is not an image error. Keep the image mounted so
          // a response arriving after the timeout can still finish loading.
          setStatus((current) => current === "loading" ? "slow" : current);
        }, PRODUCT_IMAGE_LOAD_TIMEOUT_MS);
      }
    };

    let observer: IntersectionObserver | undefined;
    if (loading === "eager" || typeof IntersectionObserver === "undefined") {
      startTimeout();
    } else if (imageRef.current) {
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
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [currentSrc, loading, status, useDirectOriginal]);

  useEffect(() => {
    if (status !== "error" || retryAttempt >= maxRetries) return;
    const timer = setTimeout(() => {
      setRetryAttempt((attempt) => attempt + 1);
      setStatus("loading");
    }, 1000 * 2 ** retryAttempt);
    return () => clearTimeout(timer);
  }, [maxRetries, retryAttempt, status]);

  if (status === "error") {
    if (retryAttempt < maxRetries) {
      return (
        <div aria-busy="true" className="absolute inset-0">
          <Skeleton aria-hidden="true" className="absolute inset-0 rounded-none" />
        </div>
      );
    }
    return (
      <ProductImageFallback name={name} compact={compact} fallback={fallback} failed />
    );
  }

  return (
    <div aria-busy={status === "loading" || status === "slow"} className="absolute inset-0">
      {status === "loading" || status === "slow" ? (
        <Skeleton aria-hidden="true" className="absolute inset-0 rounded-none" />
      ) : null}
      {status === "slow" ? (
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-muted-foreground" role="status">
          Ảnh đang tải chậm…
        </span>
      ) : null}
      <Image
        key={`${currentSrc}-${retryAttempt}-${useDirectOriginal}`}
        alt={name}
        className={cn(
          "object-cover transition-[opacity,transform,translate,scale,rotate] duration-300 group-hover:scale-105 motion-reduce:transition-none",
          status === "loaded" ? "opacity-100" : "opacity-0",
          imageClassName,
        )}
        fetchPriority={fetchPriority}
        fill
        loading={loading}
        onError={handleImageError}
        onLoad={() => setStatus("loaded")}
        quality={75}
        ref={handleImageRef}
        sizes={sizes}
        src={currentSrc}
        // Missing variants fall back to the original via Next.js optimization,
        // so cards do not download full-size originals on slow connections.
        unoptimized={shouldBypassProductImageOptimization(currentSrc) && (!hasAttemptedFallback || useDirectOriginal)}
      />
    </div>
  );
}
