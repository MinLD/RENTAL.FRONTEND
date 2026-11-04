"use server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import type { ApiResult } from "@/services/api-error";
import type { AdminOrganizationDetail } from "@/types/admin-organizations";
import type { AdminOrderDetail, AdminOrdersPage } from "@/types/admin-orders";
import type { AdminUserRow } from "@/types/admin-users";
import { unwrapApiValue, type ApiValueResult } from "@/utils/api-result";

export type ResolvedSupplierInfo = {
  id: string;
  name: string;
  logoUrl?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
};

export type ResolvedRenterInfo = {
  id: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
};

export type ResolvedDeviceInfo = {
  name: string;
  thumbnailUrl?: string | null;
  rentalDays?: number;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  dailyRate?: number;
};

export type ResolvedOrderInfo = {
  orderId: string;
  orderCode?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  address?: string | null;
  device?: ResolvedDeviceInfo | null;
};

export type ResolvedPayoutEntities = {
  supplier?: ResolvedSupplierInfo | null;
  order?: ResolvedOrderInfo | null;
  completedByUser?: { name: string; email?: string | null } | null;
};

export type ResolvedRefundEntities = {
  renter?: ResolvedRenterInfo | null;
  order?: ResolvedOrderInfo | null;
  completedByUser?: { name: string; email?: string | null } | null;
};

