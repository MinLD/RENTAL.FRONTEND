"use client";

import Image from "next/image";
import { useState } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/utils/cn";

export function ProductImage({
  src,
  name,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px",
  imageClassName,
  loading = "lazy",
  compact = false,
}: {
  src?: string | null;
  name: string;
  sizes?: string;
  imageClassName?: string;
  loading?: "lazy" | "eager";
  compact?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const validSrc =
    src &&
    (/^https?:\/\//i.test(src) ||
      (src.startsWith("/") && !src.startsWith("//")));
  if (!validSrc || src === failedSrc)
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
  return (
    <Image
      alt={name}
      className={cn(
        "object-cover transition-transform duration-300 group-hover:scale-105",
        imageClassName,
      )}
      fill
      loading={loading}
      onError={() => setFailedSrc(src)}
      sizes={sizes}
      src={src}
      unoptimized
    />
  );
}
