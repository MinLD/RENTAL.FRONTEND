import { z } from "zod";

const optionalUuidSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) =>
      !value ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      ),
    {
      message: "Media ID phải là UUID hợp lệ.",
    },
  );

export const catalogCategoryFormSchema = z.object({
  description: z.string().trim().optional(),
  imageMediaId: optionalUuidSchema,
  isActive: z.boolean().optional(),
  name: z.string().trim().min(1, "Vui lòng nhập tên danh mục."),
});

export type CatalogCategoryFormValues = z.infer<
  typeof catalogCategoryFormSchema
>;
