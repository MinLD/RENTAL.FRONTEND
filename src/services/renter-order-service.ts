import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient, authApiClientJson } from "@/services/api-client";
import type {
  CancelRenterOrderResponse,
  RenterOrderPayment,
  RenterOrdersPage,
} from "@/types/checkout";

export function getRenterOrderPayment(id: string) {
  return authApiClientJson<RenterOrderPayment>(API_ENDPOINTS.backend.rental.order(id), { cache: "no-store" });
}

export async function getRenterOrders(status?: string) {
  const query = new URLSearchParams({ page: "1", pageSize: "100" });
  if (status) query.set("status", status);
  const response = await authApiClient(`${API_ENDPOINTS.backend.rental.orders}?${query}`, { cache: "no-store" });
  return response.json() as Promise<RenterOrdersPage>;
}

export function cancelRenterOrder(orderId: string, reason: string, idempotencyKey: string) {
  return authApiClientJson<CancelRenterOrderResponse>(API_ENDPOINTS.backend.rental.cancelOrder(orderId), {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    json: { reason: reason.trim() || null },
  });
}
