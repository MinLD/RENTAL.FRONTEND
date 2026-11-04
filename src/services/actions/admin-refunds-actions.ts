"use server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson, serverApiResult, serverApiOk } from "@/services/server-api";
import type { ApiResult } from "@/services/api-error";
import { type ApiValueResult, unwrapApiValue } from "@/utils/api-result";
import type {
  AdminManualRefundFilters,
  AdminManualRefundFinancialPage,
  AdminManualRefundItem,
  CompleteManualRefundPayload,
} from "@/types/admin-refunds";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";

function normalizeRefundItem(rawItem: unknown): AdminManualRefundItem {
  const item = (rawItem ?? {}) as Record<string, unknown>;

  const qrUrl =
    (item.qrUrl as string | undefined) ||
    (item.qRUrl as string | undefined) ||
    (item.qrURL as string | undefined) ||
    (item.QrUrl as string | undefined) ||
    (item.QRUrl as string | undefined) ||
    null;

  const recipientBankCode =
    (item.recipientBankCode as string | undefined) ||
    (item.bankCode as string | undefined) ||
    (item.recipientBank as string | undefined) ||
    null;

  const recipientAccountNumber =
    (item.recipientAccountNumber as string | undefined) ||
    (item.accountNumber as string | undefined) ||
    (item.recipientAccount as string | undefined) ||
    null;

  const recipientAccountHolderName =
    (item.recipientAccountHolderName as string | undefined) ||
    (item.accountHolderName as string | undefined) ||
    (item.accountName as string | undefined) ||
    null;

  const effectiveQrUrl =
    qrUrl ||
    (recipientBankCode && recipientAccountNumber
      ? `https://img.vietqr.io/image/${recipientBankCode}-${recipientAccountNumber}-compact2.png?amount=${Math.round(Number(item.amount) || 0)}&addInfo=${encodeURIComponent(String(item.transferCode || ""))}&accountName=${encodeURIComponent(String(recipientAccountHolderName || ""))}`
      : null);

  return {
    requirementId: String(item.requirementId || item.id || ""),
    requirementRef: (item.requirementRef as string | undefined) || null,
    settlementRef: (item.settlementRef as string | undefined) || null,
    rentalItemId: (item.rentalItemId as string | undefined) || null,
    renterId: (item.renterId as string | undefined) || "",
    amount: Number(item.amount) || 0,
    currency: (item.currency as string | undefined) || "VND",
    status: (item.status as string | number | undefined) ?? "PENDING",
    transferCode: (item.transferCode as string | undefined) || null,
    externalTransferReference: (item.externalTransferReference as string | undefined) || null,
    completedBy: (item.completedBy as string | undefined) || null,
    createdAt: String(item.createdAt || new Date().toISOString()),
    completedAt: (item.completedAt as string | undefined) || null,
    recipientBankCode,
    recipientAccountNumber,
    recipientAccountHolderName,
    qrUrl: effectiveQrUrl,
  };
}

export async function getAdminManualRefundsAction(
  params: DataTableFetchParams<AdminManualRefundFilters>,
): Promise<ApiResult<DataTableFetchResult<AdminManualRefundItem>>> {
  return serverApiResult(async () => {
    const filters = params.filters ?? {};
    const rawStatus = filters.status?.trim()?.toUpperCase() || "ALL";

    // Thử gọi /api/v1/payment/admin/manual-refunds trước
    try {
      const response = await serverApiJson<
        AdminManualRefundFinancialPage | ApiValueResult<AdminManualRefundFinancialPage>
      >(
        API_ENDPOINTS.backend.manualRefunds.adminList({
          page: params.page,
          pageSize: params.pageSize,
          status: rawStatus,
        }),
        "Không thể tải danh sách hoàn tiền cọc.",
        { cache: "no-store" },
      );

      const unwrapped = unwrapApiValue(response);
      const rawItems = unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
      const items = rawItems.map(normalizeRefundItem);
      const totalCount = unwrapped?.totalCount ?? items.length;

      return {
        data: items,
        totalItems: totalCount,
      };
    } catch {
      // Fallback sang /api/v1/payment/manual-refunds nếu endpoint adminList trả lỗi
      const statusNumber =
        rawStatus === "COMPLETED" || rawStatus === "2"
          ? 2
          : rawStatus === "PENDING" || rawStatus === "1"
            ? 1
            : undefined;

      const response = await serverApiJson<unknown>(
        API_ENDPOINTS.backend.manualRefunds.list({
          status: statusNumber,
          limit: params.pageSize,
        }),
        "Không thể tải danh sách hoàn tiền cọc.",
        { cache: "no-store" },
      );

      const unwrapped = unwrapApiValue(response as ApiValueResult<unknown>);
      const rawItems = Array.isArray(unwrapped)
        ? unwrapped
        : ((unwrapped as Record<string, unknown>)?.items as unknown[]) ?? [];
      const items = rawItems.map(normalizeRefundItem);

      return {
        data: items,
        totalItems: items.length,
      };
    }
  });
}

export async function completeAdminManualRefundAction(
  requirementId: string,
  payload: CompleteManualRefundPayload,
): Promise<ApiResult<void>> {
  return serverApiResult(async () => {
    await serverApiOk(
      API_ENDPOINTS.backend.manualRefunds.complete(requirementId),
      "Xác nhận hoàn tiền thất bại.",
      {
        method: "POST",
        json: {
          externalTransferReference: payload.externalTransferReference?.trim() || null,
          operationKey: payload.operationKey || crypto.randomUUID(),
          auditReason: payload.auditReason?.trim() || null,
        },
      },
    );
  });
}
