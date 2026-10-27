"use client";

import { Check, FileText } from "lucide-react";
import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  InformationReviewCard,
  InformationReviewList,
} from "@/components/forms/information-review-card";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import type { PartnerRegistrationFormValues } from "@/lib/validations/partner-registration";
import type { MediaDocumentReference } from "@/types/media";

type ConfirmationStepProps = {
  confirmed: boolean;
  disabled?: boolean;
  licenseDocument: MediaDocumentReference | null;
  logoPreviewUrl: string;
  onConfirmedChange: (confirmed: boolean) => void;
  onEdit: (step: "business" | "legal" | "contact") => void;
};

function formatDate(value?: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function ConfirmationStep({
  confirmed,
  disabled,
  licenseDocument,
  logoPreviewUrl,
  onConfirmedChange,
  onEdit,
}: ConfirmationStepProps) {
  const { control } = useFormContext<PartnerRegistrationFormValues>();
  const values = useWatch({ control });
  const confirmationId = useId();
  const hintId = `${confirmationId}-hint`;
  const address = [values.address, values.ward, values.province]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mt-6 space-y-5">
      <InformationReviewCard
        disabled={disabled}
        onEdit={() => onEdit("business")}
        title="Thông tin doanh nghiệp"
      >
        <div className="mb-6 flex min-w-0 items-center gap-4">
          <AvatarWithSkeleton
            alt="Logo doanh nghiệp"
            className="size-12 shrink-0 rounded-lg border border-border/60"
            fallback="DN"
            fallbackClassName="rounded-lg bg-slate-50 text-sm"
            imageClassName="object-contain p-1"
            src={logoPreviewUrl}
          />
          <div className="min-w-0">
            <p className="break-words font-semibold text-foreground">{values.name}</p>
            <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground">
              Nhà cung cấp thiết bị
            </span>
          </div>
        </div>
        <InformationReviewList
          rows={[
            { label: "Mã số thuế", value: values.taxCode },
            { label: "Ngày thành lập", value: formatDate(values.establishedDate) },
            {
              label: "Website",
              value: values.website?.trim() ? (
                <a
                  className="text-blue-600 hover:underline"
                  href={values.website.trim()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {values.website.trim()}
                </a>
              ) : undefined,
            },
            { label: "Giới thiệu", value: values.description?.trim() },
          ]}
        />
      </InformationReviewCard>

      <InformationReviewCard
        disabled={disabled}
        onEdit={() => onEdit("legal")}
        title="Thông tin pháp lý"
      >
        <InformationReviewList
          rows={[
            { label: "Người đại diện", value: values.legalRepresentativeName },
            {
              label: "CCCD / CMND",
              value: values.legalRepresentativeCitizenId?.trim() || "Sử dụng CCCD của tài khoản",
            },
            { label: "Số giấy phép kinh doanh", value: values.businessLicenseNumber?.trim() },
            { label: "Ngày cấp", value: formatDate(values.businessLicenseIssuedDate) },
            { label: "Nơi cấp", value: values.businessLicenseIssuedPlace?.trim() },
          ]}
        />
        {licenseDocument ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-slate-50 px-4 py-3 text-sm">
            <div className="flex min-w-0 items-center gap-3">
              <FileText aria-hidden="true" className="size-4 shrink-0 text-primary" />
              {licenseDocument.previewUrl ? (
                <a
                  className="min-w-0 break-all text-foreground hover:text-primary hover:underline"
                  href={licenseDocument.previewUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {licenseDocument.originalFileName}
                </a>
              ) : (
                <span className="min-w-0 break-all">{licenseDocument.originalFileName}</span>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-success">
              <Check aria-hidden="true" className="size-3.5" /> Đã tải lên
            </span>
          </div>
        ) : null}
      </InformationReviewCard>

      <InformationReviewCard
        disabled={disabled}
        onEdit={() => onEdit("contact")}
        title="Địa chỉ & liên hệ"
      >
        <InformationReviewList
          rows={[
            { label: "Email", value: values.contactEmail },
            { label: "Số điện thoại", value: values.contactPhone },
            { label: "Địa chỉ", value: address },
          ]}
        />
      </InformationReviewCard>

      <div className="pt-1">
        <div className="flex items-start gap-3">
          <Checkbox
            aria-describedby={hintId}
            checked={confirmed}
            className="mt-0.5"
            disabled={disabled}
            id={confirmationId}
            onCheckedChange={(checked) => onConfirmedChange(checked === true)}
            type="button"
          />
          <label className="cursor-pointer text-sm leading-5 text-foreground" htmlFor={confirmationId}>
            Tôi xác nhận các thông tin trên là chính xác và chịu trách nhiệm về thông tin đã cung cấp.
          </label>
        </div>
        <p className="ml-7 mt-2 text-xs leading-5 text-muted-foreground" id={hintId}>
          Sau khi gửi, hồ sơ sẽ được DPU Rental xét duyệt trước khi doanh nghiệp có thể đăng thiết bị cho thuê.
        </p>
      </div>

    </div>
  );
}
