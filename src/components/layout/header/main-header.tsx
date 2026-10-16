import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { getCurrentUser } from "@/services/session-service";
import { Bell, ShoppingCart } from "lucide-react";
import { AuthLinks } from "./auth-links";
import { EquipmentSearch } from "./equipment-search";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";

export async function MainHeader({ catalogMenu }: { catalogMenu: ReactNode }) {
  const user = await getCurrentUser();

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

        <div className="order-last flex w-full min-w-0 items-center gap-2 lg:order-none lg:mx-auto lg:max-w-2xl lg:flex-1">
          {catalogMenu}

          <EquipmentSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:ml-0">
          <button
            aria-label="Thông báo"
            className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
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

          <div className="hidden shrink-0 justify-end sm:flex">
            {user ? <UserMenu user={user} /> : <AuthLinks />}
          </div>

          {user ? (
            <div className="shrink-0 sm:hidden">
              <UserMenu user={user} />
            </div>
          ) : null}

          <MobileMenu user={user} />
        </div>
      </Container>
    </div>
  );
}
