import test from "node:test";
import assert from "node:assert/strict";

const { renterBankAccountSchema } = await import(
  "../src/lib/validations/renter-bank-account.ts"
);
const { API_ENDPOINTS } = await import("../src/config/api-endpoints.ts");

test("renterBankAccountSchema validates valid bank account data", () => {
  const result = renterBankAccountSchema.safeParse({
    bankCode: "VCB",
    accountNumber: "1234567890",
    accountHolderName: "NGUYEN VAN A",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.bankCode, "VCB");
    assert.equal(result.data.accountNumber, "1234567890");
    assert.equal(result.data.accountHolderName, "NGUYEN VAN A");
  }
});

test("renterBankAccountSchema trims whitespace", () => {
  const result = renterBankAccountSchema.safeParse({
    bankCode: "  MB  ",
    accountNumber: "  0987654321  ",
    accountHolderName: "  TRAN THI B  ",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.bankCode, "MB");
    assert.equal(result.data.accountNumber, "0987654321");
    assert.equal(result.data.accountHolderName, "TRAN THI B");
  }
});

test("renterBankAccountSchema rejects empty or too long bankCode", () => {
  const empty = renterBankAccountSchema.safeParse({
    bankCode: "   ",
    accountNumber: "1234567890",
    accountHolderName: "NGUYEN VAN A",
  });
  assert.equal(empty.success, false);

  const tooLong = renterBankAccountSchema.safeParse({
    bankCode: "A".repeat(51),
    accountNumber: "1234567890",
    accountHolderName: "NGUYEN VAN A",
  });
  assert.equal(tooLong.success, false);
});

test("renterBankAccountSchema validates accountNumber length and digits", () => {
  // Too short (< 6 digits)
  assert.equal(
    renterBankAccountSchema.safeParse({
      bankCode: "VCB",
      accountNumber: "12345",
      accountHolderName: "NGUYEN VAN A",
    }).success,
    false,
  );

  // Too long (> 20 digits)
  assert.equal(
    renterBankAccountSchema.safeParse({
      bankCode: "VCB",
      accountNumber: "123456789012345678901",
      accountHolderName: "NGUYEN VAN A",
    }).success,
    false,
  );

  // Contains non-digit characters
  assert.equal(
    renterBankAccountSchema.safeParse({
      bankCode: "VCB",
      accountNumber: "12345abc89",
      accountHolderName: "NGUYEN VAN A",
    }).success,
    false,
  );

  // Valid 6 digits
  assert.equal(
    renterBankAccountSchema.safeParse({
      bankCode: "VCB",
      accountNumber: "123456",
      accountHolderName: "NGUYEN VAN A",
    }).success,
    true,
  );

  // Valid 20 digits
  assert.equal(
    renterBankAccountSchema.safeParse({
      bankCode: "VCB",
      accountNumber: "12345678901234567890",
      accountHolderName: "NGUYEN VAN A",
    }).success,
    true,
  );
});

test("renterBankAccountSchema rejects invalid accountHolderName", () => {
  // Too short (< 2 chars)
  assert.equal(
    renterBankAccountSchema.safeParse({
      bankCode: "VCB",
      accountNumber: "1234567890",
      accountHolderName: "A",
    }).success,
    false,
  );

  // Too long (> 100 chars)
  assert.equal(
    renterBankAccountSchema.safeParse({
      bankCode: "VCB",
      accountNumber: "1234567890",
      accountHolderName: "A".repeat(101),
    }).success,
    false,
  );
});

test("API_ENDPOINTS bank accounts matches Swagger RentalService contract", () => {
  const rental = API_ENDPOINTS.backend.rental;
  assert.equal(rental.bankAccounts, "/api/v1/rental/me/bank-accounts");
  assert.equal(
    rental.bankAccount("acc-123"),
    "/api/v1/rental/me/bank-accounts/acc-123",
  );
  assert.equal(
    rental.defaultBankAccount("acc-123"),
    "/api/v1/rental/me/bank-accounts/acc-123/default",
  );
});
