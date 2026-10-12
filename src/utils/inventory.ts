export function formatEquipmentListingRate(
  amount: number | undefined,
  currency: string | undefined,
) {
  if (amount === undefined || !Number.isFinite(amount)) return "—";

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

export function getEquipmentListingStatusLabel(status: string) {
  return status === "Draft" ? "Bản nháp" : status || "—";
}
