"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getReviewSummary } from "@/services/review-service";
import type { ReviewSummaryResponse } from "@/types/review";
import { cn } from "@/utils/cn";

type ProductCardRatingProps = {
  listingId: string;
  className?: string;
};

export function ProductCardRating({
  listingId,
  className,
}: ProductCardRatingProps) {
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    getReviewSummary("listing", listingId)
      .then((res) => {
        if (isMounted) setSummary(res);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  if (!summary || summary.reviewCount === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-[11px] text-muted-foreground/70",
          className,
        )}
      >
        <Star className="size-3 text-muted-foreground/30 fill-transparent" />
        <span>Chưa có đánh giá</span>
      </div>
    );
  }

  const average = summary.averageRating ?? 5.0;

  return (
    <div
      className={cn("flex items-center gap-1.5 text-[11px]", className)}
      title={`${average.toFixed(1)} sao trên ${summary.reviewCount} đánh giá`}
    >
      <div className="flex items-center gap-0.5 text-amber-500">
        <Star className="size-3 fill-amber-400 text-amber-400" />
        <span className="font-bold text-foreground">
          {average.toFixed(1)}
        </span>
      </div>
      <span className="text-muted-foreground">
        ({summary.reviewCount})
      </span>
    </div>
  );
}
