import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/products/detail/product-detail-view";
import { getPublicEquipmentListing } from "@/services/queries/inventory-queries";
import { getCatalogEquipmentTypeSchemaVersion } from "@/services/queries/catalog-queries";
import { getCurrentUser } from "@/services/session-service";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, user] = await Promise.all([getPublicEquipmentListing(id), getCurrentUser()]);
  if (!result.success) {
    if (result.error.status === 404 || result.error.status === 400) notFound();
    throw new Error(result.error.message);
  }
  const schema = await getCatalogEquipmentTypeSchemaVersion(
    result.data.equipmentTypeId,
    result.data.schemaVersion,
  );
  return (
    <ProductDetailView
      isAuthenticated={Boolean(user)}
      product={result.data}
      specificationFields={schema.success ? schema.data.fields : undefined}
    />
  );
}
