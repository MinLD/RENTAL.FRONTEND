import { ProductsManagementTable } from "@/components/own/products/products-management-table";
import { getOwnEquipmentListingsAction } from "@/services/actions/inventory-actions";

export default function OwnProductsPage() {
  return <ProductsManagementTable fetchProducts={getOwnEquipmentListingsAction} />;
}
