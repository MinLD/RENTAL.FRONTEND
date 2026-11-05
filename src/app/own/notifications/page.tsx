import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationInboxView } from "@/components/notifications/notification-inbox-view";
import { getCurrentUser } from "@/services/session-service";

export const metadata: Metadata = {
  title: "Thông báo - Nhà cung cấp",
};

export default async function OwnNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnTo=%2Fown%2Fnotifications");
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <NotificationInboxView basePath="/own/notifications" />
    </div>
  );
}
