import { QueryProvider } from "@/providers/query-provider";
import { getCatalogNavigationInitialData } from "@/services/catalog-navigation-server-service";
import { EquipmentCatalogMenu } from "./equipment-catalog-menu";
import { MainHeader } from "./main-header";
import { Navigation } from "./navigation";
import { TopBar } from "./top-bar";

export async function Header() {
  const initialData = await getCatalogNavigationInitialData();
  return (
    <QueryProvider>
      <header>
        <TopBar />
        <MainHeader
          catalogMenu={
            <EquipmentCatalogMenu initialData={initialData} mobile />
          }
        />
        <Navigation
          catalogMenu={<EquipmentCatalogMenu initialData={initialData} />}
        />
      </header>
    </QueryProvider>
  );
}
