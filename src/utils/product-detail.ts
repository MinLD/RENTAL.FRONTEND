import type {
  EquipmentListingMedia,
  PublicEquipmentListingDetail,
} from "@/types/inventory";
import type { CatalogSpecField } from "@/types/catalog";

export type ProductSpecification = { label: string; value: string };

export function getProductDetailImages(product: PublicEquipmentListingDetail) {
  const images: EquipmentListingMedia[] = (product.media ?? []).filter(
    (media) => Boolean(media.url),
  );
  if (
    product.thumbnailUrl &&
    !images.some((media) => media.url === product.thumbnailUrl)
  ) {
    images.unshift({
      id: "thumbnail",
      url: product.thumbnailUrl,
    });
  }
  return images;
}

function formatSpecValue(value: unknown): string {
  if (value == null || value === "") return "Chưa cập nhật";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number")
    return new Intl.NumberFormat("vi-VN").format(value);
  if (Array.isArray(value)) return value.map(formatSpecValue).join(", ");
  if (typeof value === "object")
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${formatSpecValue(item)}`)
      .join("; ");
  return String(value);
}

export function getProductSpecifications(
  product: PublicEquipmentListingDetail,
  fields?: CatalogSpecField[] | null,
): ProductSpecification[] {
  const rows = [
    { label: "Model", value: product.model || "Chưa cập nhật" },
    {
      label: "Năm sản xuất",
      value: product.manufactureYear
        ? String(product.manufactureYear)
        : "Chưa cập nhật",
    },
  ];
  try {
    const values: unknown =
      typeof product.specValues === "string"
        ? JSON.parse(product.specValues)
        : product.specValues;
    if (!values || typeof values !== "object" || Array.isArray(values))
      return rows;
    const definitions = new Map(
      (fields ?? []).map((field) => [field.key, field]),
    );
    for (const [key, value] of Object.entries(values)) {
      const definition = definitions.get(key);
      const label =
        definition?.label || key.replace(/([a-z])([A-Z])/g, "$1 $2");
      const formatted =
        definition?.options?.find((option) => option.value === String(value))
          ?.label || formatSpecValue(value);
      rows.push({
        label,
        value:
          definition?.unit && value != null && value !== ""
            ? `${formatted} ${definition.unit}`
            : formatted,
      });
    }
  } catch {
    // The remaining product information still works with malformed spec JSON.
  }
  return rows;
}

export function getTodayRentalDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function rentalDateTimestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return NaN;
  return new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : NaN;
}

export function getRentalDayCount(from: string, to: string) {
  const start = rentalDateTimestamp(from);
  const end = rentalDateTimestamp(to);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

export function formatRentalDate(value: string) {
  const timestamp = rentalDateTimestamp(value);
  if (!Number.isFinite(timestamp)) return "Chưa chọn";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(timestamp);
}
