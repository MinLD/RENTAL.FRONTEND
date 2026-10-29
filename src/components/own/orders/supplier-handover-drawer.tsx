"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  FileCheck,
  ImagePlus,
  Loader2,
  Package,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { FormDrawer } from "@/components/forms/form-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { handoverItem } from "@/services/rental-returns-service";
import type { ConditionEnum, HandoverUnitDto } from "@/types/rental-returns";
import type { SupplierOrderItem } from "@/types/supplier-orders";

type SupplierHandoverDrawerProps = {
  item: SupplierOrderItem | null;
  subOrderCode?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type UnitHandoverFormState = {
  condition: ConditionEnum;
  note: string;
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

export function SupplierHandoverDrawer({
  item,
  subOrderCode,
  open,
  onOpenChange,
  onSuccess,
}: SupplierHandoverDrawerProps) {
  const units = item?.units ?? [];

  const [actualHandoverAt, setActualHandoverAt] = useState<string>(formatLocalDefaultDateTime);
  const [generalNote, setGeneralNote] = useState("");
  const [unitStates, setUnitStates] = useState<Record<string, UnitHandoverFormState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUnitState = (assignmentId: string): UnitHandoverFormState => {
    return (
      unitStates[assignmentId] ?? {
        condition: "NORMAL",
        note: "",
        uploadedMedia: [],
      }
    );
  };

  const handleConditionChange = (assignmentId: string, condition: ConditionEnum) => {
    setUnitStates((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] ?? { condition: "NORMAL", note: "", uploadedMedia: [] }),
        condition,
      },
    }));
  };

  const handleUnitNoteChange = (assignmentId: string, note: string) => {
    setUnitStates((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] ?? { condition: "NORMAL", note: "", uploadedMedia: [] }),
        note,
      },
    }));
  };

  const handleRemovePhoto = (assignmentId: string, indexToRemove: number) => {
    setUnitStates((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] ?? { condition: "NORMAL", note: "", uploadedMedia: [] }),
        uploadedMedia: (prev[assignmentId]?.uploadedMedia ?? []).filter((_, idx) => idx !== indexToRemove),
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!item) return;

    if (!actualHandoverAt) {
      toast.error("Vui lòng chọn thời điểm bàn giao thực tế.");
      return;
    }

    const handoverTime = new Date(actualHandoverAt);
    if (Number.isNaN(handoverTime.getTime()) || handoverTime > new Date()) {
      toast.error("Thời điểm bàn giao không được ở tương lai.");
      return;
    }

    if (!units.length) {
      toast.error("Chưa có máy nào được gán cho mục thuê này.");
      return;
    }

    // Enforce that each unit must have at least 1 proof photo
    for (const [idx, unit] of units.entries()) {
      const st = getUnitState(unit.assignmentId);
      if (!st.uploadedMedia.length) {
        toast.error(`Máy #${idx + 1} (${unit.assignmentId.slice(-8)}) cần ít nhất một ảnh chụp bằng chứng bàn giao.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const handoverUnits: HandoverUnitDto[] = units.map((u) => {
        const st = getUnitState(u.assignmentId);
        return {
          assignmentId: u.assignmentId,
          condition: st.condition,
          note: st.note.trim() || null,
          mediaIds: st.uploadedMedia.map((m) => m.mediaId),
        };
      });

      const result = await handoverItem(item.rentalItemId, {
        actualHandoverAt: handoverTime.toISOString(),
        note: generalNote.trim() || null,
        confirmed: true,
        units: handoverUnits,
      });

      if (!result.success) {
        toast.error(result.error.message || "Không thể gửi bàn giao thiết bị.");
        return;
      }

      toast.success("Đã gửi bàn giao thiết bị thành công! Đang chờ hệ thống xác nhận.");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Đã xảy ra lỗi khi gửi bàn giao.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <FormDrawer
      className="sm:max-w-2xl"
      description={
        subOrderCode
          ? `Đơn con: ${subOrderCode} · Thiết bị: ${item?.name || "Thiết bị thuê"}`
          : "Gửi bằng chứng kiểm tra và bàn giao thiết bị cho người thuê"
      }
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            size="sm"
            type="button"
            variant="secondary"
          >
            Đóng
          </Button>
          <Button
            disabled={isSubmitting || !units.length}
            form="handover-form"
            size="sm"
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 size-4" />
                Xác nhận bàn giao
              </>
            )}
          </Button>
        </div>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Bằng chứng bàn giao thiết bị"
    >
      {!item ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Chưa chọn thiết bị để bàn giao.
        </div>
      ) : (
        <form className="space-y-5 p-1 text-xs" id="handover-form" onSubmit={handleSubmit}>
          {/* Header Card */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Package className="size-4 text-primary" />
              {item.name || "Thiết bị thuê"}
            </h4>
            <p className="text-muted-foreground">
              Số lượng: <strong>{item.quantity} máy</strong> · Thời hạn thuê: {item.rentalDays} ngày
            </p>
          </div>

          {/* Actual handover datetime */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground" htmlFor="handover-datetime">
              <Calendar className="size-3.5 text-primary" />
              Thời điểm bàn giao thực tế <span className="text-red-500">*</span>
            </label>
            <Input
              id="handover-datetime"
              max={formatLocalDefaultDateTime()}
              onChange={(e) => setActualHandoverAt(e.target.value)}
              required
              type="datetime-local"
              value={actualHandoverAt}
            />
            <p className="text-[11px] text-muted-foreground">
              Thời điểm máy được giao tại công trình hoặc bàn giao cho bên thuê (không được ở tương lai).
            </p>
          </div>

          {/* General note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="handover-note">
              Ghi chú bàn giao chung (tùy chọn)
            </label>
            <Textarea
              id="handover-note"
              maxLength={2000}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder="Ví dụ: Bàn giao đủ phụ kiện và tài liệu kỹ thuật tại cổng công trình..."
              rows={2}
              value={generalNote}
            />
          </div>

          {/* Units inspection and proof photos */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="size-3.5 text-primary" />
                Kiểm tra & Bằng chứng từng máy ({units.length} máy)
              </h4>
              <span className="text-[11px] text-muted-foreground">Mỗi máy tối thiểu 1 ảnh</span>
            </div>

            {units.length === 0 ? (
              <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Chưa có máy cụ thể nào được gán cho dòng thiết bị này. Vui lòng kiểm tra lại trạng thái gán máy.
              </p>
            ) : (
              <div className="space-y-3">
                {units.map((unit, index) => {
                  const st = getUnitState(unit.assignmentId);

                  return (
                    <div
                      className="rounded-lg border border-border/70 bg-background p-3.5 space-y-3 shadow-2xs"
                      key={unit.assignmentId}
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="font-bold text-sm text-foreground">
                          Máy #{index + 1}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          Mã: {unit.assignmentId.slice(-8)}
                        </span>
                      </div>

                      {/* Condition choice */}
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-muted-foreground">Tình trạng máy:</span>
                        <RadioGroup
                          className="flex items-center gap-3"
                          onValueChange={(val) =>
                            handleConditionChange(unit.assignmentId, val as ConditionEnum)
                          }
                          value={st.condition}
                        >
                          <div className="flex items-center gap-1.5 cursor-pointer">
                            <RadioGroupItem id={`normal-${unit.assignmentId}`} value="NORMAL" />
                            <label className="cursor-pointer font-medium text-emerald-700" htmlFor={`normal-${unit.assignmentId}`}>
                              Bình thường (NORMAL)
                            </label>
                          </div>
                          <div className="flex items-center gap-1.5 cursor-pointer">
                            <RadioGroupItem id={`damaged-${unit.assignmentId}`} value="DAMAGED" />
                            <label className="cursor-pointer font-medium text-rose-700" htmlFor={`damaged-${unit.assignmentId}`}>
                              Có trầy xước / hư hại
                            </label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Note for this unit */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground" htmlFor={`note-${unit.assignmentId}`}>
                          Ghi chú tình trạng máy
                        </label>
                        <Input
                          id={`note-${unit.assignmentId}`}
                          maxLength={500}
                          onChange={(e) => handleUnitNoteChange(unit.assignmentId, e.target.value)}
                          placeholder="Ví dụ: Máy hoạt động tốt, đã kiểm tra động cơ và đồng hồ giờ..."
                          value={st.note}
                        />
                      </div>

                      {/* Photos via built-in MediaAvatarUpload */}
                      <div className="space-y-2">
                        <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                          <ImagePlus className="size-3 text-primary" />
                          Ảnh chụp bàn giao ({st.uploadedMedia.length}/10){" "}
                          <span className="text-red-500">*</span>
                        </span>

                        <div className="flex flex-wrap items-center gap-3">
                          <MediaAvatarUpload
                            accept="image/*"
                            disabled={isSubmitting}
                            mode="multiple"
                            onChange={(_, upload) => {
                              const uploads = Array.isArray(upload) ? upload : [upload];
                              setUnitStates((prev) => {
                                const currentMedia = prev[unit.assignmentId]?.uploadedMedia ?? [];
                                const newMedia = uploads.map((res) => ({
                                  mediaId: res.mediaId,
                                  previewUrl: res.previewUrl || `/api/v1/media/${encodeURIComponent(res.mediaId)}/content`,
                                }));
                                return {
                                  ...prev,
                                  [unit.assignmentId]: {
                                    ...(prev[unit.assignmentId] ?? { condition: "NORMAL", note: "", uploadedMedia: [] }),
                                    uploadedMedia: [...currentMedia, ...newMedia].slice(0, 10),
                                  },
                                };
                              });
                            }}
                            size="md"
                            uploadLabel="Thêm ảnh"
                            variant="add"
                          />

                          {st.uploadedMedia.map((photo, pIdx) => (
                            <div
                              className="relative size-20 rounded-lg"
                              key={photo.mediaId}
                            >
                              <div className="size-full overflow-hidden rounded-lg border border-border bg-background">
                                <AvatarWithSkeleton
                                  alt={`Ảnh bàn giao ${pIdx + 1}`}
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
                  );
                })}
              </div>
            )}
          </div>
        </form>
      )}
    </FormDrawer>
  );
}
