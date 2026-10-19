import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PartnerHistoryRefresh } from "@/components/partner/partner-history-refresh";
import { PublicAreaProvider } from "@/providers/public-area-provider";
import { getStoredPublicArea } from "@/services/public-area-server-service";

type SiteLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function SiteLayout({ children }: SiteLayoutProps) {
  const initialArea = await getStoredPublicArea();
  return (
    <PublicAreaProvider initialArea={initialArea}>
      <div className="flex min-h-screen flex-col">
        <PartnerHistoryRefresh />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </div>
    </PublicAreaProvider>
  );
}
