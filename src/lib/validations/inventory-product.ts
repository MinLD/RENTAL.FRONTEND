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
  name: z.string().trim().min(1, "Vui lòng nhập tên sản phẩm."),
  description: z.string().trim(),
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
  name: productCreateFormSchema.shape.name,
  description: productCreateFormSchema.shape.description.nullable(),
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

export const productInformationFormSchema = productCreateFormSchema
  .pick({
    brandId: true,
    name: true,
    description: true,
    model: true,
    thumbnailMediaId: true,
  })
  .extend({
    status: z.enum(["1", "2", "3"], {
      error: "Vui lòng chọn trạng thái hợp lệ.",
    }),
  });

export type ProductInformationFormValues = z.infer<
  typeof productInformationFormSchema
>;

export type ProductSpecificationFormValues = {
  specInputs: ProductCreateFormValues["specInputs"];
};

export function getProductSpecificationFormSchema(fields: CatalogSpecField[]) {
  return productCreateFormSchema
    .pick({ specInputs: true })
    .superRefine((values, context) => {
      fields.forEach((field, index) => {
        const message = validateSpecificationValue(
          field,
          values.specInputs[index],
        );
        if (message)
          context.addIssue({
            code: "custom",
            path: ["specInputs", index],
            message,
          });
      });
    });
}

export const productRentalRateFormSchema = productCreateFormSchema.pick({
  dailyRate: true,
  weeklyRate: true,
  monthlyRate: true,
});
export type ProductRentalRateFormValues = z.infer<
  typeof productRentalRateFormSchema
>;
export const equipmentListingRentalRateSchema =
  createEquipmentListingRequestSchema.shape.rentalRate;
export const updateEquipmentListingRequestSchema =
  createEquipmentListingRequestSchema
    .pick({
      brandId: true,
      name: true,
      description: true,
      model: true,
      thumbnailMediaId: true,
      schemaVersion: true,
      specValues: true,
    })
    .partial()
    .extend({
      status: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    })
    .refine(
      (request) =>
        (request.specValues === undefined) ===
        (request.schemaVersion === undefined),
      "Thông số kỹ thuật phải đi kèm phiên bản schema.",
    );

export const createInventoryAssetRequestSchema = productCreateFormSchema.pick({
  serialNumber: true,
});
export const updateInventoryAssetRequestSchema = z.object({
  serialNumber: productCreateFormSchema.shape.serialNumber.optional(),
  manufactureYear: z.number().int().min(1).max(9999).nullable().optional(),
});
export const inventoryAssetFormSchema = z.object({
  serialNumber: productCreateFormSchema.shape.serialNumber,
  manufactureYear: z
    .string()
    .trim()
    .refine(
      (value) => !value || (/^\d{4}$/.test(value) && Number(value) >= 1),
      "Vui lòng nhập năm gồm 4 chữ số.",
    ),
});
export type InventoryAssetFormValues = z.infer<typeof inventoryAssetFormSchema>;

export const inventoryAssetBookingsFormSchema = z.object({
  acceptingBookings: z.boolean(),
  reason: z.string().trim(),
});
export type InventoryAssetBookingsFormValues = z.infer<
  typeof inventoryAssetBookingsFormSchema
>;
export const updateInventoryAssetBookingsRequestSchema =
  inventoryAssetBookingsFormSchema.extend({
    reason: inventoryAssetBookingsFormSchema.shape.reason.nullable(),
  });
