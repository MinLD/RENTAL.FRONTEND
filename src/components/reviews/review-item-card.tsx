"use client";

import Image from "next/image";
import { useState } from "react";
import { Flag, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
};

export function ReviewItemCard({ review }: ReviewItemCardProps) {
  const reviewId = getReviewId(review);
  const authorName = getReviewAuthorName(review);
  const avatarUrl = getReviewAuthorAvatar(review);
  const initials = getReviewInitials(authorName);
  const dateFormatted = getReviewDate(review);
  const comment = getReviewComment(review);
  const mediaList = getReviewMediaList(review);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [helpfulCount, setHelpfulCount] = useState<number>(
    review.helpfulCount ?? 0,
  );
  const [hasLiked, setHasLiked] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);

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
      <div className="flex items-start justify-between gap-4">
        {/* Author info */}
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-border">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={authorName} />
            ) : null}
            <AvatarFallback className="bg-amber-100 font-semibold text-amber-800 text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {authorName}
            </h4>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <RatingStars rating={review.rating} size="sm" />
              {dateFormatted ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{dateFormatted}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Report button */}
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
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Footer: Helpful button */}
      <div className="mt-4 flex items-center justify-end border-t border-border/50 pt-3">
        <button
          type="button"
          onClick={handleHelpfulClick}
          className={`cursor-pointer inline-flex items-center gap-1.5 text-xs transition-colors ${
            hasLiked
              ? "font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Đánh giá hữu ích"
        >
          <ThumbsUp className={`size-3.5 ${hasLiked ? "fill-primary" : ""}`} />
          <span>Hữu ích {helpfulCount > 0 ? `(${helpfulCount})` : ""}</span>
        </button>
      </div>

      {/* Lightbox for full image preview */}
      <ReviewMediaLightbox
        mediaList={mediaList}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />

      {/* Report Review Dialog */}
      <ReviewReportDialog
        reviewId={reviewId}
        authorName={authorName}
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        onSuccess={() => setHasReported(true)}
      />
    </div>
  );
}
