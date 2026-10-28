"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import { formatRentalDate, getRentalDayCount, getTodayRentalDate } from "@/utils/product-detail";

function CartRow({ item, selected, onSelect }: { item: CartItem; selected: boolean; onSelect: () => void }) {
  const { busy, updateQuantity, updateDates, removeItem } = useCart();
  const [start, setStart] = useState(item.expectedStartDate);
  const [end, setEnd] = useState(item.expectedEndDate);
  const [dateError, setDateError] = useState<string | null>(null);
  const dateUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => {
    clearTimeout(dateUpdateTimer.current ?? undefined);
  }, []);
  const minStart = addDays(getTodayRentalDate(), 3);
  const isLeadTimeViolation = item.expectedStartDate < minStart;
  const changeDates = (nextStart: string, nextEnd: string) => {
    setStart(nextStart);
    setEnd(nextEnd);
    clearTimeout(dateUpdateTimer.current ?? undefined);
    const validation = validateCartItem({
      equipmentListingId: item.equipmentListingId,
      quantity: item.quantity,
      expectedStartDate: nextStart,
      expectedEndDate: nextEnd,
    }, getTodayRentalDate());
    if (validation) {
      setDateError(validation);
      return;
    }
    setDateError(null);
    dateUpdateTimer.current = setTimeout(() => {
      void updateDates(item.cartItemId, nextStart, nextEnd);
    }, 350);
  };
  return <article className="grid gap-4 border-b border-border py-5 md:grid-cols-[minmax(0,1fr)_100px_185px_235px] md:items-center">
    <div className="flex min-w-0 items-start gap-3">
      <input aria-label={`Chọn ${item.name}`} checked={selected} className="mt-1 size-4 accent-primary" onChange={onSelect} type="checkbox" />
      <Link className="relative size-20 shrink-0 overflow-hidden rounded border border-border bg-muted sm:size-24" href={`/products/${item.equipmentListingId}`}><ProductImage compact name={item.name} role="thumbnail" sizes="96px" src={item.thumbnailUrl} /></Link>
      <div className="min-w-0">
        <Link className="line-clamp-2 text-sm font-semibold hover:text-primary" href={`/products/${item.equipmentListingId}`}>{item.name}</Link>
        <p className="mt-1 text-xs text-muted-foreground">{formatEquipmentListingRate(item.currentDailyRate, item.currency)} / ngày</p>
        <p className="mt-1 text-xs text-muted-foreground">{getRentalDayCount(item.expectedStartDate, item.expectedEndDate)} ngày · {formatRentalDate(item.expectedStartDate)} - {formatRentalDate(item.expectedEndDate)}</p>
        {item.pendingSync && <p className="mt-1 text-xs font-semibold text-error" role="status">Chưa đồng bộ vào tài khoản</p>}
        {item.status !== "AVAILABLE" && <p className="mt-1 text-xs text-error" role="status">{item.message || "Thiết bị cần được kiểm tra lại tình trạng thuê."}</p>}
        {item.status === "AVAILABLE" && isLeadTimeViolation && <p className="mt-1 text-xs text-error" role="status">Ngày bắt đầu thuê cần cách hôm nay ít nhất 3 ngày để vận chuyển. Vui lòng chọn lại ngày.</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 md:block">
      <span className="text-xs text-muted-foreground md:hidden">Số lượng</span>
      <div className="inline-flex items-center rounded border border-border">
        <button aria-label={`Giảm số lượng ${item.name}`} className="p-2 disabled:opacity-40" disabled={busy || item.quantity <= 1} onClick={() => void updateQuantity(item.cartItemId, item.quantity - 1)} type="button"><Minus className="size-3" /></button>
        <span className="min-w-8 text-center text-sm">{item.quantity}</span>
        <button aria-label={`Tăng số lượng ${item.name}`} className="p-2 disabled:opacity-40" disabled={busy} onClick={() => void updateQuantity(item.cartItemId, item.quantity + 1)} type="button"><Plus className="size-3" /></button>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 md:col-span-1 md:grid-cols-1">
      <label className="text-[11px] text-muted-foreground">Từ ngày<input aria-label={`Ngày bắt đầu ${item.name}`} className="mt-1 h-9 w-full rounded border border-border bg-background px-2 text-xs text-foreground" disabled={busy} min={minStart} onChange={(event) => changeDates(event.target.value, end)} type="date" value={start} /></label>
      <label className="text-[11px] text-muted-foreground">Đến ngày<input aria-label={`Ngày kết thúc ${item.name}`} className="mt-1 h-9 w-full rounded border border-border bg-background px-2 text-xs text-foreground" disabled={busy} min={start || minStart} onChange={(event) => changeDates(start, event.target.value)} type="date" value={end} /></label>
      {dateError && <p className="col-span-2 text-[11px] text-error md:col-span-1" role="status">{dateError}</p>}
    </div>
    <div className="flex min-w-0 items-center justify-between gap-2 md:justify-end">
      <p className="whitespace-nowrap font-bold text-primary">{formatEquipmentListingRate(item.estimatedRentalAmount, item.currency)}</p>
      <button aria-label={`Xóa ${item.name} khỏi giỏ`} className="shrink-0 rounded p-2 text-muted-foreground hover:text-error disabled:opacity-40" disabled={busy} onClick={() => void removeItem(item.cartItemId)} type="button"><Trash2 className="size-4" /></button>
    </div>
  </article>;
}

