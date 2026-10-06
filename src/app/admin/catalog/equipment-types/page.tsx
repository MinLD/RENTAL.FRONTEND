import { EquipmentTypeManagementTable } from "@/components/admin/catalog/equipment-types/equipment-type-management-table";
import {
  createCatalogEquipmentTypeAction,
  createCatalogSpecSchemaDraftAction,
  disableCatalogEquipmentTypeAction,
  getAdminCatalogEquipmentTypesAction,
  getAdminCatalogEquipmentTypeAction,
  getCatalogSpecSchemaAction,
  listCatalogSpecSchemasAction,
  listActiveCatalogCategoriesAction,
  publishCatalogEquipmentTypeAction,
  publishCatalogSpecSchemaDraftAction,
  replaceCatalogSpecSchemaDraftAction,
  updateCatalogEquipmentTypeAction,
} from "@/services/actions/catalog-actions";

export default function AdminCatalogEquipmentTypesPage() {
  return (
    <EquipmentTypeManagementTable
      schemaActions={{
        createDraft: createCatalogSpecSchemaDraftAction,
        fetchVersion: getCatalogSpecSchemaAction,
        fetchVersions: listCatalogSpecSchemasAction,
        publishDraft: publishCatalogSpecSchemaDraftAction,
        replaceDraft: replaceCatalogSpecSchemaDraftAction,
      }}
      createEquipmentType={createCatalogEquipmentTypeAction}
      disableEquipmentType={disableCatalogEquipmentTypeAction}
      fetchCategories={listActiveCatalogCategoriesAction}
      fetchEquipmentTypeDetail={getAdminCatalogEquipmentTypeAction}
      fetchEquipmentTypes={getAdminCatalogEquipmentTypesAction}
      publishEquipmentType={publishCatalogEquipmentTypeAction}
      updateEquipmentType={updateCatalogEquipmentTypeAction}
    />
  );
}
