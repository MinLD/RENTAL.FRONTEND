export type RenterDeductionDecision = "ACCEPT" | "DISPUTE";

export type SubmitDeductionRequest = {
  deductionAmount: number;
  damageDescription?: string | null;
  evidenceMediaIds?: string[] | null;
  affectedAssetIds?: string[] | null;
};

export type SubmitDeductionResponse = {
  proposalId: string;
  deductionAmount: number;
  submittedAt: string;
  renterResponseDeadline: string;
  rentalItemId: string;
  itemStatus: string | null;
};

export type RespondDeductionRequest = {
  decision: RenterDeductionDecision;
  disputeReason?: string | null;
  evidenceMediaIds?: string[] | null;
};

export type RespondDeductionResponse = {
  deductionProposalId: string;
  rentalItemId: string;
  proposalStatus: string | null;
  finalDeductionAmount: number | null;
  respondedAt: string;
  itemStatus: string | null;
};

export type DisputeUnitEvidenceDto = {
  assignmentId: string;
  assetId: string;
  status: string | null;
  handoverCondition: string | null;
  handoverNote: string | null;
  handoverMediaIds?: string[] | null;
  returnCondition: string | null;
  returnNote: string | null;
  returnMediaIds?: string[] | null;
  isAffected: boolean;
  deductionReason: string | null;
  deductionMediaIds?: string[] | null;
};

export type DisputeDetailDto = {
  rentalItemId: string;
  rentalOrderId: string;
  orderCode: string | null;
  supplierId: string;
  renterId: string;
  depositAmount: number;
  totalProposedAmount: number;
  damageDescription: string | null;
  proposalSubmittedAt: string;
  proposalStatus: string | null;
  disputeReason: string | null;
  disputeMediaIds?: string[] | null;
  disputedAt: string | null;
  units?: DisputeUnitEvidenceDto[] | null;
};

export type ResolveDisputeRequest = {
  finalDeductionAmount: number;
  decisionNote?: string | null;
  resolutionMediaIds?: string[] | null;
};

export type ResolveDisputeResponse = {
  deductionProposalId: string;
  rentalItemId: string;
  finalDeductionAmount: number;
  decision: string | null;
  resolvedAt: string;
  itemStatus: string | null;
};
