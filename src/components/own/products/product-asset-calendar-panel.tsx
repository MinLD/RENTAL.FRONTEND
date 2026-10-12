"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { DataTableState } from "@/components/data-table";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { ResourcePanel } from "@/components/layout/resource-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CALENDAR_BLOCK_REASON_OPTIONS } from "@/config/inventory";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  inventoryCalendarBlockFormSchema,
  type InventoryCalendarBlockFormValues,
} from "@/lib/validations/inventory-product";
import type { ApiResult } from "@/services/api-error";
import type {
  CalendarBlockReason,
  InventoryAssetCalendarEntry,
  InventoryCalendarBlock,
} from "@/types/inventory";
import { formatCalendarDate, getTodayDate } from "@/utils/calendar";
import { formatEquipmentListingDate } from "@/utils/inventory";
import type { ProductPageActions } from "./product-management-types";

export function ProductAssetCalendarPanel({
  assetId,
  actions,
  onChanged,
  onBusyChange,
}: {
  assetId: string;
  actions: Pick<
    ProductPageActions,
    "fetchAssetCalendar" | "createCalendarBlock" | "deleteCalendarBlock"
  >;
  onChanged: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const requestCalendar = useCallback(
    () => actions.fetchAssetCalendar(assetId),
    [actions, assetId],
  );
  const calendar = useApiResource(requestCalendar);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<InventoryAssetCalendarEntry | null>(null);
  const [pending, setPending] = useState<"create" | "delete" | null>(null);
  const mutationRef = useRef(false);

  async function createBlock(values: InventoryCalendarBlockFormValues) {
    if (mutationRef.current) return;
    mutationRef.current = true;
    setPending("create");
    onBusyChange(true);
    try {
      const result = await actions.createCalendarBlock(assetId, {
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason as CalendarBlockReason,
        note: values.note || null,
      });
      if (result.success) {
        setIsCreating(false);
        toast.success("Đã thêm khoảng chặn lịch.");
        onChanged();
        void calendar.refresh();
      } else toast.error(result.error.message);
      return result;
    } finally {
      mutationRef.current = false;
      setPending(null);
      onBusyChange(false);
    }
  }

  async function deleteBlock() {
    if (mutationRef.current || !deleteTarget || !isBlock(deleteTarget.type))
      return;
    mutationRef.current = true;
    setPending("delete");
    onBusyChange(true);
    try {
      const result = await actions.deleteCalendarBlock(
        assetId,
        deleteTarget.id,
      );
      if (result.success) {
        setDeleteTarget(null);
        toast.success("Đã xóa khoảng chặn lịch.");
        onChanged();
        void calendar.refresh();
      } else toast.error(result.error.message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể xóa khoảng chặn lịch.",
      );
    } finally {
      mutationRef.current = false;
      setPending(null);
      onBusyChange(false);
    }
  }

  const disabled = Boolean(pending) || calendar.isLoading;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Lịch sử dụng của máy</h2>
        <Button
          disabled={disabled || isCreating}
          onClick={() => setIsCreating(true)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Plus className="size-4" /> Thêm khoảng chặn
        </Button>
      </div>
      {isCreating ? (
        <CalendarBlockForm
          isSubmitting={pending === "create"}
          onCancel={() => setIsCreating(false)}
          onSubmit={createBlock}
        />
      ) : null}
      <ResourcePanel
        error={calendar.error}
        isLoading={calendar.isLoading && !calendar.data}
        onRetry={() => void calendar.refresh()}
      >
        {calendar.data ? (
          <p className="text-xs text-muted-foreground">
            Từ {formatCalendarDate(calendar.data.startDate)} đến{" "}
            {formatCalendarDate(calendar.data.endDate)}
          </p>
        ) : null}
        {calendar.data?.entries?.length ? (
          <div className="space-y-3">
            {[...calendar.data.entries]
              .sort((a, b) => a.startDate.localeCompare(b.startDate))
              .map((entry) => (
                <article
                  className="min-w-0 space-y-2 rounded border border-border p-4"
                  key={entry.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {formatCalendarDate(entry.startDate)} –{" "}
                      {formatCalendarDate(entry.endDate)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isBlock(entry.type) ? "warning" : "muted"}
                      >
                        {getEntryLabel(entry.type)}
                      </Badge>
                      {isBlock(entry.type) ? (
                        <Button
                          aria-label="Xóa khoảng chặn"
                          title="Xóa khoảng chặn"
                          disabled={disabled}
                          onClick={() => setDeleteTarget(entry)}
                          size="icon"
                          type="button"
                          variant="default"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {entry.reason ? (
                    <p className="break-words text-xs text-muted-foreground">
                      {getReasonLabel(entry.reason)}
                    </p>
                  ) : null}
                  {entry.note ? (
                    <p className="whitespace-pre-line break-words text-sm">
                      {entry.note}
                    </p>
                  ) : null}
                  {entry.holdExpiresAt ? (
                    <p className="text-xs text-muted-foreground">
                      Hết hạn giữ chỗ:{" "}
                      {formatEquipmentListingDate(entry.holdExpiresAt)}
                    </p>
                  ) : null}
                </article>
              ))}
          </div>
        ) : (
          <div className="grid place-items-center">
            <DataTableState message="Máy chưa có lịch sử dụng trong khoảng thời gian này." />
          </div>
        )}
      </ResourcePanel>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !mutationRef.current) setDeleteTarget(null);
        }}
        title="Xóa khoảng chặn lịch?"
        description={
          deleteTarget
            ? `Xóa khoảng chặn từ ${formatCalendarDate(deleteTarget.startDate)} đến ${formatCalendarDate(deleteTarget.endDate)} của máy này.`
            : ""
        }
        confirmLabel="Xóa khoảng chặn"
        submittingLabel="Đang xóa..."
        isSubmitting={pending === "delete"}
        onConfirm={() => void deleteBlock()}
        variant="danger"
        icon={<Trash2 className="size-5" />}
      />
    </section>
  );
}

function CalendarBlockForm({
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (
    values: InventoryCalendarBlockFormValues,
  ) => Promise<ApiResult<InventoryCalendarBlock> | undefined>;
}) {
  const form = useForm<InventoryCalendarBlockFormValues>({
    defaultValues: {
      startDate: getTodayDate(),
      endDate: getTodayDate(),
      reason: "",
      note: "",
    },
    resolver: zodResolver(inventoryCalendarBlockFormSchema),
  });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  async function submit(values: InventoryCalendarBlockFormValues) {
    if (isSubmitting) return;
    form.clearErrors();
    try {
      const result = await onSubmit(values);
      if (result && !result.success) {
        form.setError("root.server", { message: result.error.message });
        for (const [path, messages] of Object.entries(
          result.error.fieldErrors,
        )) {
          const key = path.replace(/^\$\./, "").toLowerCase();
          const field = (
            ["startDate", "endDate", "reason", "note"] as const
          ).find((name) => name.toLowerCase() === key);
          if (field) form.setError(field, { message: messages.join("\n") });
        }
      }
    } catch (error) {
      form.setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "Không thể tạo khoảng chặn lịch.",
      });
    }
  }
  return (
    <form
      className="space-y-4 rounded border border-border p-4"
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <h3 className="text-sm font-semibold">Thêm khoảng chặn</h3>
      {form.formState.errors.root?.server?.message ? (
        <p
          className="whitespace-pre-line break-words text-sm text-error"
          role="alert"
        >
          {form.formState.errors.root.server.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          {...form.register("startDate")}
          id="own-block-start"
          label="Ngày bắt đầu"
          type="date"
          required
          disabled={isSubmitting}
          error={form.formState.errors.startDate?.message}
        />
        <TextField
          {...form.register("endDate")}
          id="own-block-end"
          label="Ngày kết thúc"
          type="date"
          min={startDate || undefined}
          required
          disabled={isSubmitting}
          error={form.formState.errors.endDate?.message}
        />
      </div>
      <div className="space-y-1.5">
        <label
          className="block text-xs font-semibold uppercase text-foreground"
          htmlFor="own-block-reason"
        >
          Lý do chặn lịch<span className="ml-1 text-error">*</span>
        </label>
        <select
          {...form.register("reason")}
          aria-describedby={
            form.formState.errors.reason ? "own-block-reason-error" : undefined
          }
          aria-invalid={Boolean(form.formState.errors.reason)}
          className="h-10 w-full rounded border border-input bg-background px-3 text-base text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
          disabled={isSubmitting}
          id="own-block-reason"
          required
        >
          <option value="" disabled>
            Chọn lý do
          </option>
          {CALENDAR_BLOCK_REASON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {form.formState.errors.reason?.message ? (
          <p
            className="text-xs font-medium text-error"
            id="own-block-reason-error"
          >
            {form.formState.errors.reason.message}
          </p>
        ) : null}
      </div>
      <TextareaField
        {...form.register("note")}
        id="own-block-note"
        label="Ghi chú"
        placeholder="Thông tin thêm về khoảng chặn lịch."
        disabled={isSubmitting}
        error={form.formState.errors.note?.message}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          disabled={isSubmitting}
          onClick={onCancel}
          size="sm"
          type="button"
          variant="secondary"
        >
          Hủy
        </Button>
        <Button disabled={isSubmitting} size="sm" type="submit">
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isSubmitting ? "Đang tạo..." : "Tạo khoảng chặn"}
        </Button>
      </div>
    </form>
  );
}

function isBlock(type: string) {
  return ["block", "calendarblock"].includes(type?.trim().toLowerCase());
}
function getEntryLabel(type: string) {
  const labels: Record<string, string> = {
    hold: "Giữ chỗ",
    allocation: "Lịch thuê",
    booking: "Lịch thuê",
    rental: "Lịch thuê",
    block: "Chặn lịch",
    calendarblock: "Chặn lịch",
  };
  return labels[type?.trim().toLowerCase()] ?? type ?? "Lịch sử dụng";
}
function getReasonLabel(reason: string) {
  const normalizedReason = reason.trim().toLowerCase();
  return (
    CALENDAR_BLOCK_REASON_OPTIONS.find(
      (option) =>
        option.code === normalizedReason ||
        option.value.toLowerCase() === normalizedReason,
    )?.label ?? reason
  );
}
