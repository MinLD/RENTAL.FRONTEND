"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";

type RatingStarsProps = {
  rating: number;
  maxStars?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
};

const SIZE_MAP = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
  xl: "size-7",
};

export function RatingStars({
  rating,
  maxStars = 5,
  size = "md",
  className,
  interactive = false,
  onRatingChange,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const activeRating = hoverRating !== null ? hoverRating : rating;
  const iconSize = SIZE_MAP[size];

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${rating} trên ${maxStars} sao`}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = activeRating >= starValue;
        const isHalf =
          !isFilled && activeRating >= starValue - 0.5 && activeRating < starValue;

        if (interactive) {
          return (
            <button
              type="button"
              key={starValue}
              className="cursor-pointer p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              onClick={() => onRatingChange?.(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(null)}
              aria-label={`${starValue} sao`}
            >
              <Star
                className={cn(
                  iconSize,
                  "transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/40",
                )}
              />
            </button>
          );
        }

        return (
          <div key={starValue} className="relative inline-flex items-center">
            {isHalf ? (
              <div className="relative">
                <Star
                  className={cn(
                    iconSize,
                    "fill-transparent text-muted-foreground/30",
                  )}
                />
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className={cn(iconSize, "fill-amber-400 text-amber-400")} />
                </div>
              </div>
            ) : (
              <Star
                className={cn(
                  iconSize,
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/30",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
