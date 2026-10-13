type FooterLink = {
  label: string;
  href: string;
  available?: boolean;
};

export const FOOTER_SUPPORT_LINKS: readonly FooterLink[] = [
  {
    label: "Hướng dẫn thuê thiết bị",
    href: "/rental-guide",
    available: false,
  },
  {
    label: "Chính sách thuê thiết bị",
    href: "/rental-policy",
    available: false,
  },
  {
    label: "Chính sách thanh toán",
    href: "/payment-policy",
    available: false,
  },
  {
    label: "Hủy đơn & hoàn tiền",
    href: "/cancellation-policy",
    available: false,
  },
  {
    label: "Giải quyết khiếu nại",
    href: "/complaint-policy",
    available: false,
  },
] as const;

export const FOOTER_PARTNER_LINKS = [
  {
    label: "Trở thành nhà cung cấp thiết bị",
    href: "/partner",
  },
] as const;

export const FOOTER_LEGAL_LINKS: readonly FooterLink[] = [
  {
    label: "Điều khoản sử dụng",
    href: "/terms",
    available: false,
  },
  {
    label: "Chính sách bảo mật",
    href: "/privacy",
    available: false,
  },
] as const;
