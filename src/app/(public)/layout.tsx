import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PartnerHistoryRefresh } from "@/components/partner/partner-history-refresh";
import { PublicAreaProvider } from "@/providers/public-area-provider";
import { CartProvider } from "@/providers/cart-provider";
import { PaymentHubProvider } from "@/providers/payment-hub-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { getStoredPublicArea } from "@/services/public-area-server-service";
import { getCurrentUser } from "@/services/session-service";
import { getRentalCartForServer } from "@/services/rental-cart-server-service";

type SiteLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function SiteLayout({ children }: SiteLayoutProps) {
  const [initialArea, user] = await Promise.all([getStoredPublicArea(), getCurrentUser()]);
  const initialCart = user ? await getRentalCartForServer() : undefined;
  return (
    <PublicAreaProvider initialArea={initialArea}>
      <CartProvider
        key={user?.id ?? "guest"}
        initialItems={initialCart ?? undefined}
        userId={user?.id ?? null}
      >
        <PaymentHubProvider enabled={Boolean(user)}>
          <NotificationProvider
            key={user?.id ?? "guest"}
            userId={user?.id ?? null}
          >
            <div className="flex min-h-screen flex-col">
              <PartnerHistoryRefresh />
              <Header />
              <main className="flex flex-1 flex-col">{children}</main>
              <Footer />
            </div>
          </NotificationProvider>
        </PaymentHubProvider>
      </CartProvider>
    </PublicAreaProvider>
  );
}