export async function getPayoutEntitiesDetailsAction(params: {
  supplierId?: string | null;
  rentalOrderId?: string | null;
  rentalItemId?: string | null;
  completedBy?: string | null;
}): Promise<ApiResult<ResolvedPayoutEntities>> {
  return serverApiResult(async () => {
    const result: ResolvedPayoutEntities = {};

    // 1. Fetch Nhà cung cấp (Hỗ trợ cả Organization ID lẫn User ID)
    const supplierPromise = (async () => {
      if (!params.supplierId) return null;

      // Thử 1: Tra cứu theo ID tổ chức (Organization)
      try {
        const response = await serverApiJson<
          AdminOrganizationDetail | ApiValueResult<AdminOrganizationDetail>
        >(
          API_ENDPOINTS.backend.adminOrganizations.detail(params.supplierId),
          "Không thể tải thông tin nhà cung cấp.",
          { cache: "no-store" },
        );
        const data = unwrapApiValue(response);
        if (data && (data.name || data.contactPhone || data.contactEmail)) {
          return {
            id: data.id || params.supplierId,
            name: data.name || "Nhà cung cấp",
            logoUrl: data.logoUrl,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
            address: data.address
              ? [data.address, data.ward, data.province].filter(Boolean).join(", ")
              : null,
          };
        }
      } catch {
        // Tiếp tục thử tra cứu theo User ID
      }

      // Thử 2: Tra cứu theo User ID (Chủ shop / Supplier account)
      try {
        const userRes = await serverApiJson<
          AdminUserRow | ApiValueResult<AdminUserRow>
        >(
          API_ENDPOINTS.backend.adminUsers.detail(params.supplierId),
          "Không thể tải thông tin người dùng nhà cung cấp.",
          { cache: "no-store" },
        );
        const userData = unwrapApiValue(userRes);
        if (userData && (userData.name || userData.email || userData.phone)) {
          const rawUser = userData as AdminUserRow & { phoneNumber?: string | null };
          return {
            id: userData.id || params.supplierId,
            name: userData.name || "Nhà cung cấp",
            logoUrl: userData.avatarUrl,
            contactPhone: rawUser.phoneNumber || userData.phone || null,
            contactEmail: userData.email || null,
            address: null,
          };
        }
      } catch {
        // Tiếp tục thử supplierContact
      }

      // Thử 3: Tra cứu qua supplier-contact
      try {
        const contactRes = await serverApiJson<{ name?: string; contactPhone?: string }>(
          API_ENDPOINTS.backend.organizations.supplierContact(params.supplierId),
          "Không thể tải liên hệ nhà cung cấp.",
          { cache: "no-store" },
        );
        if (contactRes && (contactRes.name || contactRes.contactPhone)) {
          return {
            id: params.supplierId,
            name: contactRes.name || "Nhà cung cấp",
            contactPhone: contactRes.contactPhone || null,
          };
        }
      } catch {
        // Bỏ qua
      }

      return {
        id: params.supplierId,
        name: "Nhà cung cấp",
      };
    })();

    // 2. Fetch Đơn thuê & Thiết bị (Order & Item)
    const orderPromise = (async () => {
      if (!params.rentalOrderId) return null;
      try {
        const response = await serverApiJson<AdminOrderDetail>(
          API_ENDPOINTS.backend.rental.adminOrder(params.rentalOrderId),
          "Không thể tải thông tin đơn thuê.",
          { cache: "no-store" },
        );
        if (!response) return null;

        // Tìm thiết bị trong subOrders
        let matchedItem = null;
        if (params.rentalItemId && response.subOrders) {
          for (const sub of response.subOrders) {
            const found = sub.items?.find(
              (it) => it.rentalItemId === params.rentalItemId,
            );
            if (found) {
              matchedItem = found;
              break;
            }
          }
        }
        if (!matchedItem && response.subOrders?.[0]?.items?.[0]) {
          matchedItem = response.subOrders[0].items[0];
        }

        let device: ResolvedDeviceInfo | null = null;
        if (matchedItem) {
          device = {
            name: matchedItem.name || "Thiết bị thuê",
            rentalDays: matchedItem.rentalDays,
            quantity: matchedItem.quantity,
            startDate: matchedItem.startDate,
            endDate: matchedItem.endDate,
            dailyRate: matchedItem.dailyRate,
          };

          // Lấy thêm ảnh thiết bị nếu có equipmentListingId
          if (matchedItem.equipmentListingId) {
            try {
              const listing = await serverApiJson<{ thumbnailUrl?: string }>(
                API_ENDPOINTS.backend.inventory.equipmentListings.publicDetail(
                  matchedItem.equipmentListingId,
                ),
                "Không thể tải ảnh thiết bị.",
                { cache: "no-store" },
              );
              if (listing?.thumbnailUrl) {
                device.thumbnailUrl = listing.thumbnailUrl;
              }
            } catch {
              // Bỏ qua lỗi ảnh
            }
          }
        }

        return {
          orderId: response.orderId,
          orderCode: response.orderCode,
          recipientName: response.delivery?.recipientName,
          recipientPhone: response.delivery?.recipientPhone,
          address: response.delivery?.address,
          device,
        };
      } catch {
        return null;
      }
    })();

    // 3. Fetch Admin hoàn tất (Completed By)
    const completedByPromise = (async () => {
      if (!params.completedBy) return null;
      try {
        const response = await serverApiJson<
          AdminUserRow | ApiValueResult<AdminUserRow>
        >(
          API_ENDPOINTS.backend.adminUsers.detail(params.completedBy),
          "Không thể tải thông tin người duyệt.",
          { cache: "no-store" },
        );
        const data = unwrapApiValue(response);
        if (!data) return null;
        return {
          name: data.name || "Quản trị viên",
          email: data.email,
        };
      } catch {
        return null;
      }
    })();

    const [supplierRes, orderRes, completedByRes] = await Promise.allSettled([
      supplierPromise,
      orderPromise,
      completedByPromise,
    ]);

    result.supplier = supplierRes.status === "fulfilled" ? supplierRes.value : null;
    result.order = orderRes.status === "fulfilled" ? orderRes.value : null;
    result.completedByUser =
      completedByRes.status === "fulfilled" ? completedByRes.value : null;

    return result;
  });
}

