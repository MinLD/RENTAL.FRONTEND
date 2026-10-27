"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";

import { FormDrawer } from "@/components/forms/form-drawer";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  catalogEquipmentTypeCreateFormSchema,
  catalogEquipmentTypeFormSchema,
  type CatalogEquipmentTypeFormMedia,
  type CatalogEquipmentTypeFormValues,
} from "@/lib/validations/catalog-equipment-type";
import {
  getSpecFieldFormValues,
  toSpecDefinition,
} from "@/lib/validations/catalog-spec-schema";
import { uploadMediaFiles } from "@/services/media-service";
import type {
  CatalogCategoryDetail,
  CatalogEquipmentTypeDetail,
  CreateCatalogEquipmentTypeRequest,
  UpdateCatalogEquipmentTypeRequest,
} from "@/types/catalog";
import type { MediaUploadResponse } from "@/types/media";

import { EquipmentTypeStatusBadge } from "./equipment-type-table-columns";
import type { CatalogSpecSchemaActions } from "./equipment-type-management-types";
import { SpecSchemaPanel } from "./spec-schema-panel";
import { SpecSchemaFieldEditor } from "./spec-schema-field-editor";

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
  const [activeTab, setActiveTab] = useState("detail");
  const [wasOpen, setWasOpen] = useState(open);
  const isBusy = isSubmitting || isUploadingMedia;

  if (wasOpen !== open) {
    setWasOpen(open);
    setActiveTab("detail");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setActiveTab("detail");
    onOpenChange(nextOpen);
  }

  return (
    <FormDrawer
      activeTab={activeTab}
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
          onCancel={() => handleOpenChange(false)}
          submitLabel={isSubmitting ? "Đang tạo..." : "Tạo loại thiết bị"}
        />
      }
      onOpenChange={handleOpenChange}
      onTabChange={setActiveTab}
      open={open}
      tabs={[
        { label: "Thông tin", value: "detail" },
        { label: "Thông số kỹ thuật", value: "schema" },
      ]}
      title="Thêm loại thiết bị"
    >
      <EquipmentTypeForm
        activeTab={activeTab}
        categories={categories}
        formId={CREATE_EQUIPMENT_TYPE_FORM_ID}
        isSubmitting={isBusy}
        key={
          open ? "equipment-type-create-open" : "equipment-type-create-closed"
        }
        onMediaUploadingChange={setIsUploadingMedia}
        onTabChange={setActiveTab}
        onSubmit={async (values) => {
          await onSubmit(toCreateEquipmentTypeRequest(values));
        }}
      />
    </FormDrawer>
  );
}

type EquipmentTypeDetailDrawerProps = {
  schemaActions: CatalogSpecSchemaActions;
  onSchemaPublished: () => void;
  categories: CatalogCategoryDetail[];
  equipmentType: CatalogEquipmentTypeDetail | null;
  error?: string | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onSubmit: (
    id: string,
    request: UpdateCatalogEquipmentTypeRequest,
  ) => Promise<void>;
  open: boolean;
  selectedName?: string | null;
};

