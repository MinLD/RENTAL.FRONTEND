import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import { ApiError, type ApiResult } from "@/services/api-error";
import type {
  DisputeDetailDto,
  ResolveDisputeRequest,
  ResolveDisputeResponse,
  RespondDeductionRequest,
  RespondDeductionResponse,
  SubmitDeductionRequest,
  SubmitDeductionResponse,
} from "@/types/rental-deductions";

function getIdempotencyHeader(key?: string): Record<string, string> {
  const finalKey = key?.trim() || crypto.randomUUID();
  return { "Idempotency-Key": finalKey };
}

export async function proposeRentalDeduction(
  itemId: string,
  payload: SubmitDeductionRequest,
  idempotencyKey?: string,
): Promise<ApiResult<SubmitDeductionResponse>> {
  try {
    const response = await authApiClientJson<SubmitDeductionResponse>(
      API_ENDPOINTS.backend.rental.itemDeductions(itemId),
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
        message: "Không thể gửi đề nghị khấu trừ tiền cọc.",
        fieldErrors: {},
      },
    };
  }
}

export async function respondRentalDeduction(
  itemId: string,
  payload: RespondDeductionRequest,
  idempotencyKey?: string,
): Promise<ApiResult<RespondDeductionResponse>> {
  try {
    const response = await authApiClientJson<RespondDeductionResponse>(
      API_ENDPOINTS.backend.rental.itemDeductionResponse(itemId),
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
        message: "Không thể gửi phản hồi đề nghị khấu trừ.",
        fieldErrors: {},
      },
    };
  }
}

export async function getRentalDeductionDispute(
  itemId: string,
): Promise<ApiResult<DisputeDetailDto>> {
  try {
    const response = await authApiClientJson<DisputeDetailDto>(
      API_ENDPOINTS.backend.rental.itemDeductionDispute(itemId),
      { cache: "no-store" },
    );
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, error: error.details };
    return {
      success: false,
      error: {
        status: 500,
        message: "Không thể tải thông tin tranh chấp cọc.",
        fieldErrors: {},
      },
    };
  }
}

export async function resolveRentalDeductionDispute(
  itemId: string,
  payload: ResolveDisputeRequest,
  idempotencyKey?: string,
): Promise<ApiResult<ResolveDisputeResponse>> {
  try {
    const response = await authApiClientJson<ResolveDisputeResponse>(
      API_ENDPOINTS.backend.rental.itemDeductionResolution(itemId),
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
        message: "Không thể phân xử tranh chấp cọc.",
        fieldErrors: {},
      },
    };
  }
}
