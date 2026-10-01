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
  ({ className, error, id, label, leftIcon, required, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label
          className="block text-xs font-semibold uppercase text-foreground"
          htmlFor={id}
        >
          {label}
          {required ? <span className="ml-1 text-error">*</span> : null}
        </label>
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </span>
          ) : null}
          <Input
            aria-describedby={error && id ? `${id}-error` : undefined}
            aria-invalid={error ? true : undefined}
            className={cn(leftIcon ? "pl-9" : undefined, className)}
            id={id}
            ref={ref}
            required={required}
            {...props}
          />
        </div>
        {error ? (
          <p
            className="text-xs font-medium text-error"
            id={id ? `${id}-error` : undefined}
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

TextField.displayName = "TextField";
