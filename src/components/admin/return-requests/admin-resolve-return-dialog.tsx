"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, X, XCircle } from "lucide-react";
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
import { resolveReturnRequest } from "@/services/rental-returns-service";
import type {
  AdminResolveReturnRequest,
  ConditionEnum,
  ReturnResolutionDecision,
  ReturnRequestUnitResponse,
} from "@/types/rental-returns";

type AdminResolveReturnDialogProps = {
  itemId: string;
  requestId: string;
  units: ReturnRequestUnitResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type UnitAdminInspection = {
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

export function AdminResolveReturnDialog({
  itemId,
  requestId,
  units,
  open,
  onOpenChange,
  onSuccess,
}: AdminResolveReturnDialogProps) {
  // Actionable units: not closed and not rejected yet
  const actionableUnits = units.filter(
    (u) => u.closedAt === null && u.rejectedAt === null,
  );

  const [decision, setDecision] = useState<ReturnResolutionDecision>("ConfirmReceived");
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(() =>
    actionableUnits.map((u) => u.rentalUnitAssignmentId),
  );
  const [actualReturnAt, setActualReturnAt] = useState<string>(formatLocalDefaultDateTime);
  const [inspections, setInspections] = useState<Record<string, UnitAdminInspection>>(() => {
    const init: Record<string, UnitAdminInspection> = {};
    for (const u of units) {
      init[u.rentalUnitAssignmentId] = {
        condition: "NORMAL",
        description: "",
        uploadedMedia: [],
      };
    }
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleUnit = (id: string) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleConditionChange = (id: string, condition: ConditionEnum) => {
    setInspections((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { description: "", uploadedMedia: [] }),
        condition,
      },
    }));
  };

  const handleDescriptionChange = (id: string, description: string) => {
    setInspections((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { condition: "NORMAL", uploadedMedia: [] }),
        description,
      },
    }));
  };

  const handleRemovePhoto = (id: string, indexToRemove: number) => {
    setInspections((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { condition: "DAMAGED", description: "", uploadedMedia: [] }),
        uploadedMedia: (prev[id]?.uploadedMedia ?? []).filter((_, idx) => idx !== indexToRemove),
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedAssignmentIds.length) {
      toast.error("Vui lòng chọn ít nhất một máy để phân xử.");
      return;
    }

    if (!decisionNote.trim()) {
      toast.error("Bắt buộc nhập ghi chú phân xử của quản trị viên.");
      return;
    }

    if (decision === "ConfirmReceived") {
      if (!actualReturnAt) {
        toast.error("Vui lòng chọn thời điểm thực nhận thiết bị.");
        return;
      }

      for (const id of selectedAssignmentIds) {
        const insp = inspections[id] || { condition: "NORMAL", description: "", uploadedMedia: [] };
        if (insp.condition === "DAMAGED") {
          if (!insp.description.trim()) {
            toast.error("Thiết bị hư hại bắt buộc nhập mô tả hư hỏng.");
            return;
          }
          if (!insp.uploadedMedia.length) {
            toast.error("Thiết bị hư hại bắt buộc tải lên ít nhất một ảnh chụp hiện trạng.");
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload: AdminResolveReturnRequest = {
        decision,
        decisionNote: decisionNote.trim(),
        assignmentIds: selectedAssignmentIds,
        actualReturnAt: decision === "ConfirmReceived" ? new Date(actualReturnAt).toISOString() : null,
        units:
          decision === "ConfirmReceived"
            ? selectedAssignmentIds.map((id) => {
                const insp = inspections[id] || { condition: "NORMAL", description: "", uploadedMedia: [] };
                return {
                  rentalUnitAssignmentId: id,
                  condition: insp.condition,
                  description: insp.condition === "DAMAGED" ? insp.description.trim() : null,
                  mediaIds: insp.uploadedMedia.map((m) => m.mediaId),
                };
              })
            : null,
      };

      const result = await resolveReturnRequest(itemId, requestId, payload);

      if (!result.success) {
        toast.error(result.error.message || "Không thể phân xử yêu cầu.");
        return;
      }

      toast.success(
        decision === "ConfirmReceived"
          ? "Đã xác nhận thực nhận thiết bị thành công!"
          : "Đã bác yêu cầu trả máy của khách thuê.",
      );

      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi phân xử.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Phân xử yêu cầu trả thiết bị (Admin)</DialogTitle>
          <DialogDescription>
            Đưa ra quyết định phân xử chính thức cho yêu cầu trả máy: mã <code>{requestId.slice(-8)}</code>.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-2" onSubmit={handleSubmit}>
          {/* Decision Choice */}
          <div className="space-y-2 rounded-md border border-border p-3">
            <label className="text-sm font-semibold">Quyết định của Quản trị viên:</label>
            <RadioGroup
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              onValueChange={(val) => setDecision(val as ReturnResolutionDecision)}
              value={decision}
            >
              <div
                className={`flex items-start gap-2.5 rounded-md border p-3 cursor-pointer transition-colors ${
                  decision === "ConfirmReceived"
                    ? "border-emerald-600 bg-emerald-50/70"
                    : "border-border bg-background"
                }`}
              >
                <RadioGroupItem className="mt-0.5" id="decision-confirm" value="ConfirmReceived" />
                <label className="cursor-pointer space-y-0.5 text-xs" htmlFor="decision-confirm">
                  <span className="font-bold text-emerald-800 text-sm flex items-center gap-1">
                    <CheckCircle2 className="size-4" /> Xác nhận thực nhận
                  </span>
                  <p className="text-muted-foreground">
                    Công nhận thiết bị đã được trả tại kho, cập nhật kết quả kiểm tra máy.
                  </p>
                </label>
              </div>

              <div
                className={`flex items-start gap-2.5 rounded-md border p-3 cursor-pointer transition-colors ${
                  decision === "RejectRequest"
                    ? "border-rose-600 bg-rose-50/70"
                    : "border-border bg-background"
                }`}
              >
                <RadioGroupItem className="mt-0.5" id="decision-reject" value="RejectRequest" />
                <label className="cursor-pointer space-y-0.5 text-xs" htmlFor="decision-reject">
                  <span className="font-bold text-rose-800 text-sm flex items-center gap-1">
                    <XCircle className="size-4" /> Bác yêu cầu trả máy
                  </span>
                  <p className="text-muted-foreground">
                    Từ chối yêu cầu của khách (chưa có chứng cứ mang trả thiết bị).
                  </p>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Unit selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Thiết bị áp dụng phân xử ({selectedAssignmentIds.length}/{actionableUnits.length})
            </label>
            <div className="space-y-2">
              {actionableUnits.map((unit, index) => {
                const isChecked = selectedAssignmentIds.includes(unit.rentalUnitAssignmentId);
                const insp = inspections[unit.rentalUnitAssignmentId] || {
                  condition: "NORMAL",
                  description: "",
                  uploadedMedia: [],
                };

                return (
                  <div
                    className={`rounded-md border p-3 text-xs space-y-2.5 ${
                      isChecked ? "border-primary/50 bg-background" : "border-border bg-muted/20 opacity-60"
                    }`}
                    key={unit.rentalUnitAssignmentId}
                  >
                    <div className="flex items-center justify-between">
                      <label
                        className="flex cursor-pointer items-center gap-2 font-semibold text-sm"
                        htmlFor={`admin-unit-${unit.rentalUnitAssignmentId}`}
                      >
                        <Checkbox
                          checked={isChecked}
                          id={`admin-unit-${unit.rentalUnitAssignmentId}`}
                          onCheckedChange={() => handleToggleUnit(unit.rentalUnitAssignmentId)}
                        />
                        <span>Máy #{index + 1}</span>
                      </label>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {unit.rentalUnitAssignmentId.slice(-8)}
                      </span>
                    </div>

                    {isChecked && decision === "ConfirmReceived" && (
                      <div className="space-y-2.5 pt-2 border-t border-border">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">Kết quả kiểm định:</span>
                          <RadioGroup
                            className="flex items-center gap-3"
                            onValueChange={(val) =>
                              handleConditionChange(unit.rentalUnitAssignmentId, val as ConditionEnum)
                            }
                            value={insp.condition}
                          >
                            <div className="flex items-center gap-1.5 cursor-pointer">
                              <RadioGroupItem id={`admin-cond-normal-${unit.rentalUnitAssignmentId}`} value="NORMAL" />
                              <label
                                className="cursor-pointer font-medium text-emerald-700"
                                htmlFor={`admin-cond-normal-${unit.rentalUnitAssignmentId}`}
                              >
                                NORMAL (Bình thường)
                              </label>
                            </div>
                            <div className="flex items-center gap-1.5 cursor-pointer">
                              <RadioGroupItem id={`admin-cond-damaged-${unit.rentalUnitAssignmentId}`} value="DAMAGED" />
                              <label
                                className="cursor-pointer font-medium text-rose-700"
                                htmlFor={`admin-cond-damaged-${unit.rentalUnitAssignmentId}`}
                              >
                                DAMAGED (Hư hại)
                              </label>
                            </div>
                          </RadioGroup>
                        </div>

                        {insp.condition === "DAMAGED" && (
                          <div className="rounded border border-rose-200 bg-rose-50/50 p-2.5 space-y-2">
                            <div className="space-y-1">
                              <label
                                className="font-semibold text-rose-950 flex items-center gap-1"
                                htmlFor={`admin-desc-${unit.rentalUnitAssignmentId}`}
                              >
                                <AlertTriangle className="size-3.5 text-rose-600" />
                                Mô tả hư hại <span className="text-rose-600">*</span>
                              </label>
                              <Textarea
                                id={`admin-desc-${unit.rentalUnitAssignmentId}`}
                                maxLength={2000}
                                onChange={(e) =>
                                  handleDescriptionChange(unit.rentalUnitAssignmentId, e.target.value)
                                }
                                placeholder="Ghi chú chi tiết hư hỏng phát hiện..."
                                required
                                rows={2}
                                value={insp.description}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <span className="font-semibold text-rose-950 flex items-center gap-1">
                                <ImagePlus className="size-3.5 text-rose-600" />
                                Ảnh hiện trạng ({insp.uploadedMedia.length}/10){" "}
                                <span className="text-rose-600">*</span>
                              </span>

                              <div className="flex flex-wrap items-center gap-3">
                                <MediaAvatarUpload
                                  accept="image/*"
                                  disabled={isSubmitting}
                                  mode="multiple"
                                  onChange={(_, upload) => {
                                    const uploads = Array.isArray(upload) ? upload : [upload];
                                    setInspections((prev) => {
                                      const current = prev[unit.rentalUnitAssignmentId]?.uploadedMedia ?? [];
                                      const newMedia = uploads.map((res) => ({
                                        mediaId: res.mediaId,
                                        previewUrl: res.previewUrl || `/api/v1/media/${encodeURIComponent(res.mediaId)}/content`,
                                      }));
                                      return {
                                        ...prev,
                                        [unit.rentalUnitAssignmentId]: {
                                          ...(prev[unit.rentalUnitAssignmentId] || { condition: "DAMAGED", description: "", uploadedMedia: [] }),
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
                                      onClick={() => handleRemovePhoto(unit.rentalUnitAssignmentId, pIdx)}
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
          </div>

          {/* Actual return time if ConfirmReceived */}
          {decision === "ConfirmReceived" && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold" htmlFor="admin-actual-return-at">
                Thời điểm thực nhận công nhận <span className="text-red-500">*</span>
              </label>
              <Input
                id="admin-actual-return-at"
                max={formatLocalDefaultDateTime()}
                onChange={(e) => setActualReturnAt(e.target.value)}
                required
                type="datetime-local"
                value={actualReturnAt}
              />
            </div>
          )}

          {/* Decision Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="admin-decision-note">
              Ghi chú phân xử (Bắt buộc) <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="admin-decision-note"
              maxLength={2000}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Ghi rõ căn cứ (đối chiếu camera kho, biên bản bàn giao, liên hệ các bên...)"
              required
              rows={3}
              value={decisionNote}
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
              className={decision === "ConfirmReceived" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
              disabled={isSubmitting || !decisionNote.trim() || selectedAssignmentIds.length === 0}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang ghi nhận...
                </>
              ) : decision === "ConfirmReceived" ? (
                "Xác nhận thực nhận"
              ) : (
                "Xác nhận bác yêu cầu"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
