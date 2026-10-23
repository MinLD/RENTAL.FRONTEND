import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient, authApiClientJson } from "@/services/api-client";
import type {
  CheckoutAccepted,
  CheckoutOperation,
  CheckoutOrder,
  CheckoutRequest,
  Invoice,
  InvoiceStatus,
} from "@/types/checkout";

export async function submitBuyNowCheckout(request: CheckoutRequest, idempotencyKey: string) {
  const response = await authApiClient(
    API_ENDPOINTS.backend.rental.checkout,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      json: request,
    },
  );
  const result = await response.json() as CheckoutAccepted | CheckoutOrder;

  if (result && "operationId" in result && result.operationId) {
    return { kind: "operation" as const, id: result.operationId };
  }
  if (result && "orderId" in result && result.orderId) {
    return { kind: "order" as const, id: result.orderId };
  }
  throw new Error("Checkout không trả về mã đơn hoặc mã xử lý.");
}

export function getCheckoutOperation(id: string) {
  return authApiClientJson<CheckoutOperation>(API_ENDPOINTS.backend.rental.checkoutOperation(id), { cache: "no-store" });
}

export function getInvoice(invoiceRef: string) {
  return authApiClientJson<Invoice>(API_ENDPOINTS.backend.payment.invoice(invoiceRef), { cache: "no-store" });
}

export function getInvoiceStatus(invoiceRef: string) {
  return authApiClientJson<InvoiceStatus>(API_ENDPOINTS.backend.payment.invoiceStatus(invoiceRef), { cache: "no-store" });
}
