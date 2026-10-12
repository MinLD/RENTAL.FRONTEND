import "server-only";

import { z } from "zod";
import { createEquipmentListingRequestSchema } from "@/lib/validations/inventory-product";
import { ApiInputError } from "@/services/api-error";

export function parseInventoryRequest<T>(
  schema: z.ZodType<T>,
  request: unknown,
): T {
  const parsed = schema.safeParse(request);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    throw new ApiInputError(
      "Vui lòng kiểm tra thông tin sản phẩm.",
      fieldErrors,
    );
  }
  return parsed.data;
}

export function assertInventoryId(id: string) {
  parseInventoryRequest(
    createEquipmentListingRequestSchema.shape.equipmentTypeId,
    id,
  );
}
