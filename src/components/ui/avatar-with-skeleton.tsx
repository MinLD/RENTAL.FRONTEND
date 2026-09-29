"use client";

import { useCallback, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

type AvatarWithSkeletonProps = {
  alt: string;
  className?: string;
  fallback: string;
  fallbackClassName?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  src?: string | null;
};

export function AvatarWithSkeleton({
  alt,
  className,
  fallback,
  fallbackClassName,
  imageClassName,
  loading = "eager",
  src,
}: AvatarWithSkeletonProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const normalizedSrc = src || null;
  const isError = Boolean(normalizedSrc && failedSrc === normalizedSrc);
  const isLoaded = Boolean(normalizedSrc && loadedSrc === normalizedSrc);
  const shouldLoadImage = Boolean(normalizedSrc) && !isError;
  const handleImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || !normalizedSrc || !node.complete) {
        return;
      }

      if (node.naturalWidth > 0) {
        setLoadedSrc(normalizedSrc);
      } else {
        setFailedSrc(normalizedSrc);
      }
    },
    [normalizedSrc],
  );

  return (
    <Avatar
      className={cn(
        className,
        shouldLoadImage ? "bg-transparent" : undefined,
      )}
    >
      {shouldLoadImage ? (
        <>
          {!isLoaded ? (
            <Skeleton
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={alt}
            className={cn(
              "relative z-10 aspect-square size-full object-cover transition-opacity",
              isLoaded ? "opacity-100" : "opacity-0",
              imageClassName,
            )}
            loading={loading}
            onError={() => setFailedSrc(normalizedSrc)}
            onLoad={() => setLoadedSrc(normalizedSrc)}
            ref={handleImageRef}
            src={normalizedSrc ?? undefined}
          />
        </>
      ) : (
        <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
}
