import type { EquipmentListingRentalRateResponse } from "@/types/inventory";

export const RENTAL_DAYS_PER_MONTH = 30;
export const RENTAL_DAYS_PER_WEEK = 7;

export type RentalPriceLine = {
  unit: "month" | "week" | "day";
  label: string;
  count: number;
  rate: number;
  subtotal: number;
};

export type RentalPriceEstimate = {
  lines: RentalPriceLine[];
  unitTotal: number;
  total: number;
};

export function calculateRentalPrice(
  days: number,
  quantity: number,
  rentalRate: EquipmentListingRentalRateResponse | null,
): RentalPriceEstimate | null {
  if (
    !Number.isSafeInteger(days) ||
    days < 1 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    !rentalRate
  )
    return null;

  const periods = [
    {
      unit: "month",
      label: "tháng",
      days: RENTAL_DAYS_PER_MONTH,
      rate: rentalRate.monthlyRate,
    },
    {
      unit: "week",
      label: "tuần",
      days: RENTAL_DAYS_PER_WEEK,
      rate: rentalRate.weeklyRate,
    },
    { unit: "day", label: "ngày", days: 1, rate: rentalRate.dailyRate },
  ] as const;
  const lines: RentalPriceLine[] = [];
  let remaining = days;
  for (const period of periods) {
    const rate = period.rate;
    // If a period has no published rate, use the smaller available periods.
    if (rate == null || !Number.isFinite(rate) || rate < 0) continue;
    const count = Math.floor(remaining / period.days);
    if (!count) continue;
    lines.push({
      unit: period.unit,
      label: period.label,
      count,
      rate,
      subtotal: count * rate,
    });
    remaining %= period.days;
  }
  if (remaining > 0) return null;
  const unitTotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const total = unitTotal * quantity;
  return Number.isFinite(total) ? { lines, unitTotal, total } : null;
}
