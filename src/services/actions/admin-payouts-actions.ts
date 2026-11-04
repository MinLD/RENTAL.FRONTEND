"use server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson, serverApiResult, serverApiOk } from "@/services/server-api";
import type { ApiResult } from "@/services/api-error";
import { type ApiValueResult, unwrapApiValue } from "@/utils/api-result";
import type {
  AdminPayoutFilters,
  AdminPayoutListFinancialPage,
  AdminPayoutListItem,
  AdminPayoutStatus,
} from "@/types/admin-payouts";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";

export async function getAdminPayoutsAction(
  params: DataTableFetchParams<AdminPayoutFilters>,
): Promise<ApiResult<DataTableFetchResult<AdminPayoutListItem>>> {
  return serverApiResult(async () => {
    const filters = params.filters ?? {};
    const supplierId =
      filters.supplierId?.trim() ||
      (params.keyword?.trim() &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        params.keyword.trim(),
      )
        ? params.keyword.trim()
        : undefined);

    const rawStatus = (filters.status ?? "ALL").trim().toUpperCase();
    let normalizedStatus: AdminPayoutStatus = "ALL";
    if (rawStatus === "PENDING_PAYOUT" || rawStatus === "PENDING" || rawStatus === "WAITING") {
      normalizedStatus = "PENDING_PAYOUT";
    } else if (rawStatus === "COMPLETED" || rawStatus === "SUCCESS") {
      normalizedStatus = "COMPLETED";
    } else {
      normalizedStatus = "ALL";
    }

    const response = await serverApiJson<
      AdminPayoutListFinancialPage | ApiValueResult<AdminPayoutListFinancialPage>
    >(
      API_ENDPOINTS.backend.adminPayouts.list({
        page: params.page,
        pageSize: params.pageSize,
        supplierId,
        status: normalizedStatus,
        from: filters.from?.trim() || undefined,
        to: filters.to?.trim() || undefined,
      }),
      "Không thể tải danh sách payout của hệ thống.",
      { cache: "no-store" },
    );

    const unwrapped = unwrapApiValue(response);
    const rawItems = unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const items = rawItems.map((rawItem: unknown) => {
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
        ...item,
        qrUrl: effectiveQrUrl,
        recipientBankCode,
        recipientAccountNumber,
        recipientAccountHolderName,
      } as AdminPayoutListItem;
    });

    const totalCount = unwrapped?.totalCount ?? items.length;

    return {
      data: items,
      totalItems: totalCount,
    };
  });
}

export async function completeAdminPayoutAction(
  payoutId: string,
  payload: {
    externalTransferReference?: string;
    operationKey?: string;
    auditReason?: string;
  },
): Promise<ApiResult<void>> {
  return serverApiResult(async () => {
    await serverApiOk(
      API_ENDPOINTS.backend.adminPayouts.complete(payoutId),
      "Xác nhận chuyển khoản payout thất bại.",
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
