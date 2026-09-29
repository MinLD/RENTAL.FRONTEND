"use server";

import { z } from "zod";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { getActionResponseErrorMessage } from "@/services/actions/action-utils";
import { serverApi } from "@/services/server-api";
import type {
  AdminRoleOption,
  AdminUserRow,
  AdminUsersFilterParams,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from "@/types/admin-users";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import {
  type ApiValueResult,
  unwrapApiValue,
} from "@/utils/api-result";

type AdminUserListItemDto = {
  createdAtUtc?: string;
  email?: string | null;
  fullName?: string | null;
  id?: string;
  isActive?: boolean;
  roles?: string[] | null;
};

type AdminUserDetailDto = AdminUserListItemDto & {
  avatarMediaId?: string | null;
  avatarUrl?: string | null;
  avatarURL?: string | null;
  avatarPreviewUrl?: string | null;
  previewUrl?: string | null;
  citizenId?: string | null;
  dateOfBirth?: string | null;
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

type AdminUserDetailApiResponse =
  | AdminUserDetailDto
  | ApiValueResult<AdminUserDetailDto>;

type AdminRolesApiResponse =
  | AdminRoleOption[]
  | ApiValueResult<AdminRoleOption[]>;

type RawAdminRoleOption = Partial<AdminRoleOption> & {
  Description?: string | null;
  Id?: string | null;
  Name?: string | null;
  roleId?: string | null;
  roleName?: string | null;
};

const createAdminUserRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
  roleIds: z.array(z.string()).nullable().optional(),
});

const updateAdminUserRequestSchema = z.object({
  avatarMediaId: z.string().nullable().optional(),
  citizenId: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((value) => !value || /^\d{12}$/.test(value), {
      message: "CCCD/CMND phải gồm 12 chữ số.",
    }),
  dateOfBirth: z.string().nullable().optional(),
  email: z.string().email("Email không hợp lệ.").nullable().optional(),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên."),
  isActive: z.boolean().nullable().optional(),
  phoneNumber: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((value) => !value || /^(0|\+84)\d{9}$/.test(value), {
      message: "Số điện thoại không hợp lệ.",
    }),
  removeAvatar: z.boolean(),
  roleIds: z.array(z.string()).nullable().optional(),
});

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
  const response = await fetchBackendJson<AdminUserDetailApiResponse>(
    API_ENDPOINTS.backend.adminUsers.detail(id),
    undefined,
    "Không thể tải chi tiết user.",
  );

  return mapAdminUserDetail(unwrapApiValue<AdminUserDetailDto>(response));
}

export async function createUserAction(request: CreateAdminUserRequest) {
  const parsedRequest = createAdminUserRequestSchema.safeParse(
    sanitizeCreateUserRequest(request),
  );

  if (!parsedRequest.success) {
    throw new Error(getValidationErrorMessage(parsedRequest.error.flatten()));
  }

  const response = await fetchBackend(
    API_ENDPOINTS.backend.adminUsers.create,
    {
      json: parsedRequest.data,
      method: "POST",
    },
    "Không thể tạo user.",
  );

  return response.json() as Promise<string>;
}

export async function updateUserAction(
  id: string,
  request: UpdateAdminUserRequest,
) {
  const parsedRequest = updateAdminUserRequestSchema.safeParse(
    sanitizeUpdateUserRequest(request),
  );

  if (!parsedRequest.success) {
    throw new Error(getValidationErrorMessage(parsedRequest.error.flatten()));
  }

  await fetchBackend(
    API_ENDPOINTS.backend.adminUsers.update(id),
    {
      json: parsedRequest.data,
      method: "PUT",
    },
    "Không thể cập nhật user.",
  );

  return getUserDetailAction(id);
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

export async function getAdminRolesAction() {
  const response = await fetchBackendJson<AdminRolesApiResponse>(
    API_ENDPOINTS.backend.adminUsers.roles,
    undefined,
    "Không thể tải danh sách vai trò.",
  );

  return unwrapApiValue<RawAdminRoleOption[]>(response)
    .map(normalizeRoleOption)
    .filter((role): role is AdminRoleOption => Boolean(role));
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
  init:
    | (Omit<RequestInit, "body"> & {
        json?: unknown;
      })
    | undefined,
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

function mapAdminUserListItem(user: AdminUserListItemDto): AdminUserRow {
  const roles = user.roles?.filter(Boolean) ?? [];

  return {
    createdAtUtc: user.createdAtUtc,
    email: user.email ?? "-",
    globalRoles: roles,
    id: user.id ?? "",
    name: user.fullName?.trim() || user.email || "Chưa có tên",
    role: roles.join(", ") || undefined,
    status: user.isActive ? "active" : "locked",
  };
}

function mapAdminUserDetail(user: AdminUserDetailDto): AdminUserRow {
  const globalRoles = user.globalRoles?.filter(Boolean) ?? [];
  const avatarUrl =
    user.avatarUrl ?? user.avatarURL ?? user.avatarPreviewUrl ?? user.previewUrl;

  return {
    avatarMediaId: isUuid(user.avatarMediaId) ? user.avatarMediaId : undefined,
    avatarUrl: avatarUrl || undefined,
    citizenId: user.citizenId ?? undefined,
    createdAtUtc: user.createdAtUtc,
    dateOfBirth: user.dateOfBirth ?? undefined,
    email: user.email ?? "-",
    globalRoles,
    id: user.id ?? "",
    name: user.fullName?.trim() || user.email || "Chưa có tên",
    phone: user.phoneNumber?.trim(),
    role: globalRoles.length ? globalRoles.join(", ") : undefined,
    status: user.isActive ? "active" : "locked",
  };
}

function sanitizeCreateUserRequest(
  request: CreateAdminUserRequest,
): CreateAdminUserRequest {
  return {
    ...request,
    roleIds: normalizeRoleIds(request.roleIds),
  };
}

function sanitizeUpdateUserRequest(
  request: UpdateAdminUserRequest,
): UpdateAdminUserRequest {
  return {
    ...request,
    avatarMediaId: isUuid(request.avatarMediaId)
      ? request.avatarMediaId
      : null,
    roleIds: normalizeRoleIds(request.roleIds),
  };
}

function normalizeRoleIds(roleIds?: string[] | null) {
  const validRoleIds = roleIds?.filter(isUuid) ?? [];

  return validRoleIds.length ? validRoleIds : undefined;
}

function normalizeRoleOption(
  role: RawAdminRoleOption,
): AdminRoleOption | null {
  const id = role.id ?? role.roleId ?? role.Id ?? null;
  const name = role.name ?? role.roleName ?? role.Name ?? null;

  if (!isUuid(id) || !name) {
    return null;
  }

  return {
    description: role.description ?? role.Description ?? null,
    id,
    name,
  };
}

function isUuid(value?: string | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function getValidationErrorMessage(error: {
  fieldErrors: Record<string, string[] | undefined>;
}) {
  const messages = Object.entries(error.fieldErrors).flatMap(
    ([fieldName, fieldErrors]) =>
      (fieldErrors ?? []).map((message) => `${fieldName}: ${message}`),
  );

  return messages[0] ?? "Vui lòng kiểm tra lại thông tin user.";
}
