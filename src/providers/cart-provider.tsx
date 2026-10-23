"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ApiError } from "@/services/api-error";
import {
  addRentalCartItem,
  clearRentalCart,
  getRentalCart,
  removeRentalCartItem,
  updateRentalCartDates,
  updateRentalCartQuantity,
} from "@/services/rental-cart-service";
import type { AddCartItem, CartItem, CartItemSnapshot } from "@/types/cart";
import {
  addGuestItem,
  clearGuestCart,
  guestCartItem,
  GUEST_CART_KEY,
  readGuestCart,
  validateCartItem,
  writeGuestCart,
} from "@/utils/cart";
import { getTodayRentalDate, getRentalDayCount } from "@/utils/product-detail";

type CartContextValue = {
  items: CartItem[];
  loading: boolean;
  busy: boolean;
  hasLoadError: boolean;
  addItem: (item: AddCartItem, snapshot: CartItemSnapshot) => Promise<boolean>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  updateDates: (id: string, start: string, end: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<string | null>;
};

const CartContext = createContext<CartContextValue | null>(null);
type MergeFailure = { itemId: string; reason: string };
const mergeInFlight = new Map<string, Promise<MergeFailure[]>>();

function withCrossTabMergeLock(
  userId: string,
  action: () => Promise<MergeFailure[]>,
) {
  if (!navigator.locks?.request) return action();
  const request = navigator.locks.request as unknown as (
    name: string,
    options: LockOptions,
    callback: (lock: Lock | null) => Promise<MergeFailure[]>,
  ) => Promise<MergeFailure[]>;
  return request.call(
    navigator.locks,
    `dprental-cart-merge:${userId}`,
    { mode: "exclusive" },
    action,
  );
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error
    ? error.message
    : "Không cập nhật được giỏ hàng. Vui lòng thử lại.";
}

async function mergeGuestCart(userId: string) {
  const existing = mergeInFlight.get(userId);
  if (existing) return existing;
  const promise = withCrossTabMergeLock(userId, async () => {
    const failures: MergeFailure[] = [];
    for (const item of readGuestCart()) {
      let idempotencyKey = item.mergeIdempotencyKey;
      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        writeGuestCart(
          readGuestCart().map((saved) =>
            saved.cartItemId === item.cartItemId
              ? { ...saved, mergeIdempotencyKey: idempotencyKey }
              : saved,
          ),
        );
      }
      try {
        await addRentalCartItem(
          {
            equipmentListingId: item.equipmentListingId,
            quantity: item.quantity,
            expectedStartDate: item.expectedStartDate,
            expectedEndDate: item.expectedEndDate,
          },
          idempotencyKey,
        );
        writeGuestCart(
          readGuestCart().filter(
            (saved) => saved.cartItemId !== item.cartItemId,
          ),
        );
      } catch (cause) {
        failures.push({ itemId: item.cartItemId, reason: errorMessage(cause) });
      }
    }
    return failures;
  });
  mergeInFlight.set(userId, promise);
  try {
    return await promise;
  } finally {
    mergeInFlight.delete(userId);
  }
}

