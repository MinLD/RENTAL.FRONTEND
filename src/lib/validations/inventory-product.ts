import { z } from "zod";

import { CALENDAR_BLOCK_REASONS } from "@/config/inventory";
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

const depositInputSchema = z
  .string()
  .trim()
  .refine(
    (value) => !value || (Number.isFinite(Number(value)) && Number(value) >= 0),
    "Tiền cọc phải là số từ 0 trở lên.",
  );

const manufactureYearInputSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập năm sản xuất.")
  .regex(/^\d{4}$/, "Năm sản xuất phải gồm đúng 4 chữ số.")
  .refine(
    (value) => {
      const year = Number(value);
      const currentYear = new Date().getFullYear();
      return year >= 1900 && year <= currentYear + 1;
    },
    "Năm sản xuất không hợp lệ.",
  );
const manufactureYearRequestSchema = z
  .number()
  .int()
  .min(1)
  .max(9999)
  .nullable();

export const productCreateFormSchema = z.object({
  equipmentTypeId: uuidSchema,
  brandId: uuidSchema,
  name: z.string().trim().min(1, "Vui lòng nhập tên sản phẩm."),
  description: z.string().trim(),
  model: z.string().trim().min(1, "Vui lòng nhập model sản phẩm."),
  serialNumber: z.string().trim().min(1, "Vui lòng nhập số serial."),
  manufactureYear: manufactureYearInputSchema,
  mediaIds: z
    .array(uuidSchema)
    .min(1, "Vui lòng tải lên ít nhất 1 ảnh sản phẩm.")
    .max(10, "Tối đa 10 ảnh sản phẩm."),
  dailyRate: rateInputSchema,
  weeklyRate: rateInputSchema,
  monthlyRate: rateInputSchema,
  depositAmount: depositInputSchema,
  thumbnailMediaId: z
    .string()
    .trim()
    .min(1, "Vui lòng chọn ảnh đại diện sản phẩm."),
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
  manufactureYear: manufactureYearRequestSchema,
  mediaIds: productCreateFormSchema.shape.mediaIds,
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
  depositAmount: z.number().min(0, "Tiền cọc phải là số từ 0 trở lên."),
  thumbnailMediaId: uuidSchema.nullable(),
});

export const productInformationFormSchema = productCreateFormSchema
  .pick({
    brandId: true,
    name: true,
    description: true,
    model: true,
    manufactureYear: true,
    mediaIds: true,
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
  depositAmount: true,
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
      manufactureYear: true,
      mediaIds: true,
      thumbnailMediaId: true,
      schemaVersion: true,
      specValues: true,
      depositAmount: true,
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
  manufactureYear: manufactureYearRequestSchema.optional(),
});
export const inventoryAssetCreateFormSchema = z.object({
  serialNumber: productCreateFormSchema.shape.serialNumber,
});
export type InventoryAssetCreateFormValues = z.infer<
  typeof inventoryAssetCreateFormSchema
>;

export const inventoryAssetEditFormSchema = z.object({
  serialNumber: productCreateFormSchema.shape.serialNumber,
  manufactureYear: manufactureYearInputSchema,
});
export type InventoryAssetEditFormValues = z.infer<
  typeof inventoryAssetEditFormSchema
>;

export const inventoryAssetFormSchema = z.object({
  serialNumber: productCreateFormSchema.shape.serialNumber,
  manufactureYear: manufactureYearInputSchema.optional().or(z.literal("")),
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

const calendarBlockDates = {
  startDate: z.iso.date({ error: "Vui lòng chọn ngày bắt đầu hợp lệ." }),
  endDate: z.iso.date({ error: "Vui lòng chọn ngày kết thúc hợp lệ." }),
};
export const inventoryCalendarBlockFormSchema = z
  .object({
    ...calendarBlockDates,
    reason: z
      .string()
      .refine(
        (value) => z.enum(CALENDAR_BLOCK_REASONS).safeParse(value).success,
        "Vui lòng chọn lý do chặn lịch.",
      ),
    note: z.string().trim(),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "Ngày kết thúc phải từ ngày bắt đầu trở đi.",
    path: ["endDate"],
  });
export type InventoryCalendarBlockFormValues = z.infer<
  typeof inventoryCalendarBlockFormSchema
>;
export const createInventoryCalendarBlockRequestSchema = z
  .object({
    ...calendarBlockDates,
    reason: z.enum(CALENDAR_BLOCK_REASONS),
    note: z.string().trim().nullable(),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "Ngày kết thúc phải từ ngày bắt đầu trở đi.",
    path: ["endDate"],
  });
