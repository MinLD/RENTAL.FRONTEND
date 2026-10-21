import { ProductBrowseView } from "@/components/products/product-browse-view";
import { getProductBrowseData } from "@/services/product-browse-server-service";
import type { ProductBrowseSearchParams } from "@/services/product-browse-server-service";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<ProductBrowseSearchParams>;
}) {
  const data = await getProductBrowseData(await searchParams);
  return <ProductBrowseView {...data} />;
}
