"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { BusinessInformationStep } from "@/components/partner/business-information-step";
import { ContactInformationStep } from "@/components/partner/contact-information-step";
import { LegalInformationStep } from "@/components/partner/legal-information-step";
import { Button } from "@/components/ui/button";
import {
  partnerRegistrationSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";
import { updateOwnOrganizationAction } from "@/services/actions/organization-actions";
import {
  ORGANIZATION_STATUS,
  type OrganizationResponse,
} from "@/types/organization";
import type { MediaDocumentReference } from "@/types/media";
import { cn } from "@/utils/cn";

type OwnerOrganizationFormProps = {
  citizenId?: string | null;
  organization: OrganizationResponse;
};

function formatInitialDate(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return dateStr.slice(0, 10);
  }
}

function getInitialValues(
  org: OrganizationResponse,
  citizenId?: string | null,
): PartnerRegistrationFormValues {
  return {
    name: org.name ?? "",
    type: 1,
    taxCode: org.taxCode ?? "",
    establishedDate: formatInitialDate(org.establishedDate),
    website: org.website ?? "",
    logoMediaId: org.logoMediaId ?? "",
    description: org.description ?? "",
    businessLicenseNumber: org.businessLicenseNumber ?? "",
    businessLicenseIssuedDate: formatInitialDate(org.businessLicenseIssuedDate),
    businessLicenseIssuedPlace: org.businessLicenseIssuedPlace ?? "",
    legalRepresentativeName: org.legalRepresentativeName ?? "",
    legalRepresentativeCitizenId: citizenId ?? "",
    businessLicenseDocumentMediaId: org.businessLicenseDocumentMediaId ?? "",
    contactEmail: org.contactEmail ?? "",
    contactPhone: org.contactPhone ?? "",
    province: org.province ?? "",
    ward: org.ward ?? "",
    address: org.address ?? "",
  };
}

const STATUS_CONFIG = {
  [ORGANIZATION_STATUS.pending]: {
    label: "Đang chờ duyệt",
    icon: Clock,
    badgeClass: "bg-warning/10 text-warning border-warning/20",
  },
  [ORGANIZATION_STATUS.active]: {
    label: "Đã kích hoạt",
    icon: CheckCircle2,
    badgeClass: "bg-success/10 text-success border-success/20",
  },
  [ORGANIZATION_STATUS.rejected]: {
    label: "Bị từ chối",
    icon: AlertCircle,
    badgeClass: "bg-error/10 text-error border-error/20",
  },
  [ORGANIZATION_STATUS.suspended]: {
    label: "Tạm ngưng",
    icon: ShieldAlert,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
} as const;

export function OwnerOrganizationForm({
  citizenId,
  organization,
}: OwnerOrganizationFormProps) {
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(organization.logoUrl ?? "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialLicenseDocument: MediaDocumentReference | null =
    organization.businessLicenseDocumentMediaId
      ? {
          mediaId: organization.businessLicenseDocumentMediaId,
          originalFileName: "Giấy phép kinh doanh hiện tại",
          previewUrl: organization.businessLicenseDocumentUrl ?? "",
        }
      : null;

  const [licenseDocument, setLicenseDocument] =
    useState<MediaDocumentReference | null>(initialLicenseDocument);

  const form = useForm<PartnerRegistrationFormValues>({
    resolver: zodResolver(partnerRegistrationSchema),
    defaultValues: getInitialValues(organization, citizenId),
  });

  const {
    formState: { isDirty },
    handleSubmit,
    reset,
  } = form;

  async function onSubmit(values: PartnerRegistrationFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await updateOwnOrganizationAction(organization.id, values);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      toast.success("Cập nhật thông tin tổ chức thành công.");
      reset(values);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Không thể cập nhật hồ sơ tổ chức.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    reset(getInitialValues(organization, citizenId));
    setLogoPreviewUrl(organization.logoUrl ?? "");
    setLicenseDocument(initialLicenseDocument);
  }

  const statusInfo =
    STATUS_CONFIG[organization.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG[ORGANIZATION_STATUS.pending];
  const StatusIcon = statusInfo.icon;

  return (
    <section className="flex flex-col rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Thông tin tổ chức & Địa chỉ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý thông tin doanh nghiệp, địa chỉ trụ sở và thông tin pháp lý của chủ thiết bị.
          </p>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            statusInfo.badgeClass,
          )}
        >
          <StatusIcon className="size-3.5" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      <FormProvider {...form}>
        <form className="mt-6 space-y-10" onSubmit={handleSubmit(onSubmit)}>
          {/* Section 1: Địa chỉ & Thông tin liên hệ (Ưu tiên theo yêu cầu của Owner) */}
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-semibold text-foreground">
                Địa chỉ trụ sở & Thông tin liên hệ
              </h2>
              <p className="text-xs text-muted-foreground">
                Địa chỉ hoạt động chính thức của tổ chức/doanh nghiệp.
              </p>
            </div>
            <ContactInformationStep />
          </div>

          {/* Section 2: Thông tin doanh nghiệp */}
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-semibold text-foreground">
                Thông tin doanh nghiệp
              </h2>
              <p className="text-xs text-muted-foreground">
                Tên, mã số thuế, giới thiệu và nhận diện thương hiệu.
              </p>
            </div>
            <BusinessInformationStep
              isUploadingLogo={isUploadingLogo}
              logoPreviewUrl={logoPreviewUrl}
              onLogoPreviewChange={setLogoPreviewUrl}
              onLogoUploadingChange={setIsUploadingLogo}
            />
          </div>

          {/* Section 3: Thông tin pháp lý & Giấy tờ */}
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-semibold text-foreground">
                Thông tin pháp lý & Người đại diện
              </h2>
              <p className="text-xs text-muted-foreground">
                Giấy phép kinh doanh và thông tin người đại diện theo pháp luật.
              </p>
            </div>
            <LegalInformationStep
              licenseDocument={licenseDocument}
              onLicenseDocumentChange={setLicenseDocument}
              onLicenseUploadingChange={setIsUploadingLicense}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
            {isDirty ? (
              <Button
                disabled={isSubmitting}
                onClick={handleReset}
                type="button"
                variant="secondary"
              >
                <RotateCcw className="size-4" />
                Hủy thay đổi
              </Button>
            ) : null}
            <Button
              disabled={isSubmitting || isUploadingLogo || isUploadingLicense || !isDirty}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </section>
  );
}
