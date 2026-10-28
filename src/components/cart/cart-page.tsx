"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { HomeLink } from "@/components/layout/home-link";
import { ErrorState } from "@/components/error-state";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { EmptyCartIllustration } from "@/components/illustrations/empty-cart-illustration";
import { useCart } from "@/providers/cart-provider";
import type { CartItem } from "@/types/cart";
import { addDays, validateCartItem } from "@/utils/cart";
import { formatEquipmentListingRate } from "@/utils/inventory";
import {
  formatRentalDate,
  getRentalDayCount,
  getTodayRentalDate,
} from "@/utils/product-detail";
import { cn } from "@/utils/cn";

function CartRow({
  item,
  selected,
  onSelect,
}: {
  item: CartItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { busy, updateQuantity, updateDates, removeItem } = useCart();
  const [start, setStart] = useState(item.expectedStartDate);
  const [end, setEnd] = useState(item.expectedEndDate);
  const [dateError, setDateError] = useState<string | null>(null);
  const [prevQuantity, setPrevQuantity] = useState(item.quantity);
  const [qtyInput, setQtyInput] = useState(String(item.quantity));

  if (item.quantity !== prevQuantity) {
    setPrevQuantity(item.quantity);
    setQtyInput(String(item.quantity));
  }

  const handleQtyBlur = () => {
    const parsed = parseInt(qtyInput, 10);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      setQtyInput(String(item.quantity));
      return;
    }
    if (parsed !== item.quantity) {
      void updateQuantity(item.cartItemId, parsed);
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const dateUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(
    () => () => {
      clearTimeout(dateUpdateTimer.current ?? undefined);
    },
    [],
  );
  const minStart = addDays(getTodayRentalDate(), 3);
  const isDatePassed = item.status === "DATE_PASSED" || item.expectedStartDate < getTodayRentalDate();
  const isLeadTimeViolation = item.expectedStartDate < minStart;
  const isDateError = isDatePassed || isLeadTimeViolation || Boolean(dateError);
  const isEnabled = item.interactionStatus
    ? item.interactionStatus === "ENABLED"
    : item.status === "AVAILABLE" && !isLeadTimeViolation && !isDatePassed;
  const isReadOnly = item.interactionStatus === "DISABLED_READ_ONLY";
  const changeDates = (nextStart: string, nextEnd: string) => {
    setStart(nextStart);
    setEnd(nextEnd);
    clearTimeout(dateUpdateTimer.current ?? undefined);
    const validation = validateCartItem(
      {
        equipmentListingId: item.equipmentListingId,
        quantity: item.quantity,
        expectedStartDate: nextStart,
        expectedEndDate: nextEnd,
      },
      getTodayRentalDate(),
    );
    if (validation) {
      setDateError(validation);
      return;
    }
    setDateError(null);
    dateUpdateTimer.current = setTimeout(() => {
      void updateDates(item.cartItemId, nextStart, nextEnd);
    }, 350);
  };
  return (
    <article className="grid gap-4 border-b border-border py-5 md:grid-cols-[minmax(0,1fr)_100px_185px_235px] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <input
          aria-label={`Chọn ${item.name}`}
          checked={isEnabled && selected}
          className="mt-1 size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!isEnabled}
          onChange={onSelect}
          type="checkbox"
        />
        <Link
          className="relative size-20 shrink-0 overflow-hidden rounded border border-border bg-muted sm:size-24"
          href={`/products/${item.equipmentListingId}`}
        >
          <ProductImage
            compact
            name={item.name}
            role="thumbnail"
            sizes="96px"
            src={item.thumbnailUrl}
          />
        </Link>
        <div className="min-w-0">
          <Link
            className="line-clamp-2 text-sm font-semibold hover:text-primary"
            href={`/products/${item.equipmentListingId}`}
          >
            {item.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatEquipmentListingRate(item.currentDailyRate, item.currency)} /
            ngày
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {getRentalDayCount(item.expectedStartDate, item.expectedEndDate)}{" "}
            ngày · {formatRentalDate(item.expectedStartDate)} -{" "}
            {formatRentalDate(item.expectedEndDate)}
          </p>
          {item.pendingSync && (
            <p className="mt-1 text-xs font-semibold text-error" role="status">
              Chưa đồng bộ vào tài khoản
            </p>
          )}
          {isReadOnly ? (
            <p className="mt-1 text-xs text-error" role="status">
              {item.message ||
                "Thiết bị không còn khả dụng hoặc thuộc sở hữu của bạn."}
            </p>
          ) : item.status === "INSUFFICIENT_QUANTITY" ? (
            <p className="mt-1 text-xs text-error" role="status">
              {item.message ||
                "Không đủ số lượng thiết bị khả dụng trong khoảng ngày này."}
            </p>
          ) : item.status === "DATE_PASSED" ? (
            <p className="mt-1 text-xs text-error" role="status">
              {item.message ||
                "Khoảng ngày thuê đã quá hạn. Vui lòng chọn lại ngày."}
            </p>
          ) : item.status === "LISTING_DISABLED" ||
            item.status === "UNAVAILABLE" ? (
            <p className="mt-1 text-xs text-error" role="status">
              {item.message || "Thiết bị tạm ngưng cho thuê hoặc đã bị khóa."}
            </p>
          ) : item.status !== "AVAILABLE" ? (
            <p className="mt-1 text-xs text-error" role="status">
              {item.message ||
                "Thiết bị cần được kiểm tra lại tình trạng thuê."}
            </p>
          ) : isLeadTimeViolation ? (
            <p className="mt-1 text-xs text-error" role="status">
              Ngày bắt đầu thuê cần cách hôm nay ít nhất 3 ngày để vận chuyển.
              Vui lòng chọn lại ngày.
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 md:block">
        <span className="text-xs text-muted-foreground md:hidden">
          Số lượng
        </span>
        <div className="inline-flex items-center overflow-hidden rounded border border-border">
          <button
            aria-label={`Giảm số lượng ${item.name}`}
            className="grid size-8 place-items-center p-0 transition-colors hover:bg-muted disabled:opacity-40"
            disabled={busy || isReadOnly || item.quantity <= 1}
            onClick={() => {
              const next = Math.max(1, item.quantity - 1);
              setQtyInput(String(next));
              void updateQuantity(item.cartItemId, next);
            }}
            type="button"
          >
            <Minus className="size-3" />
          </button>
          <input
            aria-label={`Số lượng ${item.name}`}
            className="h-8 w-12 border-x border-border bg-background p-0 text-center text-xs font-semibold tabular-nums outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            disabled={busy || isReadOnly}
            inputMode="numeric"
            min={1}
            onBlur={handleQtyBlur}
            onChange={(e) => setQtyInput(e.target.value)}
            onKeyDown={handleQtyKeyDown}
            type="number"
            value={qtyInput}
          />
          <button
            aria-label={`Tăng số lượng ${item.name}`}
            className="grid size-8 place-items-center p-0 transition-colors hover:bg-muted disabled:opacity-40"
            disabled={busy || isReadOnly}
            onClick={() => {
              const next = item.quantity + 1;
              setQtyInput(String(next));
              void updateQuantity(item.cartItemId, next);
            }}
            type="button"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:col-span-1 md:grid-cols-1">
        <label className="text-[11px] text-muted-foreground">
          Từ ngày
          <input
            aria-label={`Ngày bắt đầu ${item.name}`}
            className={cn(
              "mt-1 h-9 w-full rounded border bg-background px-2 text-xs text-foreground disabled:opacity-50",
              isDateError ? "border-error text-error focus:border-error focus:ring-1 focus:ring-error" : "border-border",
            )}
            disabled={busy || isReadOnly}
            min={minStart}
            onChange={(event) => changeDates(event.target.value, end)}
            type="date"
            value={start}
          />
        </label>
        <label className="text-[11px] text-muted-foreground">
          Đến ngày
          <input
            aria-label={`Ngày kết thúc ${item.name}`}
            className={cn(
              "mt-1 h-9 w-full rounded border bg-background px-2 text-xs text-foreground disabled:opacity-50",
              isDateError ? "border-error text-error focus:border-error focus:ring-1 focus:ring-error" : "border-border",
            )}
            disabled={busy || isReadOnly}
            min={start || minStart}
            onChange={(event) => changeDates(start, event.target.value)}
            type="date"
            value={end}
          />
        </label>
        {dateError ? (
          <p className="col-span-2 text-[11px] font-medium text-error md:col-span-1" role="status">
            {dateError}
          </p>
        ) : isDatePassed ? (
          <p className="col-span-2 text-[11px] font-medium text-error md:col-span-1" role="status">
            * Ngày thuê đã quá hạn. Vui lòng chọn lại ngày mới.
          </p>
        ) : isLeadTimeViolation ? (
          <p className="col-span-2 text-[11px] font-medium text-error md:col-span-1" role="status">
            * Cần tối thiểu 3 ngày chuẩn bị vận chuyển.
          </p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col items-end justify-between gap-2 md:items-end md:justify-center">
        <p className="whitespace-nowrap font-bold text-primary">
          {formatEquipmentListingRate(
            item.estimatedRentalAmount,
            item.currency,
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            aria-label={`Xóa ${item.name} khỏi giỏ`}
            className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-error disabled:opacity-40"
            disabled={busy}
            onClick={() => void removeItem(item.cartItemId)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function CartPage() {
  const router = useRouter();
  const { items, loading, busy, hasLoadError, clear, refresh } = useCart();
  const [excluded, setExcluded] = useState<string[]>([]);

  const minStart = addDays(getTodayRentalDate(), 3);
  const validItems = useMemo(
    () =>
      items.filter((item) =>
        item.interactionStatus
          ? item.interactionStatus === "ENABLED"
          : item.status === "AVAILABLE" && item.expectedStartDate >= minStart,
      ),
    [items, minStart],
  );

  const selectedValidItems = useMemo(
    () => validItems.filter((item) => !excluded.includes(item.cartItemId)),
    [validItems, excluded],
  );

  const selectedAll =
    validItems.length > 0 && selectedValidItems.length === validItems.length;
  const subtotal = selectedValidItems.reduce(
    (sum, item) => sum + (item.estimatedRentalAmount ?? 0),
    0,
  );
  const hasUnpriced = selectedValidItems.some(
    (item) => item.estimatedRentalAmount == null,
  );
  const currency = items[0]?.currency || "VND";

  const handleProceedToCheckout = () => {
    if (!selectedValidItems.length) return;
    const cartItemIds = selectedValidItems.map((item) => item.cartItemId).join(",");
    router.push(`/checkout?cartItemIds=${encodeURIComponent(cartItemIds)}`);
  };
  return (
    <div className="flex-1 bg-background py-6">
      <Container>
        <nav
          aria-label="Đường dẫn giỏ hàng"
          className="mb-7 flex gap-2 text-xs text-muted-foreground"
        >
          <HomeLink className="hover:text-primary">Trang chủ</HomeLink>
          <span>/</span>
          <span aria-current="page" className="text-foreground">
            Giỏ hàng
          </span>
        </nav>
        {loading ? (
          <p className="py-20 text-center text-muted-foreground">
            Đang tải giỏ hàng...
          </p>
        ) : hasLoadError && items.length === 0 ? (
          <ErrorState
            action={
              <Button onClick={() => void refresh()} type="button">
                Thử lại
              </Button>
            }
            className="min-h-[400px]"
            description="Giỏ hàng đang tạm thời không hiển thị. Vui lòng thử lại."
            title="Không thể tải giỏ hàng"
          />
        ) : items.length === 0 ? (
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 py-10 sm:flex-row sm:py-16">
            <div className="w-full sm:w-1/2">
              <EmptyCartIllustration />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl font-bold">Giỏ hàng của bạn đang rỗng!</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Hãy chọn thiết bị phù hợp và thêm vào giỏ hàng để lên kế hoạch
                thuê.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                href="/search"
              >
                Xem thiết bị cho thuê <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <ShoppingBasket className="size-6 text-primary" />
                Giỏ hàng của bạn
              </h1>
              <button
                className="text-xs text-muted-foreground underline hover:text-error disabled:opacity-40"
                disabled={busy}
                onClick={() => void clear()}
                type="button"
              >
                Xóa toàn bộ
              </button>
            </div>
            <div className="border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase md:grid md:grid-cols-[minmax(0,1fr)_100px_185px_235px] md:gap-4">
              <label className="flex items-center gap-2">
                <input
                  checked={selectedAll}
                  disabled={!validItems.length}
                  className="size-4 accent-primary disabled:opacity-40"
                  onChange={() =>
                    setExcluded(
                      selectedAll
                        ? validItems.map((item) => item.cartItemId)
                        : [],
                    )
                  }
                  type="checkbox"
                />
                Tất cả ({items.length} sản phẩm)
              </label>
              <span className="hidden md:block">Số lượng</span>
              <span className="hidden md:block">Ngày thuê</span>
              <span className="hidden text-right md:block">Thành tiền</span>
            </div>
            <div className="px-1 sm:px-4">
              {items.map((item) => (
                <CartRow
                  key={item.cartItemId}
                  item={item}
                  selected={!excluded.includes(item.cartItemId)}
                  onSelect={() =>
                    setExcluded((current) =>
                      current.includes(item.cartItemId)
                        ? current.filter((id) => id !== item.cartItemId)
                        : [...current, item.cartItemId],
                    )
                  }
                />
              ))}
            </div>
            <div className="mt-5 flex flex-col items-end gap-3">
              <p className="text-sm">
                Tạm tính ({selectedValidItems.length} sản phẩm hợp lệ):{" "}
                <strong className="ml-2 text-lg text-primary">
                  {formatEquipmentListingRate(subtotal, currency)}
                </strong>
              </p>
              {hasUnpriced && (
                <p className="text-xs text-muted-foreground">
                  Một số thiết bị chưa có giá thuê; tạm tính chưa bao gồm các
                  mục đó.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                  href="/search"
                >
                  Tiếp tục chọn thiết bị
                </Link>
                <Button
                  disabled={selectedValidItems.length === 0 || busy}
                  onClick={handleProceedToCheckout}
                  className="gap-2"
                >
                  Tiến hành đặt thuê ({selectedValidItems.length}){" "}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
