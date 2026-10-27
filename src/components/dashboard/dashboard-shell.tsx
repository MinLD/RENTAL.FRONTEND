"use client";

import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { AuthUser } from "@/types/auth";
import type { DashboardNavigationItem } from "@/types/dashboard-navigation";
import {
  getAuthUserDisplayName,
  getAuthUserRoleLabel,
} from "@/utils/auth-user";

type DashboardShellProps = {
  children: ReactNode;
  homeHref?: string;
  navigation: DashboardNavigationItem[];
  user: AuthUser | null;
};

export function DashboardShell({
  children,
  homeHref,
  navigation,
  user,
}: DashboardShellProps) {
  const canNavigateHome = Boolean(
    homeHref !== "/admin" &&
      user?.roles?.some((r) => r.toLowerCase() === "customer"),
  );

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <DashboardSidebar
        homeHref={homeHref}
        items={navigation}
        user={
          user
            ? {
                avatarUrl: user.avatarUrl,
                canNavigateHome,
                name: getAuthUserDisplayName(user),
                roleLabel: getAuthUserRoleLabel(user),
              }
            : null
        }
      />
      <SidebarInset className="h-svh min-h-0 min-w-0 overflow-hidden bg-[#f5f7fb]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-2 text-muted-foreground" />
            <div className="hidden rounded border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground md:block">
              Công vận hành & quản trị
            </div>
          </div>

          <NotificationDropdown isAuthenticated={Boolean(user)} iconClassName="size-4" />
        </header>

        <main className="h-[calc(100svh-4rem)] min-h-0 min-w-0 flex-none overflow-hidden bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
