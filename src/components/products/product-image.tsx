"use client";

import Image from "next/image";
import { useState } from "react";
import { PackageOpen } from "lucide-react";

export function ProductImage({
  src,
  name,
}: {
  src?: string | null;
  name: string;
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
        <PackageOpen aria-hidden="true" className="size-12 stroke-1" />
        <span className="text-xs">Chưa có hình ảnh</span>
      </div>
    );
  return (
    <Image
      alt={name}
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      fill
      onError={() => setFailedSrc(src)}
      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px"
      src={src}
      unoptimized
    />
  );
}
