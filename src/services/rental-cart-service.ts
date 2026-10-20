import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient, authApiClientJson } from "@/services/api-client";
import type { AddCartItem, CartItem, RentalCartResponse } from "@/types/cart";
import type { PublicEquipmentListingDetail } from "@/types/inventory";
import { getEquipmentListingName } from "@/utils/inventory";
import { getProductThumbnailSrc } from "@/utils/product-image";

const endpoints = API_ENDPOINTS.backend.rental;

export async function getRentalCart(): Promise<CartItem[]> {
  const cart = await authApiClientJson<RentalCartResponse>(endpoints.cart, { cache: "no-store" });
  const products = new Map<string, Promise<PublicEquipmentListingDetail | null>>();
  return Promise.all((cart?.items ?? []).map(async (line) => {
    let product = products.get(line.equipmentListingId);
    if (!product) {
      product = authApiClientJson<PublicEquipmentListingDetail>(
        API_ENDPOINTS.backend.inventory.equipmentListings.publicDetail(line.equipmentListingId),
      ).catch(() => null);
      products.set(line.equipmentListingId, product);
    }
    const detail = await product;
    return {
      ...line,
      name: detail ? getEquipmentListingName(detail) : "Thiết bị không còn hiển thị",
      thumbnailUrl: detail ? getProductThumbnailSrc(detail) : null,
      currency: detail?.rentalRate?.currency || "VND",
    };
  }));
}

export function addRentalCartItem(item: AddCartItem, idempotencyKey?: string) {
  return authApiClientJson<{ cartItemId: string }>(endpoints.items, {
    method: "POST",
    json: item,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
}

export function updateRentalCartQuantity(id: string, quantity: number) {
  return authApiClient(endpoints.item(id), { method: "PATCH", json: { quantity } });
}

export function updateRentalCartDates(id: string, start: string, end: string) {
  return authApiClient(endpoints.item(id), { method: "PATCH", json: {
    expectedStartDate: start, expectedEndDate: end,
  } });
}

export function removeRentalCartItem(id: string) {
  return authApiClient(endpoints.item(id), { method: "DELETE" });
}

export function clearRentalCart() {
  return authApiClient(endpoints.cart, { method: "DELETE" });
}
