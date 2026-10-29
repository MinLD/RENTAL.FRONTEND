import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import { ApiError, type ApiResult } from "@/services/api-error";
import type { DataTableFetchParams, DataTableFetchResult } from "@/types/data-table";
import type {
  AdminOrderRefundResponse,
  AdminRefundQueueItemResponse,
  ConfirmRefundTransferRequest,
} from "@/types/rental-returns";

export type AdminRefundFilters = {
  status?: "PENDING" | "COMPLETED";
};

export type AdminRefundsPage = {
  items: AdminRefundQueueItemResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export async function getAdminRefunds(
  params: DataTableFetchParams<AdminRefundFilters>,
): Promise<ApiResult<DataTableFetchResult<AdminRefundQueueItemResponse>>> {
  try {
    const filters = params.filters ?? {};
    const response = await authApiClientJson<AdminRefundsPage>(
      API_ENDPOINTS.backend.rental.adminRefunds({
        page: params.page,
        pageSize: params.pageSize,
        status: filters.status,
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
        message: "Không thể tải danh sách yêu cầu hoàn tiền.",
        fieldErrors: {},
      },
    };
  }
}

export async function confirmAdminRefund(
  rentalItemId: string,
  payload: ConfirmRefundTransferRequest,
): Promise<ApiResult<AdminOrderRefundResponse>> {
  try {
    const response = await authApiClientJson<AdminOrderRefundResponse>(
      API_ENDPOINTS.backend.rental.adminCompleteRefund(rentalItemId),
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể xác nhận hoàn tiền.",
        fieldErrors: {},
      },
    };
  }
}
