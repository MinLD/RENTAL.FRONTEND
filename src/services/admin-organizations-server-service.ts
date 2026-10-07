import { z } from "zod";

import { ApiInputError } from "@/services/api-error";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  adminOrganizationDetailSchema,
  adminOrganizationHistoryQuerySchema,
  adminOrganizationHistorySchema,
  adminOrganizationListSchema,
  adminOrganizationsQuerySchema,
  adminOrganizationReasonSchema,
} from "@/lib/validations/admin-organizations";
import { serverApiJson } from "@/services/server-api";
import type {
  AdminOrganizationDetail,
  AdminOrganizationHistoryResult,
  AdminOrganizationSummary,
  AdminOrganizationsFilters,
} from "@/types/admin-organizations";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";

export async function getAdminOrganizations(
  params: DataTableFetchParams<AdminOrganizationsFilters>,
): Promise<DataTableFetchResult<AdminOrganizationSummary>> {
  const query = adminOrganizationsQuerySchema.safeParse({
    page: params.page,
    pageSize: params.pageSize,
    search: params.keyword,
    status: params.filters?.status,
  });

  if (!query.success) {
    throw new ApiInputError(
      query.error.issues[0]?.message ?? "Bộ lọc không hợp lệ.",
    );
  }

  const data = await serverApiJson<unknown>(
    API_ENDPOINTS.backend.adminOrganizations.list(query.data),
    "Không thể tải danh sách tổ chức.",
  );
  const parsed = adminOrganizationListSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Dữ liệu danh sách tổ chức không hợp lệ.");
  }

  return { data: parsed.data.items, totalItems: parsed.data.totalCount };
}

export async function getAdminOrganizationDetail(
  id: string,
): Promise<AdminOrganizationDetail> {
  if (!z.uuid().safeParse(id).success) {
    throw new ApiInputError("ID tổ chức không hợp lệ.");
  }

  const data = await serverApiJson<unknown>(
    API_ENDPOINTS.backend.adminOrganizations.detail(id),
    "Không thể tải chi tiết tổ chức.",
  );
  const parsed = adminOrganizationDetailSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Dữ liệu hồ sơ tổ chức không hợp lệ.");
  }

  return parsed.data;
}

export async function getAdminOrganizationHistory(
  id: string,
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
  },
): Promise<AdminOrganizationHistoryResult> {
  if (!z.uuid().safeParse(id).success) {
    throw new ApiInputError("ID tổ chức không hợp lệ.");
  }

  const query = adminOrganizationHistoryQuerySchema.safeParse({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
  });

  if (!query.success) {
    throw new ApiInputError(
      query.error.issues[0]?.message ?? "Bộ lọc lịch sử không hợp lệ.",
    );
  }

  const data = await serverApiJson<unknown>(
    API_ENDPOINTS.backend.adminOrganizations.history(id, query.data),
    "Không thể tải lịch sử tổ chức.",
  );
  const parsed = adminOrganizationHistorySchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Dữ liệu lịch sử tổ chức không hợp lệ.");
  }

  return parsed.data;
}

export async function approveAdminOrganization(
  id: string,
): Promise<AdminOrganizationDetail> {
  if (!z.uuid().safeParse(id).success) {
    throw new ApiInputError("ID tổ chức không hợp lệ.");
  }

  const data = await serverApiJson<unknown>(
    API_ENDPOINTS.backend.adminOrganizations.approve(id),
    "Không thể duyệt hồ sơ tổ chức.",
    { method: "PATCH" },
  );
  return parseOrganizationMutationDetail(
    id,
    data,
    "Dữ liệu hồ sơ tổ chức sau khi duyệt không hợp lệ.",
  );
}

export async function rejectAdminOrganization(
  id: string,
  reason: string,
): Promise<AdminOrganizationDetail> {
  if (!z.uuid().safeParse(id).success) {
    throw new ApiInputError("ID tổ chức không hợp lệ.");
  }

  const parsedRequest = adminOrganizationReasonSchema.safeParse({ reason });

  if (!parsedRequest.success) {
    throw new ApiInputError(
      parsedRequest.error.issues[0]?.message ?? "Lý do từ chối không hợp lệ.",
    );
  }

  const data = await serverApiJson<unknown>(
    API_ENDPOINTS.backend.adminOrganizations.reject(id),
    "Không thể từ chối hồ sơ tổ chức.",
    {
      body: JSON.stringify(parsedRequest.data),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
  );
  return parseOrganizationMutationDetail(
    id,
    data,
    "Dữ liệu hồ sơ tổ chức sau khi từ chối không hợp lệ.",
  );
}

export async function suspendAdminOrganization(
  id: string,
  reason: string,
): Promise<AdminOrganizationDetail> {
  if (!z.uuid().safeParse(id).success) {
    throw new ApiInputError("ID tổ chức không hợp lệ.");
  }

  const parsedRequest = adminOrganizationReasonSchema.safeParse({ reason });

  if (!parsedRequest.success) {
    throw new ApiInputError(
      parsedRequest.error.issues[0]?.message ?? "Lý do tạm khóa không hợp lệ.",
    );
  }

  const data = await serverApiJson<unknown>(
    API_ENDPOINTS.backend.adminOrganizations.suspend(id),
    "Không thể tạm khóa tổ chức.",
    {
      body: JSON.stringify(parsedRequest.data),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
  return parseOrganizationMutationDetail(
    id,
    data,
    "Dữ liệu tổ chức sau khi tạm khóa không hợp lệ.",
  );
}

export async function activateAdminOrganization(
  id: string,
): Promise<AdminOrganizationDetail> {
  if (!z.uuid().safeParse(id).success) {
    throw new ApiInputError("ID tổ chức không hợp lệ.");
  }

  const data = await serverApiJson<unknown>(
    API_ENDPOINTS.backend.adminOrganizations.activate(id),
    "Không thể mở khóa tổ chức.",
    { method: "POST" },
  );
  return parseOrganizationMutationDetail(
    id,
    data,
    "Dữ liệu tổ chức sau khi mở khóa không hợp lệ.",
  );
}

async function parseOrganizationMutationDetail(
  id: string,
  data: unknown,
  invalidMessage: string,
) {
  if (data === undefined) {
    return getAdminOrganizationDetail(id);
  }

  const parsed = adminOrganizationDetailSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(invalidMessage);
  }

  return parsed.data;
}
