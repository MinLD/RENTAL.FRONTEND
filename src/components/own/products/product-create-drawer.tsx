"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { DynamicSpecificationFields } from "@/components/catalog/dynamic-specification-fields";
import { DataTableState } from "@/components/data-table";
import { FormDrawer } from "@/components/forms/form-drawer";
import { MoneyField } from "@/components/forms/money-field";
import { SearchableSelectField } from "@/components/forms/searchable-select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Button } from "@/components/ui/button";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogSelectOptions } from "@/hooks/use-catalog-select-options";
import {
  buildSpecificationValues,
  getSpecificationSchemaError,
} from "@/lib/validations/catalog-spec-values";
import {
  getProductCreateFormSchema,
  type ProductCreateFormValues,
} from "@/lib/validations/inventory-product";
import type { ApiResult } from "@/services/api-error";
import { uploadMediaFiles } from "@/services/media-service";
import type {
  CatalogPublishedSpecSchema,
  CatalogSpecField,
} from "@/types/catalog";
import type {
  CreateEquipmentListingRequest,
  EquipmentListing,
  EquipmentListingMedia,
} from "@/types/inventory";

import type { ProductCreateActions } from "./product-management-types";

const FORM_ID = "own-create-product-form";
const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EMPTY_FIELDS: CatalogSpecField[] = [];

type ProductCreateDrawerProps = {
  actions: ProductCreateActions;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    request: CreateEquipmentListingRequest,
  ) => Promise<ApiResult<EquipmentListing> | undefined>;
};

