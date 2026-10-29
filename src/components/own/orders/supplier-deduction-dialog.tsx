"use client";

import { useState } from "react";
import { ImagePlus, Loader2, ShieldAlert, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Textarea } from "@/components/ui/textarea";
import { proposeRentalDeduction } from "@/services/rental-deductions-service";
import { formatEquipmentListingRate } from "@/utils/inventory";

type DamagedAsset = {
  assignmentId: string;
  assetId: string;
};

type SupplierDeductionDialogProps = {
  itemId: string;
  itemName: string;
  maxDepositAmount: number;
  currency?: string | null;
  damagedAssets: DamagedAsset[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function SupplierDeductionDialog({
  itemId,
  itemName,
  maxDepositAmount,
  currency = "VND",
  damagedAssets,
  open,
  onOpenChange,
  onSuccess,
}: SupplierDeductionDialogProps) {
  const [amountStr, setAmountStr] = useState<string>("");
  const [description, setDescription] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ mediaId: string; previewUrl: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedMedia((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(amountStr.replace(/[^0-9]/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Vui lòng nhập số tiền khấu trừ hợp lệ (lớn hơn 0).");
      return;
    }

    if (amount > maxDepositAmount) {
      toast.error(
        `Số tiền khấu trừ không được vượt quá tiền cọc của dòng (${formatEquipmentListingRate(
          maxDepositAmount,
          currency,
        )}).`,
      );
      return;
    }

    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả chi tiết hư hại cần cấn trừ cọc.");
      return;
    }

    if (!uploadedMedia.length) {
      toast.error("Cần ít nhất một ảnh chụp bằng chứng hư hại.");
      return;
    }

    setIsSubmitting(true);
    try {
      const mediaIds = uploadedMedia.map((m) => m.mediaId);
      const affectedAssetIds = damagedAssets.map((a) => a.assetId);

      const result = await proposeRentalDeduction(itemId, {
        deductionAmount: amount,
        damageDescription: description.trim(),
        evidenceMediaIds: mediaIds,
        affectedAssetIds: affectedAssetIds.length ? affectedAssetIds : undefined,
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể gửi đề nghị khấu trừ tiền cọc.");
        return;
      }

      toast.success("Đã gửi đề nghị khấu trừ tiền cọc thành công! Khách thuê sẽ có thời hạn để phản hồi.");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi gửi đề nghị khấu trừ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="size-5 shrink-0" />
            <DialogTitle>Đề nghị khấu trừ tiền cọc</DialogTitle>
          </div>
          <DialogDescription>
            Gửi yêu cầu trừ tiền cọc do phát sinh thiết bị hư hại cho: <strong>{itemName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-2" onSubmit={handleSubmit}>
          {/* Max deposit note */}
          <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
            <span>Tiền cọc tối đa của thiết bị:</span>
            <strong className="text-sm font-bold text-amber-950">
              {formatEquipmentListingRate(maxDepositAmount, currency)}
            </strong>
          </div>

          {/* Deduction amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="supplier-deduction-amount">
              Số tiền đề nghị khấu trừ <span className="text-red-500">*</span>
            </label>
            <Input
              id="supplier-deduction-amount"
              min={1000}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Ví dụ: 500000"
              required
              type="number"
              value={amountStr}
            />
            <p className="text-[11px] text-muted-foreground">
              Nhập chi phí sửa chữa / thay thế phụ tùng dự kiến.
            </p>
          </div>

          {/* Damage description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="supplier-damage-description">
              Mô tả hư hại & căn cứ khấu trừ <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="supplier-damage-description"
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể hư hại, linh kiện cần thay thế..."
              required
              rows={3}
              value={description}
            />
          </div>

          {/* Photo upload via MediaAvatarUpload */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ImagePlus className="size-3.5 text-primary" />
              Ảnh chụp bằng chứng hư hại ({uploadedMedia.length}/10){" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <MediaAvatarUpload
                accept="image/*"
                disabled={isSubmitting}
                mode="multiple"
                onChange={(_, upload) => {
                  const uploads = Array.isArray(upload) ? upload : [upload];
                  setUploadedMedia((prev) => {
                    const newMedia = uploads.map((res) => ({
                      mediaId: res.mediaId,
                      previewUrl: res.previewUrl || `/api/v1/media/${encodeURIComponent(res.mediaId)}/content`,
                    }));
                    return [...prev, ...newMedia].slice(0, 10);
                  });
                }}
                size="md"
                uploadLabel="Thêm ảnh"
                variant="add"
              />

              {uploadedMedia.map((photo, idx) => (
                <div
                  className="relative size-20 rounded-lg"
                  key={photo.mediaId}
                >
                  <div className="size-full overflow-hidden rounded-lg border border-border bg-background">
                    <AvatarWithSkeleton
                      alt={`Ảnh hỏng ${idx + 1}`}
                      className="size-full rounded-lg"
                      fallback={`${idx + 1}`}
                      imageClassName="object-cover"
                      src={photo.previewUrl}
                    />
                  </div>
                  <button
                    aria-label={`Xóa ảnh ${idx + 1}`}
                    className="absolute -right-2 -top-2 z-20 flex size-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md ring-2 ring-white hover:bg-red-700 transition-transform hover:scale-110"
                    onClick={() => handleRemovePhoto(idx)}
                    title="Xóa ảnh này"
                    type="button"
                  >
                    <X className="size-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bắt buộc tải lên ảnh chụp hiện trạng để khách thuê và quản trị viên đối soát.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              Hủy
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              disabled={isSubmitting || !amountStr || !description.trim() || !uploadedMedia.length}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi đề nghị khấu trừ"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
