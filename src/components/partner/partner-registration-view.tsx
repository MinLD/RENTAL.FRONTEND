"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  MultiStepFormLayout,
  type MultiStepFormStep,
} from "@/components/forms/multi-step-form-layout";
import { BusinessInformationStep } from "@/components/partner/business-information-step";
import { Button } from "@/components/ui/button";
import {
  BUSINESS_INFORMATION_FIELDS,
  businessInformationSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";

const PARTNER_REGISTRATION_STEPS = [
  {
    id: "business",
    title: "Thông tin doanh nghiệp",
    description: "Cung cấp các thông tin cơ bản về doanh nghiệp của bạn.",
  },
  { id: "legal", title: "Thông tin pháp lý" },
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
  const isChangingStep = useRef(false);
  const form = useForm<PartnerRegistrationFormValues>({
    defaultValues: {
      description: "",
      establishedDate: "",
      logoMediaId: "",
      name: "",
      taxCode: "",
      type: 1,
      website: "",
    },
    mode: "onTouched",
    resolver: zodResolver(businessInformationSchema),
    shouldUnregister: false,
  });
  const isNavigationDisabled = isUploadingLogo || form.formState.isValidating;

  async function handleStepChange(stepId: string) {
    const nextStep = PARTNER_REGISTRATION_STEPS.find((step) => step.id === stepId);

    if (
      !nextStep ||
      isUploadingLogo ||
      isChangingStep.current ||
      stepId === currentStep
    ) {
      return;
    }

    isChangingStep.current = true;

    try {
      if (currentStep === "business") {
        const isValid = await form.trigger([...BUSINESS_INFORMATION_FIELDS], {
          shouldFocus: true,
        });

        if (!isValid) {
          return;
        }
      }

      setCurrentStep(nextStep.id);
    } finally {
      isChangingStep.current = false;
    }
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          if (currentStep === "business") {
            void handleStepChange("legal");
          }
        }}
      >
        <MultiStepFormLayout
          currentStep={currentStep}
          footer={
            <div className="flex items-center justify-between gap-3">
              <Button
                disabled={isNavigationDisabled}
                onClick={() => router.push("/")}
                type="button"
                variant="secondary"
              >
                Hủy
              </Button>
              {currentStep === "business" ? (
                <Button
                  disabled={isNavigationDisabled}
                  onClick={() => {
                    void handleStepChange("legal");
                  }}
                  type="button"
                >
                  Tiếp tục <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  disabled={isNavigationDisabled}
                  onClick={() => {
                    void handleStepChange("business");
                  }}
                  type="button"
                  variant="secondary"
                >
                  <ArrowLeft className="size-4" /> Quay lại
                </Button>
              )}
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
        </MultiStepFormLayout>
      </form>
    </FormProvider>
  );
}
