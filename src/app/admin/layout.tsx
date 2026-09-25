import { cookies } from "next/headers";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  ADMIN_NAVIGATION,
  filterDashboardNavigationByPermissions,
} from "@/config/admin-navigation";
import { AUTH_COOKIE_NAMES } from "@/services/auth-cookie";
import { getJwtPermissions } from "@/services/auth-token";
import { getCurrentUser } from "@/services/session-service";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES[0])?.value;
  const permissions = accessToken ? getJwtPermissions(accessToken) : [];
  const navigation = filterDashboardNavigationByPermissions(
    ADMIN_NAVIGATION,
    permissions,
  );
  const user = await getCurrentUser();

  return (
    <DashboardShell navigation={navigation} user={user}>
      {children}
    </DashboardShell>
  );
}
