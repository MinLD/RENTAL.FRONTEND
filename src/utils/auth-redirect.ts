import { getSafeReturnTo, type ReturnToSearchParams } from "@/utils/return-to";

export { getSafeReturnTo } from "@/utils/return-to";
export const LOGIN_REQUIRED_TOAST_ID = "login-required";

export type AuthSearchParams = ReturnToSearchParams;

export function authPageHref(
  pathname: "/login" | "/register" | "/forgot-password",
  returnTo?: string | null,
  loginRequired = false,
) {
  const params = new URLSearchParams();
  const destination = getSafeReturnTo(returnTo);
  if (destination) params.set("returnTo", destination);
  if (loginRequired) params.set("reason", "auth_required");
  return params.size ? `${pathname}?${params}` : pathname;
}

export function getAuthPageOptions(params: AuthSearchParams) {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  return {
    returnTo: getSafeReturnTo(first(params.returnTo)) ?? "/",
    loginRequired: first(params.reason) === "auth_required",
  };
}
