import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { NotificationInboxView } from "@/components/notifications/notification-inbox-view";
import { getCurrentUser } from "@/services/session-service";

export const metadata: Metadata = {
  title: "Thông báo",
};

export default async function PublicNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnTo=/notifications");
  }

  return (
    <Container className="py-6 sm:py-10">
      <NotificationInboxView basePath="/notifications" />
    </Container>
  );
}
