"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

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
import { ApiClientError } from "@/services/api-client";
import { registerOrganization } from "@/services/organization-service";
import type { MediaUploadResponse } from "@/types/media";
import type { OrganizationRegisteredResponse } from "@/types/organization";

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

export function PartnerRegistrationView() {
  const [currentStep, setCurrentStep] = useState<PartnerStepId>(
    PARTNER_REGISTRATION_STEPS[0].id,
  );
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [licenseDocument, setLicenseDocument] =
    useState<MediaUploadResponse | null>(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [completedStepIds, setCompletedStepIds] = useState<PartnerStepId[]>([]);
  const [isValidatingStep, setIsValidatingStep] = useState(false);
  const [hasConfirmedInformation, setHasConfirmedInformation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [registeredOrganization, setRegisteredOrganization] =
    useState<OrganizationRegisteredResponse | null>(null);
  const submissionInProgress = useRef(false);
  const isChangingStep = useRef(false);
  const pendingFocus = useRef<keyof PartnerRegistrationFormValues | null>(null);
  const form = useForm<PartnerRegistrationFormValues>({
    defaultValues: {
      contactEmail: "",
      contactPhone: "",
      province: "",
      ward: "",
      address: "",
      businessLicenseNumber: "",
      businessLicenseIssuedDate: "",
      businessLicenseIssuedPlace: "",
      businessLicenseDocumentMediaId: "",
      legalRepresentativeName: "",
      legalRepresentativeCitizenId: "",
      description: "",
      establishedDate: "",
      logoMediaId: "",
      name: "",
      taxCode: "",
      type: 1,
      website: "",
    },
    mode: "onTouched",
    resolver: zodResolver(partnerRegistrationSchema),
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
      registeredOrganization
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

      const registration = await registerOrganization(form.getValues());
      if (!registration?.organizationId) {
        throw new Error("Missing registration response.");
      }
      setRegisteredOrganization(registration);
    } catch (error) {
      setSubmissionError(
        error instanceof ApiClientError
          ? error.message
          : "Không thể gửi hồ sơ. Vui lòng thử lại sau.",
      );
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  if (registeredOrganization) {
    return (
      <section
        className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-background p-8 text-center sm:p-12"
        role="status"
      >
        <CheckCircle2 aria-hidden="true" className="mx-auto mb-4 size-12 text-success" />
        <h1 className="text-2xl font-bold text-foreground">Hồ sơ đã được gửi</h1>
        <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
          Hồ sơ của {form.getValues("name")} đã được tiếp nhận và đang chờ xét duyệt.
          Bạn có thể đăng thiết bị cho thuê sau khi doanh nghiệp được duyệt.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </section>
    );
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
