import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { NotificationInboxView } from "@/components/notifications/notification-inbox-view";
import { getCurrentUser } from "@/services/session-service";
import { getNotificationsForServer } from "@/services/notification-server-service";
import type { NotificationStatusFilter } from "@/types/notifications";

export const metadata: Metadata = {
  title: "Thông báo",
};

export default async function PublicNotificationsPage({
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
    redirect("/login?returnTo=/notifications");
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
    <Container className="py-6 sm:py-10">
      <NotificationInboxView
        basePath="/notifications"
        initialData={initialData}
        initialParams={{ page, status, category }}
      />
    </Container>
  );
}
