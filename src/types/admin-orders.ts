export type RentalOrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "AWAITING_HANDOVER"
  | "IN_RENTAL"
  | "PENDING_SETTLEMENT"
  | "COMPLETED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type RentalItemStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PENDING_SUPPLIER_CONFIRMATION"
  | "AWAITING_HANDOVER"
  | "IN_RENTAL"
  | "PENDING_SETTLEMENT"
  | "COMPLETED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type OrderDeliveryResponse = {
  method?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  address?: string | null;
  note?: string | null;
};

export type OrderHandoverResponse = {
  actualHandoverAt?: string | null;
  note?: string | null;
  renterAcknowledgedAt?: string | null;
  renterAcknowledgedById?: string | null;
  renterAcknowledgementNote?: string | null;
};

export type OrderItemRefundResponse = {
  state?: string | null;
  refundRef?: string | null;
};

export type OrderReturnResponse = {
  actualReturnAt?: string | null;
  note?: string | null;
  normalUnits?: number | null;
  damagedUnits?: number | null;
};

export type OrderSettlementResponse = {
  returnsCompletedAt?: string | null;
  deductionDeadline?: string | null;
  deductionStatus?: string | null;
  proposedDeductionAmount?: number | null;
  renterResponseDeadline?: string | null;
  finalDeductionAmount?: number | null;
  depositRefundAmount?: number | null;
  settledAt?: string | null;
};

export type AdminRefundAccount = {
  bankCode: string;
  maskedAccountNumber: string;
  accountHolderName: string;
};

export type AdminUnit = {
  assignmentId: string;
  assetId: string;
  allocationId?: string | null;
  status: string;
  handoverCondition?: string | null;
  returnCondition?: string | null;
  returnNote?: string | null;
  inventoryDispositionRef?: string | null;
};

export type AdminStateTransition = {
  rentalItemId?: string | null;
  fromState?: string | null;
  toState: string;
  action: string;
  actorId?: string | null;
  actorRole: "RENTER" | "SUPPLIER" | "ADMIN" | "SYSTEM" | string;
  reason?: string | null;
  occurredAt: string;
};

export type AdminOrderItem = {
  rentalItemId: string;
  equipmentListingId: string;
  supplierId: string;
  name?: string | null;
  quantity: number;
  startDate: string;
  endDate: string;
  status: RentalItemStatus;
  rentalDays: number;
  dailyRate: number;
  depositPerUnit: number;
  rentalAmount: number;
  depositAmount: number;
  allocationGroupId?: string | null;
  inventoryConfirmationRef?: string | null;
  supplierConfirmationDeadline?: string | null;
  supplierDecisionAt?: string | null;
  supplierDecisionBy?: string | null;
  supplierDecisionReason?: string | null;
  supplierDecisionNote?: string | null;
  refund?: OrderItemRefundResponse | null;
  settlementRef?: string | null;
  handover?: OrderHandoverResponse | null;
  returns?: OrderReturnResponse[] | null;
  settlement?: OrderSettlementResponse | null;
  units?: AdminUnit[] | null;
};

export type AdminSubOrder = {
  subOrderId: string;
  subOrderCode?: string | null;
  supplierId: string;
  status: RentalItemStatus;
  totalRentalAmount: number;
  totalDepositAmount: number;
  totalAmount: number;
  items?: AdminOrderItem[] | null;
};

export type AdminOrderSummaryItem = {
  rentalItemId: string;
  equipmentListingId: string;
  name?: string | null;
  quantity: number;
  startDate: string;
  endDate: string;
  status: RentalItemStatus;
};

export type AdminOrderSummary = {
  orderId: string;
  orderCode?: string | null;
  status: RentalOrderStatus;
  renterId: string;
  supplierIds: string[];
  currency?: string | null;
  totalRentalAmount: number;
  totalDepositAmount: number;
  totalAmount: number;
  itemCount: number;
  invoiceRef?: string | null;
  paidAt?: string | null;
  createdAt: string;
  items?: AdminOrderSummaryItem[] | null;
};

export type AdminOrderDetail = {
  orderId: string;
  orderCode?: string | null;
  status: RentalOrderStatus;
  renterId: string;
  currency?: string | null;
  createdAt: string;
  paymentDeadline?: string | null;
  invoiceRef?: string | null;
  paymentRef?: string | null;
  paidAt?: string | null;
  paymentState?: string | null;
  delivery?: OrderDeliveryResponse | null;
  refundAccount?: AdminRefundAccount | null;
  totalRentalAmount: number;
  totalDepositAmount: number;
  totalAmount: number;
  subOrders?: AdminSubOrder[] | null;
  history?: AdminStateTransition[] | null;
  version: number;
};

export type AdminOrdersPage = {
  items: AdminOrderSummary[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type AdminOrderFilters = {
  orderCode?: string;
  subOrderCode?: string;
  rentalItemId?: string;
  listingId?: string;
  assetId?: string;
  supplierId?: string;
  renterId?: string;
  status?: RentalOrderStatus | string;
  itemStatus?: RentalItemStatus | string;
  createdFrom?: string;
  createdTo?: string;
};
