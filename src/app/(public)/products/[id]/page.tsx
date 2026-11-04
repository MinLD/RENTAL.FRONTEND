import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/products/detail/product-detail-view";
import {
  getPublicEquipmentListing,
  getPublicEquipmentListings,
} from "@/services/queries/inventory-queries";
import { getCatalogEquipmentTypeSchemaVersion } from "@/services/queries/catalog-queries";
import { getCurrentUser } from "@/services/session-service";
import { getOrganizationSupplierContact } from "@/services/organization-server-service";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, user] = await Promise.all([
    getPublicEquipmentListing(id),
    getCurrentUser(),
  ]);
  if (!result.success) {
    if (result.error.status === 404 || result.error.status === 400) notFound();
    throw new Error(result.error.message);
  }
  const primaryCategoryId = result.data.categoryIds?.[0];

  const [schema, relatedListingsResult, organization] = await Promise.all([
    getCatalogEquipmentTypeSchemaVersion(
      result.data.equipmentTypeId,
      result.data.schemaVersion,
    ),
    getPublicEquipmentListings(
      primaryCategoryId
        ? { categoryId: primaryCategoryId, pageSize: 12 }
        : { equipmentTypeId: result.data.equipmentTypeId, pageSize: 12 },
    ),
    getOrganizationSupplierContact(result.data.organizationId),
  ]);

  const relatedProducts = relatedListingsResult.success
    ? relatedListingsResult.data.items.filter((item) => item.id !== result.data.id)
    : [];
  return (
    <ProductDetailView
      isAuthenticated={Boolean(user)}
      isProfileCompleted={user?.isProfileCompleted ?? false}
      organization={organization}
      product={result.data}
      relatedProducts={relatedProducts}
      specificationFields={schema.success ? schema.data.fields : undefined}
    />
  );
}
