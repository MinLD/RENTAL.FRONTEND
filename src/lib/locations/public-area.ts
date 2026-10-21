import { VIETNAM_PROVINCES } from "@/lib/locations/vietnam-divisions";

export const PUBLIC_AREA_STORAGE_KEY = "dprental.public-area.v1";
export const PUBLIC_AREA_COOKIE_NAME = "dprental-public-area";

export type PublicAreaSelection = { provinceCode: string; wardCode: string };
export const ALL_PUBLIC_AREAS: PublicAreaSelection = {
  provinceCode: "",
  wardCode: "",
};

export const PUBLIC_FEATURED_PROVINCES = [
  { code: "79", label: "Hồ Chí Minh", image: "/images/address/hcm.png" },
  { code: "01", label: "Hà Nội", image: "/images/address/ha-noi.png" },
  { code: "48", label: "Đà Nẵng", image: "/images/address/da-nang.png" },
] as const;

export function parsePublicArea(value: unknown): PublicAreaSelection | null {
  if (!value || typeof value !== "object") return null;
  const { provinceCode, wardCode } = value as Partial<PublicAreaSelection>;
  if (typeof provinceCode !== "string" || typeof wardCode !== "string") return null;
  if (!provinceCode) return wardCode ? null : ALL_PUBLIC_AREAS;
  const province = VIETNAM_PROVINCES.find((item) => item.code === provinceCode);
  if (!province || (wardCode && !province.wards.some((item) => item.code === wardCode))) return null;
  return { provinceCode, wardCode };
}

export function serializePublicArea(area: PublicAreaSelection) {
  return area.provinceCode ? `${area.provinceCode}.${area.wardCode}` : "all";
}

export function deserializePublicArea(value: string | undefined | null) {
  if (!value) return null;
  if (value === "all") return ALL_PUBLIC_AREAS;
  const parts = value.split(".");
  return parts.length === 2
    ? parsePublicArea({ provinceCode: parts[0], wardCode: parts[1] })
    : null;
}

export function getPublicAreaLabel(area: PublicAreaSelection | null) {
  if (!area) return "Chọn vị trí";
  if (!area.provinceCode) return "Toàn quốc";
  const province = VIETNAM_PROVINCES.find((item) => item.code === area.provinceCode);
  const ward = province?.wards.find((item) => item.code === area.wardCode);
  return [ward?.name, province?.name].filter(Boolean).join(", ");
}

export function publicAreaParams(area: PublicAreaSelection | null) {
  return {
    provinceCode: area?.provinceCode || undefined,
    wardCode: area?.wardCode || undefined,
  };
}
