"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { DashboardIcon } from "@/components/dashboard/dashboard-icon";
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
} from "@/components/ui/sidebar";
import type { DashboardNavigationItem } from "@/types/dashboard-navigation";
import { cn } from "@/utils/cn";

type DashboardSidebarProps = {
  items: DashboardNavigationItem[];
  user?: {
    name: string;
    roleLabel: string;
  } | null;
};

export function DashboardSidebar({ items, user }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-background"
    >
      <SidebarHeader className="border-b border-border px-4 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <Link
          href="/admin"
          className="flex min-w-0 overflow-hidden group-data-[collapsible=icon]:justify-center"
        >
          <span className="hidden size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background group-data-[collapsible=icon]:flex">
            <Image
              alt="DPRENTAL"
              className="size-7"
              height={28}
              src="/favicon.ico"
              unoptimized
              width={28}
            />
          </span>
          <span className="min-w-0 whitespace-nowrap opacity-100 transition-opacity delay-150 duration-150 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
            <span className="block text-xl font-bold tracking-tight text-foreground">
              DP<span className="text-primary">RENTAL</span>
            </span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Sàn thiết bị công trường
            </span>
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

      <SidebarFooter className="border-t border-border p-3">
        <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
            {getUserInitials(user?.name)}
          </div>
          <div className="min-w-0 whitespace-nowrap opacity-100 transition-opacity delay-150 duration-150 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? "Quản trị viên"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.roleLabel ?? "Quản trị hệ thống"}
            </p>
          </div>
        </div>
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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={cn(
          "h-10 rounded-lg text-[13px] font-bold uppercase tracking-[0.01em] text-muted-foreground",
          "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!",
          "hover:bg-primary/10 hover:text-primary",
          isActive && "bg-primary/10 text-primary",
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

      {hasChildren ? (
        <SidebarMenuSub>
          {item.children?.map((child) => (
            <SidebarMenuSubItem key={child.href}>
              <SidebarMenuSubButton
                asChild
                isActive={isItemActive(pathname, child.href)}
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
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
