"use server";

import * as service from "@/services/admin-organizations-server-service";
import { runServerAction } from "@/services/server-action";

export async function getAdminOrganizationsAction(
  ...args: Parameters<typeof service.getAdminOrganizations>
) {
  return runServerAction(() => service.getAdminOrganizations(...args));
}

export async function getAdminOrganizationDetailAction(
  ...args: Parameters<typeof service.getAdminOrganizationDetail>
) {
  return runServerAction(() => service.getAdminOrganizationDetail(...args));
}

export async function getAdminOrganizationHistoryAction(
  ...args: Parameters<typeof service.getAdminOrganizationHistory>
) {
  return runServerAction(() => service.getAdminOrganizationHistory(...args));
}

export async function approveAdminOrganizationAction(
  ...args: Parameters<typeof service.approveAdminOrganization>
) {
  return runServerAction(() => service.approveAdminOrganization(...args));
}

export async function rejectAdminOrganizationAction(
  ...args: Parameters<typeof service.rejectAdminOrganization>
) {
  return runServerAction(() => service.rejectAdminOrganization(...args));
}

export async function suspendAdminOrganizationAction(
  ...args: Parameters<typeof service.suspendAdminOrganization>
) {
  return runServerAction(() => service.suspendAdminOrganization(...args));
}

export async function activateAdminOrganizationAction(
  ...args: Parameters<typeof service.activateAdminOrganization>
) {
  return runServerAction(() => service.activateAdminOrganization(...args));
}
