export const MAIN_NAVIGATION = [
  {
    label: "Trang chủ",
    href: "/",
    isActive: true,
  },
  {
    label: "Thiết bị cho thuê",
    href: "/products",
    isActive: false,
  },
  {
    label: "Đơn thuê của tôi",
    href: "/rentals",
    isActive: false,
  },
  {
    label: "Hỗ trợ",
    href: "/support",
    isActive: false,
  },
] as const;