export function EquipmentTypeDetailDrawer({
  schemaActions,
  onSchemaPublished,
  categories,
  equipmentType,
  error,
  isLoading = false,
  isSubmitting = false,
  onOpenChange,
  onRefresh,
  onSubmit,
  open,
  selectedName,
}: EquipmentTypeDetailDrawerProps) {
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");
  const [hasOpenedSchema, setHasOpenedSchema] = useState(false);
  const [schemaState, setSchemaState] = useState({ busy: false, dirty: false });
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const isBusy = isSubmitting || isUploadingMedia || isLoading;

  function closeDrawer() {
    setActiveTab("detail");
    setHasOpenedSchema(false);
    setSchemaState({ busy: false, dirty: false });
    setIsDiscardConfirmOpen(false);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (schemaState.busy || isSubmitting || isUploadingMedia) return;
    if (!nextOpen && schemaState.dirty) {
      setIsDiscardConfirmOpen(true);
    } else if (!nextOpen) {
      closeDrawer();
    } else {
      onOpenChange(nextOpen);
    }
  }

  return (
    <>
      <FormDrawer
        activeTab={activeTab}
        className="sm:max-w-2xl"
        description={
          equipmentType?.code ?? selectedName ?? "Thông tin loại thiết bị"
        }
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {activeTab === "detail" ? (
              <Button
                disabled={isLoading || schemaState.busy || schemaState.dirty}
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
            ) : null}
            {equipmentType && activeTab === "detail" ? (
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
              disabled={schemaState.busy || isSubmitting || isUploadingMedia}
              onClick={() => handleOpenChange(false)}
              size="sm"
              type="button"
              variant="secondary"
            >
              Đóng
            </Button>
          </div>
        }
        onOpenChange={handleOpenChange}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "schema") setHasOpenedSchema(true);
        }}
        open={open}
        tabs={[
          { label: "Thông tin", value: "detail" },
          { label: "Thông số kỹ thuật", value: "schema" },
        ]}
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
            <Button
              onClick={onRefresh}
              size="sm"
              type="button"
              variant="secondary"
            >
              Thử lại
            </Button>
          </div>
        ) : equipmentType ? (
          <>
            <div hidden={activeTab !== "detail"}>
              <EquipmentTypeForm
                categories={categories}
                equipmentType={equipmentType}
                formId={UPDATE_EQUIPMENT_TYPE_FORM_ID}
                isSubmitting={isBusy}
                key={equipmentType.id}
                onMediaUploadingChange={setIsUploadingMedia}
                onSubmit={async (values) => {
                  await onSubmit(
                    equipmentType.id,
                    toUpdateEquipmentTypeRequest(values),
                  );
                }}
              />
            </div>
            {hasOpenedSchema ? (
              <div hidden={activeTab !== "schema"}>
                <SpecSchemaPanel
                  actions={schemaActions}
                  equipmentTypeId={equipmentType.id}
                  key={equipmentType.id}
                  onPublished={onSchemaPublished}
                  onStateChange={setSchemaState}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </FormDrawer>
      <ConfirmDialog
        confirmLabel="Bỏ thay đổi"
        description="Các thay đổi thông số kỹ thuật chưa lưu sẽ bị bỏ khi đóng. Bạn có muốn tiếp tục?"
        onConfirm={closeDrawer}
        onOpenChange={setIsDiscardConfirmOpen}
        open={isDiscardConfirmOpen}
        title="Bỏ thay đổi chưa lưu?"
        variant="danger"
      />
    </>
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
  activeTab = "detail",
  categories,
  equipmentType,
  formId,
  isSubmitting,
  onMediaUploadingChange,
  onSubmit,
  onTabChange,
}: {
  activeTab?: string;
  categories: CatalogCategoryDetail[];
  equipmentType?: CatalogEquipmentTypeDetail;
  formId: string;
  isSubmitting: boolean;
  onMediaUploadingChange: (isUploading: boolean) => void;
  onSubmit: (values: CatalogEquipmentTypeFormValues) => Promise<void>;
  onTabChange?: (tab: string) => void;
}) {
  const form = useForm<CatalogEquipmentTypeFormValues>({
    defaultValues: getDefaultValues(equipmentType),
    resolver: zodResolver(
      equipmentType
        ? catalogEquipmentTypeFormSchema
        : catalogEquipmentTypeCreateFormSchema,
    ),
    shouldFocusError: Boolean(equipmentType),
  });
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "fields" });
  const description = useWatch({ control, name: "description" });

  async function submitForm(values: CatalogEquipmentTypeFormValues) {
    await onSubmit(values);
  }

  return (
    <FormProvider {...form}>
      <form
        className="grid gap-5"
        id={formId}
        noValidate
        onSubmit={handleSubmit(submitForm, (formErrors) => {
          onTabChange?.(
            Object.keys(formErrors).some((key) => key !== "fields")
              ? "detail"
              : "schema",
          );
        })}
      >
        <div hidden={activeTab !== "detail"}>
          <div className="grid gap-5">
            {equipmentType?.status !== undefined ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-muted/40 px-3 py-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Trạng thái
                </p>
                <EquipmentTypeStatusBadge status={equipmentType.status} />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                disabled={isSubmitting}
                error={errors.code?.message}
                id={`${formId}-code`}
                label="Code"
                placeholder="VD: EXCAVATOR"
                required
                {...register("code")}
              />
              <TextField
                disabled={isSubmitting}
                error={errors.name?.message}
                id={`${formId}-name`}
                label="Tên loại thiết bị"
                placeholder="VD: Máy xúc"
                required
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
                  error={
                    fieldState.error?.message ??
                    errors.media?.root?.message ??
                    (errors.media
                      ? "Vui lòng kiểm tra thông tin ảnh."
                      : undefined)
                  }
                  itemErrors={errors.media}
                  onChange={field.onChange}
                  onUploadingChange={onMediaUploadingChange}
                  value={field.value}
                />
              )}
            />
          </div>
        </div>
        {!equipmentType ? (
          <div hidden={activeTab !== "schema"}>
            <fieldset className="min-w-0" disabled={isSubmitting}>
              <h2 className=" pb-4 text-sm font-semibold">
                Thông số kỹ thuật <span className="text-error">*</span>
              </h2>
              {fields.map((field, index) => (
                <SpecSchemaFieldEditor
                  index={index}
                  key={field.id}
                  onRemove={() => remove(index)}
                  readOnly={isSubmitting}
                />
              ))}
              <Button
                className="mt-4"
                onClick={() =>
                  append(
                    getSpecFieldFormValues(
                      undefined,
                      Math.max(
                        -1,
                        ...getValues("fields").map((field) =>
                          Number.isFinite(field.displayOrder)
                            ? field.displayOrder
                            : -1,
                        ),
                      ) + 1,
                    ),
                  )
                }
                type="button"
                variant="secondary"
              >
                <Plus className="size-4" />
                Thêm thông số
              </Button>
            </fieldset>
            {errors.fields?.message || errors.fields?.root?.message ? (
              <p className="mt-3 text-sm text-error" role="alert">
                {errors.fields.message ?? errors.fields.root?.message}
              </p>
            ) : null}
          </div>
        ) : null}
      </form>
    </FormProvider>
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
              className="flex cursor-pointer items-start gap-3 rounded p-2 text-sm font-semibold text-foreground hover:bg-hover-accent"
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
  itemErrors,
  onChange,
  onUploadingChange,
  value,
}: {
  disabled?: boolean;
  error?: string;
  itemErrors?: FieldErrors<CatalogEquipmentTypeFormValues>["media"];
  onChange: (value: CatalogEquipmentTypeFormMedia[]) => void;
  onUploadingChange: (isUploading: boolean) => void;
  value: CatalogEquipmentTypeFormMedia[];
}) {
  function setThumbnail(mediaId: string) {
    onChange(
      value.map((item) => ({
        ...item,
        isThumbnail: item.mediaId === mediaId,
      })),
    );
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
      <div>
        <p className="text-xs font-semibold uppercase text-foreground">Media</p>
        <div className="mt-3">
          <MediaAvatarUpload
            accept={IMAGE_CONTENT_TYPES.join(",")}
            disabled={disabled}
            mode="multiple"
            onChange={(_, upload) => {
              const uploads = Array.isArray(upload) ? upload : [upload];
              const nextItems = [
                ...value,
                ...uploads.map((item, index) =>
                  toMediaFormItem(item, value.length + index),
                ),
              ];

              onChange(ensureMediaThumbnail(nextItems));
            }}
            onUploadingChange={onUploadingChange}
            size="md"
            uploadFiles={uploadEquipmentTypeImages}
            uploadLabel="Thêm ảnh thiết bị"
            variant="add"
          />
        </div>
      </div>

      {value.length ? (
        <div className="grid gap-3">
          {value
            .map((item, sourceIndex) => ({ item, sourceIndex }))
            .sort(
              (left, right) => left.item.displayOrder - right.item.displayOrder,
            )
            .map(({ item, sourceIndex }, index) => (
              <div
                className={
                  item.isThumbnail
                    ? "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded border border-amber-300 bg-amber-50 p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_80px_auto_auto]"
                    : "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_80px_auto_auto]"
                }
                key={item.mediaId}
              >
                <div className="col-span-3 flex min-w-0 items-center gap-3 sm:col-span-1">
                  <AvatarWithSkeleton
                    alt={`Ảnh ${index + 1}`}
                    className="size-16 shrink-0 rounded border border-border bg-background"
                    fallback={`${index + 1}`}
                    fallbackClassName="rounded bg-muted text-sm font-semibold text-muted-foreground"
                    imageClassName="object-contain"
                    src={item.url}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      Ảnh {index + 1}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.mediaId}
                    </p>
                  </div>
                </div>
                <TextField
                  disabled={disabled}
                  error={itemErrors?.[sourceIndex]?.displayOrder?.message}
                  id={`equipment-media-${item.mediaId}-order`}
                  label="Thứ tự"
                  max={2147483647}
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
                  aria-label={
                    item.isThumbnail
                      ? `Ảnh ${index + 1} thumbnail`
                      : `thumbnail cho ảnh ${index + 1}`
                  }
                  aria-pressed={item.isThumbnail}
                  className="size-10 p-0 sm:w-auto sm:px-3"
                  disabled={disabled}
                  onClick={() => setThumbnail(item.mediaId)}
                  title={
                    item.isThumbnail ? "thumbnail" : "thumbnail"
                  }
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
                  <span className="hidden sm:inline">
                    {item.isThumbnail ? "thumbnail" : "thumbnail"}
                  </span>
                </Button>
                <Button
                  aria-label={`Xóa ảnh ${index + 1}`}
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
    fields: equipmentType ? [] : [getSpecFieldFormValues()],
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
    specSchema: toSpecDefinition(values),
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
    .sort(
      (leftItem, rightItem) => leftItem.displayOrder - rightItem.displayOrder,
    );
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
    url: upload.previewUrl || `/api/v1/media/${upload.mediaId}/content`,
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

  const oversized = files.find((file) => file.size > 20 * 1024 * 1024);
  if (oversized) {
    throw new Error(
      `Ảnh "${oversized.name}" vượt quá dung lượng tối đa cho phép (20MB).`,
    );
  }

  const uploads = await uploadMediaFiles(files);

  for (const upload of uploads) {
    if (upload.status.toLowerCase() !== "ready") {
      throw new Error(
        "Ảnh thiết bị chưa sẵn sàng sử dụng. Vui lòng thử lại sau.",
      );
    }
  }

  return uploads;
}
