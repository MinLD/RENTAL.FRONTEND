import type { z } from "zod";
import type {
  supplierOrderDetailSchema,
  supplierOrderItemSchema,
  supplierOrderStatusSchema,
  supplierOrderSummarySchema,
  supplierRejectRequestSchema,
} from "@/lib/validations/supplier-orders";
import type { ApiResult } from "@/services/api-error";
import type { DataTableFetchParams, DataTableFetchResult } from "@/types/data-table";

export type SupplierOrderStatus = z.infer<typeof supplierOrderStatusSchema>;
export type SupplierOrderSummary = z.infer<typeof supplierOrderSummarySchema>;
export type SupplierOrderItem = z.infer<typeof supplierOrderItemSchema>;
export type SupplierOrderDetail = z.infer<typeof supplierOrderDetailSchema>;
export type SupplierRejectRequest = z.infer<typeof supplierRejectRequestSchema>;
export type SupplierOrdersFilters = { status?: SupplierOrderStatus };
export type SupplierDecisionAction = "accept" | "reject";

export type SupplierOrdersActions = {
  fetchOrders: (params: DataTableFetchParams<SupplierOrdersFilters>) =>
    Promise<ApiResult<DataTableFetchResult<SupplierOrderSummary>>>;
  fetchOrder: (id: string) => Promise<ApiResult<SupplierOrderDetail>>;
  acceptOrder: (id: string, idempotencyKey: string) => Promise<ApiResult<void>>;
  rejectOrder: (id: string, request: SupplierRejectRequest, idempotencyKey: string) =>
    Promise<ApiResult<void>>;
};
