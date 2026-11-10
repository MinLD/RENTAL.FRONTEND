"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ReviewItem,
  ReviewListPage,
  ReviewSummaryResponse,
} from "@/types/review";
import {
  DEFAULT_REVIEW_PAGE_SIZE,
  createEmptyReviewSummary,
  getListingReviews,
  getReviewSummary,
} from "@/services/review-service";
import { ReviewSummaryCard } from "./review-summary-card";
import { ReviewFilterBar, type ReviewSortOption } from "./review-filter-bar";
import { ReviewItemCard } from "./review-item-card";
import { ReviewWriteDialog } from "./review-write-dialog";

type ProductReviewsTabProps = {
  listingId: string;
  listingName: string;
  isAuthenticated: boolean;
  initialSummary?: ReviewSummaryResponse | null;
  initialReviews?: ReviewListPage | null;
};

export function ProductReviewsTab({
  listingId,
  listingName,
  isAuthenticated,
  initialSummary = null,
  initialReviews = null,
}: ProductReviewsTabProps) {
  const [summary, setSummary] = useState<ReviewSummaryResponse>(() =>
    initialSummary ?? createEmptyReviewSummary("listing", listingId),
  );
  const [reviews, setReviews] = useState<ReviewItem[]>(
    initialReviews?.items ?? [],
  );
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_REVIEW_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(
    initialReviews && initialReviews.totalPages > 0
      ? initialReviews.totalPages
      : 1,
  );
  const [totalCount, setTotalCount] = useState(
    initialReviews?.totalCount ?? initialSummary?.reviewCount ?? 0,
  );

  const [isLoading, setIsLoading] = useState(
    Boolean(!initialSummary || !initialReviews),
  );
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [selectedSort, setSelectedSort] = useState<ReviewSortOption>("newest");
  const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const reloadData = useCallback(() => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Skip client fetch on initial page 1 mount if SSR data was already provided
    if (
      initialSummary &&
      initialReviews &&
      page === 1 &&
      refreshTrigger === 0
    ) {
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    async function fetchData() {
      try {
        const [summaryRes, reviewsRes] = await Promise.all([
          getReviewSummary("listing", listingId),
          getListingReviews(listingId, page, pageSize),
        ]);

        if (isCancelled) return;
        if (summaryRes) {
          setSummary(summaryRes);
        }
        if (reviewsRes) {
          setReviews(reviewsRes.items ?? []);
          setTotalCount(reviewsRes.totalCount ?? summaryRes.reviewCount ?? 0);
          setTotalPages(reviewsRes.totalPages > 0 ? reviewsRes.totalPages : 1);
        }
      } catch {
        // Graceful fallback
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      isCancelled = true;
    };
  }, [
    initialReviews,
    initialSummary,
    listingId,
    page,
    pageSize,
    refreshTrigger,
  ]);

  // Client-side filtering & sorting for the active page
  const displayedReviews = useMemo(() => {
    let result = [...reviews];

    if (selectedStar !== null) {
      result = result.filter((r) => r.rating === selectedStar);
    }

    result.sort((a, b) => {
      if (selectedSort === "highest") {
        return b.rating - a.rating;
      }
      if (selectedSort === "lowest") {
        return a.rating - b.rating;
      }
      const timeA = new Date(
        a.createdAtUtc || a.createdAt || 0,
      ).getTime();
      const timeB = new Date(
        b.createdAtUtc || b.createdAt || 0,
      ).getTime();
      if (selectedSort === "oldest") {
        return timeA - timeB;
      }
      // default newest
      return timeB - timeA;
    });

    return result;
  }, [reviews, selectedStar, selectedSort]);

  return (
    <div className="space-y-6 pt-2">
      {/* 1. Review Summary Card */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-lg ml-auto" />
          </div>
        </div>
      ) : (
        <ReviewSummaryCard
          summary={summary}
          onOpenWriteDialog={() => setIsWriteDialogOpen(true)}
        />
      )}

      {/* 2. Filter & Sort Bar */}
      <ReviewFilterBar
        totalCount={summary.reviewCount || totalCount}
        distribution={summary.ratingDistribution}
        selectedStar={selectedStar}
        onSelectStar={setSelectedStar}
        selectedSort={selectedSort}
        onSelectSort={setSelectedSort}
      />

      {/* 3. Review List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      ) : displayedReviews.length > 0 ? (
        <div className="space-y-4">
          {displayedReviews.map((review, index) => {
            const reviewKey =
              review.id || review.reviewId || `review-${index}`;
            return <ReviewItemCard key={reviewKey} review={review} />;
          })}

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex justify-center pt-4">
              <Pagination aria-label="Phân trang đánh giá">
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
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 px-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="size-6" />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-foreground">
            {selectedStar !== null
              ? `Chưa có đánh giá ${selectedStar} sao nào`
              : "Chưa có đánh giá nào cho thiết bị này"}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {selectedStar !== null
              ? "Hãy thử chọn bộ lọc khác để xem các đánh giá còn lại."
              : "Hãy thuê thiết bị và trở thành người đầu tiên chia sẻ trải nghiệm thực tế nhé!"}
          </p>
          {selectedStar !== null ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSelectedStar(null)}
              className="mt-4 text-xs"
            >
              Xem tất cả đánh giá
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsWriteDialogOpen(true)}
              className="mt-4 text-xs border-primary text-primary hover:bg-primary/5"
            >
              Viết đánh giá đầu tiên
            </Button>
          )}
        </div>
      )}

      {/* 4. Write Review Modal */}
      <ReviewWriteDialog
        listingId={listingId}
        listingName={listingName}
        open={isWriteDialogOpen}
        onOpenChange={setIsWriteDialogOpen}
        isAuthenticated={isAuthenticated}
        onSuccess={reloadData}
      />
    </div>
  );
}
