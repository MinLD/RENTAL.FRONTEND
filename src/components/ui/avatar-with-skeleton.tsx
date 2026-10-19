"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import {
  getMediaOriginalUrl,
  getProductImageSrc,
  isMediaServiceUrl,
  type ProductImageRole,
} from "@/utils/product-image";

type AvatarWithSkeletonProps = {
  alt: string;
  className?: string;
  fallback: ReactNode;
  fallbackClassName?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  role?: ProductImageRole;
  src?: string | null;
};

export function AvatarWithSkeleton({
  alt,
  className,
  fallback,
  fallbackClassName,
  imageClassName,
  loading = "eager",
  role = "thumbnail",
  src,
}: AvatarWithSkeletonProps) {
  const primarySrc = getProductImageSrc(src, role);
  if (!primarySrc) {
    return (
      <Avatar className={className}>
        <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>
      </Avatar>
    );
  }

  const isMedia = isMediaServiceUrl(src);
  const fallbackSrc = isMedia ? getMediaOriginalUrl(src) : null;

  return (
    <LoadingAvatar
      key={primarySrc}
      alt={alt}
      className={className}
      fallback={fallback}
      fallbackClassName={fallbackClassName}
      fallbackSrc={fallbackSrc}
      imageClassName={imageClassName}
      isMedia={isMedia}
      loading={loading}
      primarySrc={primarySrc}
    />
  );
}

function LoadingAvatar({
  alt,
  className,
  fallback,
  fallbackClassName,
  imageClassName,
  loading,
  primarySrc,
  fallbackSrc,
  isMedia,
}: {
  alt: string;
  className?: string;
  fallback: ReactNode;
  fallbackClassName?: string;
  imageClassName?: string;
  loading: "eager" | "lazy";
  primarySrc: string;
  fallbackSrc: string | null;
  isMedia: boolean;
}) {
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [hasAttemptedFallback, setHasAttemptedFallback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleError = useCallback(() => {
    if (isMedia && !hasAttemptedFallback && fallbackSrc && fallbackSrc !== currentSrc) {
      setHasAttemptedFallback(true);
      setCurrentSrc(fallbackSrc);
      setIsLoaded(false);
      return;
    }

    setIsError(true);
  }, [currentSrc, fallbackSrc, hasAttemptedFallback, isMedia]);

  const handleImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      imageRef.current = node;
      if (!node || !currentSrc || !node.complete) {
        return;
      }

      if (node.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        handleError();
      }
    },
    [currentSrc, handleError],
  );

  if (isError) {
    return (
      <Avatar className={className}>
        <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn(className, "bg-transparent")}>
      {!isLoaded ? (
        <Skeleton aria-hidden="true" className="absolute inset-0 rounded-full" />
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
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        ref={handleImageRef}
        src={currentSrc}
      />
    </Avatar>
  );
}
