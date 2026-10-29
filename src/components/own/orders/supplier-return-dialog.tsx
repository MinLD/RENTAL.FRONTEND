"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { recordSupplierReturn } from "@/services/rental-returns-service";
import type { ConditionEnum, ReturnUnitRequest } from "@/types/rental-returns";

type SupplierUnit = {
  assignmentId: string;
  assetId: string;
  status: string;
  returnCondition: string | null;
};

type SupplierReturnDialogProps = {
  itemId: string;
  itemName: string;
  units: SupplierUnit[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type UnitInspectionState = {
  condition: ConditionEnum;
  description: string;
  uploadedMedia: Array<{ mediaId: string; previewUrl: string }>;
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

export function SupplierReturnDialog({
  itemId,
  itemName,
  units,
  open,
  onOpenChange,
  onSuccess,
}: SupplierReturnDialogProps) {
  // Filter units not yet returned
  const pendingUnits = units.filter(
    (u) =>
      u.status !== "RETURNED_NORMAL" &&
      u.status !== "RETURNED_DAMAGED" &&
      u.status !== "RELEASED",
  );

  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(() =>
    pendingUnits.map((u) => u.assignmentId),
  );
  const [actualReturnAt, setActualReturnAt] = useState<string>(formatLocalDefaultDateTime);
  const [note, setNote] = useState("");
  const [inspections, setInspections] = useState<Record<string, UnitInspectionState>>(() => {
    const init: Record<string, UnitInspectionState> = {};
    for (const u of units) {
      init[u.assignmentId] = {
        condition: "NORMAL",
        description: "",
        uploadedMedia: [],
      };
    }
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleUnit = (assignmentId: string) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId],
    );
  };

  const handleConditionChange = (assignmentId: string, condition: ConditionEnum) => {
    setInspections((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || { description: "", uploadedMedia: [] }),
        condition,
      },
    }));
  };

  const handleDescriptionChange = (assignmentId: string, description: string) => {
    setInspections((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || { condition: "NORMAL", uploadedMedia: [] }),
        description,
      },
    }));
  };

  const handleRemovePhoto = (assignmentId: string, indexToRemove: number) => {
    setInspections((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || { condition: "DAMAGED", description: "", uploadedMedia: [] }),
        uploadedMedia: (prev[assignmentId]?.uploadedMedia ?? []).filter((_, idx) => idx !== indexToRemove),
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedAssignmentIds.length) {
      toast.error("Vui lòng chọn ít nhất một máy để thu hồi.");
      return;
    }

    if (!actualReturnAt) {
      toast.error("Vui lòng chọn thời điểm thực nhận.");
      return;
    }

    // Validate DAMAGED units
    for (const assignmentId of selectedAssignmentIds) {
      const insp = inspections[assignmentId] || { condition: "NORMAL", description: "", uploadedMedia: [] };
      if (insp.condition === "DAMAGED") {
        if (!insp.description.trim()) {
          toast.error("Máy bị hư hỏng bắt buộc phải nhập mô tả chi tiết hư hại.");
          return;
        }
        if (!insp.uploadedMedia.length) {
          toast.error("Máy bị hư hỏng bắt buộc phải tải lên ít nhất một ảnh chụp bằng chứng.");
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const returnUnits: ReturnUnitRequest[] = selectedAssignmentIds.map((assignmentId) => {
        const insp = inspections[assignmentId] || { condition: "NORMAL", description: "", uploadedMedia: [] };
        return {
          rentalUnitAssignmentId: assignmentId,
          condition: insp.condition,
          description: insp.condition === "DAMAGED" ? insp.description.trim() : null,
          mediaIds: insp.uploadedMedia.map((m) => m.mediaId),
        };
      });

      const result = await recordSupplierReturn(itemId, {
        actualReturnAt: new Date(actualReturnAt).toISOString(),
        note: note.trim() || null,
        units: returnUnits,
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể ghi nhận thu hồi thiết bị.");
        return;
      }

      toast.success(
        result.data.remainingUnits === 0
          ? "Đã thu hồi đủ tất cả máy trong dòng! Đơn chuyển sang giai đoạn quyết toán."
          : `Đã ghi nhận thu hồi ${selectedAssignmentIds.length} máy. Còn ${result.data.remainingUnits} máy chưa thu hồi.`,
      );

      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi ghi nhận thu hồi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ghi nhận thu hồi thiết bị</DialogTitle>
          <DialogDescription>
            Kiểm tra và xác nhận nhận lại máy cho: <strong>{itemName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-2" onSubmit={handleSubmit}>
          {/* Actual Return Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="supplier-actual-return-at">
              Thời điểm thực nhận <span className="text-red-500">*</span>
            </label>
            <Input
              id="supplier-actual-return-at"
              max={formatLocalDefaultDateTime()}
              onChange={(e) => setActualReturnAt(e.target.value)}
              required
              type="datetime-local"
              value={actualReturnAt}
            />
          </div>

          {/* Unit selection and inspection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Kiểm tra & đánh giá tình trạng từng máy ({selectedAssignmentIds.length}/{pendingUnits.length})
            </label>

            {pendingUnits.length === 0 ? (
              <p className="rounded border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Tất cả máy trong dòng đã được ghi nhận thu hồi xong.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingUnits.map((unit, index) => {
                  const isChecked = selectedAssignmentIds.includes(unit.assignmentId);
                  const insp = inspections[unit.assignmentId] || {
                    condition: "NORMAL",
                    description: "",
                    uploadedMedia: [],
                  };
                  const isDamaged = insp.condition === "DAMAGED";

                  return (
                    <div
                      className={`rounded-md border p-3 text-xs space-y-2.5 transition-colors ${
                        isChecked ? "border-primary/50 bg-background" : "border-border bg-muted/20 opacity-60"
                      }`}
                      key={unit.assignmentId}
                    >
                      <div className="flex items-center justify-between">
                        <label
                          className="flex cursor-pointer items-center gap-2 font-semibold text-sm"
                          htmlFor={`supplier-unit-${unit.assignmentId}`}
                        >
                          <Checkbox
                            checked={isChecked}
                            id={`supplier-unit-${unit.assignmentId}`}
                            onCheckedChange={() => handleToggleUnit(unit.assignmentId)}
                          />
                          <span>Máy #{index + 1}</span>
                        </label>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          Mã: {unit.assignmentId.slice(-8)}
                        </span>
                      </div>

                      {isChecked && (
                        <div className="space-y-2.5 pt-2 border-t border-border">
                          {/* Condition Selection */}
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-foreground">Tình trạng máy:</span>
                            <RadioGroup
                              className="flex items-center gap-3"
                              onValueChange={(val) =>
                                handleConditionChange(unit.assignmentId, val as ConditionEnum)
                              }
                              value={insp.condition}
                            >
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <RadioGroupItem id={`cond-normal-${unit.assignmentId}`} value="NORMAL" />
                                <label
                                  className="cursor-pointer font-medium text-emerald-700"
                                  htmlFor={`cond-normal-${unit.assignmentId}`}
                                >
                                  Bình thường (NORMAL)
                                </label>
                              </div>
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <RadioGroupItem id={`cond-damaged-${unit.assignmentId}`} value="DAMAGED" />
                                <label
                                  className="cursor-pointer font-medium text-rose-700"
                                  htmlFor={`cond-damaged-${unit.assignmentId}`}
                                >
                                  Hư hại (DAMAGED)
                                </label>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* If Damaged: description and photo upload */}
                          {isDamaged && (
                            <div className="rounded border border-rose-200 bg-rose-50/50 p-2.5 space-y-2">
                              <div className="space-y-1">
                                <label
                                  className="font-semibold text-rose-950 flex items-center gap-1 text-[11px]"
                                  htmlFor={`desc-${unit.assignmentId}`}
                                >
                                  <AlertTriangle className="size-3 text-rose-600" />
                                  Mô tả hư hỏng <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                  id={`desc-${unit.assignmentId}`}
                                  maxLength={2000}
                                  onChange={(e) =>
                                    handleDescriptionChange(unit.assignmentId, e.target.value)
                                  }
                                  placeholder="Mô tả cụ thể hư hỏng (bể vỡ, móp méo, thiếu linh kiện...)"
                                  required={isDamaged}
                                  rows={2}
                                  value={insp.description}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <span className="font-semibold text-rose-950 flex items-center gap-1 text-[11px]">
                                  <ImagePlus className="size-3 text-rose-600" />
                                  Ảnh chụp hiện trạng hư hại ({insp.uploadedMedia.length}/10){" "}
                                  <span className="text-red-500">*</span>
                                </span>

                                <div className="flex flex-wrap items-center gap-3">
                                  <MediaAvatarUpload
                                    accept="image/*"
                                    disabled={isSubmitting}
                                    mode="multiple"
                                    onChange={(_, upload) => {
                                      const uploads = Array.isArray(upload) ? upload : [upload];
                                      setInspections((prev) => {
                                        const current = prev[unit.assignmentId]?.uploadedMedia ?? [];
                                        const newMedia = uploads.map((res) => ({
                                          mediaId: res.mediaId,
                                          previewUrl: res.previewUrl || `/api/v1/media/${encodeURIComponent(res.mediaId)}/content`,
                                        }));
                                        return {
                                          ...prev,
                                          [unit.assignmentId]: {
                                            ...(prev[unit.assignmentId] || { condition: "DAMAGED", description: "", uploadedMedia: [] }),
                                            uploadedMedia: [...current, ...newMedia].slice(0, 10),
                                          },
                                        };
                                      });
                                    }}
                                    size="md"
                                    uploadLabel="Thêm ảnh"
                                    variant="add"
                                  />

                                  {insp.uploadedMedia.map((photo, pIdx) => (
                                    <div
                                      className="relative size-20 rounded-lg"
                                      key={photo.mediaId}
                                    >
                                      <div className="size-full overflow-hidden rounded-lg border border-border bg-background">
                                        <AvatarWithSkeleton
                                          alt={`Ảnh hỏng ${pIdx + 1}`}
                                          className="size-full rounded-lg"
                                          fallback={`${pIdx + 1}`}
                                          imageClassName="object-cover"
                                          src={photo.previewUrl}
                                        />
                                      </div>
                                      <button
                                        aria-label={`Xóa ảnh ${pIdx + 1}`}
                                        className="absolute -right-2 -top-2 z-20 flex size-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md ring-2 ring-white hover:bg-red-700 transition-transform hover:scale-110"
                                        onClick={() => handleRemovePhoto(unit.assignmentId, pIdx)}
                                        title="Xóa ảnh này"
                                        type="button"
                                      >
                                        <X className="size-3.5 stroke-[2.5]" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="supplier-return-note">
              Ghi chú thu hồi (tùy chọn)
            </label>
            <Textarea
              id="supplier-return-note"
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thông tin thêm khi nhận lại máy..."
              rows={2}
              value={note}
            />
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
                pendingUnits.length === 0 ||
                selectedAssignmentIds.length === 0
              }
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Đang ghi nhận...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Xác nhận thu hồi máy
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
