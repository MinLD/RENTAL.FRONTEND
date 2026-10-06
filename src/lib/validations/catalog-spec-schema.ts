import { z } from "zod";

import type { CatalogSpecDefinition, CatalogSpecField } from "@/types/catalog";

const optionalNumber = z
  .string()
  .refine(
    (value) => !value.trim() || Number.isFinite(Number(value)),
    "Nhập một số hợp lệ.",
  );

const specFieldSchema = z
  .object({
    key: z.string().trim().min(1, "Nhập key của thông số."),
    label: z.string().trim().min(1, "Nhập tên thông số."),
    dataType: z.enum(["text", "number", "boolean", "enum"]),
    required: z.boolean(),
    filterable: z.boolean(),
    primary: z.boolean(),
    displayOrder: z
      .number()
      .int("Thứ tự phải là số nguyên.")
      .min(0, "Thứ tự phải từ 0 trở lên.")
      .max(2147483647),
    min: optionalNumber,
    max: optionalNumber,
    options: z.array(
      z.object({
        value: z.string().trim().min(1, "Nhập giá trị lựa chọn."),
        label: z.string().trim().min(1, "Nhập tên lựa chọn."),
      }),
    ),
    unit: z.string().trim(),
    description: z.string().trim(),
    metadata: z.string().refine((value) => {
      if (!value.trim()) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, "Metadata phải là JSON hợp lệ."),
  })
  .superRefine((field, context) => {
    if (
      field.dataType === "number" &&
      field.min.trim() &&
      field.max.trim() &&
      Number(field.min) > Number(field.max)
    ) {
      context.addIssue({
        code: "custom",
        path: ["max"],
        message: "Giá trị tối đa phải lớn hơn hoặc bằng tối thiểu.",
      });
    }
    if (field.dataType === "enum") {
      if (!field.options.length) {
        context.addIssue({
          code: "custom",
          path: ["options"],
          message: "Thêm ít nhất một lựa chọn.",
        });
      }
      const values = new Set<string>();
      field.options.forEach((option, index) => {
        if (values.has(option.value)) {
          context.addIssue({
            code: "custom",
            path: ["options", index, "value"],
            message: "Giá trị lựa chọn bị trùng.",
          });
        }
        values.add(option.value);
      });
    }
  });

export const catalogSpecSchemaFormSchema = z
  .object({
    fields: z.array(specFieldSchema).min(1, "Thêm ít nhất một thông số."),
  })
  .superRefine(({ fields }, context) => {
    const keys = new Set<string>();
    fields.forEach((field, index) => {
      if (keys.has(field.key)) {
        context.addIssue({
          code: "custom",
          path: ["fields", index, "key"],
          message: "Key bị trùng trong schema.",
        });
      }
      keys.add(field.key);
    });
  });

export type CatalogSpecSchemaFormValues = z.infer<
  typeof catalogSpecSchemaFormSchema
>;

export function getSpecFieldFormValues(
  field?: CatalogSpecField,
  displayOrder = 0,
): CatalogSpecSchemaFormValues["fields"][number] {
  return {
    key: field?.key ?? "",
    label: field?.label ?? "",
    dataType: (field?.dataType ??
      "text") as CatalogSpecSchemaFormValues["fields"][number]["dataType"],
    required: field?.required ?? false,
    filterable: field?.filterable ?? false,
    primary: field?.primary ?? false,
    displayOrder: field?.displayOrder ?? displayOrder,
    min: field?.min == null ? "" : String(field.min),
    max: field?.max == null ? "" : String(field.max),
    options: (field?.options ?? []).map((option) => ({
      value: option.value ?? "",
      label: option.label ?? "",
    })),
    unit: field?.unit ?? "",
    description: field?.description ?? "",
    metadata:
      field?.metadata === undefined
        ? ""
        : JSON.stringify(field.metadata, null, 2),
  };
}

export function toSpecDefinition(
  values: CatalogSpecSchemaFormValues,
): CatalogSpecDefinition {
  return {
    fields: values.fields
      .map((field) => ({
        key: field.key,
        label: field.label,
        dataType: field.dataType,
        required: field.required,
        filterable: field.filterable,
        primary: field.primary,
        displayOrder: field.displayOrder,
        ...(field.dataType === "number" && field.min.trim()
          ? { min: Number(field.min) }
          : {}),
        ...(field.dataType === "number" && field.max.trim()
          ? { max: Number(field.max) }
          : {}),
        ...(field.dataType === "enum" ? { options: field.options } : {}),
        unit: field.unit || null,
        description: field.description || null,
        ...(field.metadata.trim()
          ? { metadata: JSON.parse(field.metadata) }
          : {}),
      }))
      .sort((left, right) => left.displayOrder - right.displayOrder),
  };
}
