import type { OrganizationResponse } from "@/types/organization";

export type AdminOrganizationStatus = 0 | 1 | 2 | 3;

export type AdminOrganizationsFilters = {
  status?: AdminOrganizationStatus;
};

export type AdminOrganizationSummary = Pick<
  OrganizationResponse,
  "id" | "name" | "slug" | "type" | "status" | "logoMediaId" | "logoUrl" | "province" | "createdAtUtc"
>;

export type AdminOrganizationDetail = OrganizationResponse & {
  reviewedAtUtc?: string | null;
};
