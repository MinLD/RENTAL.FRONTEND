export const EMPTY_PROFILE_LABEL = "Chưa cập nhật";

export function displayProfileValue(value?: string | null) {
  return value?.trim() ? value : EMPTY_PROFILE_LABEL;
}

export function getUserInitials(name?: string) {
  const initials = name
    ?.split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "DP";
}

export function formatDisplayDate(value?: string) {
  if (!value) {
    return EMPTY_PROFILE_LABEL;
  }

  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function maskIdentityNumber(value?: string) {
  if (!value) {
    return EMPTY_PROFILE_LABEL;
  }

  if (value.length <= 4) {
    return value;
  }

  return `${value.slice(0, 3)}******${value.slice(-3)}`;
}

export function formatDate(value?: string | null) {
  if (!value) {
    return EMPTY_PROFILE_LABEL;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
  }).format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return EMPTY_PROFILE_LABEL;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
