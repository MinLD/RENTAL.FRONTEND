"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, RefreshCw, Save } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormDrawer } from "@/components/forms/form-drawer";
import { TextField } from "@/components/forms/text-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  catalogBrandFormSchema,
  type CatalogBrandFormValues,
} from "@/lib/validations/catalog-brand";
import { uploadMediaFile } from "@/services/media-service";
import type {
  CatalogBrand,
  CreateCatalogBrandRequest,
  UpdateCatalogBrandRequest,
} from "@/types/catalog";

const CREATE_BRAND_FORM_ID = "admin-create-brand-form";
const UPDATE_BRAND_FORM_ID = "admin-update-brand-form";
const LOGO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

type BrandCreateDrawerProps = {
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateCatalogBrandRequest) => Promise<void>;
  open: boolean;
};

export function BrandCreateDrawer({
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
}: BrandCreateDrawerProps) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const isBusy = isSubmitting || isUploadingLogo;

  return (
    <FormDrawer
      footer={
        <BrandDrawerFooter
          cancelLabel="Hủy"
          formId={CREATE_BRAND_FORM_ID}
          icon={isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
          isSubmitting={isBusy}
          onCancel={() => onOpenChange(false)}
          submitLabel={isSubmitting ? "Đang tạo..." : "Tạo thương hiệu"}
        />
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Thêm thương hiệu"
    >
      <BrandForm
        formId={CREATE_BRAND_FORM_ID}
        isSubmitting={isBusy}
        key={open ? "brand-create-open" : "brand-create-closed"}
        onLogoUploadingChange={setIsUploadingLogo}
        onSubmit={async (values) => {
          await onSubmit(toBrandRequest(values));
        }}
        open={open}
      />
    </FormDrawer>
  );
}

type BrandDetailDrawerProps = {
  brand: CatalogBrand | null;
  error?: string | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onSubmit: (id: string, request: UpdateCatalogBrandRequest) => Promise<void>;
  open: boolean;
  selectedName?: string | null;
};

export function BrandDetailDrawer({
  brand,
  error,
  isLoading = false,
  isSubmitting = false,
  onOpenChange,
  onRefresh,
  onSubmit,
  open,
  selectedName,
}: BrandDetailDrawerProps) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const isBusy = isSubmitting || isUploadingLogo || isLoading;

  return (
    <FormDrawer
      description={brand?.code ?? selectedName ?? "Thông tin thương hiệu"}
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
          {brand ? (
            <Button
              disabled={isBusy}
              form={UPDATE_BRAND_FORM_ID}
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
      title="Chi tiết thương hiệu"
    >
      {isLoading ? (
        <BrandDetailSkeleton />
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
      ) : brand ? (
        <BrandForm
          brand={brand}
          formId={UPDATE_BRAND_FORM_ID}
          isSubmitting={isBusy}
          key={brand.id}
          onLogoUploadingChange={setIsUploadingLogo}
          onSubmit={async (values) => {
            await onSubmit(brand.id, toBrandRequest(values));
          }}
          open={Boolean(brand)}
        />
      ) : null}
    </FormDrawer>
  );
}

function BrandDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải chi tiết thương hiệu"
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

function BrandForm({
  brand,
  formId,
  isSubmitting,
  onLogoUploadingChange,
  onSubmit,
  open,
}: {
  brand?: CatalogBrand;
  formId: string;
  isSubmitting: boolean;
  onLogoUploadingChange: (isUploading: boolean) => void;
  onSubmit: (values: CatalogBrandFormValues) => Promise<void>;
  open: boolean;
}) {
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(brand?.logoUrl ?? "");
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CatalogBrandFormValues>({
    defaultValues: getDefaultValues(brand),
    resolver: zodResolver(catalogBrandFormSchema),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(brand));
    }
  }, [brand, open, reset]);

  async function submitForm(values: CatalogBrandFormValues) {
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
        name="logoMediaId"
        render={({ field, fieldState }) => (
          <div className="space-y-2 rounded border border-border bg-muted/40 p-5">
            <p className="text-xs font-semibold uppercase text-foreground">
              Logo thương hiệu
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <MediaAvatarUpload
                accept={LOGO_CONTENT_TYPES.join(",")}
                disabled={isSubmitting}
                fallbackText={getBrandInitials(brand)}
                onChange={(mediaId, upload) => {
                  if (typeof mediaId === "string" && !Array.isArray(upload)) {
                    field.onChange(mediaId);
                    setLogoPreviewUrl(upload.previewUrl);
                  }
                }}
                onUploadingChange={onLogoUploadingChange}
                previewUrl={logoPreviewUrl}
                uploadFile={uploadBrandLogo}
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
                      setLogoPreviewUrl("");
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Xóa logo
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
          error={errors.code?.message}
          label="Mã thương hiệu"
          placeholder="VD: CAT"
          {...register("code")}
        />
        <TextField
          disabled={isSubmitting}
          error={errors.name?.message}
          label="Tên thương hiệu"
          placeholder="VD: Caterpillar"
          {...register("name")}
        />
        <TextField
          disabled={isSubmitting}
          error={errors.slug?.message}
          label="Slug"
          placeholder="VD: caterpillar"
          {...register("slug")}
        />
      </div>
    </form>
  );
}

function BrandDrawerFooter({
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

function getDefaultValues(brand?: CatalogBrand): CatalogBrandFormValues {
  return {
    code: brand?.code ?? "",
    logoMediaId: brand?.logoMediaId ?? "",
    name: brand?.name ?? "",
    slug: brand?.slug ?? "",
  };
}

function toBrandRequest(
  values: CatalogBrandFormValues,
): CreateCatalogBrandRequest {
  return {
    code: values.code.trim(),
    logoMediaId: normalizeNullableText(values.logoMediaId),
    name: values.name.trim(),
    slug: normalizeNullableText(values.slug),
  };
}

function normalizeNullableText(value?: string) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

function getBrandInitials(brand?: CatalogBrand) {
  const source = brand?.name || brand?.code || "BR";

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

async function uploadBrandLogo(file: File) {
  if (!LOGO_CONTENT_TYPES.includes(file.type)) {
    throw new Error("Logo chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
  }

  const upload = await uploadMediaFile(file);

  if (
    !catalogBrandFormSchema.shape.logoMediaId.safeParse(upload.mediaId).success
  ) {
    throw new Error("Không nhận được mã ảnh logo hợp lệ.");
  }

  if (upload.status.toLowerCase() !== "ready") {
    throw new Error("Ảnh logo chưa sẵn sàng sử dụng. Vui lòng thử lại sau.");
  }

  return upload;
}
