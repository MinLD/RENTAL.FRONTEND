"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, RefreshCw, Save } from "lucide-react";
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
  catalogCategoryFormSchema,
  type CatalogCategoryFormValues,
} from "@/lib/validations/catalog-category";
import { uploadMediaFile } from "@/services/media-service";
import type {
  CatalogCategoryDetail,
  CreateCatalogCategoryRequest,
  UpdateCatalogCategoryRequest,
} from "@/types/catalog";

const CREATE_CATEGORY_FORM_ID = "admin-create-category-form";
const UPDATE_CATEGORY_FORM_ID = "admin-update-category-form";
const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

type CategoryCreateDrawerProps = {
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateCatalogCategoryRequest) => Promise<void>;
  open: boolean;
};

export function CategoryCreateDrawer({
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
}: CategoryCreateDrawerProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const isBusy = isSubmitting || isUploadingImage;

  return (
    <FormDrawer
      footer={
        <CategoryDrawerFooter
          cancelLabel="Hủy"
          formId={CREATE_CATEGORY_FORM_ID}
          icon={
            isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )
          }
          isSubmitting={isBusy}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Đang tạo..." : "Tạo danh mục"}
        />
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Thêm danh mục"
    >
      <CategoryForm
        formId={CREATE_CATEGORY_FORM_ID}
        isSubmitting={isBusy}
        key={open ? "category-create-open" : "category-create-closed"}
        onImageUploadingChange={setIsUploadingImage}
        onSubmit={async (values) => {
          await onSubmit(toCreateCategoryRequest(values));
        }}
      />
    </FormDrawer>
  );
}

type CategoryDetailDrawerProps = {
  category: CatalogCategoryDetail | null;
  error?: string | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onSubmit: (id: string, request: UpdateCatalogCategoryRequest) => Promise<void>;
  open: boolean;
  selectedName?: string | null;
};

