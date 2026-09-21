import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
  leftIcon?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, error, id, label, leftIcon, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label
          className="block text-xs font-semibold uppercase text-foreground"
          htmlFor={id}
        >
          {label}
        </label>
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </span>
          ) : null}
          <Input
            aria-invalid={error ? true : undefined}
            className={cn(leftIcon ? "pl-9" : undefined, className)}
            id={id}
            ref={ref}
            {...props}
          />
        </div>
        {error ? (
          <p
            className="text-xs font-medium text-error"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

TextField.displayName = "TextField";
