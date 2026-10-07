"use server";

import * as service from "@/services/catalog-server-service";
import { runServerAction } from "@/services/server-action";

export async function listCatalogBrandsAction(
  ...args: Parameters<typeof service.listCatalogBrands>
) {
  return runServerAction(() => service.listCatalogBrands(...args));
}

export async function getCatalogBrandAction(
  ...args: Parameters<typeof service.getCatalogBrand>
) {
  return runServerAction(() => service.getCatalogBrand(...args));
}

export async function listAdminCatalogBrandsAction(
  ...args: Parameters<typeof service.listAdminCatalogBrands>
) {
  return runServerAction(() => service.listAdminCatalogBrands(...args));
}

export async function getAdminCatalogBrandsAction(
  ...args: Parameters<typeof service.getAdminCatalogBrands>
) {
  return runServerAction(() => service.getAdminCatalogBrands(...args));
}

export async function getAdminCatalogBrandAction(
  ...args: Parameters<typeof service.getAdminCatalogBrand>
) {
  return runServerAction(() => service.getAdminCatalogBrand(...args));
}

export async function createCatalogBrandAction(
  ...args: Parameters<typeof service.createCatalogBrand>
) {
  return runServerAction(() => service.createCatalogBrand(...args));
}

export async function updateCatalogBrandAction(
  ...args: Parameters<typeof service.updateCatalogBrand>
) {
  return runServerAction(() => service.updateCatalogBrand(...args));
}

export async function disableCatalogBrandAction(
  ...args: Parameters<typeof service.disableCatalogBrand>
) {
  return runServerAction(() => service.disableCatalogBrand(...args));
}

export async function enableCatalogBrandAction(
  ...args: Parameters<typeof service.enableCatalogBrand>
) {
  return runServerAction(() => service.enableCatalogBrand(...args));
}

export async function listCatalogCategoriesAction(
  ...args: Parameters<typeof service.listCatalogCategories>
) {
  return runServerAction(() => service.listCatalogCategories(...args));
}

export async function getAdminCatalogCategoriesAction(
  ...args: Parameters<typeof service.getAdminCatalogCategories>
) {
  return runServerAction(() => service.getAdminCatalogCategories(...args));
}

export async function getAdminCatalogCategoryAction(
  ...args: Parameters<typeof service.getAdminCatalogCategory>
) {
  return runServerAction(() => service.getAdminCatalogCategory(...args));
}

export async function getCatalogCategoryAction(
  ...args: Parameters<typeof service.getCatalogCategory>
) {
  return runServerAction(() => service.getCatalogCategory(...args));
}

export async function listActiveCatalogCategoriesAction(
  ...args: Parameters<typeof service.listActiveCatalogCategories>
) {
  return runServerAction(() => service.listActiveCatalogCategories(...args));
}

export async function createCatalogCategoryAction(
  ...args: Parameters<typeof service.createCatalogCategory>
) {
  return runServerAction(() => service.createCatalogCategory(...args));
}

export async function updateCatalogCategoryAction(
  ...args: Parameters<typeof service.updateCatalogCategory>
) {
  return runServerAction(() => service.updateCatalogCategory(...args));
}

export async function listCatalogEquipmentTypesAction(
  ...args: Parameters<typeof service.listCatalogEquipmentTypes>
) {
  return runServerAction(() => service.listCatalogEquipmentTypes(...args));
}

export async function getAdminCatalogEquipmentTypesAction(
  ...args: Parameters<typeof service.getAdminCatalogEquipmentTypes>
) {
  return runServerAction(() => service.getAdminCatalogEquipmentTypes(...args));
}

export async function getAdminCatalogEquipmentTypeAction(
  ...args: Parameters<typeof service.getAdminCatalogEquipmentType>
) {
  return runServerAction(() => service.getAdminCatalogEquipmentType(...args));
}

export async function getCatalogEquipmentTypeAction(
  ...args: Parameters<typeof service.getCatalogEquipmentType>
) {
  return runServerAction(() => service.getCatalogEquipmentType(...args));
}

export async function getCatalogEquipmentTypeSchemaAction(
  ...args: Parameters<typeof service.getCatalogEquipmentTypeSchema>
) {
  return runServerAction(() => service.getCatalogEquipmentTypeSchema(...args));
}

export async function getCatalogEquipmentTypeSchemaVersionAction(
  ...args: Parameters<typeof service.getCatalogEquipmentTypeSchemaVersion>
) {
  return runServerAction(() =>
    service.getCatalogEquipmentTypeSchemaVersion(...args),
  );
}

export async function validateCatalogSpecificationsAction(
  ...args: Parameters<typeof service.validateCatalogSpecifications>
) {
  return runServerAction(() => service.validateCatalogSpecifications(...args));
}

export async function createCatalogEquipmentTypeAction(
  ...args: Parameters<typeof service.createCatalogEquipmentType>
) {
  return runServerAction(() => service.createCatalogEquipmentType(...args));
}

export async function updateCatalogEquipmentTypeAction(
  ...args: Parameters<typeof service.updateCatalogEquipmentType>
) {
  return runServerAction(() => service.updateCatalogEquipmentType(...args));
}

export async function publishCatalogEquipmentTypeAction(
  ...args: Parameters<typeof service.publishCatalogEquipmentType>
) {
  return runServerAction(() => service.publishCatalogEquipmentType(...args));
}

export async function disableCatalogEquipmentTypeAction(
  ...args: Parameters<typeof service.disableCatalogEquipmentType>
) {
  return runServerAction(() => service.disableCatalogEquipmentType(...args));
}

export async function listCatalogSpecSchemasAction(
  ...args: Parameters<typeof service.listCatalogSpecSchemas>
) {
  return runServerAction(() => service.listCatalogSpecSchemas(...args));
}

export async function createCatalogSpecSchemaDraftAction(
  ...args: Parameters<typeof service.createCatalogSpecSchemaDraft>
) {
  return runServerAction(() => service.createCatalogSpecSchemaDraft(...args));
}

export async function getCatalogSpecSchemaAction(
  ...args: Parameters<typeof service.getCatalogSpecSchema>
) {
  return runServerAction(() => service.getCatalogSpecSchema(...args));
}

export async function replaceCatalogSpecSchemaDraftAction(
  ...args: Parameters<typeof service.replaceCatalogSpecSchemaDraft>
) {
  return runServerAction(() => service.replaceCatalogSpecSchemaDraft(...args));
}

export async function publishCatalogSpecSchemaDraftAction(
  ...args: Parameters<typeof service.publishCatalogSpecSchemaDraft>
) {
  return runServerAction(() => service.publishCatalogSpecSchemaDraft(...args));
}
