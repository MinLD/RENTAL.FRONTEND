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
    children: [
      {
        href: "/own/products",
        label: "Danh sách sản phẩm",
      },
      {
        href: "/own/products/calendar",
        label: "Lịch sử dụng",
      },
    ],
  },
  {
    href: "/own/orders",
    icon: "file-text",
    label: "Quản lý đơn thuê",
  },
  {
    href: "/own/warehouse",
    icon: "building",
    label: "Quản lý địa chỉ kho",
  },
];
