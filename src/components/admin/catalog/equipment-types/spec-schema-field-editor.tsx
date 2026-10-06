"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CatalogSpecSchemaFormValues } from "@/lib/validations/catalog-spec-schema";

export function SpecSchemaFieldEditor({
  index,
  readOnly,
  onRemove,
}: {
  index: number;
  readOnly: boolean;
  onRemove: () => void;
}) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CatalogSpecSchemaFormValues>();
  const dataType = useWatch({ control, name: `fields.${index}.dataType` });
  const label = useWatch({ control, name: `fields.${index}.label` });
  const error = errors.fields?.[index];
  const prefix = `spec-field-${index}`;

  return (
    <section className="min-w-0 space-y-4 border-b border-border py-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h3 className="min-w-0 break-words text-sm font-semibold">
          {index + 1}. {label || "Thông số mới"}
        </h3>
        {!readOnly ? (
          <Button
            aria-label={`Xóa thông số ${index + 1}`}
            onClick={onRemove}
            size="icon"
            title="Xóa thông số"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <TextField
          error={error?.key?.message}
          id={`${prefix}-key`}
          label="Key"
          required
          {...register(`fields.${index}.key`)}
        />
        <TextField
          error={error?.label?.message}
          id={`${prefix}-label`}
          label="Tên thông số"
          required
          {...register(`fields.${index}.label`)}
        />
        <div className="space-y-1.5">
          <label
            className="block text-xs font-semibold uppercase"
            htmlFor={`${prefix}-type`}
          >
            Kiểu dữ liệu <span className="text-error">*</span>
          </label>
          <select
            aria-invalid={!!error?.dataType}
            className="h-10 w-full rounded border border-input bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
            id={`${prefix}-type`}
            {...register(`fields.${index}.dataType`, {
              onChange: () => {
                setValue(`fields.${index}.options`, [], { shouldDirty: true });
                setValue(`fields.${index}.min`, "", { shouldDirty: true });
                setValue(`fields.${index}.max`, "", { shouldDirty: true });
              },
            })}
          >
            <option value="text">Văn bản</option>
            <option value="number">Số</option>
            <option value="boolean">Có / Không</option>
            <option value="enum">Danh sách lựa chọn</option>
          </select>
          {error?.dataType?.message ? (
            <p className="text-xs text-error">{error.dataType.message}</p>
          ) : null}
        </div>
        <TextField
          error={error?.displayOrder?.message}
          id={`${prefix}-order`}
          label="Thứ tự hiển thị"
          min={0}
          step={1}
          type="number"
          {...register(`fields.${index}.displayOrder`, { valueAsNumber: true })}
        />
        <TextField
          id={`${prefix}-unit`}
          label="Đơn vị"
          {...register(`fields.${index}.unit`)}
        />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {(
          [
            ["required", "Bắt buộc"],
            ["filterable", "Dùng làm bộ lọc"],
            ["primary", "Thông số chính"],
          ] as const
        ).map(([name, title]) => (
          <Controller
            control={control}
            key={name}
            name={`fields.${index}.${name}`}
            render={({ field }) => (
              <label
                className="flex items-center gap-2 text-sm"
                htmlFor={`${prefix}-${name}`}
              >
                <Checkbox
                  checked={field.value}
                  disabled={readOnly}
                  id={`${prefix}-${name}`}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                {title}
              </label>
            )}
          />
        ))}
      </div>
      {dataType === "number" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            error={error?.min?.message}
            id={`${prefix}-min`}
            label="Giá trị tối thiểu"
            step="any"
            type="number"
            {...register(`fields.${index}.min`)}
          />
          <TextField
            error={error?.max?.message}
            id={`${prefix}-max`}
            label="Giá trị tối đa"
            step="any"
            type="number"
            {...register(`fields.${index}.max`)}
          />
        </div>
      ) : dataType === "enum" ? (
        <SpecSchemaOptions index={index} readOnly={readOnly} />
      ) : null}
      <TextareaField
        className="min-h-20"
        id={`${prefix}-description`}
        label="Mô tả"
        {...register(`fields.${index}.description`)}
      />
    </section>
  );
}

function SpecSchemaOptions({
  index,
  readOnly,
}: {
  index: number;
  readOnly: boolean;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CatalogSpecSchemaFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `fields.${index}.options`,
  });
  const error = errors.fields?.[index]?.options;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase">Các lựa chọn</h4>
        {!readOnly ? (
          <Button
            onClick={() => append({ value: "", label: "" })}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Plus className="size-4" />
            Thêm lựa chọn
          </Button>
        ) : null}
      </div>
      {fields.map((option, optionIndex) => (
        <div
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
          key={option.id}
        >
          <TextField
            error={error?.[optionIndex]?.value?.message}
            id={`spec-option-${index}-${optionIndex}-value`}
            label="Giá trị"
            {...register(`fields.${index}.options.${optionIndex}.value`)}
          />
          <TextField
            error={error?.[optionIndex]?.label?.message}
            id={`spec-option-${index}-${optionIndex}-label`}
            label="Tên hiển thị"
            {...register(`fields.${index}.options.${optionIndex}.label`)}
          />
          {!readOnly ? (
            <Button
              aria-label={`Xóa lựa chọn ${optionIndex + 1}`}
              className="mt-5"
              onClick={() => remove(optionIndex)}
              size="icon"
              title="Xóa lựa chọn"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : (
            <span />
          )}
        </div>
      ))}
      {error?.message || error?.root?.message ? (
        <p className="text-xs text-error">
          {error.message ?? error.root?.message}
        </p>
      ) : null}
    </div>
  );
}
