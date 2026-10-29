import { z } from "zod";

export const supplierOrderStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAID",
  "PENDING_SUPPLIER_CONFIRMATION",
  "AWAITING_HANDOVER",
  "IN_RENTAL",
  "PENDING_SETTLEMENT",
  "COMPLETED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
]);

export const supplierOrdersQuerySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  status: supplierOrderStatusSchema.optional(),
});

export const supplierRejectRequestSchema = z.object({
  rejectReason: z.string().trim().min(1, "Vui lòng nhập lý do từ chối.")
    .max(500, "Lý do từ chối tối đa 500 ký tự."),
  optionalNote: z.string().trim().max(2000, "Ghi chú tối đa 2.000 ký tự.")
    .nullable().optional(),
});

const supplierOrderFields = {
  subOrderId: z.uuid(),
  subOrderCode: z.string().nullable(),
  orderCode: z.string().nullable(),
  status: supplierOrderStatusSchema,
  currency: z.string().nullable(),
  totalRentalAmount: z.number().nonnegative(),
  totalDepositAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
};

export const supplierOrderSummarySchema = z.object({
  ...supplierOrderFields,
  itemCount: z.number().int().nonnegative(),
});

export const supplierOrdersPageSchema = z.object({
  items: z.array(supplierOrderSummarySchema).nullable(),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const supplierOrderItemSchema = z.object({
  rentalItemId: z.uuid(),
  equipmentListingId: z.uuid(),
  name: z.string().nullable(),
  status: supplierOrderStatusSchema,
  quantity: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  rentalDays: z.number().int().positive(),
  dailyRate: z.number().nonnegative(),
  depositPerUnit: z.number().nonnegative(),
  rentalAmount: z.number().nonnegative(),
  depositAmount: z.number().nonnegative(),
  supplierConfirmationDeadline: z.string().nullable(),
  supplierDecisionAt: z.string().nullable(),
  pickupLocation: z.string().nullable(),
  units: z.array(z.object({
    assignmentId: z.uuid(),
    assetId: z.uuid(),
    status: z.string(),
    // An assigned machine has no return condition until it is returned.
    returnCondition: z.string().nullable(),
  })).nullable().optional(),
  handover: z.object({
    actualHandoverAt: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    renterAcknowledgedAt: z.string().nullable().optional(),
    renterAcknowledgementNote: z.string().nullable().optional(),
  }).nullable().optional(),
  returns: z.array(z.any()).nullable().optional(),
  returnRequests: z.array(z.any()).nullable().optional(),
  settlement: z.object({
    returnsCompletedAt: z.string().nullable(),
    deductionDeadline: z.string().nullable(),
    deductionStatus: z.string().nullable(),
    proposedDeductionAmount: z.number().nullable(),
    renterResponseDeadline: z.string().nullable(),
    finalDeductionAmount: z.number().nullable(),
    depositRefundAmount: z.number().nullable(),
    settledAt: z.string().nullable(),
  }).nullable().optional(),
});

export const supplierOrderDetailSchema = z.object({
  ...supplierOrderFields,
  delivery: z.object({
    method: z.string().nullable(),
    recipientName: z.string().nullable(),
    recipientPhone: z.string().nullable(),
    address: z.string().nullable(),
    note: z.string().nullable(),
  }).nullable(),
  items: z.array(supplierOrderItemSchema).nullable(),
  orderVersion: z.number().int().nonnegative(),
});

