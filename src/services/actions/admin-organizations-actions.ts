"use server";

import { z } from "zod";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  adminOrganizationDetailSchema,
  adminOrganizationListSchema,
  adminOrganizationsQuerySchema,
} from "@/lib/validations/admin-organizations";
import { getActionResponseErrorMessage } from "@/services/actions/action-utils";
import { serverApi } from "@/services/server-api";
import type {
  AdminOrganizationDetail,
  AdminOrganizationSummary,
  AdminOrganizationsFilters,
} from "@/types/admin-organizations";
import type { DataTableFetchParams, DataTableFetchResult } from "@/types/data-table";

export async function getAdminOrganizationsAction(
  params: DataTableFetchParams<AdminOrganizationsFilters>,
): Promise<DataTableFetchResult<AdminOrganizationSummary>> {
  const query = adminOrganizationsQuerySchema.safeParse({
    page: params.page,
    pageSize: params.pageSize,
    search: params.keyword,
    status: params.filters?.status,
  });

  if (!query.success) {
    throw new Error(query.error.issues[0]?.message ?? "Bộ lọc không hợp lệ.");
  }

  const data = await fetchOrganizationJson(
    API_ENDPOINTS.backend.adminOrganizations.list(query.data),
    "Không thể tải danh sách tổ chức.",
  );
  const parsed = adminOrganizationListSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Dữ liệu danh sách tổ chức không hợp lệ.");
  }

  return { data: parsed.data.items, totalItems: parsed.data.totalCount };
}

export async function getAdminOrganizationDetailAction(
  id: string,
): Promise<AdminOrganizationDetail> {
  if (!z.uuid().safeParse(id).success) {
    throw new Error("ID tổ chức không hợp lệ.");
  }

  const data = await fetchOrganizationJson(
    API_ENDPOINTS.backend.adminOrganizations.detail(id),
    "Không thể tải chi tiết tổ chức.",
  );
  const parsed = adminOrganizationDetailSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Dữ liệu hồ sơ tổ chức không hợp lệ.");
  }

  return parsed.data;
}

export async function approveAdminOrganizationAction(
  id: string,
): Promise<AdminOrganizationDetail> {
  if (!z.uuid().safeParse(id).success) {
    throw new Error("ID tổ chức không hợp lệ.");
  }

  const data = await fetchOrganizationJson(
    API_ENDPOINTS.backend.adminOrganizations.approve(id),
    "Không thể duyệt hồ sơ tổ chức.",
    { method: "PATCH" },
  );
  const parsed = adminOrganizationDetailSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Dữ liệu hồ sơ tổ chức sau khi duyệt không hợp lệ.");
  }

  return parsed.data;
}

async function fetchOrganizationJson(
  endpoint: string,
  fallbackMessage: string,
  init: RequestInit = { method: "GET", cache: "no-store" },
) {
  const response = await serverApi(endpoint, init);

  if (!response.ok) {
    throw new Error(await getActionResponseErrorMessage(response, fallbackMessage));
  }

  return response.json() as Promise<unknown>;
}
