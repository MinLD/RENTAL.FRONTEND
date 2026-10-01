"use client";

import { LockKeyhole } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { TextField } from "@/components/forms/text-field";
import { MediaDocumentUpload } from "@/components/media/media-document-upload";
import {
  businessLicenseMediaIdSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";
import { uploadMediaFile } from "@/services/media-service";
import type { MediaUploadResponse } from "@/types/media";

type LegalInformationStepProps = {
  licenseDocument: MediaUploadResponse | null;
  onLicenseDocumentChange: (upload: MediaUploadResponse | null) => void;
  onLicenseUploadingChange: (isUploading: boolean) => void;
};

export function LegalInformationStep({
  licenseDocument,
  onLicenseDocumentChange,
  onLicenseUploadingChange,
}: LegalInformationStepProps) {
  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<PartnerRegistrationFormValues>();

  return (
    <div className="mt-8 space-y-8">
      <section aria-labelledby="partner-license-heading" className="space-y-4">
        <h2
          className="text-xs font-bold uppercase text-foreground"
          id="partner-license-heading"
        >
          Giấy phép kinh doanh
        </h2>
        <TextField
          error={errors.businessLicenseNumber?.message}
          id="partner-license-number"
          label="Số giấy phép kinh doanh"
          maxLength={50}
          placeholder="Ví dụ: GP-123456"
          {...register("businessLicenseNumber")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            error={errors.businessLicenseIssuedDate?.message}
            id="partner-license-date"
            label="Ngày cấp"
            type="date"
            {...register("businessLicenseIssuedDate")}
          />
          <TextField
            error={errors.businessLicenseIssuedPlace?.message}
            id="partner-license-place"
            label="Nơi cấp"
            maxLength={200}
            placeholder="Nhập tên cơ quan cấp giấy phép kinh doanh"
            {...register("businessLicenseIssuedPlace")}
          />
        </div>
      </section>

      <section
        aria-labelledby="partner-representative-heading"
        className="space-y-4"
      >
        <h2
          className="text-xs font-bold uppercase text-foreground"
          id="partner-representative-heading"
        >
          Người đại diện pháp luật
        </h2>
        <TextField
          autoComplete="name"
          error={errors.legalRepresentativeName?.message}
          id="partner-representative-name"
          label="Họ và tên người đại diện"
          maxLength={100}
          placeholder="Nguyễn Văn A"
          required
          {...register("legalRepresentativeName")}
        />
        <div>
          <TextField
            aria-describedby={
              errors.legalRepresentativeCitizenId
                ? "partner-representative-citizen-id-error partner-representative-citizen-id-hint"
                : "partner-representative-citizen-id-hint"
            }
            error={errors.legalRepresentativeCitizenId?.message}
            id="partner-representative-citizen-id"
            inputMode="numeric"
            label="CCCD/CMND"
            maxLength={12}
            placeholder="Nhập 12 chữ số"
            {...register("legalRepresentativeCitizenId")}
          />
          <p
            className="mt-1.5 text-xs text-muted-foreground"
            id="partner-representative-citizen-id-hint"
          ></p>
        </div>
      </section>

      <section aria-labelledby="partner-document-heading" className="space-y-3">
        <h2
          className="text-xs font-bold uppercase text-foreground"
          id="partner-document-heading"
        >
          Giấy tờ xác minh <span className="text-error">*</span>
        </h2>
        <Controller
          control={control}
          name="businessLicenseDocumentMediaId"
          render={({ field, fieldState }) => (
            <>
              <MediaDocumentUpload
                error={fieldState.error?.message}
                label="Tải giấy phép kinh doanh"
                onChange={(upload) => {
                  field.onChange(upload?.mediaId ?? "");
                  field.onBlur();
                  onLicenseDocumentChange(upload);
                }}
                onUploadingChange={onLicenseUploadingChange}
                ref={field.ref}
                uploadFile={uploadBusinessLicense}
                value={licenseDocument}
              />
              <input name={field.name} type="hidden" value={field.value} />
            </>
          )}
        />
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
          Thông tin pháp lý chỉ được sử dụng cho mục đích xác minh doanh nghiệp.
        </p>
      </section>
    </div>
  );
}

async function uploadBusinessLicense(file: File) {
  const upload = await uploadMediaFile(file);

  if (!businessLicenseMediaIdSchema.safeParse(upload.mediaId).success) {
    throw new Error("Không nhận được mã tài liệu giấy phép kinh doanh hợp lệ.");
  }

  if (upload.status.toLowerCase() !== "ready") {
    throw new Error("Tài liệu chưa sẵn sàng sử dụng. Vui lòng thử lại sau.");
  }

  return upload;
}
