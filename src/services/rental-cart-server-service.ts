import "server-only";

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { handleMockRental } from "@/app/api/mock/rental/mock-handler";
import { serverApiJson } from "@/services/server-api";
import type { CartItem, RentalCartResponse } from "@/types/cart";
import type { PublicEquipmentListingDetail } from "@/types/inventory";
import { getEquipmentListingName } from "@/utils/inventory";
import { getProductThumbnailSrc } from "@/utils/product-image";

async function getCartResponse(): Promise<RentalCartResponse> {
  if (process.env.NEXT_PUBLIC_MOCK_RENTAL_API === "true") {
    const cookieHeader = (await cookies()).toString();
    const request = new NextRequest("http://localhost/api/mock/rental/cart", {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });
    const response = await handleMockRental(request, "/api/v1/rental/cart");
    if (!response.ok) throw new Error("Không thể tải giỏ hàng.");
    return (await response.json()) as RentalCartResponse;
  }

  return serverApiJson<RentalCartResponse>(
    API_ENDPOINTS.backend.rental.cart,
    "Không thể tải giỏ hàng.",
  );
}

export async function getRentalCartForServer(): Promise<CartItem[] | null> {
  try {
    const cart = await getCartResponse();
    const details = new Map<string, Promise<PublicEquipmentListingDetail | null>>();

    return await Promise.all(
      (cart?.items ?? []).map(async (line) => {
        let detail = details.get(line.equipmentListingId);
        if (!detail) {
          detail = serverApiJson<PublicEquipmentListingDetail>(
            API_ENDPOINTS.backend.inventory.equipmentListings.publicDetail(
              line.equipmentListingId,
            ),
            "Không thể tải thông tin thiết bị.",
          ).catch(() => null);
          details.set(line.equipmentListingId, detail);
        }
        const product = await detail;
        return {
          ...line,
          name: product ? getEquipmentListingName(product) : "Thiết bị không còn hiển thị",
          thumbnailUrl: product ? getProductThumbnailSrc(product) : null,
          currency: product?.rentalRate?.currency || "VND",
        };
      }),
    );
  } catch {
    // Let the client provider retry if the server-side request is unavailable.
    return null;
  }
}
