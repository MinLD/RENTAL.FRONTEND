export const MAIN_NAVIGATION = [
  {
    label: "Trang chủ",
    href: "/",
  },
  {
    label: "Thiết bị cho thuê",
    href: "/products",
  },
  {
    label: "Đơn thuê của tôi",
    href: "/rentals",
  },
  // {
  //   label: "Tra cứu đơn hàng",
  //   href: "/orders/lookup",
  // },
  {
    label: "Đăng ký tổ chức",
    href: "/partner",
  },

  // {
  //   label: "Hỗ trợ",
  //   href: "/support",
  // },
] as const;

export function isMainNavigationActive(pathname: string | null, href: string) {
  return (
    pathname === href || (href !== "/" && !!pathname?.startsWith(`${href}/`))
  );
}