export function ProductCreateDrawer({
  actions,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: ProductCreateDrawerProps) {
  const { fetchSchema } = actions;
  const [activeTab, setActiveTab] = useState("detail");
  const [schema, setSchema] = useState<CatalogPublishedSpecSchema | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<
    Record<string, string | null>
  >({});
  const schemaRequestIdRef = useRef(0);
  const equipmentTypes = useCatalogSelectOptions(actions.fetchEquipmentTypes);
  const brands = useCatalogSelectOptions(actions.fetchBrands);
  const fields = schema?.fields ?? EMPTY_FIELDS;
  const resolverSchema = useMemo(
    () => getProductCreateFormSchema(fields),
    [fields],
  );
  const form = useForm<ProductCreateFormValues>({
    defaultValues: {
      equipmentTypeId: "",
      brandId: "",
      name: "",
      description: "",
      model: "",
      serialNumber: "",
      manufactureYear: "",
      mediaIds: [],
      dailyRate: "",
      weeklyRate: "",
      monthlyRate: "",
      thumbnailMediaId: "",
      specInputs: [],
    },
    resolver: zodResolver(resolverSchema),
    shouldFocusError: false,
  });
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = form;
  const equipmentTypeId = useWatch({ control, name: "equipmentTypeId" });
  const specInputs = useWatch({ control, name: "specInputs" });
  const thumbnailMediaId = useWatch({ control, name: "thumbnailMediaId" });
  const isBusy = isSubmitting || isUploadingImage;
  const schemaReady = Boolean(
    schema &&
    schema.equipmentTypeId === equipmentTypeId &&
    !isLoadingSchema &&
    !schemaError,
  );

  const loadSchema = useCallback(async () => {
    if (!equipmentTypeId) return;
    const requestId = ++schemaRequestIdRef.current;
    setSchema(null);
    setSchemaError(null);
    setIsLoadingSchema(true);
    setValue("specInputs", []);
    clearErrors("specInputs");
    try {
      const result = await fetchSchema(equipmentTypeId);
      if (requestId !== schemaRequestIdRef.current) return;
      if (!result.success) {
        setSchemaError(result.error.message);
        return;
      }
      const version = result.data.schemaVersion ?? result.data.version;
      if (!Number.isInteger(version) || (version ?? 0) < 1) {
        setSchemaError(
          "Loại thiết bị chưa có phiên bản thông số hợp lệ. Vui lòng chọn loại thiết bị khác.",
        );
        return;
      }
      if (
        result.data.equipmentTypeId &&
        result.data.equipmentTypeId !== equipmentTypeId
      ) {
        setSchemaError(
          "Không thể tải đúng thông số của loại thiết bị. Vui lòng thử lại.",
        );
        return;
      }
      const nextFields = result.data.fields ?? [];
      const invalidSchema = getSpecificationSchemaError(nextFields);
      if (invalidSchema) {
        setSchemaError(invalidSchema);
        return;
      }
      setSchema({ ...result.data, equipmentTypeId, schemaVersion: version });
      setValue(
        "specInputs",
        nextFields.map((field) =>
          field.dataType?.toLowerCase() === "boolean" ? false : "",
        ),
      );
    } catch (error) {
      if (requestId === schemaRequestIdRef.current) {
        setSchemaError(
          error instanceof Error
            ? error.message
            : "Không thể tải thông số kỹ thuật.",
        );
      }
    } finally {
      if (requestId === schemaRequestIdRef.current) setIsLoadingSchema(false);
    }
  }, [fetchSchema, clearErrors, equipmentTypeId, setValue]);

  useEffect(() => {
    const requestRef = schemaRequestIdRef;
    const timeout = window.setTimeout(() => void loadSchema(), 0);
    return () => {
      window.clearTimeout(timeout);
      ++requestRef.current;
    };
  }, [loadSchema]);

  async function submitForm(values: ProductCreateFormValues) {
    if (isBusy || !schemaReady || !schema?.schemaVersion) return;
    clearErrors();
    try {
      const result = await onSubmit({
        equipmentTypeId: values.equipmentTypeId,
        brandId: values.brandId,
        name: values.name,
        description: values.description || null,
        model: values.model,
        serialNumber: values.serialNumber,
        manufactureYear: values.manufactureYear
          ? Number(values.manufactureYear)
          : null,
        mediaIds: values.mediaIds,
        schemaVersion: schema.schemaVersion,
        specValues: buildSpecificationValues(fields, values.specInputs),
        rentalRate: {
          dailyRate: Number(values.dailyRate),
          weeklyRate: Number(values.weeklyRate),
          monthlyRate: Number(values.monthlyRate),
          currency: "VND",
        },
        thumbnailMediaId: values.thumbnailMediaId || null,
      });
      if (result && !result.success) {
        setError("root.server", { message: result.error.message });
        let hasSpecError = false;
        for (const [path, messages] of Object.entries(
          result.error.fieldErrors,
        )) {
          const normalizedPath = path.replace(/^\$\./, "").toLowerCase();
          const specIndex = fields.findIndex(
            (field) =>
              normalizedPath === `specvalues.${field.key}`.toLowerCase() ||
              normalizedPath === field.key?.toLowerCase(),
          );
          if (specIndex >= 0) {
            setError(`specInputs.${specIndex}`, {
              message: messages.join("\n"),
            });
            hasSpecError = true;
          } else {
            const name = normalizedPath.replace(/^rentalrate\./, "");
            const formField = (
              [
                "equipmentTypeId",
                "brandId",
                "name",
                "description",
                "model",
                "serialNumber",
                "manufactureYear",
                "mediaIds",
                "dailyRate",
                "weeklyRate",
                "monthlyRate",
                "thumbnailMediaId",
              ] as const
            ).find((key) => key.toLowerCase() === name);
            if (formField)
              setError(formField, { message: messages.join("\n") });
          }
        }
        if (hasSpecError) setActiveTab("specs");
      }
    } catch (error) {
      setError("root.server", {
        message:
          error instanceof Error ? error.message : "Không thể tạo sản phẩm.",
      });
    }
  }

  return (
    <FormDrawer
      activeTab={activeTab}
      className="sm:max-w-2xl"
      description="Thêm thiết bị vào danh sách sản phẩm cho thuê"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          >
            Hủy
          </Button>
          <Button
            disabled={isBusy || !schemaReady}
            form={FORM_ID}
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {isSubmitting ? "Đang tạo..." : "Tạo sản phẩm"}
          </Button>
        </div>
      }
      onOpenChange={(open) => {
        if (!isBusy) onOpenChange(open);
      }}
      onTabChange={setActiveTab}
      open
      tabs={[
        { label: "Thông tin", value: "detail" },
        { label: "Thông số kỹ thuật", value: "specs" },
      ]}
      title="Thêm sản phẩm"
    >
      <form
        className="grid min-w-0 gap-5"
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit(submitForm, (formErrors) => {
          setActiveTab(
            Object.keys(formErrors).some((key) => key !== "specInputs")
              ? "detail"
              : "specs",
          );
        })}
      >
        {errors.root?.server?.message ? (
          <p
            className="whitespace-pre-line break-words rounded border border-error/20 bg-error/5 p-3 text-sm text-error"
            role="alert"
          >
            {errors.root.server.message}
          </p>
        ) : null}
        <div className="space-y-5" hidden={activeTab !== "detail"}>
          <TextField
            {...register("name")}
            disabled={isBusy}
            error={errors.name?.message}
            id={`${FORM_ID}-name`}
            label="Tên sản phẩm"
            placeholder="VD: Bộ micro không dây cho sự kiện"
            required
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Controller
                control={control}
                name="equipmentTypeId"
                render={({ field, fieldState }) => (
                  <SearchableSelectField
                    {...field}
                    disabled={
                      isBusy ||
                      (equipmentTypes.isLoading && !equipmentTypes.items.length)
                    }
                    error={fieldState.error?.message}
                    id={`${FORM_ID}-equipmentTypeId`}
                    label="Loại thiết bị"
                    onChange={(value) => {
                      if (value === field.value) return;
                      ++schemaRequestIdRef.current;
                      setSchema(null);
                      setSchemaError(null);
                      setIsLoadingSchema(true);
                      setValue("specInputs", []);
                      clearErrors();
                      field.onChange(value);
                    }}
                    options={equipmentTypes.items.map((item) => ({
                      label: item.name,
                      value: item.id,
                    }))}
                    placeholder={
                      equipmentTypes.isLoading
                        ? "Đang tải loại thiết bị..."
                        : "Chọn loại thiết bị"
                    }
                    required
                  />
                )}
              />
              <CatalogOptionsState
                {...equipmentTypes}
                disabled={isBusy}
                label="loại thiết bị"
              />
            </div>
            <div className="space-y-2">
              <Controller
                control={control}
                name="brandId"
                render={({ field, fieldState }) => (
                  <SearchableSelectField
                    {...field}
                    disabled={
                      isBusy || (brands.isLoading && !brands.items.length)
                    }
                    error={fieldState.error?.message}
                    id={`${FORM_ID}-brandId`}
                    label="Thương hiệu"
                    options={brands.items.map((item) => ({
                      label: item.name,
                      value: item.id,
                    }))}
                    placeholder={
                      brands.isLoading
                        ? "Đang tải thương hiệu..."
                        : "Chọn thương hiệu"
                    }
                    required
                  />
                )}
              />
              <CatalogOptionsState
                {...brands}
                disabled={isBusy}
                label="thương hiệu"
              />
            </div>
            <TextField
              disabled={isBusy}
              error={errors.model?.message}
              id={`${FORM_ID}-model`}
              label="Model sản phẩm"
              placeholder="VD: Micro không dây Shure SLX24"
              required
              {...register("model")}
            />
            <TextField
              disabled={isBusy}
              error={errors.serialNumber?.message}
              id={`${FORM_ID}-serialNumber`}
              label="Số serial"
              placeholder="VD: MIC-SLX24-001"
              required
              {...register("serialNumber")}
            />
            <TextField
              {...register("manufactureYear")}
              disabled={isBusy}
              error={errors.manufactureYear?.message}
              id={`${FORM_ID}-manufactureYear`}
              label="Năm sản xuất"
              placeholder="VD: 2024"
              inputMode="numeric"
              maxLength={4}
            />
          </div>
          <TextareaField
            {...register("description")}
            className="min-h-24"
            disabled={isBusy}
            error={errors.description?.message}
            id={`${FORM_ID}-description`}
            label="Mô tả sản phẩm"
            placeholder="Giới thiệu thiết bị, tình trạng và công dụng…"
          />
          <Controller
            control={control}
            name="mediaIds"
            render={({ field, fieldState }) => (
              <ProductImageField
                disabled={isBusy}
                error={
                  fieldState.error?.message || errors.thumbnailMediaId?.message
                }
                onChange={(media, thumbnail) => {
                  field.onChange(media.map((item) => item.id));
                  setValue("thumbnailMediaId", thumbnail, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setImagePreviewUrls(
                    Object.fromEntries(
                      media.map((item) => [item.id, item.url]),
                    ),
                  );
                }}
                onUploadingChange={setIsUploadingImage}
                thumbnailMediaId={thumbnailMediaId}
                value={field.value.map((id) => ({
                  id,
                  url: imagePreviewUrls[id] ?? null,
                }))}
              />
            )}
          />
          <section className="space-y-4 pt-5">
            <h2 className="text-sm font-semibold">Giá thuê (VND)</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["dailyRate", "Giá / ngày"],
                  ["weeklyRate", "Giá / tuần"],
                  ["monthlyRate", "Giá / tháng"],
                ] as const
              ).map(([name, label]) => (
                <Controller
                  control={control}
                  key={name}
                  name={name}
                  render={({ field, fieldState }) => (
                    <MoneyField
                      {...field}
                      disabled={isBusy}
                      error={fieldState.error?.message}
                      id={`${FORM_ID}-${name}`}
                      label={label}
                      placeholder="VD: 100.000"
                      required
                      rightElement={
                        <span className="px-2 text-xs text-muted-foreground">
                          VND
                        </span>
                      }
                    />
                  )}
                />
              ))}
            </div>
          </section>
          {equipmentTypeId ? (
            <SchemaLoadState
              error={schemaError}
              isLoading={isLoadingSchema}
              onRetry={loadSchema}
              disabled={isBusy}
            />
          ) : null}
        </div>
        <div className="space-y-5" hidden={activeTab !== "specs"}>
          {!equipmentTypeId ? (
            <div className="grid min-h-64 place-items-center">
              <DataTableState message="Chọn loại thiết bị để xem thông số kỹ thuật." />
            </div>
          ) : (
            <>
              <SchemaLoadState
                error={schemaError}
                isLoading={isLoadingSchema}
                onRetry={loadSchema}
                disabled={isBusy}
              />
              {schemaReady ? (
                <>
                  <h2 className="text-sm font-semibold">Thông số kỹ thuật</h2>
                  {fields.length ? (
                    <DynamicSpecificationFields
                      disabled={isBusy}
                      errors={fields.map(
                        (_, index) => errors.specInputs?.[index]?.message,
                      )}
                      fields={fields}
                      onChange={(index, value) => {
                        setValue(`specInputs.${index}`, value, {
                          shouldDirty: true,
                        });
                        clearErrors(`specInputs.${index}`);
                      }}
                      values={specInputs}
                    />
                  ) : (
                    <div className="grid min-h-64 place-items-center">
                      <DataTableState message="Loại thiết bị này không yêu cầu thông số bổ sung." />
                    </div>
                  )}
                </>
              ) : null}
            </>
          )}
        </div>
      </form>
    </FormDrawer>
  );
}

