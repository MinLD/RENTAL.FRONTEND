"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, LoaderCircle, MapPin, RefreshCw, Save, Warehouse as WarehouseIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SearchableSelectField } from "@/components/forms/searchable-select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiResource } from "@/hooks/use-api-resource";
import { VIETNAM_PROVINCES } from "@/lib/locations/vietnam-divisions";
import {
  warehouseFormSchema,
  type Warehouse,
  type WarehouseFormValues,
  type WarehouseRequest,
} from "@/lib/validations/warehouse";
import type { ApiResult } from "@/services/api-error";

type WarehouseManagementProps = {
  fetchWarehouse: () => Promise<ApiResult<Warehouse | null>>;
  saveWarehouse: (request: WarehouseRequest) => Promise<ApiResult<Warehouse>>;
};

const PROVINCE_OPTIONS = VIETNAM_PROVINCES.map(({ code, name }) => ({ value: code, label: name }));

function getFormValues(warehouse: Warehouse | null): WarehouseFormValues {
  return {
    addressDetail: warehouse?.addressDetail ?? "",
    provinceCode: warehouse?.provinceCode ?? "",
    wardCode: warehouse?.wardCode ?? "",
    latitude: warehouse?.latitude == null ? "" : String(warehouse.latitude),
    longitude: warehouse?.longitude == null ? "" : String(warehouse.longitude),
  };
}

export function WarehouseManagement({ fetchWarehouse, saveWarehouse }: WarehouseManagementProps) {
  const { data: warehouse, error, isLoading, refresh, setData } = useApiResource(fetchWarehouse);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
        <header className="space-y-1">
          <h1 className="text-xl font-bold text-foreground">Quản lý địa chỉ kho</h1>
          <p className="text-sm text-muted-foreground">
            Thiết lập địa chỉ kho dùng chung cho toàn bộ thiết bị cho thuê của bạn.
          </p>
        </header>

        {isLoading ? (
          <div aria-label="Đang tải địa chỉ kho" className="space-y-5 rounded-lg border border-border p-5" role="status">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-16 w-full" />
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => <Skeleton className="h-16 w-full" key={index} />)}
            </div>
            <span className="sr-only">Đang tải địa chỉ kho...</span>
          </div>
        ) : error ? (
          <div className="space-y-4 rounded-lg border border-error/30 bg-error/5 p-5" role="alert">
            <p className="flex items-start gap-2 text-sm text-error">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{error}
            </p>
            <Button onClick={() => void refresh()} type="button" variant="secondary">
              <RefreshCw aria-hidden="true" className="size-4" />Thử lại
            </Button>
          </div>
        ) : (
          <WarehouseAddressForm
            key={warehouse ? `warehouse-${warehouse.version}` : "new-warehouse"}
            onSaved={setData}
            onReload={refresh}
            saveWarehouse={saveWarehouse}
            warehouse={warehouse}
          />
        )}
      </div>
    </div>
  );
}

