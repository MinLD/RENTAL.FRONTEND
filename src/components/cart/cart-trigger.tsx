"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { ProductImage } from "@/components/products/product-image";
import { formatEquipmentListingRate } from "@/utils/inventory";

export function CartTrigger() {
  const { items, loading, busy, removeItem } = useCart();
  return (
    <div className="group relative">
      <Link
        aria-label={`Giỏ hàng, ${items.length} sản phẩm`}
        className="relative inline-flex size-9 items-center justify-center rounded border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
        href="/cart"
      >
        <ShoppingCart size={20} aria-hidden="true" />
        {items.length > 0 && <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground">{items.length > 99 ? "99+" : items.length}</span>}
      </Link>
      <div className="invisible absolute right-0 top-full z-50 hidden w-80 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 sm:block">
        <div className="rounded-lg border border-border bg-background p-4 shadow-xl">
          <p className="mb-3 font-semibold">Giỏ hàng của bạn</p>
          {loading ? <p className="text-sm text-muted-foreground">Đang tải giỏ hàng...</p> : items.length === 0 ?
            <p className="py-6 text-center text-sm text-muted-foreground">Giỏ hàng của bạn đang rỗng</p> :
            <div className="max-h-80 divide-y divide-border/60 overflow-y-auto">
              {items.slice(0, 5).map((item) => <div key={item.cartItemId} className="flex gap-3 py-3">
                <Link href={`/products/${item.equipmentListingId}`} className="relative size-14 shrink-0 overflow-hidden rounded bg-muted"><ProductImage compact name={item.name} role="thumbnail" src={item.thumbnailUrl} sizes="56px" /></Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.equipmentListingId}`} className="line-clamp-2 text-xs font-medium hover:text-primary">{item.name}</Link>
                  <p className="mt-1 text-xs text-muted-foreground">{item.quantity} thiết bị · {item.expectedStartDate} → {item.expectedEndDate}</p>
                  <p className="text-xs font-semibold text-primary">{formatEquipmentListingRate(item.estimatedRentalAmount, item.currency)}</p>
                </div>
                <button aria-label={`Xóa ${item.name}`} className="self-start text-muted-foreground hover:text-error" disabled={busy} onClick={() => void removeItem(item.cartItemId)} type="button"><Trash2 className="size-4" /></button>
              </div>)}
              {items.length > 5 && <p className="py-2 text-center text-xs text-muted-foreground">Và {items.length - 5} thiết bị khác</p>}
            </div>}
          <Link href="/cart" className="mt-3 flex h-9 items-center justify-center rounded bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">Xem giỏ hàng</Link>
        </div>
      </div>
    </div>
  );
}
