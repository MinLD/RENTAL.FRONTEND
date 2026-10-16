import { z } from "zod";

import { ApiInputError } from "@/services/api-error";
import { PUBLIC_EQUIPMENT_LISTING_SORTS } from "@/types/inventory";
import type { PublicEquipmentListingListParams } from "@/types/inventory";
import { VIETNAM_PROVINCES } from "@/lib/locations/vietnam-divisions";

const specFilterSchema = z
  .object({
    field: z.string().trim().min(1, "Thông số cần lọc không được để trống."),
    operator: z.enum(["eq", "gt", "gte", "lt", "lte"]),
    value: z.union([z.string(), z.number(), z.boolean()]),
  })
  .refine(
    (filter) => filter.operator === "eq" || typeof filter.value === "number",
    "Phép so sánh lớn hơn hoặc nhỏ hơn cần một giá trị số.",
  );

const serializedSpecFiltersSchema = z
  .string()
  .transform((value, context): unknown => {
    try {
      return JSON.parse(value);
    } catch {
      context.addIssue({
        code: "custom",
        message: "Bộ lọc thông số phải là JSON hợp lệ.",
      });
      return z.NEVER;
    }
  })
  .pipe(z.array(specFilterSchema))
  .transform((filters) => JSON.stringify(filters));

export const publicEquipmentListingListParamsSchema = z
  .object({
    categoryId: z.uuid().optional(),
    equipmentTypeId: z.uuid().optional(),
    brandId: z.uuid().optional(),
    provinceCode: z.string().regex(/^\d{2}$/, "Mã tỉnh / thành phố không hợp lệ.").optional(),
    wardCode: z.string().regex(/^\d{5}$/, "Mã phường / xã không hợp lệ.").optional(),
    q: z
      .string()
      .trim()
      .max(200, "Từ khóa tìm kiếm tối đa 200 ký tự.")
      .optional(),
    sort: z
      .enum(PUBLIC_EQUIPMENT_LISTING_SORTS, { error: "Kiểu sắp xếp không hợp lệ." })
      .optional(),
    filters: serializedSpecFiltersSchema.optional(),
    from: z.iso.date({ error: "Ngày bắt đầu phải theo định dạng YYYY-MM-DD hợp lệ." }).optional(),
    to: z.iso.date({ error: "Ngày kết thúc phải theo định dạng YYYY-MM-DD hợp lệ." }).optional(),
    requestedQuantity: z
      .number()
      .int("Số lượng cần thuê phải là số nguyên.")
      .positive("Số lượng cần thuê phải là số nguyên từ 1 trở lên.")
      .optional(),
    page: z.number().int().positive().default(1),
    pageSize: z
      .number()
      .int()
      .positive()
      .max(100, "Mỗi trang tối đa 100 sản phẩm.")
      .default(20),
  })
  .superRefine((params, context) => {
    const province = VIETNAM_PROVINCES.find((item) => item.code === params.provinceCode);
    if (params.provinceCode && !province) {
      context.addIssue({ code: "custom", path: ["provinceCode"], message: "Tỉnh / thành phố không hợp lệ." });
    }
    if (params.wardCode && !province?.wards.some((ward) => ward.code === params.wardCode)) {
      context.addIssue({ code: "custom", path: ["wardCode"], message: "Vui lòng chọn phường / xã thuộc tỉnh / thành phố đã chọn." });
    }
    if (Boolean(params.from) !== Boolean(params.to)) {
      context.addIssue({
        code: "custom",
        path: [params.from ? "to" : "from"],
        message: "Vui lòng nhập cả ngày bắt đầu và ngày kết thúc thuê.",
      });
    }
    if (params.requestedQuantity !== undefined && (!params.from || !params.to)) {
      context.addIssue({
        code: "custom",
        path: ["requestedQuantity"],
        message: "Lọc theo số lượng cần có cả ngày bắt đầu và ngày kết thúc thuê.",
      });
    }
    if (params.from && params.to && params.to < params.from) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "Ngày kết thúc phải từ ngày bắt đầu trở đi.",
      });
    }
  });

export function parsePublicEquipmentListingListParams(
  params: PublicEquipmentListingListParams,
) {
  const result = publicEquipmentListingListParamsSchema.safeParse(params);
  if (result.success) return result.data;
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  throw new ApiInputError(
    result.error.issues[0]?.message ?? "Bộ lọc tìm kiếm không hợp lệ.",
    fieldErrors,
  );
}
