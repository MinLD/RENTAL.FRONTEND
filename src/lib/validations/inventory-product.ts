import { z } from "zod";

import type { CatalogSpecField } from "@/types/catalog";
import { validateSpecificationValue } from "./catalog-spec-values";

const uuidSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Vui lòng chọn một giá trị hợp lệ.",
  );
const rateInputSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập giá thuê.")
  .refine(
    (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
    "Giá thuê phải là số từ 0 trở lên.",
  );

export const productCreateFormSchema = z.object({
  equipmentTypeId: uuidSchema,
  brandId: uuidSchema,
  model: z.string().trim().min(1, "Vui lòng nhập model sản phẩm."),
  serialNumber: z.string().trim().min(1, "Vui lòng nhập số serial."),
  dailyRate: rateInputSchema,
  weeklyRate: rateInputSchema,
  monthlyRate: rateInputSchema,
  thumbnailMediaId: z.union([uuidSchema, z.literal("")]),
  specInputs: z.array(z.union([z.string(), z.boolean()])),
});

export type ProductCreateFormValues = z.infer<typeof productCreateFormSchema>;

export function getProductCreateFormSchema(fields: CatalogSpecField[]) {
  return productCreateFormSchema.superRefine((values, context) => {
    fields.forEach((field, index) => {
      const message = validateSpecificationValue(
        field,
        values.specInputs[index],
      );
      if (message) {
        context.addIssue({
          code: "custom",
          path: ["specInputs", index],
          message,
        });
      }
    });
  });
}

export const createEquipmentListingRequestSchema = z.object({
  equipmentTypeId: uuidSchema,
  brandId: uuidSchema,
  model: z.string().trim().min(1, "Vui lòng nhập model sản phẩm."),
  serialNumber: z.string().trim().min(1, "Vui lòng nhập số serial."),
  schemaVersion: z.number().int().positive("Phiên bản thông số không hợp lệ."),
  specValues: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
  rentalRate: z.object({
    dailyRate: z.number().min(0),
    weeklyRate: z.number().min(0),
    monthlyRate: z.number().min(0),
    currency: z.literal("VND"),
  }),
  thumbnailMediaId: uuidSchema.nullable(),
});
