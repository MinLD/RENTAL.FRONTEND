import { z } from "zod";

const uuidSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "ID không hợp lệ.",
  );

export const catalogEquipmentTypeMediaFormSchema = z.object({
  displayOrder: z.number().int().min(0),
  isThumbnail: z.boolean(),
  mediaId: uuidSchema,
  url: z.string().optional(),
});

export const catalogEquipmentTypeFormSchema = z.object({
  categoryIds: z.array(uuidSchema).min(1, "Vui lòng chọn ít nhất một danh mục."),
  code: z.string().trim().min(1, "Vui lòng nhập code loại thiết bị."),
  description: z.string().trim().optional(),
  media: z.array(catalogEquipmentTypeMediaFormSchema),
  name: z.string().trim().min(1, "Vui lòng nhập tên loại thiết bị."),
});

export type CatalogEquipmentTypeFormMedia = z.infer<
  typeof catalogEquipmentTypeMediaFormSchema
>;

export type CatalogEquipmentTypeFormValues = z.infer<
  typeof catalogEquipmentTypeFormSchema
>;
