"use server";

import { headers as getRequestHeaders } from "next/headers";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { getActionResponseErrorMessage } from "@/services/actions/action-utils";
import { serverApi } from "@/services/server-api";
import type {
  AdminUserRow,
  AdminUsersFilterParams,
  CreateAdminUserRequest,
} from "@/types/admin-users";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";

type AdminUserListItemDto = {
  createdAtUtc?: string;
  email?: string | null;
  fullName?: string | null;
  id?: string;
  isActive?: boolean;
};

type AdminUserDetailDto = AdminUserListItemDto & {
  avatarUrl?: string | null;
  globalRoles?: string[] | null;
  phoneNumber?: string | null;
};

type AdminUserListApiResponse = {
  items?: AdminUserListItemDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
};

export async function getUsersAction(
  params: DataTableFetchParams<AdminUsersFilterParams>,
): Promise<DataTableFetchResult<AdminUserRow>> {
  const response = await fetchBackendJson<AdminUserListApiResponse>(
    API_ENDPOINTS.backend.adminUsers.list({
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
    }),
    undefined,
    "Không thể tải danh sách user.",
  );

  return {
    data: (response.items ?? []).map(mapAdminUserListItem),
    totalItems: response.totalCount ?? 0,
  };
}

export async function getUserDetailAction(id: string) {
  return mapAdminUserDetail(
    await fetchBackendJson<AdminUserDetailDto>(
      API_ENDPOINTS.backend.adminUsers.detail(id),
      undefined,
      "Không thể tải chi tiết user.",
    ),
  );
}

export async function createUserAction(request: CreateAdminUserRequest) {
  return fetchMockJson<AdminUserRow>(
    await buildMockUsersUrl(API_ENDPOINTS.internal.mock.adminUsers.create),
    {
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
}

export async function deleteUserAction(id: string) {
  await fetchMock(
    await buildMockUsersUrl(API_ENDPOINTS.internal.mock.adminUsers.delete(id)),
    {
      method: "DELETE",
    },
  );
}

export async function lockUserAction(id: string) {
  await fetchBackend(
    API_ENDPOINTS.backend.adminUsers.suspend(id),
    {
      method: "POST",
    },
    "Không thể tạm khóa user.",
  );
}

export async function unlockUserAction(id: string) {
  await fetchBackend(
    API_ENDPOINTS.backend.adminUsers.activate(id),
    {
      method: "POST",
    },
    "Không thể mở khóa user.",
  );
}

async function fetchBackendJson<TResponse>(
  endpoint: string,
  init: RequestInit | undefined,
  fallbackMessage: string,
): Promise<TResponse> {
  const response = await fetchBackend(endpoint, init, fallbackMessage);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

async function fetchBackend(
  endpoint: string,
  init: RequestInit | undefined,
  fallbackMessage: string,
) {
  const response = await serverApi(endpoint, init);

  if (!response.ok) {
    throw new Error(
      await getActionResponseErrorMessage(response, fallbackMessage),
    );
  }

  return response;
}

async function fetchMockJson<TResponse>(
  url: URL,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetchMock(url, init);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

async function fetchMock(url: URL, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      await getActionResponseErrorMessage(response, "Mock API thất bại."),
    );
  }

  return response;
}

function mapAdminUserListItem(user: AdminUserListItemDto): AdminUserRow {
  return {
    createdAtUtc: user.createdAtUtc,
    email: user.email ?? "-",
    id: user.id ?? "",
    name: user.fullName?.trim() || user.email || "Chưa có tên",
    status: user.isActive ? "active" : "locked",
  };
}

function mapAdminUserDetail(user: AdminUserDetailDto): AdminUserRow {
  const globalRoles = user.globalRoles?.filter(Boolean) ?? [];

  return {
    avatarUrl: user.avatarUrl ?? undefined,
    createdAtUtc: user.createdAtUtc,
    email: user.email ?? "-",
    globalRoles,
    id: user.id ?? "",
    name: user.fullName?.trim() || user.email || "Chưa có tên",
    phone: user.phoneNumber?.trim(),
    role: globalRoles.length ? globalRoles.join(", ") : undefined,
    status: user.isActive ? "active" : "locked",
  };
}

async function buildMockUsersUrl(path: string) {
  const requestHeaders = await getRequestHeaders();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    API_ENDPOINTS.internal.fallbackHost;
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return new URL(path, `${protocol}://${host}`);
}
