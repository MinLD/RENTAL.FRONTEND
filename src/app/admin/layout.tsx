import { cookies } from "next/headers";

import { NotificationProvider } from "@/providers/notification-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  ADMIN_NAVIGATION,
  filterDashboardNavigationByPermissions,
} from "@/config/admin-navigation";
import { AUTH_COOKIE_NAMES } from "@/services/auth-cookie";
import { getJwtPermissions } from "@/services/auth-token";
import { getCurrentUser } from "@/services/session-service";
import {
  getInitialNotificationsForServer,
  getUnreadCountForServer,
} from "@/services/notification-server-service";

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
  const [user, initialUnreadCount, initialNotifications] = await Promise.all([
    getCurrentUser(),
    getUnreadCountForServer(),
    getInitialNotificationsForServer(),
  ]);

  return (
    <NotificationProvider
      key={user?.id ?? "guest"}
      userId={user?.id ?? null}
      initialUnreadCount={initialUnreadCount}
      initialNotifications={initialNotifications}
    >
      <DashboardShell navigation={navigation} user={user}>
        {children}
      </DashboardShell>
    </NotificationProvider>
  );
}