export function CatalogOptionsState({
  error,
  isLoading,
  items,
  disabled,
  label,
  retry,
  showLoadingMessage = true,
}: {
  error: string | null;
  isLoading: boolean;
  items: unknown[];
  disabled: boolean;
  label: string;
  retry: () => void;
  showLoadingMessage?: boolean;
}) {
  if (error)
    return (
      <div className="space-y-1">
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
        <Button
          disabled={disabled || isLoading}
          onClick={retry}
          size="sm"
          type="button"
          variant="ghost"
        >
          Thử lại
        </Button>
      </div>
    );
  if (isLoading)
    return showLoadingMessage ? (
      <p className="text-xs text-muted-foreground" role="status">
        Đang tải {label}...
      </p>
    ) : null;
  if (!items.length)
    return (
      <p className="text-xs text-muted-foreground">Chưa có {label} để chọn.</p>
    );
  return null;
}

export function SchemaLoadState({
  error,
  isLoading,
  onRetry,
  disabled,
}: {
  error: string | null;
  isLoading: boolean;
  onRetry: () => Promise<void>;
  disabled: boolean;
}) {
  if (isLoading)
    return (
      <div
        aria-busy="true"
        aria-label="Đang tải thông số kỹ thuật"
        className="space-y-3"
      >
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  if (error)
    return (
      <div
        className="space-y-3 rounded border border-error/20 bg-error/5 p-3"
        role="alert"
      >
        <p className="text-sm text-error">{error}</p>
        <Button
          disabled={disabled}
          onClick={() => void onRetry()}
          size="sm"
          type="button"
          variant="secondary"
        >
          <RefreshCw className="size-4" />
          Tải lại thông số
        </Button>
      </div>
    );
  return null;
}

async function uploadProductImages(files: File[]) {
  if (files.some((file) => !IMAGE_CONTENT_TYPES.includes(file.type)))
    throw new Error("Ảnh sản phẩm chỉ hỗ trợ JPG, PNG hoặc WEBP.");
  const uploads = await uploadMediaFiles(files);
  if (uploads.some((upload) => upload.status.toLowerCase() !== "ready"))
    throw new Error(
      "Ảnh sản phẩm chưa sẵn sàng sử dụng. Vui lòng thử lại sau.",
    );
  return uploads;
}

export function ProductImageField({
  disabled,
  error,
  onChange,
  onUploadingChange,
  thumbnailMediaId,
  value,
}: {
  disabled: boolean;
  error?: string;
  onChange: (media: EquipmentListingMedia[], thumbnailMediaId: string) => void;
  onUploadingChange: (uploading: boolean) => void;
  thumbnailMediaId: string;
  value: EquipmentListingMedia[];
}) {
  return (
    <div className="space-y-3 rounded border border-border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase">Ảnh sản phẩm</p>
      <div className="flex flex-wrap items-center gap-4">
        <MediaAvatarUpload
          accept={IMAGE_CONTENT_TYPES.join(",")}
          disabled={disabled}
          mode="multiple"
          onChange={(_, upload) => {
            const uploads = Array.isArray(upload) ? upload : [upload];
            const media = Array.from(
              new Map([
                ...value.map((item) => [item.id, item] as const),
                ...uploads.map(
                  (item) =>
                    [
                      item.mediaId,
                      { id: item.mediaId, url: item.previewUrl },
                    ] as const,
                ),
              ]).values(),
            );
            onChange(media, thumbnailMediaId || media[0]?.id || "");
          }}
          onUploadingChange={onUploadingChange}
          uploadFiles={uploadProductImages}
          uploadLabel="Thêm ảnh sản phẩm"
          variant="add"
        />
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            JPG, PNG hoặc WEBP. Không bắt buộc.
          </p>
          <p className="text-xs text-muted-foreground">
            Có thể chọn nhiều ảnh. Chọn ngôi sao để đặt ảnh đại diện.
          </p>
        </div>
      </div>
      {value.map((item, index) => (
        <div
          className="flex min-w-0 flex-wrap items-center gap-3 rounded border border-border bg-background p-3"
          key={item.id}
        >
          <AvatarWithSkeleton
            alt={`Ảnh sản phẩm ${index + 1}`}
            className="size-16 shrink-0 rounded border border-border"
            fallback={`${index + 1}`}
            fallbackClassName="rounded bg-muted text-sm"
            imageClassName="object-contain"
            src={item.url}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Ảnh {index + 1}</p>
            {item.id === thumbnailMediaId ? (
              <p className="text-xs text-muted-foreground">Ảnh đại diện</p>
            ) : null}
          </div>
          <Button
            aria-label={`Chọn ảnh ${index + 1} làm ảnh đại diện`}
            aria-pressed={item.id === thumbnailMediaId}
            disabled={disabled}
            onClick={() => onChange(value, item.id)}
            size="icon"
            title="Đặt làm ảnh đại diện"
            type="button"
            variant="default"
          >
            <Star
              className={
                item.id === thumbnailMediaId
                  ? "size-4 fill-amber-400 text-amber-500"
                  : "size-4"
              }
            />
          </Button>
          <Button
            aria-label={`Xóa ảnh ${index + 1}`}
            disabled={disabled}
            onClick={() => {
              const media = value.filter((image) => image.id !== item.id);
              onChange(
                media,
                item.id === thumbnailMediaId
                  ? media[0]?.id || ""
                  : thumbnailMediaId,
              );
            }}
            size="icon"
            title="Xóa ảnh"
            type="button"
            variant="default"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
