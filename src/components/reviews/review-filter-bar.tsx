"use client";

import { ChevronDown } from "lucide-react";
import type { ReviewRatingDistribution } from "@/types/review";
import { cn } from "@/utils/cn";

export type ReviewSortOption = "newest" | "oldest" | "highest" | "lowest";

type ReviewFilterBarProps = {
  totalCount: number;
  distribution: ReviewRatingDistribution;
  selectedStar: number | null; // null = all
  onSelectStar: (star: number | null) => void;
  selectedSort: ReviewSortOption;
  onSelectSort: (sort: ReviewSortOption) => void;
};

export function ReviewFilterBar({
  totalCount,
  distribution,
  selectedStar,
  onSelectStar,
  selectedSort,
  onSelectSort,
}: ReviewFilterBarProps) {
  const chips = [
    { label: "Tất cả", value: null, count: totalCount },
    { label: "5 sao", value: 5, count: distribution["5"] || 0 },
    { label: "4 sao", value: 4, count: distribution["4"] || 0 },
    { label: "3 sao", value: 3, count: distribution["3"] || 0 },
    { label: "2 sao", value: 2, count: distribution["2"] || 0 },
    { label: "1 sao", value: 1, count: distribution["1"] || 0 },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 pb-2">
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          const isActive = selectedStar === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSelectStar(chip.value)}
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {chip.label} ({chip.count})
            </button>
          );
        })}
      </div>

      {/* Sort selector */}
      <div className="relative inline-flex items-center shrink-0">
        <select
          value={selectedSort}
          onChange={(e) => onSelectSort(e.target.value as ReviewSortOption)}
          className="appearance-none cursor-pointer rounded-lg border border-border bg-card px-3.5 py-1.5 pr-8 text-xs font-medium text-foreground hover:bg-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          aria-label="Sắp xếp đánh giá"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="highest">Đánh giá cao nhất</option>
          <option value="lowest">Đánh giá thấp nhất</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}
