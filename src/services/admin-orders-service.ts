import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import { ApiError, type ApiResult } from "@/services/api-error";
import type { DataTableFetchParams, DataTableFetchResult } from "@/types/data-table";
import type {
  AdminOrderDetail,
  AdminOrderFilters,
  AdminOrdersPage,
  AdminOrderSummary,
} from "@/types/admin-orders";

export async function getAdminOrders(
  params: DataTableFetchParams<AdminOrderFilters>,
): Promise<ApiResult<DataTableFetchResult<AdminOrderSummary>>> {
  try {
    const filters = params.filters ?? {};
    const response = await authApiClientJson<AdminOrdersPage>(
      API_ENDPOINTS.backend.rental.adminOrders({
        page: params.page,
        pageSize: params.pageSize,
        orderCode: params.keyword || filters.orderCode,
        subOrderCode: filters.subOrderCode,
        status: filters.status,
        itemStatus: filters.itemStatus,
        supplierId: filters.supplierId,
        renterId: filters.renterId,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
      }),
      { cache: "no-store" },
    );

    return {
      success: true,
      data: {
        data: response.items ?? [],
        totalItems: response.totalCount ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể tải danh sách đơn thuê của hệ thống.",
        fieldErrors: {},
      },
    };
  }
}

export async function getAdminOrderDetail(orderId: string): Promise<ApiResult<AdminOrderDetail>> {
  try {
    const response = await authApiClientJson<AdminOrderDetail>(
      API_ENDPOINTS.backend.rental.adminOrder(orderId),
      { cache: "no-store" },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể tải chi tiết đơn thuê.",
        fieldErrors: {},
      },
    };
  }
}
