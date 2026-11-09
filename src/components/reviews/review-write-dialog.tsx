"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImagePlus, Loader2, LogIn, Star, X } from "lucide-react";
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
import type { PendingReviewItem } from "@/types/review";
import { ApiError } from "@/services/api-error";
import { getPendingReviews, submitReviewWithMedia } from "@/services/review-service";
import { RatingStars } from "./rating-stars";

type ReviewWriteDialogProps = {
  listingId?: string;
  listingName: string;
  orderId?: string;
  itemId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated: boolean;
  onSuccess?: () => void;
};

const RATING_LABELS: Record<number, string> = {
  1: "Rất không hài lòng",
  2: "Không hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Rất hài lòng & Tuyệt vời",
};

export function ReviewWriteDialog({
  listingId,
  listingName,
  orderId,
  itemId,
  open,
  onOpenChange,
  isAuthenticated,
  onSuccess,
}: ReviewWriteDialogProps) {
  const hasDirectTarget = Boolean(orderId && itemId);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<
    Array<{ mediaId: string; previewUrl: string }>
  >([]);
  const [pendingItems, setPendingItems] = useState<PendingReviewItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PendingReviewItem | null>(null);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !isAuthenticated) return;

    let isMounted = true;
    getPendingReviews()
      .then((res) => {
        if (!isMounted) return;
        const items = res?.items ?? [];

        // 1. Try to match by itemId
        let match = itemId ? items.find((i) => i.itemId === itemId) : null;

        // 2. Try to match by listingId
        if (!match && listingId) {
          match = items.find(
            (i) =>
              i.listingId === listingId || i.equipmentListingId === listingId,
          );
        }

        // 3. Try to match by orderId
        if (!match && orderId) {
          match = items.find((i) => i.orderId === orderId);
        }

        if (match) {
          setSelectedItem(match);
          setPendingItems([match]);
        } else if (hasDirectTarget && orderId && itemId) {
          // Direct target from order
          setSelectedItem({ orderId, itemId, listingName });
          setPendingItems([{ orderId, itemId, listingName }]);
        } else if (items.length > 0) {
          setPendingItems(items);
          setSelectedItem(items[0]);
        } else {
          setPendingItems([]);
          setSelectedItem(null);
        }
      })
      .catch((err) => {
        console.error("[ReviewService] Error loading pending reviews:", err);
        if (!isMounted) return;
        if (hasDirectTarget && orderId && itemId) {
          setSelectedItem({ orderId, itemId, listingName });
          setPendingItems([{ orderId, itemId, listingName }]);
        } else {
          setPendingItems([]);
          setSelectedItem(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPending(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, isAuthenticated, listingId, hasDirectTarget, orderId, itemId, listingName]);

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedMedia((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) {
      toast.error(
        "Bạn cần có đơn thuê thiết bị này đã hoàn tất để gửi đánh giá.",
      );
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn số sao đánh giá (1 - 5 sao).");
      return;
    }

    const payloadSent = {
      orderId: selectedItem.orderId,
      itemId: selectedItem.itemId,
      rating,
      comment: comment.trim() || null,
      mediaIds: uploadedMedia.map((m) => m.mediaId),
    };

    try {
      setIsSubmitting(true);
      await submitReviewWithMedia(payloadSent);

      toast.success("Cảm ơn bạn đã gửi đánh giá cho thiết bị!");
      onOpenChange(false);
      // Reset form
      setRating(5);
      setComment("");
      setUploadedMedia([]);
      onSuccess?.();
    } catch (err: unknown) {
      console.error("🔴 [ReviewService Error]:", err);
      if (err instanceof ApiError) {
        console.error("🔴 [ReviewService Response Status]:", err.status);
        console.error("🔴 [ReviewService Response Body]:", err.responseBody);
        console.error("🔴 [ReviewService Payload Sent]:", payloadSent);
      }
      const message =
        err instanceof Error ? err.message : "Không thể gửi đánh giá lúc này.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 sm:rounded-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold">
            Đánh giá thiết bị
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {listingName}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LogIn className="size-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Đăng nhập để đánh giá</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Bạn cần đăng nhập tài khoản đã hoàn tất thuê thiết bị này để viết
                đánh giá.
              </p>
            </div>
            <Button asChild className="rounded-lg">
              <Link href="/login">Đăng nhập ngay</Link>
            </Button>
          </div>
        ) : isLoadingPending ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Đang kiểm tra lịch sử thuê của bạn...
            </p>
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <Star className="size-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">
                Chưa thể đánh giá thiết bị
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Bạn chỉ có thể đánh giá sau khi đã thuê và hoàn tất đơn hàng cho thiết bị này.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="rounded-lg"
            >
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">

            {/* If multiple pending orders exist, allow selecting */}
            {pendingItems.length > 1 ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Chọn đơn thuê cần đánh giá
                </label>
                <select
                  value={selectedItem?.itemId || ""}
                  onChange={(e) => {
                    const item = pendingItems.find(
                      (i) => i.itemId === e.target.value,
                    );
                    if (item) setSelectedItem(item);
                  }}
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs"
                >
                  {pendingItems.map((item, idx) => (
                    <option key={item.itemId} value={item.itemId}>
                      Đơn #{item.orderId.slice(0, 8)} - Lần thuê {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

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
                htmlFor="review-comment"
                className="text-xs font-semibold text-foreground"
              >
                Nhận xét chi tiết
              </label>
              <Textarea
                id="review-comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về tình trạng thiết bị, độ chính xác so với mô tả, thời gian giao nhận..."
                className="resize-none text-xs"
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ImagePlus className="size-3.5 text-primary" />
                Ảnh chụp thực tế ({uploadedMedia.length}/5)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {uploadedMedia.length < 5 ? (
                  <MediaAvatarUpload
                    accept="image/*"
                    disabled={isSubmitting}
                    mode="multiple"
                    onChange={(_, upload) => {
                      const uploads = Array.isArray(upload) ? upload : [upload];
                      setUploadedMedia((prev) => {
                        const newMedia = uploads.map((res) => ({
                          mediaId: res.mediaId,
                          previewUrl:
                            res.previewUrl ||
                            `/api/v1/media/${encodeURIComponent(res.mediaId)}/content`,
                        }));
                        return [...prev, ...newMedia].slice(0, 5);
                      });
                    }}
                    size="md"
                    uploadLabel="Thêm ảnh"
                    variant="add"
                  />
                ) : null}

                {uploadedMedia.map((photo, pIdx) => (
                  <div
                    className="relative size-16 rounded-lg"
                    key={photo.mediaId}
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
                      aria-label={`Xóa ảnh ${pIdx + 1}`}
                      className="absolute -right-1.5 -top-1.5 z-20 flex size-5 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                      onClick={() => handleRemovePhoto(pIdx)}
                      title="Xóa ảnh này"
                      type="button"
                    >
                      <X className="size-3" />
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
                className="rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi đánh giá"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
