"use client";

import { TextField } from "@/components/forms/text-field";
import { Checkbox } from "@/components/ui/checkbox";
import type { SpecificationInputValue } from "@/lib/validations/catalog-spec-values";
import type { CatalogSpecField } from "@/types/catalog";

type DynamicSpecificationFieldsProps = {
  disabled: boolean;
  errors: Array<string | undefined>;
  fields: CatalogSpecField[];
  onChange: (index: number, value: SpecificationInputValue) => void;
  values: SpecificationInputValue[];
};

export function DynamicSpecificationFields({
  disabled,
  errors,
  fields,
  onChange,
  values,
}: DynamicSpecificationFieldsProps) {
  return (
    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
      {fields.map((field, index) => {
        const id = `product-spec-${index}`;
        const type = field.dataType?.toLowerCase();
        const label = field.label || field.key || `Thông số ${index + 1}`;
        const error = errors[index];
        return (
          <div className="min-w-0 space-y-1.5" key={field.key ?? index}>
            {type === "boolean" ? (
              <label
                className="flex min-h-10 items-center gap-3 text-sm font-semibold"
                htmlFor={id}
              >
                <Checkbox
                  aria-describedby={error ? `${id}-error` : undefined}
                  aria-invalid={Boolean(error)}
                  checked={values[index] === true}
                  disabled={disabled}
                  id={id}
                  onCheckedChange={(checked) =>
                    onChange(index, checked === true)
                  }
                />
                {label}
                {field.required ? <span className="text-error">*</span> : null}
              </label>
            ) : type === "enum" ? (
              <>
                <label
                  className="block text-xs font-semibold uppercase"
                  htmlFor={id}
                >
                  {label}
                  {field.required ? (
                    <span className="ml-1 text-error">*</span>
                  ) : null}
                </label>
                <select
                  aria-describedby={error ? `${id}-error` : undefined}
                  aria-invalid={Boolean(error)}
                  className="h-10 w-full rounded border border-input bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
                  disabled={disabled}
                  id={id}
                  onChange={(event) => onChange(index, event.target.value)}
                  required={field.required}
                  value={
                    typeof values[index] === "string"
                      ? (values[index] as string)
                      : ""
                  }
                >
                  <option value="">Chọn {label.toLocaleLowerCase("vi")}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value ?? ""}>
                      {option.label || option.value}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <TextField
                disabled={disabled}
                error={error}
                id={id}
                label={label}
                max={field.max ?? undefined}
                min={field.min ?? undefined}
                onChange={(event) => onChange(index, event.target.value)}
                required={field.required}
                rightElement={
                  field.unit ? (
                    <span className="px-2 text-xs text-muted-foreground">
                      {field.unit}
                    </span>
                  ) : undefined
                }
                step={type === "integer" ? 1 : "any"}
                type={
                  type === "number" || type === "integer" ? "number" : "text"
                }
                value={
                  typeof values[index] === "string"
                    ? (values[index] as string)
                    : ""
                }
              />
            )}
            {error && (type === "boolean" || type === "enum") ? (
              <p className="text-xs font-medium text-error" id={`${id}-error`}>
                {error}
              </p>
            ) : null}
            {field.description ? (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
