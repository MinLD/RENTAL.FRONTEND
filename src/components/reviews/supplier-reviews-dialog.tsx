"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_REVIEW_PAGE_SIZE,
  createEmptyReviewSummary,
  getReviewSummary,
  getSupplierReviews,
} from "@/services/review-service";
import type { ReviewItem, ReviewSummaryResponse } from "@/types/review";
import { RatingStars } from "./rating-stars";
import { ReviewFilterBar, type ReviewSortOption } from "./review-filter-bar";
import { ReviewItemCard } from "./review-item-card";

type SupplierReviewsDialogProps = {
  supplierId: string;
  supplierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SupplierReviewsDialog({
  supplierId,
  supplierName,
  open,
  onOpenChange,
}: SupplierReviewsDialogProps) {
  const [summary, setSummary] = useState<ReviewSummaryResponse>(() =>
    createEmptyReviewSummary("supplier", supplierId),
  );
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [selectedSort, setSelectedSort] = useState<ReviewSortOption>("newest");

  useEffect(() => {
    if (!open || !supplierId) return;

    let isCancelled = false;
    setIsLoading(true);

    async function fetchSupplierReviews() {
      try {
        const [summaryRes, reviewsRes] = await Promise.all([
          getReviewSummary("supplier", supplierId),
          getSupplierReviews(supplierId, page, DEFAULT_REVIEW_PAGE_SIZE),
        ]);

        if (isCancelled) return;
        if (summaryRes) {
          setSummary(summaryRes);
        }
        if (reviewsRes) {
          setReviews(reviewsRes.items ?? []);
          setTotalCount(reviewsRes.totalCount ?? summaryRes?.reviewCount ?? 0);
          setTotalPages(reviewsRes.totalPages > 0 ? reviewsRes.totalPages : 1);
        }
      } catch {
        // Fallback
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchSupplierReviews();

    return () => {
      isCancelled = true;
    };
  }, [open, supplierId, page]);

  const displayedReviews = useMemo(() => {
    let result = [...reviews];
    if (selectedStar !== null) {
      result = result.filter((r) => r.rating === selectedStar);
    }

    result.sort((a, b) => {
      if (selectedSort === "highest") return b.rating - a.rating;
      if (selectedSort === "lowest") return a.rating - b.rating;
      const timeA = new Date(a.createdAtUtc || a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAtUtc || b.createdAt || 0).getTime();
      return selectedSort === "oldest" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [reviews, selectedStar, selectedSort]);

  const avgRating =
    summary.averageRating !== null && summary.averageRating > 0
      ? Number(summary.averageRating).toFixed(1)
      : "0.0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto p-6 sm:rounded-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <span>Đánh giá đối tác: {supplierName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tổng hợp đánh giá công khai từ khách hàng đã thuê thiết bị của đối tác này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Compact Supplier Rating Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-extrabold text-foreground">
                {avgRating}
                <span className="text-sm font-normal text-muted-foreground">
                  /5
                </span>
              </div>
              <div>
                <RatingStars
                  rating={summary.averageRating ?? 0}
                  size="md"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {summary.reviewCount || totalCount} đánh giá khách hàng
                </p>
              </div>
            </div>
          </div>

          {/* Filter & Sort Bar */}
          <ReviewFilterBar
            totalCount={summary.reviewCount || totalCount}
            distribution={summary.ratingDistribution}
            selectedStar={selectedStar}
            onSelectStar={setSelectedStar}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
          />

          {/* Reviews List */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : displayedReviews.length > 0 ? (
            <div className="space-y-3">
              {displayedReviews.map((review, index) => {
                const key =
                  review.id || review.reviewId || `supplier-rev-${index}`;
                return <ReviewItemCard key={key} review={review} />;
              })}

              {totalPages > 1 ? (
                <div className="flex justify-center pt-3">
                  <Pagination aria-label="Phân trang đánh giá đối tác">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          aria-label="Trang trước"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          type="button"
                        >
                          <span>Trước</span>
                        </PaginationPrevious>
                      </PaginationItem>
                      <PaginationItem>
                        <span className="whitespace-nowrap px-4 text-xs font-medium text-muted-foreground">
                          Trang {page} / {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          aria-label="Trang sau"
                          disabled={page >= totalPages}
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          type="button"
                        >
                          <span>Sau</span>
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MessageSquare className="size-5" aria-hidden="true" />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-foreground">
                {selectedStar !== null
                  ? `Chưa có đánh giá ${selectedStar} sao nào`
                  : "Đối tác chưa có đánh giá nào"}
              </h4>
              {selectedStar !== null ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedStar(null)}
                  className="mt-3 text-xs"
                >
                  Xem tất cả đánh giá
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
