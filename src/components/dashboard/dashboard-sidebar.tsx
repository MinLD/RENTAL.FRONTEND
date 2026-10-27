"use client";

import Link from "next/link";
import { ChevronDown, Home, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DashboardIcon } from "@/components/dashboard/dashboard-icon";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logout } from "@/services/auth-service";
import type { DashboardNavigationItem } from "@/types/dashboard-navigation";
import { cn } from "@/utils/cn";

type DashboardSidebarProps = {
  homeHref?: string;
  items: DashboardNavigationItem[];
  user?: {
    avatarUrl?: string | null;
    name: string;
    roleLabel: string;
  } | null;
};

export function DashboardSidebar({
  homeHref = "/admin",
  items,
  user,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-background"
    >
      <SidebarHeader className=" px-4 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <Link
          href={homeHref}
          className="flex min-w-0 overflow-hidden group-data-[collapsible=icon]:justify-center"
        >
          <span className="hidden size-9 shrink-0 items-center justify-center overflow-hidden group-data-[collapsible=icon]:flex">
            <BrandLogo compact />
          </span>
          <span className="min-w-0 whitespace-nowrap opacity-100 transition-opacity delay-150 duration-150 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
            <BrandLogo className="[&>span:first-child]:text-xl [&>span:last-child]:mt-0.5 [&>span:last-child]:text-[10px] [&>span:last-child]:font-bold [&>span:last-child]:tracking-[0.22em]" />
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
              {items.map((item) => (
                <DashboardSidebarItem
                  item={item}
                  key={item.href}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className=" p-3">
        <SidebarUserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardSidebarItem({
  item,
  pathname,
}: {
  item: DashboardNavigationItem;
  pathname: string;
}) {
  const isActive = isItemActive(pathname, item.href);
  const hasChildren = Boolean(item.children?.length);
  const [isOpenOverride, setIsOpenOverride] = useState<boolean | null>(null);
  const isOpen = isOpenOverride ?? isActive;
  const { state: sidebarState, setOpen: setSidebarOpen } = useSidebar();

  return (
    <SidebarMenuItem>
      {hasChildren ? (
        <SidebarMenuButton
          aria-expanded={isOpen}
          className={cn(
            "h-10 rounded-lg text-[13px] font-bold uppercase tracking-[0.01em] text-muted-foreground",
            "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
          isActive={isActive}
          onClick={() => {
            if (sidebarState === "collapsed") {
              setSidebarOpen(true);
              setIsOpenOverride(true);
              return;
            }

            setIsOpenOverride(!isOpen);
          }}
          tooltip={item.label}
          type="button"
        >
          <DashboardIcon className="size-4.5" name={item.icon} />
          <span className="whitespace-nowrap opacity-100 transition-opacity delay-150 duration-150 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
            {item.label}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden",
              isOpen && "rotate-180",
            )}
          />
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          asChild
          className={cn(
            "h-10 rounded-lg text-[13px] font-bold uppercase tracking-[0.01em] text-muted-foreground",
            "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
          isActive={isActive}
          tooltip={item.label}
        >
          <Link href={item.href}>
            <DashboardIcon className="size-4.5" name={item.icon} />
            <span className="whitespace-nowrap opacity-100 transition-opacity delay-150 duration-150 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
              {item.label}
            </span>
          </Link>
        </SidebarMenuButton>
      )}

      {hasChildren && isOpen ? (
        <SidebarMenuSub>
          {item.children?.map((child) => (
            <SidebarMenuSubItem key={child.href}>
              <SidebarMenuSubButton
                asChild
                isActive={isChildItemActive(pathname, child.href, item.children)}
              >
                <Link href={child.href}>
                  <span>{child.label}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}

function isItemActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/own") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isChildItemActive(
  pathname: string,
  childHref: string,
  allChildren?: DashboardNavigationItem[],
) {
  if (allChildren) {
    const hasMoreSpecificMatch = allChildren.some(
      (sibling) =>
        sibling.href !== childHref &&
        sibling.href.startsWith(`${childHref}/`) &&
        isItemActive(pathname, sibling.href),
    );
    if (hasMoreSpecificMatch) {
      return false;
    }
  }
  return isItemActive(pathname, childHref);
}

function SidebarUserMenu({
  user,
}: {
  user?: {
    avatarUrl?: string | null;
    name: string;
    roleLabel: string;
  } | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? "Quản trị viên";
  const displayRole = user?.roleLabel ?? "Quản trị hệ thống";
  const avatarUrl = user?.avatarUrl;

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
        className={cn(
          "flex h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg bg-muted px-3 text-left transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
          isOpen && "bg-sidebar-accent text-sidebar-accent-foreground",
        )}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <AvatarWithSkeleton
          alt={displayName}
          className="size-9 bg-secondary text-secondary-foreground"
          fallback={getUserInitials(displayName)}
          fallbackClassName="bg-secondary text-xs font-bold text-secondary-foreground"
          src={avatarUrl}
        />
        <span className="min-w-0 flex-1 whitespace-nowrap opacity-100 transition-opacity delay-150 duration-150 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
          <span className="block truncate text-sm font-bold text-foreground">
            {displayName}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {displayRole}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform group-data-[collapsible=icon]:hidden",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-lg border border-border bg-background shadow-lg group-data-[collapsible=icon]:left-12 group-data-[collapsible=icon]:w-60">
          <div className="flex items-center gap-3 border-b border-border px-3 py-3">
            <AvatarWithSkeleton
              alt={displayName}
              className="size-9 bg-secondary text-secondary-foreground"
              fallback={getUserInitials(displayName)}
              fallbackClassName="bg-secondary text-xs font-bold text-secondary-foreground"
              src={avatarUrl}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {displayRole}
              </span>
            </span>
          </div>
          <div className="py-1">
            <Link
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              href="/"
              onClick={() => setIsOpen(false)}
            >
              <Home size={16} />
              Về trang chủ
            </Link>
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={16} />
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
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
