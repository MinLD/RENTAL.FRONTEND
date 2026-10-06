"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormDrawer } from "@/components/forms/form-drawer";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  catalogEquipmentTypeFormSchema,
  type CatalogEquipmentTypeFormMedia,
  type CatalogEquipmentTypeFormValues,
} from "@/lib/validations/catalog-equipment-type";
import { uploadMediaFiles } from "@/services/media-service";
import {
  CATALOG_EQUIPMENT_TYPE_STATUS,
  type CatalogCategoryDetail,
  type CatalogEquipmentTypeDetail,
  type CreateCatalogEquipmentTypeRequest,
  type UpdateCatalogEquipmentTypeRequest,
} from "@/types/catalog";
import type {
  MediaUploadResponse,
} from "@/types/media";

import { EquipmentTypeStatusBadge } from "./equipment-type-table-columns";

const CREATE_EQUIPMENT_TYPE_FORM_ID = "admin-create-equipment-type-form";
const UPDATE_EQUIPMENT_TYPE_FORM_ID = "admin-update-equipment-type-form";
const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

type EquipmentTypeCreateDrawerProps = {
  categories: CatalogCategoryDetail[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateCatalogEquipmentTypeRequest) => Promise<void>;
  open: boolean;
};

export function EquipmentTypeCreateDrawer({
  categories,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
}: EquipmentTypeCreateDrawerProps) {
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const isBusy = isSubmitting || isUploadingMedia;

  return (
    <FormDrawer
      className="sm:max-w-2xl"
      footer={
        <EquipmentTypeDrawerFooter
          cancelLabel="Hủy"
          formId={CREATE_EQUIPMENT_TYPE_FORM_ID}
          icon={
            isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )
          }
          isSubmitting={isBusy}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Đang tạo..." : "Tạo loại thiết bị"}
        />
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Thêm loại thiết bị"
    >
      <EquipmentTypeForm
        categories={categories}
        formId={CREATE_EQUIPMENT_TYPE_FORM_ID}
        isSubmitting={isBusy}
        key={open ? "equipment-type-create-open" : "equipment-type-create-closed"}
        onMediaUploadingChange={setIsUploadingMedia}
        onSubmit={async (values) => {
          await onSubmit(toCreateEquipmentTypeRequest(values));
        }}
      />
    </FormDrawer>
  );
}

type EquipmentTypeDetailDrawerProps = {
  categories: CatalogCategoryDetail[];
  equipmentType: CatalogEquipmentTypeDetail | null;
  error?: string | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish?: (equipmentType: CatalogEquipmentTypeDetail) => void;
  onRefresh: () => void;
  onSubmit: (id: string, request: UpdateCatalogEquipmentTypeRequest) => Promise<void>;
  open: boolean;
  selectedName?: string | null;
};

export function EquipmentTypeDetailDrawer({
  categories,
  equipmentType,
  error,
  isLoading = false,
  isSubmitting = false,
  onOpenChange,
  onPublish,
  onRefresh,
  onSubmit,
  open,
  selectedName,
}: EquipmentTypeDetailDrawerProps) {
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const isBusy = isSubmitting || isUploadingMedia || isLoading;

  return (
    <FormDrawer
      className="sm:max-w-2xl"
      description={equipmentType?.code ?? selectedName ?? "Thông tin loại thiết bị"}
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button
            disabled={isLoading}
            onClick={onRefresh}
            size="sm"
            type="button"
            variant="ghost"
          >
            <RefreshCw
              className={isLoading ? "size-4 animate-spin" : "size-4"}
            />
            Tải lại
          </Button>
          {equipmentType ? (
            <Button
              disabled={isBusy}
              form={UPDATE_EQUIPMENT_TYPE_FORM_ID}
              size="sm"
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          ) : null}
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            type="button"
            variant="secondary"
          >
            Đóng
          </Button>
        </div>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Chi tiết loại thiết bị"
    >
      {isLoading ? (
        <EquipmentTypeDetailSkeleton />
      ) : error ? (
        <div
          className="space-y-4 rounded border border-error/20 bg-error/5 p-4"
          role="alert"
        >
          <p className="text-sm text-error">{error}</p>
          <Button onClick={onRefresh} size="sm" type="button" variant="secondary">
            Thử lại
          </Button>
        </div>
      ) : equipmentType ? (
        <EquipmentTypeForm
          categories={categories}
          equipmentType={equipmentType}
          formId={UPDATE_EQUIPMENT_TYPE_FORM_ID}
          isSubmitting={isBusy}
          key={equipmentType.id}
          onMediaUploadingChange={setIsUploadingMedia}
          onPublish={onPublish}
          onSubmit={async (values) => {
            await onSubmit(equipmentType.id, toUpdateEquipmentTypeRequest(values));
          }}
        />
      ) : null}
    </FormDrawer>
  );
}

function EquipmentTypeDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải chi tiết loại thiết bị"
      className="space-y-6"
    >
      <Skeleton className="size-24 rounded-lg" />
      {Array.from({ length: 7 }, (_, index) => (
        <div className="space-y-2" key={index}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function EquipmentTypeForm({
  categories,
  equipmentType,
  formId,
  isSubmitting,
  onMediaUploadingChange,
  onPublish,
  onSubmit,
}: {
  categories: CatalogCategoryDetail[];
  equipmentType?: CatalogEquipmentTypeDetail;
  formId: string;
  isSubmitting: boolean;
  onMediaUploadingChange: (isUploading: boolean) => void;
  onPublish?: (equipmentType: CatalogEquipmentTypeDetail) => void;
  onSubmit: (values: CatalogEquipmentTypeFormValues) => Promise<void>;
}) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CatalogEquipmentTypeFormValues>({
    defaultValues: getDefaultValues(equipmentType),
    resolver: zodResolver(catalogEquipmentTypeFormSchema),
  });
  const description = useWatch({ control, name: "description" });

  async function submitForm(values: CatalogEquipmentTypeFormValues) {
    await onSubmit(values);

    if (!equipmentType) {
      reset(getDefaultValues());
    }
  }

  return (
    <form
      className="grid gap-5"
      id={formId}
      onSubmit={handleSubmit(submitForm)}
    >
      {equipmentType?.status !== undefined ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-muted/40 p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Trạng thái
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {equipmentType.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <EquipmentTypeStatusBadge status={equipmentType.status} />
            {equipmentType.status === CATALOG_EQUIPMENT_TYPE_STATUS.Draft ? (
              <Button
                disabled={isSubmitting}
                onClick={() => onPublish?.(equipmentType)}
                size="sm"
                type="button"
              >
                <Send className="size-4" />
                Publish
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          disabled={isSubmitting}
          error={errors.code?.message}
          label="Code"
          placeholder="VD: EXCAVATOR"
          {...register("code")}
        />
        <TextField
          disabled={isSubmitting}
          error={errors.name?.message}
          label="Tên loại thiết bị"
          placeholder="VD: Máy xúc"
          {...register("name")}
        />
      </div>

      <TextareaField
        characterCount={description?.length ?? 0}
        disabled={isSubmitting}
        error={errors.description?.message}
        label="Mô tả"
        maxLength={2000}
        placeholder="Mô tả ngắn về loại thiết bị..."
        {...register("description")}
      />

      <Controller
        control={control}
        name="categoryIds"
        render={({ field, fieldState }) => (
          <CategoryMultiSelect
            categories={categories}
            disabled={isSubmitting}
            error={fieldState.error?.message}
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="media"
        render={({ field, fieldState }) => (
          <EquipmentTypeMediaField
            disabled={isSubmitting}
            error={fieldState.error?.message}
            onChange={field.onChange}
            onUploadingChange={onMediaUploadingChange}
            value={field.value}
          />
        )}
      />
    </form>
  );
}

function CategoryMultiSelect({
  categories,
  disabled,
  error,
  onChange,
  value,
}: {
  categories: CatalogCategoryDetail[];
  disabled?: boolean;
  error?: string;
  onChange: (value: string[]) => void;
  value: string[];
}) {
  const activeCategories = categories.filter((category) => category.isActive);

  function toggleCategory(categoryId: string) {
    if (value.includes(categoryId)) {
      onChange(value.filter((id) => id !== categoryId));
      return;
    }

    onChange([...value, categoryId]);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-foreground">
        Danh mục <span className="text-error">*</span>
      </p>
      <div className="grid max-h-56 gap-2 overflow-y-auto rounded border border-border bg-background p-3 sm:grid-cols-2">
        {activeCategories.length ? (
          activeCategories.map((category) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded p-2 text-sm font-semibold text-foreground hover:bg-primary/5"
              key={category.id}
            >
              <Checkbox
                checked={value.includes(category.id)}
                disabled={disabled}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <span className="min-w-0">
                <span className="block truncate">{category.name}</span>
                {category.slug ? (
                  <span className="block truncate text-xs font-medium text-muted-foreground">
                    {category.slug}
                  </span>
                ) : null}
              </span>
            </label>
          ))
        ) : (
          <p className="p-3 text-sm text-muted-foreground">
            Chưa có danh mục đang hoạt động.
          </p>
        )}
      </div>
      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
    </div>
  );
}

function EquipmentTypeMediaField({
  disabled,
  error,
  onChange,
  onUploadingChange,
  value,
}: {
  disabled?: boolean;
  error?: string;
  onChange: (value: CatalogEquipmentTypeFormMedia[]) => void;
  onUploadingChange: (isUploading: boolean) => void;
  value: CatalogEquipmentTypeFormMedia[];
}) {
  function setThumbnail(mediaId: string) {
    onChange(value.map((item) => ({
      ...item,
      isThumbnail: item.mediaId === mediaId,
    })));
  }

  function removeMedia(mediaId: string) {
    const nextItems = value.filter((item) => item.mediaId !== mediaId);

    onChange(ensureMediaThumbnail(nextItems));
  }

  function updateDisplayOrder(mediaId: string, displayOrder: number) {
    onChange(
      value.map((item) =>
        item.mediaId === mediaId ? { ...item, displayOrder } : item,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded border border-border bg-muted/40 p-4">
        <p className="text-xs font-semibold uppercase text-foreground">
          Media
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <MediaAvatarUpload
            accept={IMAGE_CONTENT_TYPES.join(",")}
            disabled={disabled}
            fallbackText="Ảnh"
            mode="multiple"
            onChange={(_, upload) => {
              const uploads = Array.isArray(upload) ? upload : [upload];
              const nextItems = [
                ...value,
                ...uploads.map((item, index) => toMediaFormItem(item, value.length + index)),
              ];

              onChange(ensureMediaThumbnail(nextItems));
            }}
            onUploadingChange={onUploadingChange}
            previewUrl={value.map((item) => item.url ?? "")}
            size="md"
            uploadFiles={uploadEquipmentTypeImages}
          />
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            Upload nhiều ảnh, chọn một ảnh làm thumbnail và sắp xếp bằng display order.
          </p>
        </div>
      </div>

      {value.length ? (
        <div className="grid gap-3">
          {[...value]
            .sort((leftItem, rightItem) => leftItem.displayOrder - rightItem.displayOrder)
            .map((item, index) => (
              <div
                className={
                  item.isThumbnail
                    ? "grid gap-3 rounded border border-amber-300 bg-amber-50 p-3 shadow-sm sm:grid-cols-[1fr_120px_auto_auto]"
                    : "grid gap-3 rounded border border-border bg-background p-3 sm:grid-cols-[1fr_120px_auto_auto]"
                }
                key={item.mediaId}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Ảnh {index + 1}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.mediaId}
                  </p>
                </div>
                <TextField
                  disabled={disabled}
                  label="Thứ tự"
                  min={0}
                  onChange={(event) =>
                    updateDisplayOrder(
                      item.mediaId,
                      Number(event.target.value) || 0,
                    )
                  }
                  type="number"
                  value={item.displayOrder}
                />
                <Button
                  disabled={disabled}
                  onClick={() => setThumbnail(item.mediaId)}
                  type="button"
                  variant={item.isThumbnail ? "default" : "secondary"}
                >
                  <Star
                    className={
                      item.isThumbnail
                        ? "size-4 fill-amber-300 text-amber-300"
                        : "size-4"
                    }
                  />
                  {item.isThumbnail ? "Đang là thumbnail" : "Chọn thumbnail"}
                </Button>
                <Button
                  disabled={disabled}
                  onClick={() => removeMedia(item.mediaId)}
                  size="icon"
                  title="Xóa ảnh"
                  type="button"
                  variant="secondary"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
        </div>
      ) : null}
      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
    </div>
  );
}

function EquipmentTypeDrawerFooter({
  cancelLabel,
  formId,
  icon,
  isSubmitting,
  onCancel,
  submitLabel,
}: {
  cancelLabel: string;
  formId: string;
  icon: ReactNode;
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex w-full justify-end gap-2">
      <Button
        disabled={isSubmitting}
        onClick={onCancel}
        type="button"
        variant="secondary"
      >
        {cancelLabel}
      </Button>
      <Button disabled={isSubmitting} form={formId} type="submit">
        {icon}
        {submitLabel}
      </Button>
    </div>
  );
}

function getDefaultValues(
  equipmentType?: CatalogEquipmentTypeDetail,
): CatalogEquipmentTypeFormValues {
  return {
    categoryIds: equipmentType?.categories.map((category) => category.id) ?? [],
    code: equipmentType?.code ?? "",
    description: equipmentType?.description ?? "",
    media: ensureMediaThumbnail(
      equipmentType?.media.map((item, index) => ({
        displayOrder: item.displayOrder ?? index,
        isThumbnail: item.isThumbnail === true,
        mediaId: item.mediaId,
        url: item.url ?? "",
      })) ?? [],
    ),
    name: equipmentType?.name ?? "",
  };
}

function toCreateEquipmentTypeRequest(
  values: CatalogEquipmentTypeFormValues,
): CreateCatalogEquipmentTypeRequest {
  return {
    categoryIds: values.categoryIds,
    code: values.code.trim(),
    description: normalizeNullableText(values.description),
    media: normalizeMediaRequest(values.media),
    name: values.name.trim(),
  };
}

function toUpdateEquipmentTypeRequest(
  values: CatalogEquipmentTypeFormValues,
): UpdateCatalogEquipmentTypeRequest {
  return {
    categoryIds: values.categoryIds,
    code: values.code.trim(),
    description: normalizeNullableText(values.description),
    media: normalizeMediaRequest(values.media),
    name: values.name.trim(),
  };
}

function normalizeMediaRequest(media: CatalogEquipmentTypeFormMedia[]) {
  return ensureMediaThumbnail(media)
    .map((item) => ({
      displayOrder: item.displayOrder,
      isThumbnail: item.isThumbnail,
      mediaId: item.mediaId,
    }))
    .sort((leftItem, rightItem) => leftItem.displayOrder - rightItem.displayOrder);
}

function ensureMediaThumbnail(media: CatalogEquipmentTypeFormMedia[]) {
  if (!media.length) {
    return [];
  }

  const thumbnailItem = media.find((item) => item.isThumbnail);

  return media.map((item, index) => ({
    ...item,
    isThumbnail: thumbnailItem
      ? item.mediaId === thumbnailItem.mediaId
      : index === 0,
  }));
}

function toMediaFormItem(
  upload: MediaUploadResponse,
  index: number,
): CatalogEquipmentTypeFormMedia {
  return {
    displayOrder: index,
    isThumbnail: index === 0,
    mediaId: upload.mediaId,
    url: upload.previewUrl,
  };
}

function normalizeNullableText(value?: string) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

async function uploadEquipmentTypeImages(files: File[]) {
  const invalidFile = files.find(
    (file) => !IMAGE_CONTENT_TYPES.includes(file.type),
  );

  if (invalidFile) {
    throw new Error("Ảnh thiết bị chỉ hỗ trợ JPG, PNG hoặc WEBP.");
  }

  const uploads = await uploadMediaFiles(files);

  for (const upload of uploads) {
    if (upload.status.toLowerCase() !== "ready") {
      throw new Error("Ảnh thiết bị chưa sẵn sàng sử dụng. Vui lòng thử lại sau.");
    }
  }

  return uploads;
}
