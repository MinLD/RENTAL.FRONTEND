import type { ReturnRequestResponse } from "@/types/rental-returns";

export type BuyNowSelection = {
  equipmentListingId: string;
  quantity: number;
  expectedStartDate: string;
  expectedEndDate: string;
};

export type RefundAccount = {
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
};

export type CheckoutRequest = {
  buyNow?: BuyNowSelection;
  cartItemIds?: string[];
  addressId?: string;
  delivery?: {
    province: string;
    addressDetail: string;
    recipientName: string;
    recipientPhone: string;
    note?: string;
  };
  deliveryNote?: string;
  refundAccount?: RefundAccount;
  refundAccountId?: string;
  expectedTotalAmount: number;
  termsAccepted: true;
  termsVersion?: string;
};

export type CheckoutOrder = {
  orderId: string;
  orderCode: string | null;
  status: string | null;
  paymentDeadline: string;
  currency: string | null;
  totalAmount: number;
  isReplay: boolean;
  payment?: {
    invoiceRef: string | null;
    status: string | null;
    qrUrl: string | null;
    bank: string | null;
    account: string | null;
    transferContent: string | null;
  } | null;
};

export type CheckoutAccepted = {
  operationId: string;
  statusUrl: string | null;
};

export type CheckoutOperation = {
  operationId: string | null;
  status: string | null;
  orderId: string | null;
  orderCode: string | null;
  order: CheckoutOrder | null;
  errorCode: string | null;
  errorMessage: string | null;
  invoiceStatus: string | null;
  readyForPayment: boolean;
};

export type RenterOrderPayment = {
  orderId: string;
  orderCode: string | null;
  status: string;
  paymentDeadline: string;
  invoiceRef: string | null;
  paymentState: string;
  totalAmount: number;
  currency: string | null;
};

export type OrderPaymentSnapshot = RenterOrderPayment & { paidAt: string | null };

export type RenterOrderSummary = {
  orderId: string;
  orderCode: string | null;
  status: string;
  currency: string | null;
  totalRentalAmount: number;
  totalDepositAmount: number;
  totalAmount: number;
  itemCount: number;
  subOrderCount: number;
  paymentDeadline: string;
  createdAt: string;
  refundState?: "NONE" | "PENDING" | "REFUNDED" | null;
  refundedAmount?: number | null;
  items: Array<{
    rentalItemId: string;
    equipmentListingId: string;
    supplierId: string;
    name: string | null;
    thumbnailMediaId: string | null;
    quantity: number;
    rentalDays: number;
    dailyRate: number;
    rentalAmount: number;
    depositAmount: number;
    startDate: string;
    endDate: string;
    status: string;
  }> | null;
};

export type RenterOrdersPage = {
  items: RenterOrderSummary[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type RenterOrderDetail = RenterOrderPayment & {
  createdAt: string;
  paidAt: string | null;
  totalRentalAmount: number;
  totalDepositAmount: number;
  refundState?: "NONE" | "PENDING" | "REFUNDED" | null;
  refundedAmount?: number | null;
  delivery: {
    method: string | null;
    recipientName: string | null;
    recipientPhone: string | null;
    address: string | null;
    note: string | null;
  } | null;
  refundAccount: {
    bankCode: string | null;
    accountNumber: string | null;
    accountHolderName: string | null;
  } | null;
  subOrders: Array<{
    subOrderId: string;
    subOrderCode: string | null;
    supplierId: string;
    status: string;
    totalRentalAmount: number;
    totalDepositAmount: number;
    totalAmount: number;
    items: Array<{
      rentalItemId: string;
      equipmentListingId?: string | null;
      name: string | null;
      quantity: number;
      startDate: string;
      endDate: string;
      status: string;
      listing: {
        id?: string | null;
        equipmentListingId?: string | null;
        thumbnailMediaId: string | null;
        brandName: string | null;
        model: string | null;
        equipmentTypeName: string | null;
        description: string | null;
      } | null;
      rentalDays: number;
      dailyRate: number;
      depositPerUnit: number;
      rentalAmount: number;
      depositAmount: number;
      supplierConfirmationDeadline: string | null;
      supplierDecisionAt: string | null;
      rejectReason: string | null;
      refund: {
        state: string;
        refundRef: string | null;
        kind?: string | null;
        refundAmount?: number | null;
        refundedAt?: string | null;
      } | null;
      handover: {
        actualHandoverAt: string;
        note: string | null;
        renterAcknowledgedAt: string | null;
        renterAcknowledgementNote: string | null;
      } | null;
      units?: Array<{
        assignmentId: string;
        status: string;
        hasOpenReturnRequest: boolean;
        canRequestReturn: boolean;
      }> | null;
      returnRequests?: ReturnRequestResponse[] | null;
      settlement?: {
        returnsCompletedAt: string | null;
        deductionDeadline: string | null;
        deductionStatus: string | null;
        proposedDeductionAmount: number | null;
        renterResponseDeadline: string | null;
        finalDeductionAmount: number | null;
        depositRefundAmount: number | null;
        settledAt: string | null;
      } | null;
    }> | null;
  }> | null;
  version: number;
};

export type CancelRenterOrderResponse = {
  orderId: string;
  orderCode: string | null;
  status: string | null;
  cancelledAt: string;
};

export type Invoice = {
  invoiceRef: string | null;
  totalAmount: number;
  currency: string | null;
  qrUrl: string | null;
  bank: string | null;
  account: string | null;
  transferContent: string | null;
  paymentDeadline: string;
  status: string | null;
};

export type InvoiceStatus = {
  invoiceRef: string | null;
  rentalOrderId: string;
  status: string | null;
  paymentDeadline: string;
  paidAt: string | null;
  totalAmount: number;
};
