import { z } from "zod";

import { catalogSpecFieldsFormSchema } from "./catalog-spec-schema";

const uuidSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "ID không hợp lệ.",
  );

export const catalogEquipmentTypeMediaFormSchema = z.object({
  displayOrder: z
    .number()
    .int("Thứ tự ảnh phải là số nguyên.")
    .min(0, "Thứ tự ảnh phải từ 0 trở lên.")
    .max(2147483647, "Thứ tự ảnh không được vượt quá 2147483647."),
  isThumbnail: z.boolean(),
  mediaId: uuidSchema,
  url: z.string().optional(),
});

export const catalogEquipmentTypeFormSchema = z.object({
  categoryIds: z
    .array(uuidSchema)
    .min(1, "Vui lòng chọn ít nhất một danh mục."),
  code: z.string().trim().min(1, "Vui lòng nhập code loại thiết bị."),
  description: z
    .string()
    .trim()
    .max(2000, "Mô tả loại thiết bị không được quá 2000 ký tự.")
    .optional(),
  media: z.array(catalogEquipmentTypeMediaFormSchema),
  name: z.string().trim().min(1, "Vui lòng nhập tên loại thiết bị."),
  fields: catalogSpecFieldsFormSchema,
});

export const catalogEquipmentTypeCreateFormSchema =
  catalogEquipmentTypeFormSchema.extend({
    fields: catalogSpecFieldsFormSchema.min(1, "Thêm ít nhất một thông số."),
  });

export type CatalogEquipmentTypeFormMedia = z.infer<
  typeof catalogEquipmentTypeMediaFormSchema
>;

export type CatalogEquipmentTypeFormValues = z.infer<
  typeof catalogEquipmentTypeFormSchema
>;
