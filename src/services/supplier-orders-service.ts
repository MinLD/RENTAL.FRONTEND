import { z } from "zod";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  supplierOrderDetailSchema,
  supplierOrdersPageSchema,
  supplierOrdersQuerySchema,
  supplierRejectRequestSchema,
} from "@/lib/validations/supplier-orders";
import { ApiError, ApiInputError } from "@/services/api-error";
import { authApiClient } from "@/services/api-client";
import type { DataTableFetchParams, DataTableFetchResult } from "@/types/data-table";
import type { ApiResult } from "@/services/api-error";
import type {
  SupplierOrderDetail,
  SupplierOrdersFilters,
  SupplierOrderSummary,
  SupplierRejectRequest,
} from "@/types/supplier-orders";

function parseRequest<T>(schema: z.ZodType<T>, request: unknown): T {
  const parsed = schema.safeParse(request);
  if (parsed.success) return parsed.data;
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    (fieldErrors[issue.path.join(".")] ??= []).push(issue.message);
  }
  throw new ApiInputError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.", fieldErrors);
}

function assertDecisionRequest(id: string, key: string) {
  parseRequest(z.uuid({ error: "Mã đơn thuê không hợp lệ." }), id);
  parseRequest(z.string().trim().min(1).max(64), key);
}

// Poll through the existing BFF. Page middleware may return JSON/redirects,
// which are not valid responses for the Server Action transport.
async function supplierOrderResult<T>(request: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    return { success: true, data: await request() };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    if (error instanceof ApiInputError) {
      return { success: false, error: { status: 400, message: error.message, fieldErrors: error.fieldErrors } };
    }
    return {
      success: false,
      error: {
        status: error instanceof z.ZodError ? 502 : 503,
        message: error instanceof z.ZodError
          ? "Dữ liệu đơn thuê trả về không hợp lệ. Vui lòng tải lại để thử lại."
          : "Chưa thể tải dữ liệu đơn thuê. Vui lòng thử lại sau ít phút.",
        fieldErrors: {},
      },
    };
  }
}

export async function getSupplierOrders(
  params: DataTableFetchParams<SupplierOrdersFilters>,
): Promise<ApiResult<DataTableFetchResult<SupplierOrderSummary>>> {
  return supplierOrderResult(async () => {
    const query = parseRequest(supplierOrdersQuerySchema, {
      page: params.page,
      pageSize: params.pageSize,
      status: params.filters?.status,
    });
    const search = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
    if (query.status) search.set("status", query.status);
    const response = await authApiClient(
      `${API_ENDPOINTS.backend.rental.supplierSubOrders}?${search}`,
      { cache: "no-store" },
    );
    const result = supplierOrdersPageSchema.parse(await response.json());
    return { data: result.items ?? [], totalItems: result.totalCount };
  });
}

export async function getSupplierOrder(id: string): Promise<ApiResult<SupplierOrderDetail>> {
  return supplierOrderResult(async () => {
    parseRequest(z.uuid({ error: "Mã đơn thuê không hợp lệ." }), id);
    const response = await authApiClient(
      API_ENDPOINTS.backend.rental.supplierSubOrder(id),
      { cache: "no-store" },
    );
    const order = supplierOrderDetailSchema.parse(await response.json());
    if (order.subOrderId !== id) throw new Error("Chi tiết đơn thuê không khớp yêu cầu.");
    return order;
  });
}

export async function acceptSupplierOrder(id: string, idempotencyKey: string): Promise<ApiResult<void>> {
  return supplierOrderResult(async () => {
    assertDecisionRequest(id, idempotencyKey);
    await authApiClient(
      API_ENDPOINTS.backend.rental.supplierAcceptSubOrder(id),
      { method: "POST", headers: { "Idempotency-Key": idempotencyKey } },
    );
  });
}

export async function rejectSupplierOrder(id: string, request: SupplierRejectRequest, idempotencyKey: string): Promise<ApiResult<void>> {
  return supplierOrderResult(async () => {
    assertDecisionRequest(id, idempotencyKey);
    const payload = parseRequest(supplierRejectRequestSchema, request);
    await authApiClient(
      API_ENDPOINTS.backend.rental.supplierRejectSubOrder(id),
      { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, json: payload },
    );
  });
}
