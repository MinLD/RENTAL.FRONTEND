import type { DashboardNavigationItem } from "@/types/dashboard-navigation";

export const ADMIN_NAVIGATION: DashboardNavigationItem[] = [
  {
    href: "/admin",
    icon: "layout-dashboard",
    label: "Dashboard",
  },
  {
    href: "/admin/users",
    icon: "user-pen",
    label: "Quản lý người dùng",
  },
  {
    href: "/admin/organizations",
    icon: "building",
    label: "Quản lý tổ chức",
  },
  {
    href: "/admin/catalog",
    icon: "package",
    label: "Quản lý catalog",
    children: [
      {
        href: "/admin/catalog/brands",
        label: "Thương hiệu",
      },
      {
        href: "/admin/catalog/categories",
        label: "Danh mục",
      },
      {
        href: "/admin/catalog/equipment-types",
        label: "Loại thiết bị",
      },
    ],
  },
  {
    href: "/admin/orders",
    icon: "file-text",
    label: "Quản lý đơn thuê",
    children: [
      {
        href: "/admin/orders",
        label: "Tất cả đơn thuê",
      },

      {
        href: "/admin/return-requests",
        label: "Yêu cầu trả máy",
      },
      {
        href: "/admin/refunds",
        label: "Hoàn tiền cọc",
      },
      {
        href: "/admin/payouts",
        label: "Quyết toán tiền",
      },
    ],
  },
  // {
  //   href: "/admin/equipment",
  //   icon: "package",
  //   label: "Quản lý thiết bị",
  // },
  // {
  //   href: "/admin/suppliers",
  //   icon: "building",
  //   label: "Nhà cung cấp",
  // },
  // {
  //   href: "/admin/renters",
  //   icon: "users",
  //   label: "Khách thuê",
  // },
  // {
  //   href: "/admin/logistics",
  //   icon: "truck",
  //   label: "Đối tác vận chuyển",
  // },
  // {
  //   href: "/admin/supply-approval",
  //   icon: "shield",
  //   label: "Duyệt nguồn cung",
  // },
  // {
  //   href: "/admin/reconciliation",
  //   icon: "credit-card",
  //   label: "Đối soát & thanh toán",
  // },
  // {
  //   href: "/admin/reports",
  //   icon: "bar-chart",
  //   label: "Báo cáo",
  // },
  // {
  //   href: "/admin/settings",
  //   icon: "settings",
  //   label: "Cài đặt",
  // },
];

export function filterDashboardNavigationByPermissions(
  items: DashboardNavigationItem[],
  permissions: string[],
): DashboardNavigationItem[] {
  const permissionSet = new Set(permissions);

  return items.flatMap((item) => {
    const children = item.children
      ? filterDashboardNavigationByPermissions(item.children, permissions)
      : undefined;
    const canViewItem =
      !item.permissions?.length ||
      item.permissions.some((permission) => permissionSet.has(permission));

    if (!canViewItem && !children?.length) {
      return [];
    }

    return [
      {
        ...item,
        ...(children ? { children } : {}),
      },
    ];
  });
}
