"use server";

import * as service from "@/services/admin-users-server-service";
import { runServerAction } from "@/services/server-action";

export async function getUsersAction(
  ...args: Parameters<typeof service.getUsers>
) {
  return runServerAction(() => service.getUsers(...args));
}

export async function getUserDetailAction(
  ...args: Parameters<typeof service.getUserDetail>
) {
  return runServerAction(() => service.getUserDetail(...args));
}

export async function createUserAction(
  ...args: Parameters<typeof service.createUser>
) {
  return runServerAction(() => service.createUser(...args));
}

export async function updateUserAction(
  ...args: Parameters<typeof service.updateUser>
) {
  return runServerAction(() => service.updateUser(...args));
}

export async function lockUserAction(
  ...args: Parameters<typeof service.lockUser>
) {
  return runServerAction(() => service.lockUser(...args));
}

export async function unlockUserAction(
  ...args: Parameters<typeof service.unlockUser>
) {
  return runServerAction(() => service.unlockUser(...args));
}

export async function getAdminRolesAction(
  ...args: Parameters<typeof service.getAdminRoles>
) {
  return runServerAction(() => service.getAdminRoles(...args));
}
