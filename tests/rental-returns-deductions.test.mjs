import test from "node:test";
import assert from "node:assert/strict";

const {
  createReturnRequestSchema,
  recordReturnRequestSchema,
  reportReturnIssueSchema,
  adminResolveReturnRequestSchema,
} = await import("../src/lib/validations/rental-returns.ts");

const {
  submitDeductionSchema,
  respondDeductionSchema,
  resolveDisputeSchema,
} = await import("../src/lib/validations/rental-deductions.ts");

const validUuid1 = "10000000-0000-4000-8000-000000000001";
const mediaUuid = "40000000-0000-4000-8000-000000000001";

test("createReturnRequestSchema validates units and return time", () => {
  const emptyUnits = createReturnRequestSchema.safeParse({
    actualReturnAt: "2026-10-28T08:00:00Z",
    units: [],
  });
  assert.equal(emptyUnits.success, false);

  const valid = createReturnRequestSchema.safeParse({
    actualReturnAt: "2026-10-28T08:00:00Z",
    note: "Tra may tai kho",
    units: [{ rentalUnitAssignmentId: validUuid1 }],
  });
  assert.equal(valid.success, true);
});

test("recordReturnRequestSchema enforces description and media when condition is DAMAGED", () => {
  const normalResult = recordReturnRequestSchema.safeParse({
    actualReturnAt: "2026-10-28T09:00:00Z",
    units: [
      {
        rentalUnitAssignmentId: validUuid1,
        condition: "NORMAL",
      },
    ],
  });
  assert.equal(normalResult.success, true);

  const damagedNoDesc = recordReturnRequestSchema.safeParse({
    actualReturnAt: "2026-10-28T09:00:00Z",
    units: [
      {
        rentalUnitAssignmentId: validUuid1,
        condition: "DAMAGED",
        mediaIds: [mediaUuid],
      },
    ],
  });
  assert.equal(damagedNoDesc.success, false);

  const damagedNoMedia = recordReturnRequestSchema.safeParse({
    actualReturnAt: "2026-10-28T09:00:00Z",
    units: [
      {
        rentalUnitAssignmentId: validUuid1,
        condition: "DAMAGED",
        description: "Be kinh bao ve",
        mediaIds: [],
      },
    ],
  });
  assert.equal(damagedNoMedia.success, false);

  const damagedValid = recordReturnRequestSchema.safeParse({
    actualReturnAt: "2026-10-28T09:00:00Z",
    units: [
      {
        rentalUnitAssignmentId: validUuid1,
        condition: "DAMAGED",
        description: "Be kinh bao ve",
        mediaIds: [mediaUuid],
      },
    ],
  });
  assert.equal(damagedValid.success, true);
});

test("reportReturnIssueSchema validates issue reason length", () => {
  const emptyReason = reportReturnIssueSchema.safeParse({
    reason: "",
  });
  assert.equal(emptyReason.success, false);

  const valid = reportReturnIssueSchema.safeParse({
    reason: "NCC chua xac nhan du da qua 24h",
    assignmentIds: [validUuid1],
  });
  assert.equal(valid.success, true);
});

test("adminResolveReturnRequestSchema enforces unit matching when decision is ConfirmReceived", () => {
  const rejectValid = adminResolveReturnRequestSchema.safeParse({
    decision: "RejectRequest",
    decisionNote: "Chua co bien ban giao nhan tai kho",
    assignmentIds: [validUuid1],
  });
  assert.equal(rejectValid.success, true);

  const confirmNoUnits = adminResolveReturnRequestSchema.safeParse({
    decision: "ConfirmReceived",
    decisionNote: "Doi chieu kho dung thiet bi",
    assignmentIds: [validUuid1],
    actualReturnAt: "2026-10-28T10:00:00Z",
  });
  assert.equal(confirmNoUnits.success, false);

  const confirmValid = adminResolveReturnRequestSchema.safeParse({
    decision: "ConfirmReceived",
    decisionNote: "Doi chieu kho dung thiet bi",
    assignmentIds: [validUuid1],
    actualReturnAt: "2026-10-28T10:00:00Z",
    units: [
      {
        rentalUnitAssignmentId: validUuid1,
        condition: "NORMAL",
      },
    ],
  });
  assert.equal(confirmValid.success, true);
});

test("submitDeductionSchema validates positive amount", () => {
  const zeroAmount = submitDeductionSchema.safeParse({
    deductionAmount: 0,
  });
  assert.equal(zeroAmount.success, false);

  const valid = submitDeductionSchema.safeParse({
    deductionAmount: 1500000,
    damageDescription: "Hu hai guong va lop xe",
    evidenceMediaIds: [mediaUuid],
  });
  assert.equal(valid.success, true);
});

test("respondDeductionSchema requires disputeReason only when decision is DISPUTE", () => {
  const acceptValid = respondDeductionSchema.safeParse({
    decision: "ACCEPT",
  });
  assert.equal(acceptValid.success, true);

  const disputeNoReason = respondDeductionSchema.safeParse({
    decision: "DISPUTE",
  });
  assert.equal(disputeNoReason.success, false);

  const disputeValid = respondDeductionSchema.safeParse({
    decision: "DISPUTE",
    disputeReason: "May da bi nut tu truoc khi ban giao",
    evidenceMediaIds: [mediaUuid],
  });
  assert.equal(disputeValid.success, true);
});

test("resolveDisputeSchema validates non-negative amount and decision note", () => {
  const negative = resolveDisputeSchema.safeParse({
    finalDeductionAmount: -100,
    decisionNote: "Giai quyet",
  });
  assert.equal(negative.success, false);

  const valid = resolveDisputeSchema.safeParse({
    finalDeductionAmount: 500000,
    decisionNote: "Giam 50% phi sua chua do loi ca hai ben",
  });
  assert.equal(valid.success, true);
});
