import { EquipmentTypeManagementTable } from "@/components/admin/catalog/equipment-types/equipment-type-management-table";
import {
  createCatalogEquipmentTypeAction,
  disableCatalogEquipmentTypeAction,
  getAdminCatalogEquipmentTypesAction,
  getCatalogEquipmentTypeAction,
  listActiveCatalogCategoriesAction,
  publishCatalogEquipmentTypeAction,
  updateCatalogEquipmentTypeAction,
} from "@/services/actions/catalog-actions";

export default function AdminCatalogEquipmentTypesPage() {
  return (
    <EquipmentTypeManagementTable
      createEquipmentType={createCatalogEquipmentTypeAction}
      disableEquipmentType={disableCatalogEquipmentTypeAction}
      fetchCategories={listActiveCatalogCategoriesAction}
      fetchEquipmentTypeDetail={getCatalogEquipmentTypeAction}
      fetchEquipmentTypes={getAdminCatalogEquipmentTypesAction}
      publishEquipmentType={publishCatalogEquipmentTypeAction}
      updateEquipmentType={updateCatalogEquipmentTypeAction}
    />
  );
}
