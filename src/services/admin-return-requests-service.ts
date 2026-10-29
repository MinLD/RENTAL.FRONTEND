import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import { ApiError, type ApiResult } from "@/services/api-error";
import type { DataTableFetchParams, DataTableFetchResult } from "@/types/data-table";
import type {
  AdminReturnRequestDetailResponse,
  AdminReturnRequestsFilters,
  AdminReturnRequestsPage,
  AdminReturnRequestSummary,
} from "@/types/rental-returns";

export async function getAdminReturnRequests(
  params: DataTableFetchParams<AdminReturnRequestsFilters>,
): Promise<ApiResult<DataTableFetchResult<AdminReturnRequestSummary>>> {
  try {
    const filters = params.filters ?? {};
    const response = await authApiClientJson<AdminReturnRequestsPage>(
      API_ENDPOINTS.backend.rental.adminReturnRequests({
        page: params.page,
        pageSize: params.pageSize,
        disputed: filters.disputed,
        overdue: filters.overdue,
        itemId: filters.itemId || (params.keyword?.includes("-") ? params.keyword : undefined),
        orderId: filters.orderId,
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
        message: "Không thể tải danh sách yêu cầu trả thiết bị.",
        fieldErrors: {},
      },
    };
  }
}

export async function getAdminReturnRequestDetail(
  requestId: string,
): Promise<ApiResult<AdminReturnRequestDetailResponse>> {
  try {
    const response = await authApiClientJson<AdminReturnRequestDetailResponse>(
      API_ENDPOINTS.backend.rental.adminReturnRequestDetail(requestId),
      { cache: "no-store" },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể tải chi tiết yêu cầu trả thiết bị.",
        fieldErrors: {},
      },
    };
  }
}
