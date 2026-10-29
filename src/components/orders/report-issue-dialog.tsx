"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ImagePlus, Loader2, X } from "lucide-react";
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
import { reportReturnIssue } from "@/services/rental-returns-service";
import type { ReturnRequestUnitResponse } from "@/types/rental-returns";

type ReportIssueDialogProps = {
  itemId: string;
  requestId: string;
  units: ReturnRequestUnitResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ReportIssueDialog({
  itemId,
  requestId,
  units,
  open,
  onOpenChange,
  onSuccess,
}: ReportIssueDialogProps) {
  const router = useRouter();

  // Actionable units: not closed and not rejected yet
  const actionableUnits = units.filter(
    (u) => u.closedAt === null && u.rejectedAt === null,
  );

  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(() =>
    actionableUnits.map((u) => u.rentalUnitAssignmentId),
  );
  const [reason, setReason] = useState("");
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

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedMedia((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do báo cáo sự cố.");
      return;
    }

    setIsSubmitting(true);
    try {
      const mediaIds = uploadedMedia.map((m) => m.mediaId);
      const result = await reportReturnIssue(itemId, requestId, {
        reason: reason.trim(),
        note: note.trim() || null,
        mediaIds,
        assignmentIds: selectedAssignmentIds.length ? selectedAssignmentIds : undefined,
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể gửi báo cáo sự cố.");
        return;
      }

      toast.success("Đã gửi báo cáo sự cố thành công! Trạng thái yêu cầu chuyển sang Có bất đồng (Disputed).");
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi gửi báo cáo sự cố.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="size-5 shrink-0" />
            <DialogTitle>Báo cáo sự cố trả thiết bị</DialogTitle>
          </div>
          <DialogDescription>
            Báo cáo vấn đề nếu nhà cung cấp chưa xác nhận hoặc có sai lệch ngoài công trình.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-2" onSubmit={handleSubmit}>
          {/* Target units selection if multiple */}
          {actionableUnits.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Áp dụng cho thiết bị
              </label>
              <div className="space-y-2 rounded-md border border-border p-2.5">
                {actionableUnits.map((unit, index) => {
                  const isChecked = selectedAssignmentIds.includes(unit.rentalUnitAssignmentId);
                  return (
                    <label
                      className="flex cursor-pointer items-center justify-between text-xs font-medium"
                      htmlFor={`issue-unit-${unit.rentalUnitAssignmentId}`}
                      key={unit.rentalUnitAssignmentId}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          id={`issue-unit-${unit.rentalUnitAssignmentId}`}
                          onCheckedChange={() => handleToggleUnit(unit.rentalUnitAssignmentId)}
                        />
                        <span>Máy #{index + 1}</span>
                      </div>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {unit.rentalUnitAssignmentId.slice(-8)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="issue-reason">
              Lý do sự cố <span className="text-red-500">*</span>
            </label>
            <Input
              id="issue-reason"
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Đã trả máy tại kho nhưng quá 24h NCC chưa xác nhận..."
              required
              value={reason}
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="issue-note">
              Ghi chú chi tiết (tùy chọn)
            </label>
            <Textarea
              id="issue-note"
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thông tin thêm giúp hỗ trợ giải quyết..."
              rows={2}
              value={note}
            />
          </div>

          {/* Photo upload via MediaAvatarUpload */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ImagePlus className="size-3.5 text-primary" />
              Ảnh đính kèm ({uploadedMedia.length}/10)
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
                      alt={`Ảnh sự cố ${pIdx + 1}`}
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
              disabled={isSubmitting || !reason.trim()}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi báo cáo sự cố"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
