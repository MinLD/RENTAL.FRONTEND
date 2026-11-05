import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationInboxView } from "@/components/notifications/notification-inbox-view";
import { getCurrentUser } from "@/services/session-service";

export const metadata: Metadata = {
  title: "Thông báo - Quản trị viên",
};

export default async function AdminNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnTo=%2Fadmin%2Fnotifications");
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <NotificationInboxView basePath="/admin/notifications" />
    </div>
  );
}
