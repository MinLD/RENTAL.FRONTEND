import type { PublicEquipmentListingListParams } from "@/types/inventory";

type ListAdminUsersParams = {
  keyword?: string;
  page: number;
  pageSize: number;
};

type InventoryPaginationParams = {
  page: number;
  pageSize: number;
};

type ListOwnEquipmentListingsParams = InventoryPaginationParams & {
  q?: string;
  equipmentTypeId?: string;
  brandId?: string;
  status?: 1 | 2 | 3;
};

type ListAdminOrganizationsParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: 0 | 1 | 2 | 3;
};

type ListCatalogEquipmentTypesParams = {
  categoryId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
};

type ListAdminCatalogEquipmentTypesParams = ListCatalogEquipmentTypesParams & {
  status?: 0 | 1 | 2 | Array<0 | 1 | 2>;
};

const EQUIPMENT_TYPE_STATUS_NAMES = ["Draft", "Published", "Disabled"] as const;

type ListCatalogBrandsParams = {
  keyword?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
};

type ListAdminCatalogBrandsParams = ListCatalogBrandsParams & {
  isActive?: boolean;
};

type ListAdminCatalogCategoriesParams = {
  isActive?: boolean;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
};

type ListAdminOrganizationHistoryParams = {
  page: number;
  pageSize: number;
  search?: string;
};

function buildQueryEndpoint(
  pathname: string,
  params: Record<string, string | number | Array<string | number> | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== "") searchParams.append(key, String(item));
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

const rentalApiBase = process.env.NEXT_PUBLIC_MOCK_RENTAL_API === "true"
  ? "/api/mock/rental"
  : "/api/v1/rental";