export async function getRefundEntitiesDetailsAction(params: {
  renterId?: string | null;
  rentalItemId?: string | null;
  completedBy?: string | null;
}): Promise<ApiResult<ResolvedRefundEntities>> {
  return serverApiResult(async () => {
    const result: ResolvedRefundEntities = {};

    // 1. Fetch Khách thuê (Renter User)
    const renterPromise = (async () => {
      if (!params.renterId) return null;
      try {
        const response = await serverApiJson<
          AdminUserRow | ApiValueResult<AdminUserRow>
        >(
          API_ENDPOINTS.backend.adminUsers.detail(params.renterId),
          "Không thể tải thông tin khách thuê.",
          { cache: "no-store" },
        );
        const data = unwrapApiValue(response);
        if (!data) return null;
        const rawUser = data as AdminUserRow & { phoneNumber?: string | null };
        return {
          id: data.id || params.renterId,
          name: data.name || "Khách thuê",
          email: data.email,
          phoneNumber: rawUser.phoneNumber || data.phone || null,
          avatarUrl: data.avatarUrl,
        };
      } catch {
        return null;
      }
    })();

    // 2. Fetch Đơn thuê & Thiết bị qua rentalItemId
    const orderPromise = (async () => {
      if (!params.rentalItemId) return null;
      try {
        // Tìm order chứa rentalItemId
        const listRes = await serverApiJson<AdminOrdersPage>(
          API_ENDPOINTS.backend.rental.adminOrders({
            rentalItemId: params.rentalItemId,
            pageSize: 1,
          }),
          "Không thể tìm đơn thuê cho thiết bị.",
          { cache: "no-store" },
        );
        const firstOrder = listRes.items?.[0];
        if (!firstOrder) return null;

        const orderDetail = await serverApiJson<AdminOrderDetail>(
          API_ENDPOINTS.backend.rental.adminOrder(firstOrder.orderId),
          "Không thể tải chi tiết đơn thuê.",
          { cache: "no-store" },
        );
        if (!orderDetail) return null;

        let matchedItem = null;
        if (orderDetail.subOrders) {
          for (const sub of orderDetail.subOrders) {
            const found = sub.items?.find(
              (it) => it.rentalItemId === params.rentalItemId,
            );
            if (found) {
              matchedItem = found;
              break;
            }
          }
        }
        if (!matchedItem && orderDetail.subOrders?.[0]?.items?.[0]) {
          matchedItem = orderDetail.subOrders[0].items[0];
        }

        let device: ResolvedDeviceInfo | null = null;
        if (matchedItem) {
          device = {
            name: matchedItem.name || "Thiết bị thuê",
            rentalDays: matchedItem.rentalDays,
            quantity: matchedItem.quantity,
            startDate: matchedItem.startDate,
            endDate: matchedItem.endDate,
            dailyRate: matchedItem.dailyRate,
          };

          if (matchedItem.equipmentListingId) {
            try {
              const listing = await serverApiJson<{ thumbnailUrl?: string }>(
                API_ENDPOINTS.backend.inventory.equipmentListings.publicDetail(
                  matchedItem.equipmentListingId,
                ),
                "Không thể tải ảnh thiết bị.",
                { cache: "no-store" },
              );
              if (listing?.thumbnailUrl) {
                device.thumbnailUrl = listing.thumbnailUrl;
              }
            } catch {
              // Bỏ qua lỗi ảnh
            }
          }
        }

        return {
          orderId: orderDetail.orderId,
          orderCode: orderDetail.orderCode,
          recipientName: orderDetail.delivery?.recipientName,
          recipientPhone: orderDetail.delivery?.recipientPhone,
          address: orderDetail.delivery?.address,
          device,
        };
      } catch {
        return null;
      }
    })();

    // 3. Fetch Admin hoàn tất (Completed By)
    const completedByPromise = (async () => {
      if (!params.completedBy) return null;
      try {
        const response = await serverApiJson<
          AdminUserRow | ApiValueResult<AdminUserRow>
        >(
          API_ENDPOINTS.backend.adminUsers.detail(params.completedBy),
          "Không thể tải thông tin người duyệt.",
          { cache: "no-store" },
        );
        const data = unwrapApiValue(response);
        if (!data) return null;
        return {
          name: data.name || "Quản trị viên",
          email: data.email,
        };
      } catch {
        return null;
      }
    })();

    const [renterRes, orderRes, completedByRes] = await Promise.allSettled([
      renterPromise,
      orderPromise,
      completedByPromise,
    ]);

    result.renter = renterRes.status === "fulfilled" ? renterRes.value : null;
    result.order = orderRes.status === "fulfilled" ? orderRes.value : null;
    result.completedByUser =
      completedByRes.status === "fulfilled" ? completedByRes.value : null;

    return result;
  });
}
