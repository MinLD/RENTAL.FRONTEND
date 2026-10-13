import "server-only";

import type { PublicEquipmentListingDetail } from "@/types/inventory";

export function isPublicEquipmentDetailMockEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.MOCK_PUBLIC_EQUIPMENT_DETAIL !== "false"
  );
}

const equipmentListing: PublicEquipmentListingDetail = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  equipmentTypeId: "a1268244-6375-4d31-9b47-8aa032c3ecfa",
  brandId: "b2536355-7486-4e42-8c58-9bb143d4fdb0",
  name: "Máy xúc bánh xích CAT 320",
  description:
    "Máy xúc bánh xích phục vụ đào đất, san lấp và thi công công trình. Cabin điều hòa, vận hành ổn định và được bảo dưỡng định kỳ.",
  model: "CAT 320",
  manufactureYear: 2022,
  schemaVersion: 1,
  specValues: JSON.stringify({
    operatingWeight: 20400,
    bucketCapacity: 1.2,
    enginePower: 119,
    maxDiggingDepth: 6.72,
    fuelType: "Diesel",
  }),
  rentalRate: {
    dailyRate: 2500000,
    weeklyRate: 15000000,
    monthlyRate: 55000000,
    currency: "VND",
  },
  media: [
    {
      id: "c3647466-8597-4f53-9d69-acc254e50ec1",
      url: "/banners/banner.png",
    },
  ],
  thumbnailUrl: "/banners/banner.png",
  totalQuantity: 8,
};

// Intentionally independent of the requested ID while building the detail UI.
export function getMockPublicEquipmentListing(): PublicEquipmentListingDetail {
  return structuredClone(equipmentListing);
}
