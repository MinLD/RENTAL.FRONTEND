"use client";

import { type ReactNode, useId } from "react";
import { Check } from "lucide-react";

import { cn } from "@/utils/cn";

export type MultiStepFormStep = {
  description?: string;
  heading?: string;
  id: string;
  title: string;
};

type MultiStepFormLayoutProps = {
  children?: ReactNode;
  className?: string;
  completedStepIds?: readonly string[];
  currentStep: string;
  footer?: ReactNode;
  isStepNavigationDisabled?: boolean;
  onStepChange: (stepId: string) => void;
  steps: readonly MultiStepFormStep[];
};

// Adapted from Formcn's sidebarStepper layout:
// https://github.com/F-47/formcn/blob/main/utils/tailwind-presets.js
export function MultiStepFormLayout({
  children,
  className,
  completedStepIds = [],
  currentStep,
  footer,
  isStepNavigationDisabled = false,
  onStepChange,
  steps,
}: MultiStepFormLayoutProps) {
  const layoutId = useId();
  const contentId = `${layoutId}-content`;
  const titleId = `${layoutId}-title`;
  const activeStep = steps.find((step) => step.id === currentStep);
  const activeStepIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div
      className={cn(
        "grid items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)] lg:gap-8",
        className,
      )}
    >
      <nav
        aria-label="Các bước đăng ký"
        className="rounded-xl border border-border/60 bg-background p-3"
      >
        <ol className="space-y-1">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted =
              index < activeStepIndex && completedStepIds.includes(step.id);

            return (
              <li key={step.id}>
                <button
                  aria-controls={contentId}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    "hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60",
                    isActive
                      ? "font-semibold text-primary"
                      : "font-medium text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => onStepChange(step.id)}
                  disabled={isStepNavigationDisabled}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                          ? "border-success bg-success text-white"
                          : "border-border/60 bg-slate-100 text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="size-4" /> : index + 1}
                  </span>
                  <span>{step.title}</span>
                  {isCompleted ? (
                    <span className="sr-only">Đã hoàn thành</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section
        aria-labelledby={titleId}
        className="flex min-h-[400px] min-w-0 flex-col rounded-xl border border-border/60 bg-background p-6 sm:min-h-[560px] md:p-8"
        id={contentId}
      >
        <h1
          aria-live="polite"
          className="text-xl font-bold tracking-tight text-foreground"
          id={titleId}
        >
          {activeStep?.heading ?? activeStep?.title}
        </h1>
        {activeStep?.description ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {activeStep.description}
          </p>
        ) : null}
        <div className="flex-1">{children}</div>
        {footer ? <div className="mt-6  pt-4">{footer}</div> : null}
      </section>
    </div>
  );
}