function WarehouseAddressForm({ warehouse, saveWarehouse, onSaved, onReload }: {
  warehouse: Warehouse | null;
  saveWarehouse: WarehouseManagementProps["saveWarehouse"];
  onSaved: (warehouse: Warehouse) => void;
  onReload: () => Promise<void>;
}) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const savingRef = useRef(false);
  const {
    control, register, setValue, setError, reset, handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WarehouseFormValues, unknown, WarehouseRequest>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: getFormValues(warehouse),
  });
  const provinceCode = useWatch({ control, name: "provinceCode" });
  const addressDetail = useWatch({ control, name: "addressDetail" });
  const wardOptions = useMemo(() => (
    VIETNAM_PROVINCES.find((province) => province.code === provinceCode)?.wards ?? []
  ).map(({ code, name }) => ({ value: code, label: name })), [provinceCode]);
  const savedAddress = [warehouse?.addressDetail, warehouse?.wardName, warehouse?.provinceName]
    .filter(Boolean).join(", ");

  async function submit(values: WarehouseRequest) {
    if (savingRef.current || hasConflict) return;
    savingRef.current = true;
    setSaveError(null);
    try {
      const result = await saveWarehouse({
        addressDetail: values.addressDetail,
        provinceCode: values.provinceCode,
        wardCode: values.wardCode,
        latitude: values.latitude,
        longitude: values.longitude,
        ...(warehouse ? { expectedVersion: warehouse.version } : {}),
      });
      if (!result.success) {
        setSaveError(result.error.message);
        setHasConflict(result.error.status === 409);
        const fields = ["addressDetail", "provinceCode", "wardCode", "latitude", "longitude"] as const;
        for (const [name, messages] of Object.entries(result.error.fieldErrors)) {
          const field = fields.find((field) => field.toLowerCase() === name.replace(/^\$\./, "").toLowerCase());
          if (field && messages[0]) setError(field, { type: "server", message: messages[0] });
        }
        return;
      }
      reset(getFormValues(result.data));
      onSaved(result.data);
      toast.success(warehouse ? "Đã cập nhật địa chỉ kho." : "Đã thiết lập địa chỉ kho.");
    } catch {
      setSaveError("Không thể lưu địa chỉ kho. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      savingRef.current = false;
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 md:p-5">
        <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <WarehouseIcon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{warehouse ? "Kho của bạn" : "Thiết lập kho của bạn"}</h2>
            <span className={warehouse?.hasValidAddress
              ? "inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
              : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"}>
              {warehouse?.hasValidAddress ? <><CheckCircle2 aria-hidden="true" className="size-3" />Đã có địa chỉ</> : "Chưa hoàn tất địa chỉ"}
            </span>
          </div>
          <p className="break-words text-sm text-muted-foreground">
            {savedAddress || "Bạn chưa thiết lập địa chỉ kho. Vui lòng điền đầy đủ thông tin bên dưới."}
          </p>
          {warehouse?.updatedAt && (
            <p className="text-xs text-muted-foreground">
              Cập nhật: {new Date(warehouse.updatedAt).toLocaleString("vi-VN")}
            </p>
          )}
        </div>
      </section>

      <form className="rounded-lg border border-border bg-background" noValidate onSubmit={(event) => void handleSubmit(submit)(event)}>
        <div className="border-b border-border px-4 py-4 md:px-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin aria-hidden="true" className="size-4 text-primary" />Thông tin địa chỉ kho
          </h2>
        </div>
        <fieldset className="min-w-0 space-y-5 p-4 disabled:opacity-70 md:p-6" disabled={isSubmitting}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller control={control} name="provinceCode" render={({ field }) => (
              <SearchableSelectField
                {...field}
                error={errors.provinceCode?.message}
                id="warehouse-province"
                label="Tỉnh / Thành phố"
                onChange={(value) => {
                  field.onChange(value);
                  if (value !== field.value) setValue("wardCode", "", { shouldDirty: true, shouldValidate: true });
                }}
                options={PROVINCE_OPTIONS}
                placeholder="Chọn tỉnh / thành phố"
                required
              />
            )} />
            <Controller control={control} name="wardCode" render={({ field }) => (
              <SearchableSelectField
                {...field}
                disabled={!provinceCode || isSubmitting}
                error={errors.wardCode?.message}
                id="warehouse-ward"
                label="Phường / Xã"
                options={wardOptions}
                placeholder="Chọn phường / xã"
                required
              />
            )} />
          </div>
          <TextareaField
            {...register("addressDetail")}
            characterCount={addressDetail.length}
            className="min-h-28"
            error={errors.addressDetail?.message}
            id="warehouse-address"
            label="Địa chỉ chi tiết"
            maxLength={500}
            placeholder="Số nhà, tên đường, thôn / xóm..."
            required
          />
          <div className="space-y-2">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField {...register("latitude")} error={errors.latitude?.message} id="warehouse-latitude" label="Vĩ độ" max={90} min={-90} placeholder="Ví dụ: 21.025" required step="any" type="number" />
              <TextField {...register("longitude")} error={errors.longitude?.message} id="warehouse-longitude" label="Kinh độ" max={180} min={-180} placeholder="Ví dụ: 105.856" required step="any" type="number" />
            </div>
            <p className="text-xs text-muted-foreground">Nhập tọa độ chính xác của kho. Vĩ độ từ -90 đến 90, kinh độ từ -180 đến 180.</p>
          </div>
        </fieldset>

        {(saveError || hasConflict) && (
          <div className="mx-4 mb-5 space-y-3 rounded border border-error/30 bg-error/5 p-4 text-sm md:mx-6" role="alert">
            <p className="text-error">{hasConflict
              ? "Địa chỉ kho đã thay đổi hoặc phiên bản không còn phù hợp. Hãy tải lại địa chỉ mới nhất trước khi chỉnh sửa và lưu lại."
              : saveError}</p>
            {hasConflict && <>
              <p className="text-muted-foreground">Nội dung bạn nhập vẫn được giữ ở trên. Tải lại sẽ thay thế bằng thông tin mới nhất của kho.</p>
              <Button disabled={isSubmitting} onClick={() => void onReload()} type="button" variant="secondary">
                <RefreshCw aria-hidden="true" className="size-4" />Tải địa chỉ mới nhất
              </Button>
            </>}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-border p-4 md:px-6">
          <Button disabled={isSubmitting || !isDirty || hasConflict} onClick={() => { reset(getFormValues(warehouse)); setSaveError(null); }} type="button" variant="secondary">Hủy thay đổi</Button>
          <Button disabled={isSubmitting || hasConflict || (Boolean(warehouse?.hasValidAddress) && !isDirty)} type="submit">
            {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
            {isSubmitting ? "Đang lưu..." : warehouse ? "Lưu thay đổi" : "Thiết lập kho"}
          </Button>
        </div>
      </form>
    </div>
  );
}
