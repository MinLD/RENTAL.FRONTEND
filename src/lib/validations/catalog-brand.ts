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

export const catalogBrandFormSchema = z.object({
  code: z.string().trim().min(1, "Vui lòng nhập mã thương hiệu."),
  logoMediaId: optionalUuidSchema,
  name: z.string().trim().min(1, "Vui lòng nhập tên thương hiệu."),
  slug: z
    .string()
    .trim()
    .max(150, "Slug thương hiệu không được quá 150 ký tự.")
    .refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
      message: "Slug chỉ nhận chữ thường, số và dấu gạch ngang giữa các từ.",
    })
    .optional(),
});

export type CatalogBrandFormValues = z.infer<typeof catalogBrandFormSchema>;
