"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormDrawer } from "@/components/forms/form-drawer";
import { TextareaField } from "@/components/forms/textarea-field";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/forms/text-field";
import { ResourcePanel } from "@/components/layout/resource-panel";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  inventoryAssetFormSchema,
  inventoryAssetBookingsFormSchema,
  type InventoryAssetBookingsFormValues,
  type InventoryAssetFormValues,
} from "@/lib/validations/inventory-product";
import type { ApiResult } from "@/services/api-error";
import type {
  InventoryAsset,
  UpdateInventoryAssetRequest,
} from "@/types/inventory";
import { formatEquipmentListingDate } from "@/utils/inventory";
import { ProductAssetCalendarPanel } from "./product-asset-calendar-panel";
import type { ProductPageActions } from "./product-management-types";

const ASSET_FORM_ID = "own-asset-form";
const BOOKINGS_FORM_ID = "own-asset-bookings-form";

export function ProductAssetDrawer({
  actions,
  productId,
  productName,
  selectedAsset,
  initialMode,
  onClose,
  onChanged,
}: {
  actions: ProductPageActions;
  productId: string;
  productName: string;
  selectedAsset: InventoryAsset | null;
  initialMode: "create" | "view" | "edit";
  onClose: () => void;
  onChanged: () => void;
}) {
  const mode = initialMode === "create" ? "create" : "edit";
  const [activeTab, setActiveTab] = useState("information");
  const [visitedTabs, setVisitedTabs] = useState(["information"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const assetId = selectedAsset?.id ?? "";
  const requestAsset = useCallback(
    () => actions.fetchAsset(assetId),
    [actions, assetId],
  );
  const asset = useApiResource(requestAsset, Boolean(assetId));
  const onCalendarBusyChange = useCallback((busy: boolean) => {
    submittingRef.current = busy;
    setIsSubmitting(busy);
  }, []);
  const data = asset.data;

  async function saveAsset(values: InventoryAssetFormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      let result: ApiResult<InventoryAsset>;
      if (mode === "create")
        result = await actions.createAsset(productId, {
          serialNumber: values.serialNumber,
        });
      else {
        const request: UpdateInventoryAssetRequest = {};
        if (values.serialNumber !== data?.serialNumber)
          request.serialNumber = values.serialNumber;
        const year = values.manufactureYear
          ? Number(values.manufactureYear)
          : null;
        if (year !== data?.manufactureYear) request.manufactureYear = year;
        result = await actions.updateAsset(assetId, request);
      }
      if (result.success) {
        toast.success(
          mode === "create" ? "Đã thêm máy vật lý." : "Đã cập nhật máy vật lý.",
        );
        onChanged();
        if (mode === "create") onClose();
        else {
          asset.setData(result.data);
        }
      } else toast.error(result.error.message);
      return result;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function saveBookings(values: InventoryAssetBookingsFormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const result = await actions.updateAssetBookings(assetId, {
        acceptingBookings: values.acceptingBookings,
        reason: values.acceptingBookings ? null : values.reason || null,
      });
      if (result.success) {
        asset.setData(result.data);
        onChanged();
        toast.success("Đã cập nhật trạng thái nhận đặt thuê.");
      } else toast.error(result.error.message);
      return result;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <FormDrawer
      activeTab={mode === "edit" ? activeTab : undefined}
      onTabChange={(tab) => {
        if (submittingRef.current) return;
        setActiveTab(tab);
        setVisitedTabs((tabs) => (tabs.includes(tab) ? tabs : [...tabs, tab]));
      }}
      tabs={
        mode === "edit"
          ? [
              { label: "Thông tin", value: "information" },
              { label: "Nhận đặt thuê", value: "bookings" },
              { label: "Lịch sử dụng", value: "calendar" },
            ]
          : undefined
      }
      className="sm:max-w-2xl"
      description={productName}
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          {mode === "create" ||
          (data && !asset.error && activeTab !== "calendar") ? (
            <Button
              disabled={isSubmitting || asset.isLoading}
              form={activeTab === "bookings" ? BOOKINGS_FORM_ID : ASSET_FORM_ID}
              size="sm"
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              {isSubmitting
                ? "Đang lưu..."
                : mode === "create"
                  ? "Thêm máy"
                  : activeTab === "bookings"
                    ? "Lưu trạng thái"
                    : "Lưu thay đổi"}
            </Button>
          ) : null}
          <Button
            disabled={isSubmitting}
            onClick={onClose}
            size="sm"
            type="button"
            variant="secondary"
          >
            Đóng
          </Button>
        </div>
      }
      onOpenChange={(open) => {
        if (!open && !submittingRef.current) onClose();
      }}
      open
      title={mode === "create" ? "Thêm máy vật lý" : "Chi tiết máy vật lý"}
    >
      {mode === "create" ? (
        <InventoryAssetForm
          isSubmitting={isSubmitting}
          mode="create"
          onSubmit={saveAsset}
        />
      ) : (
        <ResourcePanel
          error={asset.error}
          isLoading={asset.isLoading && !data}
          onRetry={() => void asset.refresh()}
        >
          {data ? (
            <div className="space-y-5">
              <div hidden={activeTab !== "information"}>
                <InventoryAssetForm
                  asset={data}
                  isSubmitting={isSubmitting}
                  key={data.id}
                  mode="edit"
                  onSubmit={saveAsset}
                />
              </div>
              {visitedTabs.includes("bookings") ? (
                <div hidden={activeTab !== "bookings"}>
                  <InventoryAssetBookingsForm
                    asset={data}
                    isSubmitting={isSubmitting}
                    onSubmit={saveBookings}
                    key={data.id}
                  />
                </div>
              ) : null}
              {visitedTabs.includes("calendar") ? (
                <div hidden={activeTab !== "calendar"}>
                  <ProductAssetCalendarPanel
                    actions={actions}
                    assetId={assetId}
                    onChanged={onChanged}
                    onBusyChange={onCalendarBusyChange}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </ResourcePanel>
      )}
    </FormDrawer>
  );
}

function InventoryAssetForm({
  asset,
  mode,
  isSubmitting,
  onSubmit,
}: {
  asset?: InventoryAsset;
  mode: "create" | "edit";
  isSubmitting: boolean;
  onSubmit: (
    values: InventoryAssetFormValues,
  ) => Promise<ApiResult<InventoryAsset> | undefined>;
}) {
  const form = useForm<InventoryAssetFormValues>({
    defaultValues: {
      serialNumber: asset?.serialNumber ?? "",
      manufactureYear: asset?.manufactureYear?.toString() ?? "",
    },
    resolver: zodResolver(inventoryAssetFormSchema),
  });
  async function submit(values: InventoryAssetFormValues) {
    if (isSubmitting) return;
    form.clearErrors();
    try {
      const result = await onSubmit(values);
      if (result?.success) {
        form.reset({
          serialNumber: result.data.serialNumber ?? "",
          manufactureYear: result.data.manufactureYear?.toString() ?? "",
        });
      } else if (result) {
        form.setError("root.server", { message: result.error.message });
        for (const [path, messages] of Object.entries(
          result.error.fieldErrors,
        )) {
          const key = path.replace(/^\$\./, "").toLowerCase();
          if (key === "serialnumber" || key === "manufactureyear")
            form.setError(
              key === "serialnumber" ? "serialNumber" : "manufactureYear",
              { message: messages.join("\n") },
            );
        }
      }
    } catch (failure) {
      form.setError("root.server", {
        message:
          failure instanceof Error
            ? failure.message
            : "Không thể lưu máy vật lý.",
      });
    }
  }
  return (
    <form
      className="space-y-5"
      id={ASSET_FORM_ID}
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      {form.formState.errors.root?.server?.message ? (
        <p
          className="rounded border border-error/20 bg-error/5 p-3 text-sm text-error"
          role="alert"
        >
          {form.formState.errors.root.server.message}
        </p>
      ) : null}
      {asset ? (
        <>
          <h2 className="text-sm font-semibold">Thông tin máy vật lý</h2>
          <TextField
            disabled
            id="own-asset-code"
            label="Mã máy"
            value={asset.assetCode || "—"}
          />
        </>
      ) : null}
      <div
        className={mode === "edit" ? "grid gap-5 sm:grid-cols-2" : undefined}
      >
        <TextField
          {...form.register("serialNumber")}
          disabled={isSubmitting}
          error={form.formState.errors.serialNumber?.message}
          id="own-asset-serial"
          label="Số serial"
          placeholder="VD: MIC-SLX24-002"
          required
        />
        {mode === "edit" ? (
          <TextField
            {...form.register("manufactureYear")}
            disabled={isSubmitting}
            error={form.formState.errors.manufactureYear?.message}
            id="own-asset-year"
            inputMode="numeric"
            label="Năm sản xuất"
            maxLength={4}
            placeholder="VD: 2024"
          />
        ) : null}
      </div>
      {asset ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              disabled
              id="own-asset-created"
              label="Ngày thêm"
              value={formatEquipmentListingDate(asset.createdAt)}
            />
            <TextField
              disabled
              id="own-asset-updated"
              label="Cập nhật"
              value={formatEquipmentListingDate(asset.updatedAt)}
            />
          </div>
        </>
      ) : null}
    </form>
  );
}

function InventoryAssetBookingsForm({
  asset,
  isSubmitting,
  onSubmit,
}: {
  asset: InventoryAsset;
  isSubmitting: boolean;
  onSubmit: (
    values: InventoryAssetBookingsFormValues,
  ) => Promise<ApiResult<InventoryAsset> | undefined>;
}) {
  const form = useForm<InventoryAssetBookingsFormValues>({
    defaultValues: {
      acceptingBookings: asset.acceptingBookings,
      reason: asset.suspensionReason ?? "",
    },
    resolver: zodResolver(inventoryAssetBookingsFormSchema),
  });
  const acceptingBookings = useWatch({
    control: form.control,
    name: "acceptingBookings",
  });

  async function submit(values: InventoryAssetBookingsFormValues) {
    if (isSubmitting) return;
    form.clearErrors();
    try {
      const result = await onSubmit(values);
      if (result?.success) {
        form.reset({
          acceptingBookings: result.data.acceptingBookings,
          reason: result.data.suspensionReason ?? "",
        });
      } else if (result) {
        form.setError("root.server", { message: result.error.message });
        for (const [path, messages] of Object.entries(
          result.error.fieldErrors,
        )) {
          const key = path.replace(/^\$\./, "").toLowerCase();
          if (key === "acceptingbookings" || key === "reason")
            form.setError(key === "reason" ? "reason" : "acceptingBookings", {
              message: messages.join("\n"),
            });
        }
      }
    } catch (error) {
      form.setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái nhận đặt thuê.",
      });
    }
  }

  return (
    <form
      className="space-y-5"
      id={BOOKINGS_FORM_ID}
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      {form.formState.errors.root?.server?.message ? (
        <p
          className="rounded border border-error/20 bg-error/5 p-3 text-sm text-error"
          role="alert"
        >
          {form.formState.errors.root.server.message}
        </p>
      ) : null}
      <Controller
        control={form.control}
        name="acceptingBookings"
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <label
              className="flex items-center gap-3 text-sm font-semibold"
              htmlFor="own-asset-accepting-bookings"
            >
              <Checkbox
                id="own-asset-accepting-bookings"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                ref={field.ref}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldState.error)}
                aria-describedby={
                  fieldState.error
                    ? "own-asset-accepting-bookings-error"
                    : undefined
                }
              />
              Nhận đặt thuê
            </label>
            {fieldState.error?.message ? (
              <p
                className="text-xs text-error"
                id="own-asset-accepting-bookings-error"
              >
                {fieldState.error.message}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {acceptingBookings
                ? "Máy đang nhận các yêu cầu đặt thuê mới."
                : "Máy tạm ngừng nhận các yêu cầu đặt thuê mới."}
            </p>
          </div>
        )}
      />
      <TextareaField
        {...form.register("reason")}
        id="own-asset-bookings-reason"
        label="Lý do tạm ngừng"
        placeholder="VD: Máy đang bảo trì hoặc cần kiểm tra."
        className="min-h-24"
        disabled={isSubmitting || acceptingBookings}
        error={form.formState.errors.reason?.message}
      />
    </form>
  );
}
