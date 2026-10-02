import { ORGANIZATION_STATUS } from "@/types/organization";

export const ORGANIZATION_STATUS_OPTIONS = [
  { label: "Chờ duyệt", value: ORGANIZATION_STATUS.pending },
  { label: "Hoạt động", value: ORGANIZATION_STATUS.active },
  { label: "Bị từ chối", value: ORGANIZATION_STATUS.rejected },
  { label: "Tạm khóa", value: ORGANIZATION_STATUS.suspended },
];

export function getOrganizationStatusLabel(status: number) {
  return ORGANIZATION_STATUS_OPTIONS.find((option) => option.value === status)?.label
    ?? "Không xác định";
}

export function getOrganizationTypeLabel(type?: number) {
  switch (type) {
    case 0:
      return "Nền tảng";
    case 1:
      return "Nhà cung cấp";
    case 2:
      return "Bên thuê";
    default:
      return "Không xác định";
  }
}

export function formatOrganizationDate(value?: string | null, includeTime = true) {
  if (!value) return "—";

  // Parse date-only fields as local calendar dates to avoid timezone shifts.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit" as const, minute: "2-digit" as const } : {}),
  }).format(date);
}

export function getOrganizationInitials(name?: string | null) {
  return name?.trim().split(/\s+/).slice(0, 2)
    .map((word) => word[0]?.toUpperCase()).join("") || "TC";
}

export function getOrganizationWebsiteUrl(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ["http:", "https:", "ftp:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
