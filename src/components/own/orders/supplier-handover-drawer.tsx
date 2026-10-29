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
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { handoverItem } from "@/services/rental-returns-service";
import type { ConditionEnum, HandoverUnitDto } from "@/types/rental-returns";
import type { SupplierOrderItem } from "@/types/supplier-orders";

type SupplierHandoverDrawerProps = {
  items: SupplierOrderItem[];
  subOrderCode?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type UnitHandoverFormState = {
  selected: boolean;
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
  items,
  subOrderCode,
  open,
  onOpenChange,
  onSuccess,
}: SupplierHandoverDrawerProps) {
  // Only items that can be handed over (or all items if in draft/ready)
  const handoverableItems = items.filter(
    (it) => it.status === "AWAITING_HANDOVER" || !it.handover?.actualHandoverAt,
  );

  const [actualHandoverAt, setActualHandoverAt] = useState<string>(formatLocalDefaultDateTime);
  const [generalNote, setGeneralNote] = useState("");
  const [unitStates, setUnitStates] = useState<Record<string, UnitHandoverFormState>>(() => {
    const init: Record<string, UnitHandoverFormState> = {};
    for (const it of items) {
      for (const u of it.units ?? []) {
        init[u.assignmentId] = {
          selected: true,
          condition: "NORMAL",
          note: "",
          uploadedMedia: [],
        };
      }
    }
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUnitState = (assignmentId: string): UnitHandoverFormState => {
    return (
      unitStates[assignmentId] ?? {
        selected: true,
        condition: "NORMAL",
        note: "",
        uploadedMedia: [],
      }
    );
  };

  const handleToggleUnit = (assignmentId: string) => {
    setUnitStates((prev) => {
      const current = prev[assignmentId] ?? {
        selected: true,
        condition: "NORMAL",
        note: "",
        uploadedMedia: [],
      };
      return {
        ...prev,
        [assignmentId]: { ...current, selected: !current.selected },
      };
    });
  };

  const handleConditionChange = (assignmentId: string, condition: ConditionEnum) => {
    setUnitStates((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] ?? { selected: true, condition: "NORMAL", note: "", uploadedMedia: [] }),
        condition,
      },
    }));
  };

  const handleUnitNoteChange = (assignmentId: string, note: string) => {
    setUnitStates((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] ?? { selected: true, condition: "NORMAL", note: "", uploadedMedia: [] }),
        note,
      },
    }));
  };

  const handleRemovePhoto = (assignmentId: string, indexToRemove: number) => {
    setUnitStates((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] ?? { selected: true, condition: "NORMAL", note: "", uploadedMedia: [] }),
        uploadedMedia: (prev[assignmentId]?.uploadedMedia ?? []).filter((_, idx) => idx !== indexToRemove),
      },
    }));
  };

  // Count total selected units
  const totalSelectedUnits = Object.values(unitStates).filter((u) => u.selected).length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!actualHandoverAt) {
      toast.error("Vui lòng chọn thời điểm bàn giao thực tế.");
      return;
    }

    const handoverTime = new Date(actualHandoverAt);
    if (Number.isNaN(handoverTime.getTime()) || handoverTime > new Date()) {
      toast.error("Thời điểm bàn giao không được ở tương lai.");
      return;
    }

    // Find which items have selected units
    const itemsToSubmit = handoverableItems.filter((it) =>
      (it.units ?? []).some((u) => getUnitState(u.assignmentId).selected),
    );

    if (!itemsToSubmit.length || totalSelectedUnits === 0) {
      toast.error("Vui lòng tích chọn ít nhất một máy để bàn giao.");
      return;
    }

    // Enforce that each selected unit must have at least 1 proof photo
    for (const it of itemsToSubmit) {
      for (const [idx, u] of (it.units ?? []).entries()) {
        const st = getUnitState(u.assignmentId);
        if (st.selected && !st.uploadedMedia.length) {
          toast.error(
            `Máy #${idx + 1} (${u.assignmentId.slice(-8)}) của "${it.name}" cần ít nhất một ảnh chụp bằng chứng bàn giao.`,
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      // Execute handover for all items that have selected units
      const requests = itemsToSubmit.map((it) => {
        const selectedUnits = (it.units ?? []).filter((u) => getUnitState(u.assignmentId).selected);
        const handoverUnits: HandoverUnitDto[] = selectedUnits.map((u) => {
          const st = getUnitState(u.assignmentId);
          return {
            assignmentId: u.assignmentId,
            condition: st.condition,
            note: st.note.trim() || null,
            mediaIds: st.uploadedMedia.map((m) => m.mediaId),
          };
        });

        return handoverItem(it.rentalItemId, {
          actualHandoverAt: handoverTime.toISOString(),
          note: generalNote.trim() || null,
          confirmed: true,
          units: handoverUnits,
        });
      });

      const results = await Promise.all(requests);
      const failed = results.find((r) => !r.success);
      if (failed && !failed.success) {
        toast.error(failed.error.message || "Không thể gửi bàn giao thiết bị.");
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
          ? `Đơn con: ${subOrderCode} · Chọn các thiết bị và máy con cần bàn giao`
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
            disabled={isSubmitting || totalSelectedUnits === 0}
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
                Xác nhận bàn giao ({totalSelectedUnits} máy)
              </>
            )}
          </Button>
        </div>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Bàn giao thiết bị"
    >
      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Chưa có thiết bị nào trong đơn thuê này.
        </div>
      ) : (
        <form className="space-y-5 p-1 text-xs" id="handover-form" onSubmit={handleSubmit}>
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

          {/* List of all equipment items with checkboxes */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="size-3.5 text-primary" />
                Danh sách thiết bị trong đơn ({items.length} dòng · {totalSelectedUnits} máy chọn)
              </h4>
              <span className="text-[11px] text-muted-foreground">Mỗi máy tối thiểu 1 ảnh</span>
            </div>

            <div className="space-y-4">
              {items.map((it) => {
                const itemUnits = it.units ?? [];
                const isHandedOver = Boolean(it.handover?.actualHandoverAt);

                return (
                  <div
                    className="rounded-xl border border-border/70 bg-background p-4 space-y-3.5 shadow-2xs"
                    key={it.rentalItemId}
                  >
                    {/* Item Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-primary shrink-0" />
                        <div>
                          <h5 className="font-bold text-sm text-foreground">
                            {it.name || "Thiết bị thuê"}
                          </h5>
                          <p className="text-[11px] text-muted-foreground">
                            Số lượng: <strong>{it.quantity} máy</strong> · Thời hạn thuê: {it.rentalDays} ngày
                          </p>
                        </div>
                      </div>

                      {isHandedOver && (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" /> Đã bàn giao
                        </span>
                      )}
                    </div>

                    {/* Assigned units with checkboxes */}
                    {itemUnits.length === 0 ? (
                      <p className="rounded border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                        Chưa có máy cụ thể nào được gán cho dòng thiết bị này.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {itemUnits.map((u, uIdx) => {
                          const st = getUnitState(u.assignmentId);

                          return (
                            <div
                              className={`rounded-lg border p-3 space-y-2.5 transition-colors ${
                                st.selected
                                  ? "border-primary/50 bg-background"
                                  : "border-border bg-muted/20 opacity-60"
                              }`}
                              key={u.assignmentId}
                            >
                              <div className="flex items-center justify-between">
                                <label
                                  className="flex cursor-pointer items-center gap-2 font-semibold text-sm"
                                  htmlFor={`chk-unit-${u.assignmentId}`}
                                >
                                  <Checkbox
                                    checked={st.selected}
                                    id={`chk-unit-${u.assignmentId}`}
                                    onCheckedChange={() => handleToggleUnit(u.assignmentId)}
                                  />
                                  <span>Máy #{uIdx + 1}</span>
                                </label>
                                <span className="font-mono text-muted-foreground text-[11px]">
                                  Mã: {u.assignmentId.slice(-8)}
                                </span>
                              </div>

                              {st.selected && (
                                <div className="space-y-2.5 pt-2 border-t border-border/50">
                                  {/* Condition Choice */}
                                  <div className="flex items-center gap-4">
                                    <span className="font-semibold text-muted-foreground">Tình trạng máy:</span>
                                    <RadioGroup
                                      className="flex items-center gap-3"
                                      onValueChange={(val) =>
                                        handleConditionChange(u.assignmentId, val as ConditionEnum)
                                      }
                                      value={st.condition}
                                    >
                                      <div className="flex items-center gap-1.5 cursor-pointer">
                                        <RadioGroupItem id={`norm-${u.assignmentId}`} value="NORMAL" />
                                        <label className="cursor-pointer font-medium text-emerald-700" htmlFor={`norm-${u.assignmentId}`}>
                                          Bình thường (NORMAL)
                                        </label>
                                      </div>
                                      <div className="flex items-center gap-1.5 cursor-pointer">
                                        <RadioGroupItem id={`dmg-${u.assignmentId}`} value="DAMAGED" />
                                        <label className="cursor-pointer font-medium text-rose-700" htmlFor={`dmg-${u.assignmentId}`}>
                                          Có trầy xước / hư hại
                                        </label>
                                      </div>
                                    </RadioGroup>
                                  </div>

                                  {/* Note */}
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-muted-foreground" htmlFor={`nt-${u.assignmentId}`}>
                                      Ghi chú tình trạng máy
                                    </label>
                                    <Input
                                      id={`nt-${u.assignmentId}`}
                                      maxLength={500}
                                      onChange={(e) => handleUnitNoteChange(u.assignmentId, e.target.value)}
                                      placeholder="Ví dụ: Máy hoạt động tốt, đã nạp đủ nhiên liệu..."
                                      value={st.note}
                                    />
                                  </div>

                                  {/* Photos via MediaAvatarUpload */}
                                  <div className="space-y-1.5">
                                    <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                                      <ImagePlus className="size-3 text-primary" />
                                      Ảnh chụp bàn giao ({st.uploadedMedia.length}/10) <span className="text-red-500">*</span>
                                    </span>

                                    <div className="flex flex-wrap items-center gap-3">
                                      <MediaAvatarUpload
                                        accept="image/*"
                                        disabled={isSubmitting}
                                        mode="multiple"
                                        onChange={(_, upload) => {
                                          const uploads = Array.isArray(upload) ? upload : [upload];
                                          setUnitStates((prev) => {
                                            const current = prev[u.assignmentId]?.uploadedMedia ?? [];
                                            const newMedia = uploads.map((res) => ({
                                              mediaId: res.mediaId,
                                              previewUrl: res.previewUrl || `/api/v1/media/${encodeURIComponent(res.mediaId)}/content`,
                                            }));
                                            return {
                                              ...prev,
                                              [u.assignmentId]: {
                                                ...(prev[u.assignmentId] ?? { selected: true, condition: "NORMAL", note: "", uploadedMedia: [] }),
                                                uploadedMedia: [...current, ...newMedia].slice(0, 10),
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
                                            onClick={() => handleRemovePhoto(u.assignmentId, pIdx)}
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
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      )}
    </FormDrawer>
  );
}
