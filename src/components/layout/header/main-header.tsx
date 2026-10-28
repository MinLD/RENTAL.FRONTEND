import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { HomeLink } from "@/components/layout/home-link";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { getCurrentUser } from "@/services/session-service";
import { CartTrigger } from "@/components/cart/cart-trigger";
import { AuthLinks } from "./auth-links";
import { EquipmentSearch } from "./equipment-search";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";
import { BrandLogo } from "@/components/brand/brand-logo";

export async function MainHeader({ catalogMenu }: { catalogMenu: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="border-b border-border bg-background">
      <Container className="flex min-h-14 flex-wrap items-center gap-3 py-2 md:gap-4 lg:h-14 lg:flex-nowrap lg:py-0">
        <HomeLink
          aria-label="DPU Rental - Trang chủ"
          className="w-32 shrink-0"
        >
          <BrandLogo />
        </HomeLink>

        <div className="order-last flex w-full min-w-0 items-center gap-2 lg:order-none lg:mx-auto lg:max-w-2xl lg:flex-1">
          {catalogMenu}

          <EquipmentSearch key={user?.id ?? "guest"} userId={user?.id ?? null} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:ml-0">
          <NotificationDropdown isAuthenticated={Boolean(user)} />

          <CartTrigger />

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
