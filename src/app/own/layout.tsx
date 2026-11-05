import { cookies } from "next/headers";

import { NotificationProvider } from "@/providers/notification-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { filterDashboardNavigationByPermissions } from "@/config/admin-navigation";
import { OW_NAVIGATION } from "@/config/ow-navigation";
import { AUTH_COOKIE_NAMES } from "@/services/auth-cookie";
import { getJwtPermissions } from "@/services/auth-token";
import { getCurrentUser } from "@/services/session-service";
import {
  getInitialNotificationsForServer,
  getUnreadCountForServer,
} from "@/services/notification-server-service";

export default async function OwLayout({ children }: LayoutProps<"/own">) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES[0])?.value;
  const permissions = accessToken ? getJwtPermissions(accessToken) : [];
  const navigation = filterDashboardNavigationByPermissions(
    OW_NAVIGATION,
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
      <DashboardShell homeHref="/own" navigation={navigation} user={user}>
        {children}
      </DashboardShell>
    </NotificationProvider>
  );
}
