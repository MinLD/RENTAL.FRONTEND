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

export type AdminOrganizationHistoryItem = {
  action: string;
  actorId: string;
  id: string;
  reason?: string | null;
  result: string;
  timestamp: string;
};

export type AdminOrganizationHistoryResult = {
  items: AdminOrganizationHistoryItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
