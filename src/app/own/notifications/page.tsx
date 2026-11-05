import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationInboxView } from "@/components/notifications/notification-inbox-view";
import { getCurrentUser } from "@/services/session-service";
import { getNotificationsForServer } from "@/services/notification-server-service";
import type { NotificationStatusFilter } from "@/types/notifications";

export const metadata: Metadata = {
  title: "Thông báo - Nhà cung cấp",
};

export default async function OwnNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
    status?: string | string[];
    category?: string | string[];
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnTo=%2Fown%2Fnotifications");
  }

  const params = await searchParams;
  const page = Math.max(
    1,
    Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1,
  );
  const statusParam = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const status: NotificationStatusFilter =
    statusParam === "unread" ? "unread" : "all";
  const category =
    (Array.isArray(params.category) ? params.category[0] : params.category) ??
    "all";

  const initialData = await getNotificationsForServer({
    page,
    pageSize: 20,
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
  });

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <NotificationInboxView
        basePath="/own/notifications"
        initialData={initialData}
        initialParams={{ page, status, category }}
      />
    </div>
  );
}
