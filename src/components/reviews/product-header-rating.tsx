"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getReviewSummary } from "@/services/review-service";
import type { ReviewSummaryResponse } from "@/types/review";

export function ProductHeaderRating({
  listingId,
  initialSummary = null,
}: {
  listingId: string;
  initialSummary?: ReviewSummaryResponse | null;
}) {
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(
    initialSummary,
  );

  useEffect(() => {
    if (initialSummary) return;
    let isMounted = true;
    getReviewSummary("listing", listingId)
      .then((res) => {
        if (isMounted) setSummary(res);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [initialSummary, listingId]);

  if (!summary || summary.reviewCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Star className="size-3.5 fill-muted-foreground/30 text-muted-foreground/30" />
        <span>Chưa có đánh giá</span>
      </span>
    );
  }

  const average = summary.averageRating ?? 5.0;

  return (
    <span className="inline-flex items-center gap-1 font-medium text-amber-500">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-foreground">{average.toFixed(1)}</span>
      <span className="text-muted-foreground">({summary.reviewCount} đánh giá)</span>
    </span>
  );
}
