"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  MultiStepFormLayout,
  type MultiStepFormStep,
} from "@/components/forms/multi-step-form-layout";
import { BusinessInformationStep } from "@/components/partner/business-information-step";
import { ConfirmationStep } from "@/components/partner/confirmation-step";
import { ContactInformationStep } from "@/components/partner/contact-information-step";
import { LegalInformationStep } from "@/components/partner/legal-information-step";
import { Button } from "@/components/ui/button";
import {
  BUSINESS_INFORMATION_FIELDS,
  CONTACT_INFORMATION_FIELDS,
  LEGAL_INFORMATION_FIELDS,
  partnerRegistrationSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";
import { ApiError } from "@/services/api-error";
import { registerOrganization, updateOrganizationProfile } from "@/services/organization-service";
import type { MediaDocumentReference } from "@/types/media";
import type { OrganizationApplication, OrganizationResponse } from "@/types/organization";
import { withReturnTo } from "@/utils/return-to";

const PROFILE_NOT_COMPLETED_ERROR_CODE = "Profile.NotCompleted";

const PARTNER_REGISTRATION_STEPS = [
  {
    id: "business",
    title: "Thông tin doanh nghiệp",
    description: "Cung cấp các thông tin cơ bản về doanh nghiệp của bạn.",
  },
  {
    id: "legal",
    title: "Thông tin pháp lý",
    description:
      "Các thông tin này được sử dụng để xác minh doanh nghiệp trước khi cho phép đăng thiết bị.",
  },
  {
    id: "contact",
    title: "Địa chỉ & liên hệ",
    heading: "Địa chỉ & thông tin liên hệ",
    description:
      "Thông tin này giúp DPRENTAL và khách hàng có thể liên hệ với doanh nghiệp khi cần thiết.",
  },
  {
    id: "confirmation",
    title: "Xác nhận",
    heading: "Xác nhận thông tin",
    description: "Kiểm tra lại thông tin trước khi gửi hồ sơ xét duyệt.",
  },
] as const satisfies readonly MultiStepFormStep[];

type PartnerStepId = (typeof PARTNER_REGISTRATION_STEPS)[number]["id"];

type PartnerRegistrationViewProps = {
  initialOrganization?: OrganizationResponse;
  onSubmitted: (organization: OrganizationApplication) => void;
  onCancel?: () => void;
};

export function PartnerRegistrationView({
  initialOrganization,
  onSubmitted,
  onCancel,
}: PartnerRegistrationViewProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<PartnerStepId>(
    PARTNER_REGISTRATION_STEPS[0].id,
  );
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(initialOrganization?.logoUrl ?? "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [licenseDocument, setLicenseDocument] =
    useState<MediaDocumentReference | null>(() => initialOrganization?.businessLicenseDocumentMediaId ? {
      mediaId: initialOrganization.businessLicenseDocumentMediaId,
      originalFileName: "Giấy phép kinh doanh đã tải lên",
      previewUrl: initialOrganization.businessLicenseDocumentUrl ?? "",
    } : null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [completedStepIds, setCompletedStepIds] = useState<PartnerStepId[]>([]);
  const [isValidatingStep, setIsValidatingStep] = useState(false);
  const [hasConfirmedInformation, setHasConfirmedInformation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const hasSubmitted = useRef(false);
  const submissionInProgress = useRef(false);
  const isChangingStep = useRef(false);
  const pendingFocus = useRef<keyof PartnerRegistrationFormValues | null>(null);
  const form = useForm<PartnerRegistrationFormValues>({
    defaultValues: {
      contactEmail: initialOrganization?.contactEmail ?? "",
      contactPhone: initialOrganization?.contactPhone ?? "",
      province: initialOrganization?.province ?? "",
      ward: initialOrganization?.ward ?? "",
      address: initialOrganization?.address ?? "",
      businessLicenseNumber: initialOrganization?.businessLicenseNumber ?? "",
      businessLicenseIssuedDate: initialOrganization?.businessLicenseIssuedDate ?? "",
      businessLicenseIssuedPlace: initialOrganization?.businessLicenseIssuedPlace ?? "",
      businessLicenseDocumentMediaId: initialOrganization?.businessLicenseDocumentMediaId ?? "",
      legalRepresentativeName: initialOrganization?.legalRepresentativeName ?? "",
      legalRepresentativeCitizenId: "",
      description: initialOrganization?.description ?? "",
      establishedDate: initialOrganization?.establishedDate ?? "",
      logoMediaId: initialOrganization?.logoMediaId ?? "",
      name: initialOrganization?.name ?? "",
      taxCode: initialOrganization?.taxCode ?? "",
      type: 1,
      website: initialOrganization?.website ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(partnerRegistrationSchema),
    reValidateMode: "onChange",
    shouldUnregister: false,
  });
  const isUploading = isUploadingLogo || isUploadingLicense;
  const isNavigationDisabled = isUploading || isValidatingStep || isSubmitting;
  const currentStepIndex = PARTNER_REGISTRATION_STEPS.findIndex(
    (step) => step.id === currentStep,
  );
  const previousStep = PARTNER_REGISTRATION_STEPS[currentStepIndex - 1];
  const nextStep = PARTNER_REGISTRATION_STEPS[currentStepIndex + 1];
  const canContinue = currentStep !== "confirmation";

  useEffect(() => {
    if (pendingFocus.current) {
      form.setFocus(pendingFocus.current);
      pendingFocus.current = null;
    }
  }, [currentStep, form]);

  async function validatePreviousSteps(stepCount: number) {
    const completed: PartnerStepId[] = [];

    for (const step of PARTNER_REGISTRATION_STEPS.slice(0, stepCount)) {
      const fields =
        step.id === "business"
          ? BUSINESS_INFORMATION_FIELDS
          : step.id === "legal"
            ? LEGAL_INFORMATION_FIELDS
            : step.id === "contact"
              ? CONTACT_INFORMATION_FIELDS
              : null;

      if (!fields) continue;

      const isValid = await form.trigger([...fields]);

      if (!isValid) {
        setCompletedStepIds((ids) => [
          ...new Set([...ids.filter((id) => id !== step.id), ...completed]),
        ]);
        const firstInvalidField = fields.find(
          (field) => form.getFieldState(field).error,
        );

        if (step.id === currentStep && firstInvalidField) {
          form.setFocus(firstInvalidField);
        } else if (step.id !== currentStep) {
          pendingFocus.current = firstInvalidField ?? null;
          setCurrentStep(step.id);
        }

        return false;
      }

      completed.push(step.id);
    }

    setCompletedStepIds((ids) => [...new Set([...ids, ...completed])]);
    return true;
  }

  async function handleStepChange(stepId: string) {
    const nextStep = PARTNER_REGISTRATION_STEPS.find(
      (step) => step.id === stepId,
    );

    if (
      !nextStep ||
      isUploading ||
      isChangingStep.current ||
      submissionInProgress.current ||
      stepId === currentStep
    ) {
      return;
    }

    isChangingStep.current = true;
    setIsValidatingStep(true);

    try {
      const nextStepIndex = PARTNER_REGISTRATION_STEPS.indexOf(nextStep);

      if (nextStepIndex > currentStepIndex) {
        if (!(await validatePreviousSteps(nextStepIndex))) {
          return;
        }
      }

      if (currentStep === "confirmation") {
        setHasConfirmedInformation(false);
        setSubmissionError("");
      }
      setCurrentStep(nextStep.id);
    } finally {
      isChangingStep.current = false;
      setIsValidatingStep(false);
    }
  }

  async function handleRegistrationSubmit() {
    if (
      currentStep !== "confirmation" ||
      !hasConfirmedInformation ||
      isNavigationDisabled ||
      submissionInProgress.current ||
      hasSubmitted.current
    ) {
      return;
    }

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setSubmissionError("");

    try {
      if (!(await validatePreviousSteps(PARTNER_REGISTRATION_STEPS.length - 1))) {
        setHasConfirmedInformation(false);
        return;
      }

      if (initialOrganization) {
        const updated = await updateOrganizationProfile(initialOrganization.id, form.getValues());
        hasSubmitted.current = true;
        onSubmitted(updated);
      } else {
        const registration = await registerOrganization(form.getValues());
        if (!registration?.organizationId || !Number.isInteger(registration.status)) {
          throw new Error("Missing registration response.");
        }
        hasSubmitted.current = true;
        // Render from the POST response immediately; no additional GET after creation.
        onSubmitted({
          id: registration.organizationId,
          status: registration.status,
          createdAtUtc: registration.createdAtUtc,
          submittedAtUtc: registration.submittedAtUtc,
        });
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        isProfileNotCompletedError(error)
      ) {
        toast.error(
          "Bạn cần cập nhật CCCD, số điện thoại và ngày sinh trước khi đăng ký tổ chức.",
        );
        router.push(withReturnTo(
          "/account",
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        ));
        return;
      }

      setSubmissionError(
        error instanceof ApiError
          ? error.message
          : "Không thể gửi hồ sơ. Vui lòng thử lại sau.",
      );
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          if (canContinue && nextStep) {
            void handleStepChange(nextStep.id);
          } else if (currentStep === "confirmation") {
            void handleRegistrationSubmit();
          }
        }}
      >
        <MultiStepFormLayout
          completedStepIds={completedStepIds}
          currentStep={currentStep}
          footer={
            <div
              className={
                currentStep === "confirmation"
                  ? "flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
                  : currentStep === "contact"
                    ? "flex w-full items-center justify-between gap-3 border-t border-border/60 pt-4"
                    : "flex items-center justify-self-end-safe gap-3"
              }
            >
              {previousStep && (
                <>
                  <Button
                    disabled={isNavigationDisabled}
                    onClick={() => {
                      if (previousStep) {
                        void handleStepChange(previousStep.id);
                      }
                    }}
                    type="button"
                    variant="secondary"
                  >
                    <ArrowLeft className="size-4" /> Quay lại
                  </Button>
                </>
              )}
              {!previousStep && onCancel && (
                <Button
                  disabled={isNavigationDisabled}
                  onClick={onCancel}
                  type="button"
                  variant="secondary"
                >
                  Hủy chỉnh sửa
                </Button>
              )}
              {canContinue && nextStep ? (
                <Button
                  disabled={isNavigationDisabled}
                  onClick={() => {
                    void handleStepChange(nextStep.id);
                  }}
                  type="button"
                >
                  Tiếp tục <ArrowRight className="size-4" />
                </Button>
              ) : null}
              {currentStep === "confirmation" ? (
                <Button
                  disabled={isNavigationDisabled || !hasConfirmedInformation}
                  onClick={() => {
                    void handleRegistrationSubmit();
                  }}
                  type="button"
                >
                  {isSubmitting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {isSubmitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ xét duyệt"}
                </Button>
              ) : null}
            </div>
          }
          isStepNavigationDisabled={isNavigationDisabled}
          onStepChange={(stepId) => {
            void handleStepChange(stepId);
          }}
          steps={PARTNER_REGISTRATION_STEPS}
          variant={currentStep === "confirmation" ? "plain" : "card"}
        >
          {currentStep === "business" ? (
            <BusinessInformationStep
              isUploadingLogo={isUploadingLogo}
              logoPreviewUrl={logoPreviewUrl}
              onLogoPreviewChange={setLogoPreviewUrl}
              onLogoUploadingChange={setIsUploadingLogo}
            />
          ) : null}
          {currentStep === "legal" ? (
            <LegalInformationStep
              licenseDocument={licenseDocument}
              onLicenseDocumentChange={setLicenseDocument}
              onLicenseUploadingChange={setIsUploadingLicense}
            />
          ) : null}
          {currentStep === "contact" ? <ContactInformationStep /> : null}
          {currentStep === "confirmation" ? (
            <ConfirmationStep
              confirmed={hasConfirmedInformation}
              disabled={isNavigationDisabled}
              licenseDocument={licenseDocument}
              logoPreviewUrl={logoPreviewUrl}
              onConfirmedChange={setHasConfirmedInformation}
              onEdit={(stepId) => {
                void handleStepChange(stepId);
              }}
              submissionError={submissionError}
            />
          ) : null}
        </MultiStepFormLayout>
      </form>
    </FormProvider>
  );
}

function isProfileNotCompletedError(error: ApiError) {
  return error.code === PROFILE_NOT_COMPLETED_ERROR_CODE;
}
