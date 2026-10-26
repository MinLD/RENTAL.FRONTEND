import test from "node:test";
import assert from "node:assert/strict";

const { buyNowCheckoutSchema } = await import(
  "../src/lib/validations/checkout.ts"
);

test("buyNowCheckoutSchema validates valid checkout inputs with bankAccountId", () => {
  const result = buyNowCheckoutSchema.safeParse({
    addressId: "addr-123",
    deliveryNote: "Gọi trước khi giao hàng",
    bankAccountId: "bank-acc-456",
    termsAccepted: true,
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.addressId, "addr-123");
    assert.equal(result.data.bankAccountId, "bank-acc-456");
    assert.equal(result.data.termsAccepted, true);
  }
});

test("buyNowCheckoutSchema rejects missing or empty bankAccountId", () => {
  const empty = buyNowCheckoutSchema.safeParse({
    addressId: "addr-123",
    deliveryNote: "",
    bankAccountId: "",
    termsAccepted: true,
  });
  assert.equal(empty.success, false);

  const missing = buyNowCheckoutSchema.safeParse({
    addressId: "addr-123",
    deliveryNote: "",
    termsAccepted: true,
  });
  assert.equal(missing.success, false);
});

test("buyNowCheckoutSchema rejects missing addressId or unaccepted terms", () => {
  const missingAddress = buyNowCheckoutSchema.safeParse({
    addressId: "",
    deliveryNote: "",
    bankAccountId: "bank-acc-456",
    termsAccepted: true,
  });
  assert.equal(missingAddress.success, false);

  const termsNotAccepted = buyNowCheckoutSchema.safeParse({
    addressId: "addr-123",
    deliveryNote: "",
    bankAccountId: "bank-acc-456",
    termsAccepted: false,
  });
  assert.equal(termsNotAccepted.success, false);
});
