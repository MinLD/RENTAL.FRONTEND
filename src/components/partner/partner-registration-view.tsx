"use client";

import { useState } from "react";

import {
  MultiStepFormLayout,
  type MultiStepFormStep,
} from "@/components/forms/multi-step-form-layout";

const PARTNER_REGISTRATION_STEPS = [
  { id: "business", title: "Thông tin doanh nghiệp" },
  { id: "legal", title: "Thông tin pháp lý" },
  { id: "contact", title: "Địa chỉ & liên hệ" },
  { id: "confirmation", title: "Xác nhận" },
] as const satisfies readonly MultiStepFormStep[];

export function PartnerRegistrationView() {
  const [currentStep, setCurrentStep] = useState<string>(
    PARTNER_REGISTRATION_STEPS[0].id,
  );

  return (
    <MultiStepFormLayout
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      steps={PARTNER_REGISTRATION_STEPS}
    />
  );
}
