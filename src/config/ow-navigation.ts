import type { DashboardNavigationItem } from "@/types/dashboard-navigation";

export const OW_NAVIGATION: DashboardNavigationItem[] = [
  {
    href: "/own",
    icon: "layout-dashboard",
    label: "Dashboard",
  },
  {
    href: "/own/products",
    icon: "package",
    label: "Quản lý sản phẩm",
  },
  {
    href: "/own/warehouse",
    icon: "building",
    label: "Quản lý địa chỉ kho",
  },
];
