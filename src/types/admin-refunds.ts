export type AdminManualRefundItem = {
  requirementId: string;
  requirementRef?: string | null;
  settlementRef?: string | null;
  rentalItemId?: string | null;
  renterId?: string;
  amount: number;
  currency?: string | null;
  status?: string | number | null;
  transferCode?: string | null;
  externalTransferReference?: string | null;
  completedBy?: string | null;
  createdAt: string;
  completedAt?: string | null;
  recipientBankCode?: string | null;
  recipientAccountNumber?: string | null;
  recipientAccountHolderName?: string | null;
  qrUrl?: string | null;
};

export type AdminManualRefundFinancialPage = {
  items?: AdminManualRefundItem[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
};

export type AdminManualRefundFilters = {
  status?: string;
};

export type CompleteManualRefundPayload = {
  externalTransferReference?: string;
  operationKey?: string;
  auditReason?: string;
};
