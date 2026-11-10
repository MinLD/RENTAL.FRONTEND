"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/reviews/rating-stars";
import { ReviewEditDialog } from "@/components/reviews/review-edit-dialog";
import { ReviewItemCard } from "@/components/reviews/review-item-card";
import { ReviewWithdrawDialog } from "@/components/reviews/review-withdraw-dialog";
import { ReviewWriteDialog } from "@/components/reviews/review-write-dialog";
import type { InitialAccountReviewsData } from "@/services/review-server-service";
import {
  DEFAULT_REVIEW_PAGE_SIZE,
  getMyReputation,
  getMyReviews,
  getPendingReviews,
} from "@/services/review-service";
import type {
  PendingReviewItem,
  RenterReputationResponse,
  ReviewItem,
} from "@/types/review";
import { formatRelativeTime } from "@/utils/review";

type ActiveTab = "written" | "pending";

type AccountReviewsSectionProps = {
  initialData?: InitialAccountReviewsData | null;
};

export function AccountReviewsSection({
  initialData = null,
}: AccountReviewsSectionProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("written");
  const [reputation, setReputation] =
    useState<RenterReputationResponse | null>(initialData?.reputation ?? null);

  const [writtenReviews, setWrittenReviews] = useState<ReviewItem[]>(
    initialData?.myReviews.items ?? [],
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    initialData && initialData.myReviews.totalPages > 0
      ? initialData.myReviews.totalPages
      : 1,
  );
  const [totalWrittenCount, setTotalWrittenCount] = useState(
    initialData?.myReviews.totalCount ?? 0,
  );

  const [pendingItems, setPendingItems] = useState<PendingReviewItem[]>(
    initialData?.pendingReviews.items ?? [],
  );
  const [totalPendingCount, setTotalPendingCount] = useState(
    initialData?.pendingReviews.totalCount ??
      initialData?.pendingReviews.items?.length ??
      0,
  );

  const [isLoading, setIsLoading] = useState(!initialData);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [withdrawingReview, setWithdrawingReview] =
    useState<ReviewItem | null>(null);
  const [writingPendingItem, setWritingPendingItem] =
    useState<PendingReviewItem | null>(null);

  const reloadAll = useCallback(() => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // If SSR initialData is already loaded for page 1 and no manual refresh was triggered, skip client fetch
    if (initialData && page === 1 && refreshTrigger === 0) {
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    async function loadData() {
      try {
        const [myReviewsRes, pendingRes, reputationRes] = await Promise.all([
          getMyReviews(page, DEFAULT_REVIEW_PAGE_SIZE),
          getPendingReviews(1, 50),
          getMyReputation(),
        ]);

        if (isCancelled) return;

        setWrittenReviews(myReviewsRes.items ?? []);
        setTotalWrittenCount(myReviewsRes.totalCount ?? 0);
        setTotalPages(
          myReviewsRes.totalPages > 0 ? myReviewsRes.totalPages : 1,
        );

        setPendingItems(pendingRes.items ?? []);
        setTotalPendingCount(
          pendingRes.totalCount ?? pendingRes.items?.length ?? 0,
        );

        setReputation(reputationRes);
      } catch {
        // Graceful fallback
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [initialData, page, refreshTrigger]);

  const reputationRating =
    reputation?.averageRating ??
    reputation?.score ??
    reputation?.reputationScore ??
    null;
  const reputationReviewsCount =
    reputation?.totalReviews ?? reputation?.reviewCount ?? 0;

  return (
    <section className="flex min-h-[400px] flex-col rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Đánh giá & Uy tín của tôi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý các đánh giá thiết bị bạn đã gửi và theo dõi điểm uy tín khách thuê.
          </p>
        </div>

        {/* Renter Reputation Summary Pill */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-2.5">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <Award className="size-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">
                Điểm uy tín người thuê:
              </span>
              {reputationRating !== null && reputationRating > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
                  {Number(reputationRating).toFixed(1)}
                  <Star
                    className="size-3.5 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  <span>Tài khoản tích cực</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {reputationReviewsCount > 0
                ? `Dựa trên ${reputationReviewsCount} đánh giá từ đối tác`
                : `Đã viết ${totalWrittenCount} đánh giá thiết bị`}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-navigation Filter Bar (reusing ReviewFilterBar pill design) */}
      <div
        role="tablist"
        aria-label="Phân loại đánh giá"
        className="mt-5 flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "written"}
          onClick={() => setActiveTab("written")}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "written"
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
          }`}
        >
          <MessageSquare className="size-3.5" aria-hidden="true" />
          <span>Đã đánh giá ({totalWrittenCount})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "pending"
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
          }`}
        >
          <Clock className="size-3.5" aria-hidden="true" />
          <span>Chờ đánh giá ({totalPendingCount})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-5 flex-1">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : activeTab === "written" ? (
          writtenReviews.length > 0 ? (
            <div className="space-y-4">
              {writtenReviews.map((review, idx) => {
                const key = review.id || review.reviewId || `my-review-${idx}`;
                return (
                  <ReviewItemCard
                    key={key}
                    review={review}
                    editable={true}
                    onEdit={(r) => setEditingReview(r)}
                    onWithdraw={(r) => setWithdrawingReview(r)}
                  />
                );
              })}

              {totalPages > 1 ? (
                <div className="flex justify-center pt-4">
                  <Pagination aria-label="Phân trang đánh giá của tôi">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MessageSquare className="size-6" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-foreground">
                Bạn chưa viết đánh giá nào
              </h2>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Sau khi hoàn tất đơn thuê thiết bị, bạn có thể chia sẻ trải nghiệm và đánh giá chất lượng tại đây.
              </p>
              {totalPendingCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setActiveTab("pending")}
                  className="mt-4 text-xs border-primary text-primary hover:bg-primary/5"
                >
                  Xem {totalPendingCount} mục chờ đánh giá
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="mt-4 text-xs"
                >
                  <Link href="/orders">Xem lịch sử đơn thuê</Link>
                </Button>
              )}
            </div>
          )
        ) : pendingItems.length > 0 ? (
          <div className="space-y-3">
            {pendingItems.map((item) => {
              const itemName =
                item.listingName ||
                item.equipmentName ||
                item.title ||
                `Thiết bị đơn #${item.orderId.slice(0, 8)}`;
              const listingId = item.listingId || item.equipmentListingId;
              const completedDate = item.completedAtUtc || item.completedAt;

              return (
                <div
                  key={`${item.orderId}-${item.itemId}`}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {itemName}
                      </h3>
                      {listingId ? (
                        <Link
                          href={`/products/${encodeURIComponent(listingId)}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <span>Chi tiết</span>
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Mã đơn: #{item.orderId.slice(0, 8)}</span>
                      {completedDate ? (
                        <>
                          <span aria-hidden="true">•</span>
                          <span>
                            Hoàn tất {formatRelativeTime(completedDate)}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <div className="pt-0.5">
                      <RatingStars rating={5} size="sm" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setWritingPendingItem(item)}
                      className="border-primary text-xs text-primary hover:bg-primary/5"
                    >
                      <Star
                        className="mr-1.5 size-3.5 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                      <span>Viết đánh giá</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-foreground">
              Không có mục thuê nào đang chờ đánh giá
            </h2>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Bạn đã đánh giá tất cả các thiết bị đã thuê hoặc chưa có đơn thuê mới hoàn tất.
            </p>
          </div>
        )}
      </div>

      {/* Edit Review Dialog */}
      <ReviewEditDialog
        review={editingReview}
        open={editingReview !== null}
        onOpenChange={(open) => {
          if (!open) setEditingReview(null);
        }}
        onSuccess={reloadAll}
      />

      {/* Withdraw Review Dialog */}
      <ReviewWithdrawDialog
        review={withdrawingReview}
        open={withdrawingReview !== null}
        onOpenChange={(open) => {
          if (!open) setWithdrawingReview(null);
        }}
        onSuccess={reloadAll}
      />

      {/* Write Review Dialog for Pending Item */}
      {writingPendingItem ? (
        <ReviewWriteDialog
          orderId={writingPendingItem.orderId}
          itemId={writingPendingItem.itemId}
          listingId={
            writingPendingItem.listingId ||
            writingPendingItem.equipmentListingId
          }
          listingName={
            writingPendingItem.listingName ||
            writingPendingItem.equipmentName ||
            writingPendingItem.title ||
            "Thiết bị đã thuê"
          }
          open={writingPendingItem !== null}
          onOpenChange={(open) => {
            if (!open) setWritingPendingItem(null);
          }}
          isAuthenticated={true}
          onSuccess={() => {
            setWritingPendingItem(null);
            setActiveTab("written");
            reloadAll();
          }}
        />
      ) : null}
    </section>
  );
}
