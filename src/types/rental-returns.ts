export type ConditionEnum = "NORMAL" | "DAMAGED";

export type ReturnRequestStatus =
  | "PendingSupplierConfirmation"
  | "PENDING_SUPPLIER_CONFIRMATION"
  | "Disputed"
  | "DISPUTED"
  | "Confirmed"
  | "CONFIRMED"
  | "Rejected"
  | "REJECTED"
  | "Resolved"
  | "RESOLVED";

export type ReturnRequestUnitStatus =
  | "PendingSupplierConfirmation"
  | "PENDING_SUPPLIER_CONFIRMATION"
  | "Disputed"
  | "DISPUTED"
  | "Confirmed"
  | "CONFIRMED"
  | "Rejected"
  | "REJECTED";

export type ReturnResolutionDecision =
  | "ConfirmReceived"
  | "CONFIRM_RECEIVED"
  | "RejectRequest"
  | "REJECT_REQUEST";

export type ReporterRole = "Renter" | "Supplier" | "Admin" | "System";

// Task 1: Handover, Acknowledgement, Cancel
export type HandoverUnitDto = {
  assignmentId: string;
  condition: ConditionEnum;
  note?: string | null;
  mediaIds: string[];
};

export type HandoverItemRequest = {
  actualHandoverAt: string;
  note?: string | null;
  confirmed?: boolean;
  units: HandoverUnitDto[];
};

export type HandoverItemResponse = {
  handoverRecordId: string | null;
  handoverAt: string;
  status: string | null;
};

export type AcknowledgeReceiptRequest = {
  note?: string | null;
};

export type AcknowledgeReceiptResponse = {
  itemId: string;
  handoverRecordId: string;
  receivedAt: string;
  receivedBy: string;
  note: string | null;
};

export type CancelNotDeliveredRequest = {
  reason?: string | null;
};

export type CancelNotDeliveredResponse = {
  itemId: string;
  status: string | null;
  cancelledAt: string;
  refundAmount: number;
};

// Task 2: Return Request
export type ReturnRequestUnitDto = {
  rentalUnitAssignmentId: string;
  mediaIds?: string[];
};

export type CreateReturnRequest = {
  actualReturnAt: string;
  note?: string | null;
  units: ReturnRequestUnitDto[];
};

export type ReturnRequestUnitResponse = {
  rentalUnitAssignmentId: string;
  assignmentId: string;
  mediaIds: string[];
  closedAt: string | null;
  rejectedAt: string | null;
  status: ReturnRequestUnitStatus;
  isOverdue: boolean;
  overdueNotifiedAt: string | null;
};

export type ReturnRequestIssueResponse = {
  issueId: string;
  returnRequestId: string;
  reporterId: string;
  reporterRole: ReporterRole | string;
  reason: string;
  note: string | null;
  mediaIds: string[];
  reportedAt: string;
  assignmentIds: string[];
};

export type ReturnRequestResolutionResponse = {
  resolutionId: string;
  returnRequestId: string;
  adminId: string;
  decision: ReturnResolutionDecision;
  decisionNote: string | null;
  resolutionMediaIds: string[];
  resolvedAt: string;
  assignmentIds: string[];
};

export type ReturnRequestResponse = {
  returnRequestId: string;
  itemId: string;
  actualReturnAt: string;
  note: string | null;
  submittedAt: string;
  units: ReturnRequestUnitResponse[];
  status: ReturnRequestStatus;
  confirmationDeadlineAt: string;
  isOverdue: boolean;
  issues: ReturnRequestIssueResponse[];
  resolutions: ReturnRequestResolutionResponse[];
};

// Task 3: Supplier Record Return
export type ReturnUnitRequest = {
  rentalUnitAssignmentId: string;
  condition: ConditionEnum;
  description?: string | null;
  mediaIds?: string[];
};

export type RecordReturnRequest = {
  actualReturnAt: string;
  note?: string | null;
  units: ReturnUnitRequest[];
};

export type RecordReturnResponse = {
  returnRecordId: string;
  submittedAt: string;
  remainingUnits: number;
  status: string;
  deductionDeadline: string | null;
};

// Task 4: Report Issue & Admin Resolution
export type ReportReturnIssueRequest = {
  reason: string;
  note?: string | null;
  mediaIds?: string[];
  assignmentIds?: string[];
};

export type AdminResolveReturnRequest = {
  decision: ReturnResolutionDecision;
  decisionNote: string;
  assignmentIds: string[];
  resolutionMediaIds?: string[];
  actualReturnAt?: string | null;
  units?: ReturnUnitRequest[] | null;
};

export type AdminReturnRequestSummary = {
  returnRequestId: string;
  itemId: string;
  orderId: string;
  orderCode: string | null;
  renterId: string;
  supplierId: string;
  submittedAt: string;
  confirmationDeadlineAt: string;
  status: ReturnRequestStatus;
  isOverdue: boolean;
  totalUnits: number;
  actionableUnits: number;
  disputedUnits: number;
  confirmedUnits: number;
  rejectedUnits: number;
};

export type AdminReturnRequestsPage = {
  items: AdminReturnRequestSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type AdminReturnRequestsFilters = {
  disputed?: boolean;
  overdue?: boolean;
  itemId?: string;
  orderId?: string;
};

export type InventoryUnitTracking = {
  rentalUnitAssignmentId: string;
  assetId: string;
  allocationId: string;
  assignmentStatus: string;
  returnRecordId: string | null;
  returnCondition: string | null;
  allocationClosedAt: string | null;
  inventoryDispositionRef: string | null;
};

export type AdminReturnRequestDetailResponse = {
  request: ReturnRequestResponse;
  orderId: string;
  orderCode: string;
  supplierId: string;
  renterId: string;
  itemStatus: string;
  inventoryUnits: InventoryUnitTracking[];
};

// Admin Refunds & Renter Refund Tracking
export type RentalRefundKind = "FULL_REFUND" | "DEPOSIT_RETURN";
export type AdminRefundQueueState = "PENDING" | "COMPLETED";
export type OrderRefundProgress = "NONE" | "PENDING" | "REFUNDED";
export type OrderRefundState = "NONE" | "PROCESSING" | "COMPLETED";

export type AdminRefundConfirmationResponse = {
  bankTransactionRef: string;
  confirmedAt: string;
  confirmedBy: string;
  note: string | null;
};

export type AdminRefundQueueItemResponse = {
  rentalItemId: string;
  orderId: string;
  orderCode: string | null;
  renterId: string;
  renterName: string | null;
  renterPhone: string | null;
  equipmentName: string | null;
  supplierId: string;
  itemStatus: string;
  kind: RentalRefundKind;
  rentalAmount: number;
  depositAmount: number;
  deductionAmount: number;
  refundAmount: number;
  refundAccount: Record<string, unknown>;
  state: AdminRefundQueueState;
  paymentRequestStatus: string | null;
  requestedAt: string;
  confirmation?: AdminRefundConfirmationResponse | null;
};

export type ConfirmRefundTransferRequest = {
  bankTransactionRef: string;
  note?: string | null;
};

export type AdminOrderRefundResponse = {
  rentalItemId: string;
  equipmentName: string | null;
  supplierId: string;
  itemStatus: string;
  kind: RentalRefundKind;
  rentalAmount: number;
  depositAmount: number;
  deductionAmount: number;
  refundAmount: number;
  refundAccount: Record<string, unknown>;
  state: AdminRefundQueueState;
  paymentRequestStatus: string | null;
  requestedAt: string;
  confirmation?: AdminRefundConfirmationResponse | null;
};