export function CartPage() {
  const { items, loading, busy, hasLoadError, clear, refresh } = useCart();
  const [excluded, setExcluded] = useState<string[]>([]);
  const selected = items.filter((item) => !excluded.includes(item.cartItemId));
  const selectedAll = selected.length === items.length;
  const subtotal = selected.reduce((sum, item) => sum + (item.estimatedRentalAmount ?? 0), 0);
  const hasUnpriced = selected.some((item) => item.estimatedRentalAmount == null);
  const currency = selected[0]?.currency || "VND";
  return <div className="flex-1 bg-background py-6">
    <Container>
      <nav aria-label="Đường dẫn giỏ hàng" className="mb-7 flex gap-2 text-xs text-muted-foreground"><HomeLink className="hover:text-primary">Trang chủ</HomeLink><span>/</span><span aria-current="page" className="text-foreground">Giỏ hàng</span></nav>
      {loading ? <p className="py-20 text-center text-muted-foreground">Đang tải giỏ hàng...</p> : hasLoadError && items.length === 0 ?
        <ErrorState
          action={<Button onClick={() => void refresh()} type="button">Thử lại</Button>}
          className="min-h-[400px]"
          description="Giỏ hàng đang tạm thời không hiển thị. Vui lòng thử lại."
          title="Không thể tải giỏ hàng"
        /> : items.length === 0 ?
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 py-10 sm:flex-row sm:py-16">
          <div className="w-full sm:w-1/2"><EmptyCartIllustration /></div>
          <div className="text-center sm:text-left"><h1 className="text-xl font-bold">Giỏ hàng của bạn đang rỗng!</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Hãy chọn thiết bị phù hợp và thêm vào giỏ hàng để lên kế hoạch thuê.</p><Link className="mt-5 inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90" href="/search">Xem thiết bị cho thuê <ArrowRight className="size-4" /></Link></div>
        </div> :
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2 text-xl font-bold"><ShoppingBasket className="size-6 text-primary" />Giỏ hàng của bạn</h1><button className="text-xs text-muted-foreground underline hover:text-error disabled:opacity-40" disabled={busy} onClick={() => void clear()} type="button">Xóa toàn bộ</button></div>
          <div className="border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase md:grid md:grid-cols-[minmax(0,1fr)_100px_185px_235px] md:gap-4">
            <label className="flex items-center gap-2"><input checked={selectedAll} className="size-4 accent-primary" onChange={() => setExcluded(selectedAll ? items.map((item) => item.cartItemId) : [])} type="checkbox" />Tất cả ({items.length} sản phẩm)</label>
            <span className="hidden md:block">Số lượng</span><span className="hidden md:block">Ngày thuê</span><span className="hidden text-right md:block">Thành tiền</span>
          </div>
          <div className="px-1 sm:px-4">{items.map((item) => <CartRow key={item.cartItemId} item={item} selected={!excluded.includes(item.cartItemId)} onSelect={() => setExcluded((current) => current.includes(item.cartItemId) ? current.filter((id) => id !== item.cartItemId) : [...current, item.cartItemId])} />)}</div>
          <div className="mt-5 flex flex-col items-end gap-3"><p className="text-sm">Tạm tính ({selected.length} sản phẩm): <strong className="ml-2 text-lg text-primary">{formatEquipmentListingRate(subtotal, currency)}</strong></p>{hasUnpriced && <p className="text-xs text-muted-foreground">Một số thiết bị chưa có giá thuê; tạm tính chưa bao gồm các mục đó.</p>}<p className="text-xs text-muted-foreground">Giá thuê và tình trạng thiết bị có thể thay đổi khi xác nhận đơn.</p><Link className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary" href="/search">Tiếp tục chọn thiết bị <ArrowRight className="size-4" /></Link></div>
        </>}
    </Container>
  </div>;
}
