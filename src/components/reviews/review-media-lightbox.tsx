"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ReviewMediaLightboxProps = {
  mediaList: Array<{ mediaId: string; previewUrl: string }>;
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
};

export function ReviewMediaLightbox({
  mediaList,
  activeIndex,
  onClose,
  onNavigate,
}: ReviewMediaLightboxProps) {
  if (activeIndex === null || !mediaList.length) return null;

  const currentMedia = mediaList[activeIndex];
  if (!currentMedia) return null;

  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < mediaList.length - 1;

  return (
    <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl border-none bg-black/90 p-2 text-white shadow-2xl backdrop-blur-md sm:p-4 [&>button]:hidden">
        <DialogTitle className="sr-only">Xem ảnh đánh giá</DialogTitle>
        <div className="relative flex flex-col items-center justify-center">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 z-50 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>

          {/* Main image */}
          <div className="relative flex max-h-[80vh] min-h-[300px] w-full items-center justify-center overflow-hidden rounded-lg">
            <Image
              src={currentMedia.previewUrl}
              alt="Ảnh đánh giá của khách hàng"
              width={1200}
              height={900}
              unoptimized
              className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
            />
          </div>

          {/* Navigation buttons */}
          {hasPrev ? (
            <button
              type="button"
              onClick={() => onNavigate(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-40 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-6" />
            </button>
          ) : null}

          {hasNext ? (
            <button
              type="button"
              onClick={() => onNavigate(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-40 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              aria-label="Ảnh kế tiếp"
            >
              <ChevronRight className="size-6" />
            </button>
          ) : null}

          {/* Image index counter */}
          <div className="mt-3 text-xs text-white/80">
            {activeIndex + 1} / {mediaList.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
