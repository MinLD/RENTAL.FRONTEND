"use client";

import { useEffect, useId, useState } from "react";
import { ImagePlus, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/services/api-error";
import {
  getReviewDetail,
  getReviewMediaAccess,
  updateReviewWithMedia,
} from "@/services/review-service";
import type { ReviewItem } from "@/types/review";
import {
  getReviewComment,
  getReviewId,
  getReviewMediaList,
} from "@/utils/review";
import { RatingStars } from "./rating-stars";

const RATING_LABELS: Record<number, string> = {
  1: "Rất không hài lòng",
  2: "Không hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Rất hài lòng & Tuyệt vời",
};

type MediaDraftItem = {
  mediaId: string;
  previewUrl: string;
  isExisting: boolean;
};

type ReviewEditDialogProps = {
  review: ReviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ReviewEditDialog({
  review,
  open,
  onOpenChange,
  onSuccess,
}: ReviewEditDialogProps) {
  const baseId = useId();
  const commentInputId = `${baseId}-edit-comment`;
  const commentHintId = `${baseId}-edit-comment-hint`;

  const reviewId = review ? getReviewId(review) : "";
  const [rating, setRating] = useState<number>(review?.rating ?? 5);
  const [comment, setComment] = useState<string>(
    review ? getReviewComment(review) : "",
  );
  const [etag, setEtag] = useState<string | null>(review?.etag ?? null);
  const [mediaList, setMediaList] = useState<MediaDraftItem[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !review) return;

    const id = getReviewId(review);
    setRating(review.rating || 5);
    setComment(getReviewComment(review));
    setEtag(review.etag ?? null);
    setRemovedMediaIds([]);

    const initialMedia = getReviewMediaList(review).map((m) => ({
      mediaId: m.mediaId,
      previewUrl: m.previewUrl,
      isExisting: true,
    }));
    setMediaList(initialMedia);

    if (!id) return;

    let isMounted = true;
    setIsLoadingDetail(true);

    getReviewDetail(id)
      .then(async ({ review: detailReview, etag: detailEtag }) => {
        if (!isMounted) return;
        setRating(detailReview.rating || review.rating || 5);
        setComment(getReviewComment(detailReview) || getReviewComment(review));
        if (detailEtag) {
          setEtag(detailEtag);
        }

        const rawMedia = getReviewMediaList(detailReview);
        const resolvedMedia: MediaDraftItem[] = await Promise.all(
          rawMedia.map(async (item) => {
            if (
              item.mediaId &&
              (!item.previewUrl ||
                item.previewUrl.startsWith("/api/v1/media/"))
            ) {
              const signedUrl = await getReviewMediaAccess(id, item.mediaId);
              if (signedUrl) {
                return {
                  mediaId: item.mediaId,
                  previewUrl: signedUrl,
                  isExisting: true,
                };
              }
            }
            return {
              mediaId: item.mediaId,
              previewUrl: item.previewUrl,
              isExisting: true,
            };
          }),
        );

        if (isMounted) {
          setMediaList(resolvedMedia);
        }
      })
      .catch(() => {
        // Fallback to passed review item data
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, review]);

  const handleRemovePhoto = (indexToRemove: number) => {
    setMediaList((prev) => {
      const target = prev[indexToRemove];
      if (target?.isExisting && target.mediaId) {
        setRemovedMediaIds((removed) =>
          removed.includes(target.mediaId)
            ? removed
            : [...removed, target.mediaId],
        );
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId) {
      toast.error("Không tìm thấy mã đánh giá.");
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn số sao đánh giá (1 - 5 sao).");
      return;
    }

    const addedMediaIds = mediaList
      .filter((m) => !m.isExisting && m.mediaId)
      .map((m) => m.mediaId);

    try {
      setIsSubmitting(true);
      await updateReviewWithMedia({
        reviewId,
        rating,
        comment: comment.trim() || null,
        etag,
        addedMediaIds,
        removedMediaIds,
      });

      toast.success("Đã cập nhật đánh giá của bạn thành công!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(
          err.details?.detail ||
            err.details?.message ||
            "Không thể chỉnh sửa đánh giá (có thể đã quá thời hạn cho phép).",
        );
        return;
      }
      toast.error("Không thể cập nhật đánh giá lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-lg p-6 sm:rounded-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Pencil className="size-4" aria-hidden="true" />
            </span>
            <span>Chỉnh sửa đánh giá</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật số sao, nhận xét hoặc hình ảnh đính kèm trong thời hạn cho phép.
          </DialogDescription>
        </DialogHeader>

        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">
              Đang tải thông tin đánh giá...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Interactive Rating */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">
                Chất lượng tổng thể
              </span>
              <RatingStars
                rating={rating}
                interactive
                onRatingChange={setRating}
                size="xl"
              />
              <span className="text-xs font-medium text-primary transition-all">
                {RATING_LABELS[rating] || ""}
              </span>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label
                htmlFor={commentInputId}
                className="block text-xs font-semibold text-foreground"
              >
                Nhận xét chi tiết
              </label>
              <p id={commentHintId} className="text-[11px] text-muted-foreground">
                Chia sẻ trải nghiệm thực tế của bạn về thiết bị và dịch vụ thuê.
              </p>
              <Textarea
                id={commentInputId}
                aria-describedby={commentHintId}
                rows={4}
                disabled={isSubmitting}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về tình trạng thiết bị, độ chính xác so với mô tả..."
                className="resize-none text-xs"
              />
            </div>

            {/* Media Upload & Delete */}
            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ImagePlus className="size-3.5 text-primary" aria-hidden="true" />
                <span>Ảnh chụp thực tế ({mediaList.length}/5)</span>
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {mediaList.length < 5 ? (
                  <MediaAvatarUpload
                    accept="image/*"
                    disabled={isSubmitting}
                    mode="multiple"
                    onChange={(_, upload) => {
                      const uploads = Array.isArray(upload) ? upload : [upload];
                      setMediaList((prev) => {
                        const newMedia: MediaDraftItem[] = uploads.map((res) => ({
                          mediaId: res.mediaId,
                          previewUrl:
                            res.previewUrl ||
                            `/api/v1/media/${encodeURIComponent(res.mediaId)}/content`,
                          isExisting: false,
                        }));
                        return [...prev, ...newMedia].slice(0, 5);
                      });
                    }}
                    size="md"
                    uploadLabel="Thêm ảnh"
                    variant="add"
                  />
                ) : null}

                {mediaList.map((photo, pIdx) => (
                  <div
                    className="relative size-16 rounded-lg"
                    key={`${photo.mediaId}-${pIdx}`}
                  >
                    <div className="size-full overflow-hidden rounded-lg border border-border bg-background">
                      <AvatarWithSkeleton
                        alt={`Ảnh đánh giá ${pIdx + 1}`}
                        className="size-full rounded-lg"
                        fallback={`${pIdx + 1}`}
                        imageClassName="object-cover"
                        src={photo.previewUrl}
                      />
                    </div>
                    <button
                      aria-label={`Gỡ ảnh đánh giá ${pIdx + 1}`}
                      className="absolute -right-1.5 -top-1.5 z-20 flex size-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                      onClick={() => handleRemovePhoto(pIdx)}
                      type="button"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="rounded-lg text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="mr-1.5 size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
