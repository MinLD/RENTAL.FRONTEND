"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewWriteDialog } from "@/components/reviews/review-write-dialog";
import { cn } from "@/utils/cn";

type OrderReviewButtonProps = {
  orderId: string;
  itemId: string;
  itemName: string;
  listingId?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onSuccess?: () => void;
};

export function OrderReviewButton({
  orderId,
  itemId,
  itemName,
  listingId = "",
  size = "sm",
  variant = "secondary",
  className,
  onSuccess,
}: OrderReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={() => setOpen(true)}
        disabled={hasReviewed}
        className={cn(
          "cursor-pointer border-primary text-primary hover:bg-primary/5 hover:text-primary transition-colors",
          hasReviewed && "border-emerald-500 bg-emerald-50 text-emerald-700 opacity-100",
          className,
        )}
      >
        {hasReviewed ? (
          <>
            <Check className="mr-1.5 size-3.5 text-emerald-600" />
            <span>Đã đánh giá</span>
          </>
        ) : (
          <>
            <Star className="mr-1.5 size-3.5 fill-amber-400 text-amber-400" />
            <span>Đánh giá thiết bị</span>
          </>
        )}
      </Button>

      <ReviewWriteDialog
        orderId={orderId}
        itemId={itemId}
        listingId={listingId}
        listingName={itemName}
        open={open}
        onOpenChange={setOpen}
        isAuthenticated={true}
        onSuccess={() => {
          setHasReviewed(true);
          onSuccess?.();
        }}
      />
    </>
  );
}
