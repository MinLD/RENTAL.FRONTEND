"use client";

import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  error?: string;
  label: string;
  leftIcon?: ReactNode;
};

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, error, id, label, leftIcon, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

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
            className={cn("pr-10", leftIcon ? "pl-9" : undefined, className)}
            id={id}
            ref={ref}
            type={isVisible ? "text" : "password"}
            {...props}
          />
          <button
            aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
            onClick={() => setIsVisible((currentValue) => !currentValue)}
            type="button"
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
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

PasswordField.displayName = "PasswordField";
