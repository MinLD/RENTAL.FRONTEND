import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/utils/cn";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  characterCount?: number;
  error?: string;
  label: string;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    { characterCount, className, error, id, label, maxLength, required, ...props },
    ref,
  ) => {
    const errorId = id ? `${id}-error` : undefined;

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
          <textarea
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              "block min-h-40 w-full resize-y rounded border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
              characterCount !== undefined && "pb-8",
              className,
            )}
            id={id}
            maxLength={maxLength}
            ref={ref}
            required={required}
            {...props}
          />
          {characterCount !== undefined ? (
            <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
              {characterCount}
              {maxLength !== undefined ? `/${maxLength}` : ""}
            </span>
          ) : null}
        </div>
        {error ? (
          <p className="text-xs font-medium text-error" id={errorId}>
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";
