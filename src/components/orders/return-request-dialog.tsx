"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createReturnRequest } from "@/services/rental-returns-service";

type AvailableUnit = {
  assignmentId: string;
  status: string;
  hasOpenReturnRequest?: boolean;
  canRequestReturn?: boolean;
};

type ReturnRequestDialogProps = {
  itemId: string;
  itemName: string;
  units: AvailableUnit[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function formatLocalDefaultDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ReturnRequestDialog({
  itemId,
  itemName,
  units,
  open,
  onOpenChange,
  onSuccess,
}: ReturnRequestDialogProps) {
  const router = useRouter();

  const eligibleUnits = units.filter(
    (unit) =>
      unit.canRequestReturn !== false &&
      !unit.hasOpenReturnRequest &&
      unit.status !== "RELEASED" &&
      !unit.status.startsWith("RETURNED"),
  );

  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(() =>
    eligibleUnits.map((u) => u.assignmentId),
  );
  const [actualReturnAt, setActualReturnAt] = useState<string>(formatLocalDefaultDateTime);
  const [note, setNote] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ mediaId: string; previewUrl: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleUnit = (assignmentId: string) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssignmentIds(eligibleUnits.map((u) => u.assignmentId));
    } else {
      setSelectedAssignmentIds([]);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedMedia((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedAssignmentIds.length) {
      toast.error("Vui lòng chọn ít nhất một máy để trả.");
      return;
    }

    if (!actualReturnAt) {
      toast.error("Vui lòng chọn thời điểm trả máy.");
      return;
    }

    const returnTime = new Date(actualReturnAt);
    if (Number.isNaN(returnTime.getTime()) || returnTime > new Date()) {
      toast.error("Thời điểm trả máy không được ở tương lai.");
      return;
    }

    setIsSubmitting(true);
    try {
      const mediaIds = uploadedMedia.map((m) => m.mediaId);
      const result = await createReturnRequest(itemId, {
        actualReturnAt: returnTime.toISOString(),
        note: note.trim() || null,
        units: selectedAssignmentIds.map((assignmentId) => ({
          rentalUnitAssignmentId: assignmentId,
          mediaIds,
        })),
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể gửi yêu cầu trả thiết bị.");
        return;
      }

      toast.success("Đã gửi yêu cầu trả thiết bị thành công! Vui lòng chờ nhà cung cấp xác nhận.");
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi gửi yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllSelected =
    eligibleUnits.length > 0 && selectedAssignmentIds.length === eligibleUnits.length;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Khai báo trả thiết bị</DialogTitle>
          <DialogDescription>
            Khai báo trả máy cho dòng thiết bị: <strong>{itemName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-2" onSubmit={handleSubmit}>
          {/* Unit selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Chọn thiết bị trả ({selectedAssignmentIds.length}/{eligibleUnits.length})
              </label>
              {eligibleUnits.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Checkbox
                    checked={isAllSelected}
                    id="select-all-units"
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                  />
                  <label className="cursor-pointer" htmlFor="select-all-units">
                    Chọn tất cả
                  </label>
                </div>
              )}
            </div>

            {eligibleUnits.length === 0 ? (
              <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Hiện tại không còn thiết bị nào sẵn sàng để khai báo trả.
              </p>
            ) : (
              <div className="space-y-2 rounded-md border border-border p-3">
                {eligibleUnits.map((unit, index) => {
                  const isChecked = selectedAssignmentIds.includes(unit.assignmentId);
                  return (
                    <div
                      className="flex items-center justify-between gap-2 text-xs"
                      key={unit.assignmentId}
                    >
                      <label
                        className="flex cursor-pointer items-center gap-2 font-medium"
                        htmlFor={`unit-${unit.assignmentId}`}
                      >
                        <Checkbox
                          checked={isChecked}
                          id={`unit-${unit.assignmentId}`}
                          onCheckedChange={() => handleToggleUnit(unit.assignmentId)}
                        />
                        <span>Máy #{index + 1}</span>
                      </label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {unit.assignmentId.slice(-8)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actual return datetime */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground" htmlFor="return-datetime">
              <Calendar className="size-3.5 text-primary" />
              Thời điểm thực trả
            </label>
            <Input
              id="return-datetime"
              max={formatLocalDefaultDateTime()}
              onChange={(e) => setActualReturnAt(e.target.value)}
              required
              type="datetime-local"
              value={actualReturnAt}
            />
            <p className="text-[11px] text-muted-foreground">
              Thời điểm bạn mang trả máy tại kho hoặc bàn giao cho nhà cung cấp.
            </p>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="return-note">
              Ghi chú thêm (tùy chọn)
            </label>
            <Textarea
              id="return-note"
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Đã bàn giao đầy đủ phụ kiện tại kho quận 9..."
              rows={2}
              value={note}
            />
          </div>

          {/* Photo upload via MediaAvatarUpload */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ImagePlus className="size-3.5 text-primary" />
              Ảnh chụp bàn giao / biên nhận ({uploadedMedia.length}/10)
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

              {uploadedMedia.map((photo, pIdx) => (
                <div
                  className="relative size-20 rounded-lg"
                  key={photo.mediaId}
                >
                  <div className="size-full overflow-hidden rounded-lg border border-border bg-background">
                    <AvatarWithSkeleton
                      alt={`Ảnh trả ${pIdx + 1}`}
                      className="size-full rounded-lg"
                      fallback={`${pIdx + 1}`}
                      imageClassName="object-cover"
                      src={photo.previewUrl}
                    />
                  </div>
                  <button
                    aria-label={`Xóa ảnh ${pIdx + 1}`}
                    className="absolute -right-2 -top-2 z-20 flex size-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md ring-2 ring-white hover:bg-red-700 transition-transform hover:scale-110"
                    onClick={() => handleRemovePhoto(pIdx)}
                    title="Xóa ảnh này"
                    type="button"
                  >
                    <X className="size-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tải lên ảnh chụp hiện trạng thiết bị lúc trả hoặc biên nhận kho (tùy chọn).
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
              disabled={
                isSubmitting ||
                eligibleUnits.length === 0 ||
                selectedAssignmentIds.length === 0
              }
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Xác nhận gửi yêu cầu trả"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