export function CategoryDetailDrawer({
  category,
  error,
  isLoading = false,
  isSubmitting = false,
  onOpenChange,
  onRefresh,
  onSubmit,
  open,
  selectedName,
}: CategoryDetailDrawerProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const isBusy = isSubmitting || isUploadingImage || isLoading;

  return (
    <FormDrawer
      description={category?.slug ?? selectedName ?? "Thông tin danh mục"}
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
          {category ? (
            <Button
              disabled={isBusy}
              form={UPDATE_CATEGORY_FORM_ID}
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
      title="Chi tiết danh mục"
    >
      {isLoading ? (
        <CategoryDetailSkeleton />
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
      ) : category ? (
        <CategoryForm
          category={category}
          formId={UPDATE_CATEGORY_FORM_ID}
          isSubmitting={isBusy}
          key={category.id}
          onImageUploadingChange={setIsUploadingImage}
          onSubmit={async (values) => {
            await onSubmit(category.id, toUpdateCategoryRequest(values));
          }}
          showStatus
        />
      ) : null}
    </FormDrawer>
  );
}

function CategoryDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải chi tiết danh mục"
      className="space-y-6"
    >
      <Skeleton className="size-24 rounded-lg" />
      {Array.from({ length: 4 }, (_, index) => (
        <div className="space-y-2" key={index}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function CategoryForm({
  category,
  formId,
  isSubmitting,
  onImageUploadingChange,
  onSubmit,
  showStatus = false,
}: {
  category?: CatalogCategoryDetail;
  formId: string;
  isSubmitting: boolean;
  onImageUploadingChange: (isUploading: boolean) => void;
  onSubmit: (values: CatalogCategoryFormValues) => Promise<void>;
  showStatus?: boolean;
}) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    category?.imageUrl ?? "",
  );
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CatalogCategoryFormValues>({
    defaultValues: getDefaultValues(category),
    resolver: zodResolver(catalogCategoryFormSchema),
  });
  const description = useWatch({ control, name: "description" });

  async function submitForm(values: CatalogCategoryFormValues) {
    await onSubmit(values);
  }

  return (
    <form
      className="grid gap-5"
      id={formId}
      onSubmit={handleSubmit(submitForm)}
    >
      <Controller
        control={control}
        name="imageMediaId"
        render={({ field, fieldState }) => (
          <div className="space-y-2 rounded border border-border bg-muted/40 p-5">
            <p className="text-xs font-semibold uppercase text-foreground">
              Ảnh danh mục
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <MediaAvatarUpload
                accept={IMAGE_CONTENT_TYPES.join(",")}
                disabled={isSubmitting}
                emptyLabel="Tải ảnh"
                fallbackText={getCategoryInitials(category)}
                onChange={(mediaId, upload) => {
                  if (typeof mediaId === "string" && !Array.isArray(upload)) {
                    field.onChange(mediaId);
                    setImagePreviewUrl(upload.previewUrl);
                  }
                }}
                onUploadingChange={onImageUploadingChange}
                previewAlt="Ảnh danh mục"
                previewUrl={imagePreviewUrl}
                replaceLabel="Thay ảnh danh mục"
                uploadFile={uploadCategoryImage}
                uploadLabel="Tải ảnh danh mục"
                variant="logo"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  JPG, PNG hoặc WEBP. Không bắt buộc.
                </p>
                {field.value ? (
                  <Button
                    disabled={isSubmitting}
                    onClick={() => {
                      field.onChange("");
                      setImagePreviewUrl("");
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Xóa ảnh
                  </Button>
                ) : null}
              </div>
            </div>
            <input name={field.name} type="hidden" value={field.value ?? ""} />
            {fieldState.error ? (
              <p className="text-xs font-medium text-error">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />

      <div className="grid gap-4">
        <TextField
          disabled={isSubmitting}
          error={errors.name?.message}
          label="Tên danh mục"
          placeholder="VD: Máy xúc"
          {...register("name")}
        />
        <TextareaField
          characterCount={description?.length ?? 0}
          disabled={isSubmitting}
          error={errors.description?.message}
          label="Mô tả"
          maxLength={2000}
          placeholder="Mô tả ngắn về danh mục..."
          {...register("description")}
        />
        {showStatus ? (
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-3 rounded border border-border bg-background p-3 text-sm font-semibold text-foreground">
                <Checkbox
                  checked={field.value === true}
                  disabled={isSubmitting}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                Đang hoạt động
              </label>
            )}
          />
        ) : null}
      </div>
    </form>
  );
}

function CategoryDrawerFooter({
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
  category?: CatalogCategoryDetail,
): CatalogCategoryFormValues {
  return {
    description: category?.description ?? "",
    imageMediaId: category?.imageMediaId ?? "",
    isActive: category?.isActive ?? true,
    name: category?.name ?? "",
  };
}

function toCreateCategoryRequest(
  values: CatalogCategoryFormValues,
): CreateCatalogCategoryRequest {
  return {
    description: normalizeNullableText(values.description),
    imageMediaId: normalizeNullableText(values.imageMediaId),
    name: values.name.trim(),
  };
}

function toUpdateCategoryRequest(
  values: CatalogCategoryFormValues,
): UpdateCatalogCategoryRequest {
  return {
    description: normalizeNullableText(values.description),
    imageMediaId: normalizeNullableText(values.imageMediaId),
    isActive: values.isActive === true,
    name: values.name.trim(),
  };
}

function normalizeNullableText(value?: string) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

function getCategoryInitials(category?: CatalogCategoryDetail) {
  const source = category?.name || "DM";

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

async function uploadCategoryImage(file: File) {
  if (!IMAGE_CONTENT_TYPES.includes(file.type)) {
    throw new Error("Ảnh danh mục chỉ hỗ trợ JPG, PNG hoặc WEBP.");
  }

  const upload = await uploadMediaFile(file);

  if (
    !catalogCategoryFormSchema.shape.imageMediaId.safeParse(upload.mediaId)
      .success
  ) {
    throw new Error("Không nhận được mã ảnh danh mục hợp lệ.");
  }

  if (upload.status.toLowerCase() !== "ready") {
    throw new Error("Ảnh danh mục chưa sẵn sàng sử dụng. Vui lòng thử lại sau.");
  }

  return upload;
}
