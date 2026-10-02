import { z } from "zod";

import { organizationResponseSchema } from "@/lib/validations/organization";

export const adminOrganizationsQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200, "Tìm kiếm tối đa 200 ký tự.").default(""),
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export const adminOrganizationListSchema = z.object({
  items: z.array(organizationResponseSchema.pick({
    id: true,
    name: true,
    slug: true,
    type: true,
    status: true,
    logoMediaId: true,
    logoUrl: true,
    province: true,
    createdAtUtc: true,
  })),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const adminOrganizationDetailSchema = organizationResponseSchema.extend({
  reviewedAtUtc: z.string().nullable().optional(),
});

export const adminOrganizationReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập lý do.")
    .max(500, "Lý do tối đa 500 ký tự."),
});
