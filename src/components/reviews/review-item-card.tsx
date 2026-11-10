"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Flag, Pencil, RotateCcw, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getReviewMediaAccess } from "@/services/review-service";
import type { ReviewItem } from "@/types/review";
import {
  getReviewAuthorAvatar,
  getReviewAuthorName,
  getReviewComment,
  getReviewDate,
  getReviewId,
  getReviewInitials,
  getReviewMediaList,
} from "@/utils/review";
import { RatingStars } from "./rating-stars";
import { ReviewMediaLightbox } from "./review-media-lightbox";
import { ReviewReportDialog } from "./review-report-dialog";

type ReviewItemCardProps = {
  review: ReviewItem;
  editable?: boolean;
  onEdit?: (review: ReviewItem) => void;
  onWithdraw?: (review: ReviewItem) => void;
};

function getStatusBadge(status?: string | null) {
  const normalized = (status || "Visible").toLowerCase();
  if (normalized === "withdrawn") {
    return {
      label: "Đã thu hồi",
      className: "border-border bg-muted text-muted-foreground",
    };
  }
  if (normalized === "hidden") {
    return {
      label: "Đã ẩn bởi QTV",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }
  return {
    label: "Đang hiển thị",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  };
}

export function ReviewItemCard({
  review,
  editable = false,
  onEdit,
  onWithdraw,
}: ReviewItemCardProps) {
  const reviewId = getReviewId(review);
  const authorName = getReviewAuthorName(review);
  const avatarUrl = getReviewAuthorAvatar(review);
  const initials = getReviewInitials(authorName);
  const dateFormatted = getReviewDate(review);
  const comment = getReviewComment(review);
  const baseMediaList = getReviewMediaList(review);

  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [helpfulCount, setHelpfulCount] = useState<number>(
    review.helpfulCount ?? 0,
  );
  const [hasLiked, setHasLiked] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const mediaList = baseMediaList.map((m) => ({
    ...m,
    previewUrl: resolvedUrls[m.mediaId] || m.previewUrl,
  }));

  const targetListingId = review.listingId || review.equipmentListingId;
  const targetListingName = review.listingName || review.equipmentName;
  const isWithdrawn = (review.status || "").toLowerCase() === "withdrawn";
  const statusBadge = getStatusBadge(review.status);

  const handleMediaError = async (mediaId: string) => {
    if (!reviewId || !mediaId || resolvedUrls[mediaId]) return;
    const accessUrl = await getReviewMediaAccess(reviewId, mediaId);
    if (accessUrl) {
      setResolvedUrls((prev) => ({ ...prev, [mediaId]: accessUrl }));
    }
  };

  const handleHelpfulClick = () => {
    if (hasLiked) {
      setHelpfulCount((prev) => Math.max(0, prev - 1));
      setHasLiked(false);
    } else {
      setHelpfulCount((prev) => prev + 1);
      setHasLiked(true);
      toast.success("Cảm ơn bạn đã phản hồi đánh giá này!");
    }
  };

  const handleOpenReportDialog = () => {
    if (!reviewId) {
      toast.error("Không tìm thấy mã đánh giá.");
      return;
    }
    setIsReportDialogOpen(true);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-border/80">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Author / Equipment info */}
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-border">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={authorName} />
            ) : null}
            <AvatarFallback className="bg-amber-100 text-sm font-semibold text-amber-800">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {editable && targetListingName ? targetListingName : authorName}
              </h4>
              {editable ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <RatingStars rating={review.rating} size="sm" />
              {dateFormatted ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{dateFormatted}</span>
                </>
              ) : null}
              {targetListingId ? (
                <>
                  <span aria-hidden="true">•</span>
                  <Link
                    href={`/products/${encodeURIComponent(targetListingId)}`}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <span>
                      {!editable && targetListingName
                        ? targetListingName
                        : "Xem thiết bị"}
                    </span>
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Actions: Editable controls OR Report button */}
        {editable ? (
          !isWithdrawn ? (
            <div className="flex items-center gap-2">
              {onEdit ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(review)}
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
                  aria-label={`Chỉnh sửa đánh giá ${targetListingName || reviewId}`}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  <span>Sửa</span>
                </Button>
              ) : null}
              {onWithdraw ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onWithdraw(review)}
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Thu hồi đánh giá ${targetListingName || reviewId}`}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span>Thu hồi</span>
                </Button>
              ) : null}
            </div>
          ) : null
        ) : (
          <button
            type="button"
            onClick={handleOpenReportDialog}
            disabled={hasReported}
            className={`inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-lg p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              hasReported
                ? "cursor-default text-destructive/60"
                : "text-muted-foreground/60 hover:bg-muted hover:text-destructive"
            }`}
            aria-label={
              hasReported
                ? `Đã báo cáo đánh giá của ${authorName}`
                : `Báo cáo đánh giá của ${authorName}`
            }
          >
            <Flag
              className={`size-3.5 ${hasReported ? "fill-destructive/30" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Review content */}
      {comment ? (
        <p className="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {comment}
        </p>
      ) : null}

      {/* Media attachments */}
      {mediaList.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {mediaList.map((media, index) => (
            <button
              key={`${media.mediaId}-${index}`}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group relative size-20 cursor-pointer overflow-hidden rounded-xl border border-border bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Xem ảnh đính kèm ${index + 1}`}
            >
              <Image
                src={media.previewUrl}
                alt={`Ảnh đánh giá ${index + 1}`}
                fill
                unoptimized
                onError={() => void handleMediaError(media.mediaId)}
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Footer: Helpful button (only on public view) */}
      {!editable ? (
        <div className="mt-4 flex items-center justify-end border-t border-border/50 pt-3">
          <button
            type="button"
            onClick={handleHelpfulClick}
            className={`inline-flex cursor-pointer items-center gap-1.5 text-xs transition-colors ${
              hasLiked
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Đánh giá hữu ích"
          >
            <ThumbsUp
              className={`size-3.5 ${hasLiked ? "fill-primary" : ""}`}
              aria-hidden="true"
            />
            <span>Hữu ích {helpfulCount > 0 ? `(${helpfulCount})` : ""}</span>
          </button>
        </div>
      ) : null}

      {/* Lightbox for full image preview */}
      <ReviewMediaLightbox
        mediaList={mediaList}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />

      {/* Report Review Dialog */}
      {!editable ? (
        <ReviewReportDialog
          reviewId={reviewId}
          authorName={authorName}
          open={isReportDialogOpen}
          onOpenChange={setIsReportDialogOpen}
          onSuccess={() => setHasReported(true)}
        />
      ) : null}
    </div>
  );
}
