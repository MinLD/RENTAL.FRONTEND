import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Bell, ShoppingCart } from "lucide-react";
import { MobileMenu } from "./mobile-menu";
import { HeaderAuthSlot } from "./header-auth-slot";

export function MainHeader() {
  return (
    <div className="border-b border-border bg-background">
      <Container className="flex min-h-14 flex-wrap items-center gap-3 py-2 md:gap-4 lg:h-14 lg:flex-nowrap lg:py-0">
        <Link
          aria-label="DPRENTAL - Trang chủ"
          className="w-32 shrink-0 leading-none"
          href="/"
        >
          <span className="block text-lg font-bold tracking-tight text-foreground">
            DP<span className="text-primary">RENTAL</span>
          </span>
          <span className="mt-1 block text-[8px] font-medium uppercase tracking-wide text-muted-foreground">
            Sàn thiết bị công trường
          </span>
        </Link>

        <form
          aria-label="Tìm kiếm thiết bị"
          className="order-last flex h-9 w-full min-w-0 overflow-hidden rounded border border-primary md:order-none md:flex-1"
        >
          <label className="sr-only" htmlFor="header-search">
            Tìm kiếm thiết bị
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3 text-muted-foreground focus-within:text-primary">
            <svg
              aria-hidden="true"
              className="size-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="m16 16 4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              id="header-search"
              name="q"
              placeholder="Bạn cần thuê thiết bị gì? (ví dụ: máy xúc...)"
              type="search"
            />
          </div>
          <button
            className="inline-flex shrink-0 items-center gap-1.5 bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
          >
            TÌM MÁY
            <svg
              aria-hidden="true"
              className="size-3.5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m16 16 4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            aria-label="Thông báo"
            className="relative inline-flex size-9 items-center justify-center rounded border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
            type="button"
          >
            <Bell size="20" />
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-0.5 size-1.5 rounded-full bg-primary"
            />
          </button>

          <Link
            aria-label="Giỏ hàng, 6 sản phẩm"
            className="relative inline-flex size-9 items-center justify-center rounded border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
            href="/cart"
          >
            <ShoppingCart size="20" />
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground"
            >
              6
            </span>
          </Link>

          <div className="hidden w-[220px] shrink-0 justify-end sm:flex">
            <HeaderAuthSlot />
          </div>

          <MobileMenu />
        </div>
      </Container>
    </div>
  );
}
