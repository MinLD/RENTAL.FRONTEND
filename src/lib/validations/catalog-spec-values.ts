import type { CatalogSpecField } from "@/types/catalog";

export type SpecificationInputValue = string | boolean;

export function validateSpecificationValue(
  field: CatalogSpecField,
  value: SpecificationInputValue | undefined,
): string | undefined {
  const type = field.dataType?.toLowerCase();
  if (!["text", "number", "integer", "boolean", "enum"].includes(type ?? "")) {
    return "Kiểu thông số này chưa được hỗ trợ.";
  }
  if (type === "boolean") {
    return typeof value === "boolean"
      ? undefined
      : "Vui lòng chọn Có hoặc Không.";
  }
  if (typeof value !== "string") return "Giá trị thông số không hợp lệ.";
  if (!value.trim()) {
    return field.required ? "Vui lòng nhập thông số này." : undefined;
  }
  if (type === "number" || type === "integer") {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Vui lòng nhập một số hợp lệ.";
    if (type === "integer" && !Number.isInteger(number)) {
      return "Thông số này phải là số nguyên.";
    }
    if (field.min != null && number < field.min) {
      return `Giá trị phải từ ${field.min} trở lên.`;
    }
    if (field.max != null && number > field.max) {
      return `Giá trị không được vượt quá ${field.max}.`;
    }
  }
  if (
    type === "enum" &&
    !field.options?.some((option) => option.value === value)
  ) {
    return "Vui lòng chọn một giá trị hợp lệ.";
  }
}

export function buildSpecificationValues(
  fields: CatalogSpecField[],
  values: SpecificationInputValue[],
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    fields.flatMap<[string, string | number | boolean]>((field, index) => {
      const value = values[index];
      if (!field.key || value === undefined) return [];
      if (typeof value === "boolean") return [[field.key, value]];
      if (!value.trim()) return [];
      const type = field.dataType?.toLowerCase();
      return [
        [
          field.key,
          type === "number" || type === "integer"
            ? Number(value)
            : value.trim(),
        ],
      ];
    }),
  );
}

export function getSpecificationSchemaError(fields: CatalogSpecField[]) {
  const keys = new Set<string>();
  for (const field of fields) {
    if (!field.key || keys.has(field.key)) {
      return "Thông số của loại thiết bị chưa hợp lệ. Vui lòng chọn loại thiết bị khác.";
    }
    keys.add(field.key);
    if (
      !["text", "number", "integer", "boolean", "enum"].includes(
        field.dataType?.toLowerCase() ?? "",
      )
    ) {
      return "Loại thiết bị có thông số chưa được hỗ trợ. Vui lòng chọn loại thiết bị khác.";
    }
    if (field.min != null && field.max != null && field.min > field.max) {
      return "Giới hạn thông số của loại thiết bị chưa hợp lệ.";
    }
    if (field.dataType?.toLowerCase() === "enum" && !field.options?.length) {
      return "Loại thiết bị có thông số chưa có lựa chọn. Vui lòng chọn loại thiết bị khác.";
    }
  }
  return null;
}
