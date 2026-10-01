"use client";

import { type ReactNode, useId } from "react";

import { cn } from "@/utils/cn";

export type MultiStepFormStep = {
  id: string;
  title: string;
};

type MultiStepFormLayoutProps = {
  children?: ReactNode;
  className?: string;
  currentStep: string;
  onStepChange: (stepId: string) => void;
  steps: readonly MultiStepFormStep[];
};

// Adapted from Formcn's sidebarStepper layout:
// https://github.com/F-47/formcn/blob/main/utils/tailwind-presets.js
export function MultiStepFormLayout({
  children,
  className,
  currentStep,
  onStepChange,
  steps,
}: MultiStepFormLayoutProps) {
  const layoutId = useId();
  const contentId = `${layoutId}-content`;
  const titleId = `${layoutId}-title`;
  const activeStep = steps.find((step) => step.id === currentStep);

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

            return (
              <li key={step.id}>
                <button
                  aria-controls={contentId}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    "hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    isActive
                      ? "font-semibold text-primary"
                      : "font-medium text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => onStepChange(step.id)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 bg-slate-100 text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span>{step.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section
        aria-labelledby={titleId}
        className="min-h-[400px] min-w-0 rounded-xl border border-border/60 bg-background p-6 sm:min-h-[560px] md:p-8"
        id={contentId}
      >
        <h1
          aria-live="polite"
          className="text-xl font-bold tracking-tight text-foreground"
          id={titleId}
        >
          {activeStep?.title}
        </h1>
        {children}
      </section>
    </div>
  );
}
