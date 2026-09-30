"use client";

import { Bell } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
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
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <DashboardSidebar
        homeHref={homeHref}
        items={navigation}
        user={
          user
            ? {
                avatarUrl: user.avatarUrl,
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

          <button
            aria-label="Thông báo"
            className="relative flex size-9 cursor-pointer items-center justify-center rounded border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary"
            type="button"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
          </button>
        </header>

        <main className="h-[calc(100svh-4rem)] min-h-0 min-w-0 flex-none overflow-hidden bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