export const API_ENDPOINTS = {
  backend: {
    rental: {
      addresses: "/api/v1/rental/me/addresses",
      address: (id: string) =>
        `/api/v1/rental/me/addresses/${encodeURIComponent(id)}`,
      defaultAddress: (id: string) =>
        `/api/v1/rental/me/addresses/${encodeURIComponent(id)}/default`,
      bankAccounts: "/api/v1/rental/me/bank-accounts",
      bankAccount: (id: string) =>
        `/api/v1/rental/me/bank-accounts/${encodeURIComponent(id)}`,
      defaultBankAccount: (id: string) =>
        `/api/v1/rental/me/bank-accounts/${encodeURIComponent(id)}/default`,
      cart: `${rentalApiBase}/cart`,
      items: `${rentalApiBase}/cart/items`,
      item: (id: string) =>
        `${rentalApiBase}/cart/items/${encodeURIComponent(id)}`,
      checkout: "/api/v1/rental/checkout",
      checkoutOperation: (id: string) =>
        `/api/v1/rental/checkout/operations/${encodeURIComponent(id)}`,
      orders: "/api/v1/rental/orders",
      order: (id: string) => `/api/v1/rental/orders/${encodeURIComponent(id)}`,
      cancelOrder: (id: string) => `/api/v1/rental/orders/${encodeURIComponent(id)}/cancel`,
      calendar: `${rentalApiBase}/me/calendar`,
      supplierSubOrders: `${rentalApiBase}/supplier/sub-orders`,
      supplierSubOrder: (id: string) => `${rentalApiBase}/supplier/sub-orders/${encodeURIComponent(id)}`,
      supplierAcceptSubOrder: (id: string) => `${rentalApiBase}/supplier/sub-orders/${encodeURIComponent(id)}/accept`,
      supplierRejectSubOrder: (id: string) => `${rentalApiBase}/supplier/sub-orders/${encodeURIComponent(id)}/reject`,
      adminOrders: (params?: {
        orderCode?: string;
        subOrderCode?: string;
        rentalItemId?: string;
        listingId?: string;
        assetId?: string;
        supplierId?: string;
        renterId?: string;
        status?: string;
        itemStatus?: string;
        createdFrom?: string;
        createdTo?: string;
        page?: number;
        pageSize?: number;
      }) =>
        buildQueryEndpoint(`${rentalApiBase}/admin/orders`, {
          OrderCode: params?.orderCode,
          SubOrderCode: params?.subOrderCode,
          RentalItemId: params?.rentalItemId,
          ListingId: params?.listingId,
          AssetId: params?.assetId,
          SupplierId: params?.supplierId,
          RenterId: params?.renterId,
          Status: params?.status,
          ItemStatus: params?.itemStatus,
          CreatedFrom: params?.createdFrom,
          CreatedTo: params?.createdTo,
          Page: params?.page,
          PageSize: params?.pageSize,
        }),
      adminOrder: (id: string) => `${rentalApiBase}/admin/orders/${encodeURIComponent(id)}`,
      adminDisputes: `${rentalApiBase}/admin/disputes`,
      itemHandover: (id: string) => `${rentalApiBase}/items/${encodeURIComponent(id)}/handover`,
      itemAcknowledgeReceipt: (id: string) => `${rentalApiBase}/items/${encodeURIComponent(id)}/acknowledge-receipt`,
      itemCancelNotDelivered: (id: string) => `${rentalApiBase}/items/${encodeURIComponent(id)}/cancel-not-delivered`,
      itemReturns: (id: string) => `${rentalApiBase}/items/${encodeURIComponent(id)}/returns`,
      itemDeductions: (id: string) => `${rentalApiBase}/items/${encodeURIComponent(id)}/deductions`,
      itemDeductionResponse: (id: string) => `${rentalApiBase}/items/${encodeURIComponent(id)}/deductions/response`,
      itemDeductionDispute: (id: string) => `${rentalApiBase}/items/${encodeURIComponent(id)}/deductions/dispute`,
      itemDeductionResolution: (id: string) => `${rentalApiBase}/items/${encodeURIComponent(id)}/deductions/dispute/resolution`,
      itemReturnRequests: (itemId: string) =>
        `${rentalApiBase}/items/${encodeURIComponent(itemId)}/return-requests`,
      itemReportIssue: (itemId: string, requestId: string) =>
        `${rentalApiBase}/items/${encodeURIComponent(itemId)}/return-requests/${encodeURIComponent(requestId)}/report-issue`,
      itemResolveReturnRequest: (itemId: string, requestId: string) =>
        `${rentalApiBase}/items/${encodeURIComponent(itemId)}/return-requests/${encodeURIComponent(requestId)}/resolve`,
      adminReturnRequests: (params?: {
        page?: number;
        pageSize?: number;
        disputed?: boolean;
        overdue?: boolean;
        itemId?: string;
        orderId?: string;
      }) =>
        buildQueryEndpoint(`${rentalApiBase}/admin/return-requests`, {
          Page: params?.page,
          PageSize: params?.pageSize,
          Disputed: params?.disputed !== undefined ? String(params.disputed) : undefined,
          Overdue: params?.overdue !== undefined ? String(params.overdue) : undefined,
          ItemId: params?.itemId,
          OrderId: params?.orderId,
        }),
      adminReturnRequestDetail: (requestId: string) =>
        `${rentalApiBase}/admin/return-requests/${encodeURIComponent(requestId)}`,
      adminRefunds: (params?: {
        status?: "PENDING" | "COMPLETED";
        page?: number;
        pageSize?: number;
      }) =>
        buildQueryEndpoint(`${rentalApiBase}/admin/refunds`, {
          status: params?.status,
          page: params?.page,
          pageSize: params?.pageSize,
        }),
      adminCompleteRefund: (rentalItemId: string) =>
        `${rentalApiBase}/admin/refunds/${encodeURIComponent(rentalItemId)}/complete`,
    },
    analytics: {
      overview: (params?: { from?: string; to?: string }) =>
        buildQueryEndpoint("/api/v1/analytics/overview", {
          from: params?.from,
          to: params?.to,
        }),
      revenue: (params?: { from?: string; to?: string; granularity?: string }) =>
        buildQueryEndpoint("/api/v1/analytics/revenue", {
          from: params?.from,
          to: params?.to,
          granularity: params?.granularity,
        }),
      orders: (params: { from: string; to: string }) =>
        buildQueryEndpoint("/api/v1/analytics/orders", {
          from: params.from,
          to: params.to,
        }),
      equipment: (params: { from: string; to: string; limit?: number }) =>
        buildQueryEndpoint("/api/v1/analytics/equipment", {
          from: params.from,
          to: params.to,
          limit: params.limit,
        }),
      suppliers: (params: { from: string; to: string; page?: number; pageSize?: number }) =>
        buildQueryEndpoint("/api/v1/analytics/suppliers", {
          from: params.from,
          to: params.to,
          page: params.page,
          pageSize: params.pageSize,
        }),
      meOverview: (params?: { from?: string; to?: string }) =>
        buildQueryEndpoint("/api/v1/analytics/me/overview", {
          from: params?.from,
          to: params?.to,
        }),
      meRevenue: (params?: { from?: string; to?: string; granularity?: string }) =>
        buildQueryEndpoint("/api/v1/analytics/me/revenue", {
          from: params?.from,
          to: params?.to,
          granularity: params?.granularity,
        }),
    },
    payment: {
      invoice: (invoiceRef: string) =>
        `/api/v1/payment/invoices/${encodeURIComponent(invoiceRef)}`,
      invoiceStatus: (invoiceRef: string) =>
        `/api/v1/payment/invoices/${encodeURIComponent(invoiceRef)}/status`,
      settlement: (id: string) =>
        `/api/v1/payment/settlements/${encodeURIComponent(id)}`,
    },
    manualRefunds: {
      list: (params?: {
        status?: number | string;
        cursor?: string;
        limit?: number;
      }) =>
        buildQueryEndpoint("/api/v1/payment/manual-refunds", {
          status: params?.status,
          cursor: params?.cursor,
          limit: params?.limit,
        }),
      adminList: (params?: {
        page?: number;
        pageSize?: number;
        status?: string;
        from?: string;
        to?: string;
      }) =>
        buildQueryEndpoint("/api/v1/payment/admin/manual-refunds", {
          Page: params?.page,
          PageSize: params?.pageSize,
          Status: params?.status,
          From: params?.from,
          To: params?.to,
        }),
      complete: (requirementId: string) =>
        `/api/v1/payment/manual-refunds/${encodeURIComponent(requirementId)}/complete`,
    },
    adminPayouts: {
      list: (params?: {
        supplierId?: string;
        page?: number;
        pageSize?: number;
        status?: string;
        from?: string;
        to?: string;
      }) =>
        buildQueryEndpoint("/api/v1/payment/admin/payouts", {
          supplierId: params?.supplierId,
          Page: params?.page,
          PageSize: params?.pageSize,
          Status: params?.status,
          From: params?.from,
          To: params?.to,
        }),
      complete: (payoutId: string) =>
        `/api/v1/payment/admin/payouts/${encodeURIComponent(payoutId)}/complete`,
    },
    organizations: {
      register: "/api/v1/auth/organizations/register",
      mine: "/api/v1/auth/organizations/mine",
      detail: (id: string) =>
        `/api/v1/auth/organizations/${encodeURIComponent(id)}`,
      profile: (id: string) =>
        `/api/v1/auth/organizations/${encodeURIComponent(id)}/profile`,
      supplierContact: (organizationId: string) =>
        `/api/v1/auth/organizations/${encodeURIComponent(organizationId)}/supplier-contact`,
    },
    adminOrganizations: {
      approve: (id: string) =>
        `/api/v1/auth/admin/organizations/${encodeURIComponent(id)}/approve`,
      activate: (id: string) =>
        `/api/v1/auth/admin/organizations/${encodeURIComponent(id)}/activate`,
      detail: (id: string) =>
        `/api/v1/auth/admin/organizations/${encodeURIComponent(id)}`,
      history: (
        id: string,
        { page, pageSize, search }: ListAdminOrganizationHistoryParams,
      ) =>
        buildQueryEndpoint(
          `/api/v1/auth/admin/organizations/${encodeURIComponent(id)}/history`,
          {
            Page: page,
            PageSize: pageSize,
            Search: search?.trim(),
          },
        ),
      list: ({
        page,
        pageSize,
        search,
        status,
      }: ListAdminOrganizationsParams) =>
        buildQueryEndpoint("/api/v1/auth/admin/organizations", {
          Page: page,
          PageSize: pageSize,
          Search: search?.trim(),
          status,
        }),
      reject: (id: string) =>
        `/api/v1/auth/admin/organizations/${encodeURIComponent(id)}/reject`,
      suspend: (id: string) =>
        `/api/v1/auth/admin/organizations/${encodeURIComponent(id)}/suspend`,
    },
    adminUsers: {
      activate: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}/activate`,
      create: "/api/v1/auth/admin/users",
      detail: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}`,
      list: ({ keyword, page, pageSize }: ListAdminUsersParams) =>
        buildQueryEndpoint("/api/v1/auth/admin/users", {
          Page: page,
          PageSize: pageSize,
          Search: keyword?.trim(),
        }),
      roles: "/api/v1/auth/admin/users/roles",
      suspend: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}/suspend`,
      update: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}`,
    },
    auth: {
      firebaseLogin: "/api/v1/auth/firebase/login",
      login: "/api/v1/auth/login",
      logout: "/api/v1/auth/logout",
      refresh: "/api/v1/auth/refresh",
      register: "/api/v1/auth/register",
    },
    catalog: {
      brands: {
        adminDetail: (brandId: string) =>
          `/api/v1/catalog/admin/brands/${encodeURIComponent(brandId)}`,
        adminList: ({
          isActive,
          keyword,
          page,
          pageSize,
          sort,
        }: ListAdminCatalogBrandsParams = {}) =>
          buildQueryEndpoint("/api/v1/catalog/admin/brands", {
            IsActive: isActive === undefined ? undefined : String(isActive),
            Keyword: keyword?.trim(),
            Page: page,
            PageSize: pageSize,
            Sort: sort?.trim(),
          }),
        create: "/api/v1/catalog/brands",
        detail: (brandId: string) =>
          `/api/v1/catalog/brands/${encodeURIComponent(brandId)}`,
        disable: (brandId: string) =>
          `/api/v1/catalog/brands/${encodeURIComponent(brandId)}/disable`,
        enable: (brandId: string) =>
          `/api/v1/catalog/brands/${encodeURIComponent(brandId)}/enable`,
        list: ({
          keyword,
          page,
          pageSize,
          sort,
        }: ListCatalogBrandsParams = {}) =>
          buildQueryEndpoint("/api/v1/catalog/brands", {
            Keyword: keyword?.trim(),
            Page: page,
            PageSize: pageSize,
            Sort: sort?.trim(),
          }),
        update: (brandId: string) =>
          `/api/v1/catalog/brands/${encodeURIComponent(brandId)}`,
      },
      categories: {
        adminDetail: (id: string) =>
          `/api/v1/catalog/admin/categories/${encodeURIComponent(id)}`,
        adminList: ({
          isActive,
          keyword,
          page,
          pageSize,
          sort,
        }: ListAdminCatalogCategoriesParams = {}) =>
          buildQueryEndpoint("/api/v1/catalog/admin/categories", {
            IsActive:
              typeof isActive === "boolean" ? String(isActive) : undefined,
            Keyword: keyword?.trim(),
            Page: page,
            PageSize: pageSize,
            Sort: sort?.trim(),
          }),
        create: "/api/v1/catalog/categories",
        detail: (id: string) =>
          `/api/v1/catalog/categories/${encodeURIComponent(id)}`,
        list: () => "/api/v1/catalog/categories",
        update: (id: string) =>
          `/api/v1/catalog/categories/${encodeURIComponent(id)}`,
      },
      equipmentTypes: {
        adminDetail: (id: string) =>
          `/api/v1/catalog/admin/equipment-types/${encodeURIComponent(id)}`,
        adminList: ({
          categoryId,
          keyword,
          page,
          pageSize,
          sort,
          status,
        }: ListAdminCatalogEquipmentTypesParams = {}) =>
          buildQueryEndpoint("/api/v1/catalog/admin/equipment-types", {
            CategoryId: categoryId,
            Keyword: keyword?.trim(),
            Page: page,
            PageSize: pageSize,
            Sort: sort?.trim(),
            Status:
              status === undefined
                ? undefined
                : (Array.isArray(status) ? status : [status]).map(
                    (value) => EQUIPMENT_TYPE_STATUS_NAMES[value],
                  ),
          }),
        create: "/api/v1/catalog/equipment-types",
        currentSchema: (equipmentTypeId: string) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(equipmentTypeId)}/schema`,
        detail: (id: string) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(id)}`,
        disable: (id: string) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(id)}/disable`,
        list: ({
          categoryId,
          keyword,
          page,
          pageSize,
          sort,
        }: ListCatalogEquipmentTypesParams = {}) =>
          buildQueryEndpoint("/api/v1/catalog/equipment-types", {
            CategoryId: categoryId,
            Keyword: keyword?.trim(),
            Page: page,
            PageSize: pageSize,
            Sort: sort?.trim(),
          }),
        publish: (id: string) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(id)}/publish`,
        publishedSchemaVersion: (equipmentTypeId: string, version: number) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(equipmentTypeId)}/schemas/${encodeURIComponent(String(version))}`,
        specSchema: (id: string, version: number) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(id)}/spec-schemas/${encodeURIComponent(String(version))}`,
        specSchemaPublish: (id: string, version: number) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(id)}/spec-schemas/${encodeURIComponent(String(version))}/publish`,
        specSchemas: (id: string) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(id)}/spec-schemas`,
        update: (id: string) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(id)}`,
        validateSpecifications: (equipmentTypeId: string) =>
          `/api/v1/catalog/equipment-types/${encodeURIComponent(equipmentTypeId)}/specifications/validate`,
      },
    },
    currentUser: {
      citizenId: "/api/v1/auth/users/me/citizen-id",
      changePassword: "/api/v1/auth/users/change-password",
      deactivate: "/api/v1/auth/users/deactivate",
      externalLogins: "/api/v1/auth/users/external-logins",
      externalLogin: (provider: string) =>
        `/api/v1/auth/users/external-logins/${encodeURIComponent(provider)}`,
      externalLoginLink: (provider: string) =>
        `/api/v1/auth/users/external-logins/${encodeURIComponent(provider)}/link`,
      me: "/api/v1/auth/users/me",
      organizations: "/api/v1/auth/users/organizations",
      profile: "/api/v1/auth/users/profile",
    },
    inventory: {
      statistics: "/api/v1/inventory/equipment-listings/statistics",
      warehouse: {
        me: "/api/v1/inventory/warehouse/me",
      },
      equipmentListings: {
        publicAvailabilityCheck: (id: string) =>
          `/api/v1/inventory/public/equipment-listings/${encodeURIComponent(id)}/availability/check`,
        publicDetail: (id: string) =>
          `/api/v1/inventory/public/equipment-listings/${encodeURIComponent(id)}`,
        publicList: ({
          categoryId,
          equipmentTypeId,
          brandId,
          provinceCode,
          wardCode,
          q,
          sort,
          filters,
          from,
          to,
          requestedQuantity,
          page = 1,
          pageSize = 20,
        }: PublicEquipmentListingListParams = {}) =>
          buildQueryEndpoint("/api/v1/inventory/public/equipment-listings", {
            categoryId,
            equipmentTypeId,
            brandId,
            ProvinceCode: provinceCode,
            WardCode: wardCode,
            q: q?.trim(),
            sort,
            filters,
            from,
            to,
            requestedQuantity,
            page,
            pageSize,
          }),
        create: "/api/v1/inventory/equipment-listings",
        detail: (id: string) =>
          `/api/v1/inventory/equipment-listings/${encodeURIComponent(id)}`,
        rentalRate: (id: string) =>
          `/api/v1/inventory/equipment-listings/${encodeURIComponent(id)}/rental-rate`,
        assets: (id: string, params?: InventoryPaginationParams) =>
          buildQueryEndpoint(
            `/api/v1/inventory/equipment-listings/${encodeURIComponent(id)}/assets`,
            { page: params?.page, pageSize: params?.pageSize },
          ),
        calendar: (id: string, range: { from: string; to: string }) =>
          buildQueryEndpoint(
            `/api/v1/inventory/equipment-listings/${encodeURIComponent(id)}/calendar`,
            range,
          ),
        list: ({
          page,
          pageSize,
          q,
          equipmentTypeId,
          brandId,
          status,
        }: ListOwnEquipmentListingsParams) =>
          buildQueryEndpoint("/api/v1/inventory/equipment-listings", {
            Page: page,
            PageSize: pageSize,
            Q: q?.trim() || undefined,
            EquipmentTypeId: equipmentTypeId,
            BrandId: brandId,
            Status: status,
          }),
      },
      assets: {
        detail: (id: string) =>
          `/api/v1/inventory/assets/${encodeURIComponent(id)}`,
        acceptingBookings: (id: string) =>
          `/api/v1/inventory/assets/${encodeURIComponent(id)}/accepting-bookings`,
        calendarBlocks: (id: string) =>
          `/api/v1/inventory/assets/${encodeURIComponent(id)}/calendar-blocks`,
        calendarBlock: (id: string, blockId: string) =>
          `/api/v1/inventory/assets/${encodeURIComponent(id)}/calendar-blocks/${encodeURIComponent(blockId)}`,
        calendar: (id: string) =>
          `/api/v1/inventory/assets/${encodeURIComponent(id)}/calendar`,
      },
    },
    media: {
      upload: "/api/v1/media/uploads",
    },
  },
  internal: {
    fallbackHost: "localhost:3000",
    auth: {
      firebaseLogin: "/api/auth/firebase/login",
      login: "/api/auth/login",
      logout: "/api/auth/logout",
      refresh: "/api/auth/refresh",
    },
    mock: {
      passwordReset: {
        request: "/api/mock/auth/password-reset/request",
        reset: "/api/mock/auth/password-reset/reset",
        verify: "/api/mock/auth/password-reset/verify",
      },
    },
  },
} as const;

export const API_ENDPOINT_PREFIXES = {
  internalAuth: "/api/auth/",
  internalMock: "/api/mock/",
} as const;