export function CartProvider({
  children,
  enabled = true,
  userId,
  initialItems,
}: {
  children: ReactNode;
  enabled?: boolean;
  userId: string | null;
  initialItems?: CartItem[];
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(enabled && initialItems === undefined);
  const [busy, setBusy] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const operation = useRef(false);
  const refreshId = useRef(0);
  const hasLoaded = useRef(initialItems !== undefined);

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    const id = ++refreshId.current;
    try {
      if (!hasLoaded.current) setLoading(true);
      const failures = userId ? await mergeGuestCart(userId) : [];
      const next = userId ? await getRentalCart() : readGuestCart();
      const failedIds = new Map(
        failures.map((failure) => [failure.itemId, failure.reason]),
      );
      const pending = userId
        ? readGuestCart()
            .filter((item) => failedIds.has(item.cartItemId))
            .map((item) => ({
              ...item,
              pendingSync: true,
              status: "SYNC_FAILED",
              message:
                failedIds.get(item.cartItemId) ||
                "Không thể chuyển mục này vào giỏ tài khoản.",
            }))
        : [];
      if (id === refreshId.current) {
        setItems([...next, ...pending]);
        setHasLoadError(false);
        if (failures.length) {
          toast.error(`${failures.length} thiết bị chưa đồng bộ được. ${failures[0].reason}`);
        }
      }
      return null;
    } catch (cause) {
      const message = errorMessage(cause);
      if (id === refreshId.current) setHasLoadError(true);
      return message;
    } finally {
      if (id === refreshId.current) {
        hasLoaded.current = true;
        setLoading(false);
      }
    }
  }, [userId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const version = refreshId;
    queueMicrotask(() => {
      if (active) void refresh();
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === GUEST_CART_KEY) {
        if (userId) void refresh();
        else setItems(readGuestCart());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      version.current++;
      window.removeEventListener("storage", onStorage);
    };
  }, [userId, refresh, enabled]);

  const run = useCallback(async (action: () => Promise<void>) => {
    if (operation.current) return false;
    operation.current = true;
    setBusy(true);
    try {
      await action();
      return true;
    } catch (cause) {
      const message = errorMessage(cause);
      toast.error(message);
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }, []);

  const addItem = useCallback(
    async (item: AddCartItem, snapshot: CartItemSnapshot) => {
      const validation = validateCartItem(item, getTodayRentalDate());
      if (validation) {
        toast.error(validation);
        return false;
      }
      if (operation.current) return false;
      let success = false;
      await run(async () => {
        if (userId) {
          await addRentalCartItem(item);
          const refreshError = await refresh();
          if (refreshError) throw new Error(refreshError);
        } else {
          const matching = readGuestCart().find(
            (saved) =>
              saved.equipmentListingId === item.equipmentListingId &&
              saved.expectedStartDate === item.expectedStartDate &&
              saved.expectedEndDate === item.expectedEndDate,
          );
          if (
            snapshot.availableQuantity != null &&
            item.quantity + (matching?.quantity ?? 0) >
              snapshot.availableQuantity
          )
            throw new Error(
              `Chỉ còn ${snapshot.availableQuantity} thiết bị cho khoảng ngày này.`,
            );
          const next = addGuestItem(
            readGuestCart(),
            guestCartItem(item, snapshot),
          );
          writeGuestCart(next);
          setItems(next);
        }
        success = true;
        toast.success("Đã thêm thiết bị vào giỏ hàng.");
      });
      return success;
    },
    [refresh, run, userId],
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1) return;
      const current = items.find((item) => item.cartItemId === id);
      if (
        (!userId || current?.pendingSync) &&
        current?.availableQuantity != null &&
        quantity > current.availableQuantity
      ) {
        toast.error(
          `Chỉ còn ${current.availableQuantity} thiết bị cho khoảng ngày này.`,
        );
        return;
      }
      await run(async () => {
        if (userId && !current?.pendingSync) {
          await updateRentalCartQuantity(id, quantity);
          const refreshError = await refresh();
          if (refreshError) throw new Error(refreshError);
        } else {
          const next = readGuestCart().map((item) =>
            item.cartItemId === id
              ? {
                  ...item,
                  quantity,
                  estimatedRentalAmount:
                    item.currentDailyRate == null
                      ? null
                      : item.currentDailyRate *
                        quantity *
                        getRentalDayCount(
                          item.expectedStartDate,
                          item.expectedEndDate,
                        ),
                }
              : item,
          );
          writeGuestCart(next);
          setItems(
            userId
              ? [
                  ...items.filter((item) => !item.pendingSync),
                  ...next.map((item) => ({
                    ...item,
                    pendingSync: true,
                    status: "SYNC_FAILED",
                    message:
                      current?.message || "Chưa thể đồng bộ vào giỏ tài khoản.",
                  })),
                ]
              : next,
          );
          if (userId) {
            const refreshError = await refresh();
            if (refreshError) throw new Error(refreshError);
          }
        }
      });
    },
    [items, refresh, run, userId],
  );

  const updateDates = useCallback(
    async (id: string, start: string, end: string) => {
      const current = items.find((item) => item.cartItemId === id);
      if (!current) return;
      const validation = validateCartItem(
        { ...current, expectedStartDate: start, expectedEndDate: end },
        getTodayRentalDate(),
      );
      if (validation) {
        toast.error(validation);
        return;
      }
      await run(async () => {
        if (userId && !current.pendingSync) {
          await updateRentalCartDates(id, start, end);
          const refreshError = await refresh();
          if (refreshError) throw new Error(refreshError);
        } else {
          const updated = readGuestCart().map((item) =>
            item.cartItemId === id
              ? {
                  ...item,
                  expectedStartDate: start,
                  expectedEndDate: end,
                  estimatedRentalAmount:
                    item.currentDailyRate == null
                      ? null
                      : item.currentDailyRate *
                        item.quantity *
                        getRentalDayCount(start, end),
                }
              : item,
          );
          const changed = updated.find((item) => item.cartItemId === id);
          const next = changed
            ? addGuestItem(
                updated.filter((item) => item.cartItemId !== id),
                changed,
              )
            : updated;
          writeGuestCart(next);
          setItems(
            userId
              ? [
                  ...items.filter((item) => !item.pendingSync),
                  ...next.map((item) => ({
                    ...item,
                    pendingSync: true,
                    status: "SYNC_FAILED",
                    message: current.message,
                  })),
                ]
              : next,
          );
          if (userId) {
            const refreshError = await refresh();
            if (refreshError) throw new Error(refreshError);
          }
        }
      });
    },
    [items, refresh, run, userId],
  );

  const removeItem = useCallback(
    async (id: string) => {
      const current = items.find((item) => item.cartItemId === id);
      await run(async () => {
        if (userId && !current?.pendingSync) {
          await removeRentalCartItem(id);
          const refreshError = await refresh();
          if (refreshError) throw new Error(refreshError);
        } else {
          const next = readGuestCart().filter((item) => item.cartItemId !== id);
          writeGuestCart(next);
          if (userId) {
            setItems((currentItems) => [
              ...currentItems.filter((item) => !item.pendingSync),
              ...next.map((item) => ({
                ...item,
                pendingSync: true,
                status: "SYNC_FAILED",
                message: item.message || "Chưa thể đồng bộ vào giỏ tài khoản.",
              })),
            ]);
            const refreshError = await refresh();
            if (refreshError) throw new Error(refreshError);
          } else setItems(next);
        }
      });
    },
    [items, refresh, run, userId],
  );

  const clear = useCallback(async () => {
    await run(async () => {
      if (userId) {
        clearGuestCart();
        await clearRentalCart();
        const refreshError = await refresh();
        if (refreshError) throw new Error(refreshError);
      } else {
        clearGuestCart();
        setItems([]);
      }
    });
  }, [refresh, run, userId]);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        busy,
        hasLoadError,
        addItem,
        updateQuantity,
        updateDates,
        removeItem,
        clear,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
