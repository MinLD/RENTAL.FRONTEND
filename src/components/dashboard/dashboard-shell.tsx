"use client";

import { Bell, ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { logout } from "@/services/auth-service";
import type { AuthUser } from "@/types/auth";
import type { DashboardNavigationItem } from "@/types/dashboard-navigation";

type DashboardShellProps = {
  children: ReactNode;
  navigation: DashboardNavigationItem[];
  user: AuthUser | null;
};

export function DashboardShell({
  children,
  navigation,
  user,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar
        items={navigation}
        user={
          user
            ? {
                name: user.name,
                roleLabel: user.roleLabel,
              }
            : null
        }
      />
      <SidebarInset className="min-h-svh bg-[#f5f7fb]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-2 text-muted-foreground" />
            <div className="hidden rounded border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground md:block">
              Công vận hành & quản trị
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Thông báo"
              className="relative flex size-9 items-center justify-center rounded border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary"
              type="button"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
            </button>
            <DashboardUserDropdown user={user} />
          </div>
        </header>

        <main className="min-h-[calc(100svh-4rem)] p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardUserDropdown({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      toast.success("Đăng xuất thành công.");
      setIsOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể đăng xuất. Vui lòng thử lại.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        className="flex h-11 items-center gap-3 rounded border border-border bg-background px-3 text-left transition-colors hover:border-primary"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
          {getUserInitials(user?.name)}
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block max-w-36 truncate text-xs font-bold text-foreground">
            {user?.name ?? "Quản trị viên"}
          </span>
          <span className="block max-w-36 truncate text-[11px] text-muted-foreground">
            {user?.roleLabel ?? "Quản trị hệ thống"}
          </span>
        </span>
        <ChevronDown
          className={`hidden size-4 shrink-0 text-muted-foreground transition-transform md:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded border border-border bg-background py-2 shadow-lg">
          <Link
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            href="/account"
            onClick={() => setIsOpen(false)}
          >
            <UserRound size={16} />
            Tài khoản của tôi
          </Link>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function getUserInitials(name?: string) {
  if (!name) {
    return "AD";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
