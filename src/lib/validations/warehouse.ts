import { z } from "zod";

import { VIETNAM_PROVINCES } from "@/lib/locations/vietnam-divisions";

const latitudeSchema = z.number({ error: "Vui lòng nhập vĩ độ hợp lệ." })
  .min(-90, "Vĩ độ phải từ -90 đến 90.")
  .max(90, "Vĩ độ phải từ -90 đến 90.");
const longitudeSchema = z.number({ error: "Vui lòng nhập kinh độ hợp lệ." })
  .min(-180, "Kinh độ phải từ -180 đến 180.")
  .max(180, "Kinh độ phải từ -180 đến 180.");

export const warehouseRequestSchema = z.object({
  addressDetail: z.string().trim()
    .min(1, "Vui lòng nhập địa chỉ chi tiết.")
    .max(500, "Địa chỉ chi tiết tối đa 500 ký tự."),
  provinceCode: z.string().min(1, "Vui lòng chọn tỉnh/thành phố."),
  wardCode: z.string().min(1, "Vui lòng chọn phường/xã."),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  expectedVersion: z.number().int().nonnegative().optional(),
}).superRefine((value, context) => {
  const province = VIETNAM_PROVINCES.find((item) => item.code === value.provinceCode);
  if (!province) {
    context.addIssue({ code: "custom", path: ["provinceCode"], message: "Vui lòng chọn tỉnh/thành phố hợp lệ." });
  } else if (!province.wards.some((ward) => ward.code === value.wardCode)) {
    context.addIssue({ code: "custom", path: ["wardCode"], message: "Vui lòng chọn phường/xã thuộc tỉnh/thành phố đã chọn." });
  }
});

// Keep blank coordinates distinct from the valid numeric value zero.
export const warehouseFormSchema = z.object({
  addressDetail: z.string(),
  provinceCode: z.string(),
  wardCode: z.string(),
  latitude: z.string().trim().min(1, "Vui lòng nhập vĩ độ.")
    .transform(Number).pipe(latitudeSchema),
  longitude: z.string().trim().min(1, "Vui lòng nhập kinh độ.")
    .transform(Number).pipe(longitudeSchema),
}).pipe(warehouseRequestSchema);

export const warehouseResponseSchema = z.object({
  ownerUserId: z.string().min(1),
  addressDetail: z.string().nullable(),
  provinceCode: z.string().nullable(),
  provinceName: z.string().nullable(),
  wardCode: z.string().nullable(),
  wardName: z.string().nullable(),
  latitude: latitudeSchema.nullable(),
  longitude: longitudeSchema.nullable(),
  hasValidAddress: z.boolean(),
  updatedAt: z.string().nullable(),
  version: z.number().int().nonnegative(),
});

export type Warehouse = z.infer<typeof warehouseResponseSchema>;
export type WarehouseRequest = z.infer<typeof warehouseRequestSchema>;
export type WarehouseFormValues = z.input<typeof warehouseFormSchema>;
