export type AdminPayoutListItem = {
  payoutId: string;
  payoutRef?: string | null;
  settlementId?: string;
  settlementRef?: string | null;
  rentalItemId?: string;
  supplierId?: string;
  amount: number;
  currency?: string | null;
  status?: string | null;
  transferCode?: string | null;
  externalTransferReference?: string | null;
  completedBy?: string | null;
  createdAt: string;
  completedAt?: string | null;
  rentalOrderId?: string;
  orderCode?: string | null;
  rentalAmount?: number;
  platformFeeAmount?: number;
  finalDeductionAmount?: number;
  recipientBankCode?: string | null;
  recipientAccountNumber?: string | null;
  recipientAccountHolderName?: string | null;
  qrUrl?: string | null;
};

export type AdminPayoutListFinancialPage = {
  items?: AdminPayoutListItem[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};

export type AdminPayoutStatus = "ALL" | "PENDING_PAYOUT" | "COMPLETED";

export type AdminPayoutFilters = {
  supplierId?: string;
  status?: AdminPayoutStatus | string;
  from?: string;
  to?: string;
};
