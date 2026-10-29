import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import { ApiError, type ApiResult } from "@/services/api-error";
import type {
  AcknowledgeReceiptRequest,
  AcknowledgeReceiptResponse,
  AdminResolveReturnRequest,
  CancelNotDeliveredRequest,
  CancelNotDeliveredResponse,
  CreateReturnRequest,
  HandoverItemRequest,
  HandoverItemResponse,
  RecordReturnRequest,
  RecordReturnResponse,
  ReportReturnIssueRequest,
  ReturnRequestResponse,
} from "@/types/rental-returns";

function getIdempotencyHeader(key?: string): Record<string, string> {
  const finalKey = key?.trim() || crypto.randomUUID();
  return { "Idempotency-Key": finalKey };
}
export async function handoverItem(
  itemId: string,
  payload: HandoverItemRequest,
  idempotencyKey?: string,
): Promise<ApiResult<HandoverItemResponse>> {
  try {
    const response = await authApiClientJson<HandoverItemResponse>(
      API_ENDPOINTS.backend.rental.itemHandover(itemId),
      {
        method: "POST",
        headers: getIdempotencyHeader(idempotencyKey),
        json: payload,
      },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể gửi bằng chứng bàn giao thiết bị.",
        fieldErrors: {},
      },
    };
  }
}
export async function acknowledgeReceipt(
  itemId: string,
  payload: AcknowledgeReceiptRequest,
): Promise<ApiResult<AcknowledgeReceiptResponse>> {
  try {
    const response = await authApiClientJson<AcknowledgeReceiptResponse>(
      API_ENDPOINTS.backend.rental.itemAcknowledgeReceipt(itemId),
      {
        method: "POST",
        json: payload,
      },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể xác nhận đã nhận máy.",
        fieldErrors: {},
      },
    };
  }
}

export async function cancelNotDelivered(
  itemId: string,
  payload: CancelNotDeliveredRequest,
  idempotencyKey?: string,
): Promise<ApiResult<CancelNotDeliveredResponse>> {
  try {
    const response = await authApiClientJson<CancelNotDeliveredResponse>(
      API_ENDPOINTS.backend.rental.itemCancelNotDelivered(itemId),
      {
        method: "POST",
        headers: getIdempotencyHeader(idempotencyKey),
        json: payload,
      },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể gửi yêu cầu hủy đơn do chưa nhận máy.",
        fieldErrors: {},
      },
    };
  }
}



export async function createReturnRequest(
  itemId: string,
  payload: CreateReturnRequest,
  idempotencyKey?: string,
): Promise<ApiResult<ReturnRequestResponse>> {
  try {
    const response = await authApiClientJson<ReturnRequestResponse>(
      API_ENDPOINTS.backend.rental.itemReturnRequests(itemId),
      {
        method: "POST",
        headers: getIdempotencyHeader(idempotencyKey),
        json: payload,
      },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể gửi yêu cầu trả thiết bị.",
        fieldErrors: {},
      },
    };
  }
}

export async function recordSupplierReturn(
  itemId: string,
  payload: RecordReturnRequest,
  idempotencyKey?: string,
): Promise<ApiResult<RecordReturnResponse>> {
  try {
    const response = await authApiClientJson<RecordReturnResponse>(
      API_ENDPOINTS.backend.rental.itemReturns(itemId),
      {
        method: "POST",
        headers: getIdempotencyHeader(idempotencyKey),
        json: payload,
      },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể ghi nhận thu hồi thiết bị.",
        fieldErrors: {},
      },
    };
  }
}

export async function reportReturnIssue(
  itemId: string,
  requestId: string,
  payload: ReportReturnIssueRequest,
  idempotencyKey?: string,
): Promise<ApiResult<ReturnRequestResponse>> {
  try {
    const response = await authApiClientJson<ReturnRequestResponse>(
      API_ENDPOINTS.backend.rental.itemReportIssue(itemId, requestId),
      {
        method: "POST",
        headers: getIdempotencyHeader(idempotencyKey),
        json: payload,
      },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể báo cáo sự cố trả thiết bị.",
        fieldErrors: {},
      },
    };
  }
}

export async function resolveReturnRequest(
  itemId: string,
  requestId: string,
  payload: AdminResolveReturnRequest,
  idempotencyKey?: string,
): Promise<ApiResult<ReturnRequestResponse>> {
  try {
    const response = await authApiClientJson<ReturnRequestResponse>(
      API_ENDPOINTS.backend.rental.itemResolveReturnRequest(itemId, requestId),
      {
        method: "POST",
        headers: getIdempotencyHeader(idempotencyKey),
        json: payload,
      },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể phân xử yêu cầu trả thiết bị.",
        fieldErrors: {},
      },
    };
  }
}
