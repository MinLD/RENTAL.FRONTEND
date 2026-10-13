import {
  EQUIPMENT_LISTING_STATUS,
  type EquipmentListing,
  type EquipmentListingMedia,
  type EquipmentListingStatus,
} from "@/types/inventory";

export function getEquipmentListingMedia(
  product: EquipmentListing,
): EquipmentListingMedia[] {
  const media = new Map((product.media ?? []).map((item) => [item.id, item]));
  // Preserve listings created before the gallery was introduced.
  if (product.thumbnailMediaId && !media.has(product.thumbnailMediaId)) {
    media.set(product.thumbnailMediaId, {
      id: product.thumbnailMediaId,
      url: product.thumbnailUrl,
    });
  }
  return Array.from(media.values());
}

export function formatEquipmentListingRate(
  amount: number | null | undefined,
  currency: string | null | undefined,
) {
  if (amount == null || !Number.isFinite(amount)) return "—";

  if (currency) {
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        currencyDisplay: "code",
      }).format(amount);
    } catch {
      // Preserve the API currency when it is not an ISO currency code.
    }
  }

  return `${new Intl.NumberFormat("vi-VN").format(amount)}${currency ? ` ${currency}` : ""}`;
}

export function formatEquipmentListingDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function getEquipmentListingStatusValue(
  status: EquipmentListing["status"],
): EquipmentListingStatus | undefined {
  if (status === "Draft" || status === 1 || status === "1")
    return EQUIPMENT_LISTING_STATUS.Draft;
  if (status === "Active" || status === 2 || status === "2")
    return EQUIPMENT_LISTING_STATUS.Active;
  if (status === "Inactive" || status === 3 || status === "3")
    return EQUIPMENT_LISTING_STATUS.Inactive;
}

export function getEquipmentListingStatusLabel(
  status: EquipmentListing["status"],
) {
  switch (getEquipmentListingStatusValue(status)) {
    case EQUIPMENT_LISTING_STATUS.Draft:
      return "Bản nháp";
    case EQUIPMENT_LISTING_STATUS.Active:
      return "Đang hoạt động";
    case EQUIPMENT_LISTING_STATUS.Inactive:
      return "Tạm dừng";
    default:
      return status ? String(status) : "—";
  }
}

export function getEquipmentListingStatusVariant(
  status: EquipmentListing["status"],
) {
  switch (getEquipmentListingStatusValue(status)) {
    case EQUIPMENT_LISTING_STATUS.Draft:
      return "warning";
    case EQUIPMENT_LISTING_STATUS.Active:
      return "success";
    default:
      return "muted";
  }
}

export function getEquipmentListingName(
  product: Pick<EquipmentListing, "name" | "model">,
) {
  return (
    product.name?.trim() || product.model?.trim() || "Sản phẩm chưa có tên"
  );
}
