"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewSummaryResponse } from "@/types/review";
import { calculateStarPercentage } from "@/utils/review";
import { RatingStars } from "./rating-stars";

type ReviewSummaryCardProps = {
  summary: ReviewSummaryResponse;
  onOpenWriteDialog: () => void;
};

export function ReviewSummaryCard({
  summary,
  onOpenWriteDialog,
}: ReviewSummaryCardProps) {
  const average = summary.averageRating ?? 0;
  const total = summary.reviewCount;
  const distribution = summary.ratingDistribution || {
    "5": 0,
    "4": 0,
    "3": 0,
    "2": 0,
    "1": 0,
  };

  const starLevels = [5, 4, 3, 2, 1] as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: Score & Stars */}
        <div className="flex flex-col items-start gap-2 md:w-56">
          <h3 className="text-base font-semibold text-foreground">
            Đánh giá khách hàng
          </h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {total > 0 ? average.toFixed(1) : "0.0"}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              / 5
            </span>
          </div>
          <RatingStars rating={average} size="md" />
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `${total} đánh giá` : "Chưa có đánh giá nào"}
          </p>
        </div>

        {/* Center: Rating breakdown histogram */}
        <div className="flex-1 max-w-md space-y-2">
          {starLevels.map((stars) => {
            const count = distribution[String(stars)] || 0;
            const percentage = calculateStarPercentage(count, total);

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 shrink-0 font-medium text-muted-foreground">
                  {stars} sao
                </span>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-muted-foreground">
                  {count} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Write review button */}
        <div className="flex items-center justify-start md:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onOpenWriteDialog}
            className="h-10 cursor-pointer gap-2 rounded-lg border-primary text-primary hover:bg-primary/5 hover:text-primary font-medium px-5"
          >
            <Pencil className="size-4 text-primary" />
            <span>Viết đánh giá</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
