"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Button } from "@/components/ui/button";
import {
  organizationLogoMediaIdSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";
import { uploadMediaFile } from "@/services/media-service";

const LOGO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

type BusinessInformationStepProps = {
  isUploadingLogo: boolean;
  logoPreviewUrl: string;
  onLogoPreviewChange: (url: string) => void;
  onLogoUploadingChange: (isUploading: boolean) => void;
};

export function BusinessInformationStep({
  isUploadingLogo,
  logoPreviewUrl,
  onLogoPreviewChange,
  onLogoUploadingChange,
}: BusinessInformationStepProps) {
  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<PartnerRegistrationFormValues>();
  const description = useWatch({ control, name: "description" });

  return (
    <div className="mt-6 grid gap-5">
      <Controller
        control={control}
        name="logoMediaId"
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-foreground">
              Logo doanh nghiệp
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <MediaAvatarUpload
                accept={LOGO_CONTENT_TYPES.join(",")}
                onChange={(mediaId, upload) => {
                  if (typeof mediaId === "string" && !Array.isArray(upload)) {
                    field.onChange(mediaId);
                    onLogoPreviewChange(upload.previewUrl);
                  }
                }}
                onUploadingChange={onLogoUploadingChange}
                previewUrl={logoPreviewUrl}
                uploadFile={uploadOrganizationLogo}
                variant="logo"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  JPG, PNG hoặc WEBP. Không bắt buộc.
                </p>
                {field.value ? (
                  <Button
                    disabled={isUploadingLogo}
                    onClick={() => {
                      field.onChange("");
                      onLogoPreviewChange("");
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
            <input name={field.name} type="hidden" value={field.value} />
            {fieldState.error ? (
              <p className="text-xs font-medium text-error">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />

      <TextField
        autoComplete="organization"
        error={errors.name?.message}
        id="partner-name"
        label="Tên doanh nghiệp"
        maxLength={150}
        placeholder="Ví dụ: Công ty TNHH Thiết Bị ABC"
        required
        {...register("name")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          error={errors.taxCode?.message}
          id="partner-tax-code"
          label="Mã số thuế"
          maxLength={14}
          placeholder="0312345678 hoặc 0312345678-001"
          required
          {...register("taxCode")}
        />
        <TextField
          error={errors.establishedDate?.message}
          id="partner-established-date"
          label="Ngày thành lập"
          type="date"
          {...register("establishedDate")}
        />
      </div>

      <TextField
        autoComplete="url"
        error={errors.website?.message}
        id="partner-website"
        label="Website"
        maxLength={500}
        placeholder="https://example.com"
        type="url"
        {...register("website")}
      />

      <TextareaField
        characterCount={description?.length ?? 0}
        error={errors.description?.message}
        id="partner-description"
        label="Giới thiệu doanh nghiệp"
        maxLength={2000}
        placeholder="Mô tả ngắn về doanh nghiệp, lĩnh vực hoạt động và các loại thiết bị cung cấp..."
        {...register("description")}
      />
    </div>
  );
}

async function uploadOrganizationLogo(file: File) {
  if (!LOGO_CONTENT_TYPES.includes(file.type)) {
    throw new Error("Logo chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
  }

  const upload = await uploadMediaFile(file);

  if (!organizationLogoMediaIdSchema.safeParse(upload.mediaId).success) {
    throw new Error("Không nhận được mã ảnh logo hợp lệ.");
  }

  if (upload.status.toLowerCase() !== "ready") {
    throw new Error("Ảnh logo chưa sẵn sàng sử dụng. Vui lòng thử lại sau.");
  }

  return upload;
}
