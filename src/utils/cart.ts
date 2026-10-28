import type { AddCartItem, CartItem, CartItemSnapshot } from "@/types/cart";
import { getRentalDayCount } from "./product-detail.ts";

export const GUEST_CART_KEY = "dprental-guest-cart-v1";

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function maxStartDate(today: string) {
  const value = new Date(`${today}T00:00:00Z`);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + 6);
  const targetMonth = value.getUTCMonth();
  value.setUTCDate(day);
  if (value.getUTCMonth() !== targetMonth) value.setUTCDate(0);
  return value.toISOString().slice(0, 10);
}

export function validateCartItem(item: AddCartItem, today: string): string | null {
  if (!item.equipmentListingId || !Number.isSafeInteger(item.quantity) || item.quantity < 1)
    return "Số lượng thiết bị không hợp lệ.";
  if (item.expectedStartDate < addDays(today, 3))
    return "Ngày bắt đầu thuê phải cách hôm nay ít nhất 3 ngày (thời gian chuẩn bị và vận chuyển thiết bị).";
  if (item.expectedStartDate > maxStartDate(today))
    return "Ngày bắt đầu thuê không được quá 6 tháng tới.";
  const days = getRentalDayCount(item.expectedStartDate, item.expectedEndDate);
  if (!days || days > 365) return "Thời gian thuê phải từ 1 đến 365 ngày.";
  return null;
}

export function guestCartItem(item: AddCartItem, snapshot: CartItemSnapshot): CartItem {
  return {
    ...item,
    cartItemId: crypto.randomUUID(),
    name: snapshot.name,
    thumbnailUrl: snapshot.thumbnailUrl,
    currency: snapshot.currency || "VND",
    currentDailyRate: snapshot.dailyRate,
    currentDeposit: snapshot.depositAmount,
    estimatedRentalAmount: snapshot.dailyRate == null
      ? null : snapshot.dailyRate * item.quantity * getRentalDayCount(item.expectedStartDate, item.expectedEndDate),
    status: "AVAILABLE",
    message: null,
    availableQuantity: snapshot.availableQuantity,
    mergeIdempotencyKey: crypto.randomUUID(),
  };
}

export function addGuestItem(items: CartItem[], next: CartItem): CartItem[] {
  const match = items.find((item) => item.equipmentListingId === next.equipmentListingId &&
    item.expectedStartDate === next.expectedStartDate && item.expectedEndDate === next.expectedEndDate);
  if (!match) return [...items, next];
  return items.map((item) => item.cartItemId === match.cartItemId
    ? { ...item, quantity: item.quantity + next.quantity,
      estimatedRentalAmount: item.currentDailyRate == null ? null :
        item.currentDailyRate * (item.quantity + next.quantity) * getRentalDayCount(item.expectedStartDate, item.expectedEndDate) }
    : item);
}

export function readGuestCart(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CartItem => Boolean(item && typeof item === "object" &&
      typeof item.cartItemId === "string" && typeof item.equipmentListingId === "string" &&
      typeof item.name === "string" && Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
      typeof item.expectedStartDate === "string" && typeof item.expectedEndDate === "string"));
  } catch { return []; }
}

export function writeGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("dprental-cart-updated"));
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
  window.dispatchEvent(new Event("dprental-cart-updated"));
}
