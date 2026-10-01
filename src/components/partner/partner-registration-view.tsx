"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  MultiStepFormLayout,
  type MultiStepFormStep,
} from "@/components/forms/multi-step-form-layout";
import { BusinessInformationStep } from "@/components/partner/business-information-step";
import { LegalInformationStep } from "@/components/partner/legal-information-step";
import { Button } from "@/components/ui/button";
import {
  BUSINESS_INFORMATION_FIELDS,
  LEGAL_INFORMATION_FIELDS,
  partnerRegistrationSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";
import type { MediaUploadResponse } from "@/types/media";

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
  { id: "contact", title: "Địa chỉ & liên hệ" },
  { id: "confirmation", title: "Xác nhận" },
] as const satisfies readonly MultiStepFormStep[];

type PartnerStepId = (typeof PARTNER_REGISTRATION_STEPS)[number]["id"];

export function PartnerRegistrationView() {
  const router = useRouter();
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
  const isChangingStep = useRef(false);
  const pendingFocus = useRef<keyof PartnerRegistrationFormValues | null>(null);
  const form = useForm<PartnerRegistrationFormValues>({
    defaultValues: {
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
  const isNavigationDisabled = isUploading || isValidatingStep;
  const currentStepIndex = PARTNER_REGISTRATION_STEPS.findIndex(
    (step) => step.id === currentStep,
  );
  const previousStep = PARTNER_REGISTRATION_STEPS[currentStepIndex - 1];
  const nextStep = PARTNER_REGISTRATION_STEPS[currentStepIndex + 1];
  const canContinue = currentStep === "business" || currentStep === "legal";

  useEffect(() => {
    if (pendingFocus.current) {
      form.setFocus(pendingFocus.current);
      pendingFocus.current = null;
    }
  }, [currentStep, form]);

  async function handleStepChange(stepId: string) {
    const nextStep = PARTNER_REGISTRATION_STEPS.find(
      (step) => step.id === stepId,
    );

    if (
      !nextStep ||
      isUploading ||
      isChangingStep.current ||
      stepId === currentStep
    ) {
      return;
    }

    isChangingStep.current = true;
    setIsValidatingStep(true);

    try {
      const nextStepIndex = PARTNER_REGISTRATION_STEPS.indexOf(nextStep);

      if (nextStepIndex > currentStepIndex) {
        const completed: PartnerStepId[] = [];

        for (const step of PARTNER_REGISTRATION_STEPS.slice(0, nextStepIndex)) {
          const fields =
            step.id === "business"
              ? BUSINESS_INFORMATION_FIELDS
              : step.id === "legal"
                ? LEGAL_INFORMATION_FIELDS
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

            return;
          }

          completed.push(step.id);
        }

        setCompletedStepIds((ids) => [...new Set([...ids, ...completed])]);
      }

      setCurrentStep(nextStep.id);
    } finally {
      isChangingStep.current = false;
      setIsValidatingStep(false);
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
          }
        }}
      >
        <MultiStepFormLayout
          completedStepIds={completedStepIds}
          currentStep={currentStep}
          footer={
            <div className="flex items-center justify-self-end-safe gap-3">
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
            </div>
          }
          isStepNavigationDisabled={isNavigationDisabled}
          onStepChange={(stepId) => {
            void handleStepChange(stepId);
          }}
          steps={PARTNER_REGISTRATION_STEPS}
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
        </MultiStepFormLayout>
      </form>
    </FormProvider>
  );
}
