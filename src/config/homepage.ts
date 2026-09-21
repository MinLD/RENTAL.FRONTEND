export type HomeHeroAction = {
  href: string;
  label: string;
};

export type HomeHeroSlide = {
  cta: HomeHeroAction;
  description: string;
  eyebrow: string;
  id: string;
  imageSrc: string;
  secondaryCta?: HomeHeroAction;
  title: string;
};

export type HomePromoBanner = {
  id: string;
  imageSrc: string;
  title: string;
};

export const HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    cta: {
      href: "/equipment",
      label: "Xem máy đang sẵn tại bãi",
    },
    description:
      "Cam kết máy luôn có sẵn sàng tại bãi 24/7. Đã qua kiểm định an toàn tiêu chuẩn kỹ thuật nghiêm ngặt.",
    eyebrow: "Sàn điều phối thiết bị cơ giới uy tín số 1 Việt Nam",
    id: "construction-equipment",
    imageSrc: "/banners/banner.png",
    // secondaryCta: {
    //   href: "/support",
    //   label: "Tư vấn bóc tách máy dự án",
    // },
    title: "Sàn điều phối máy cơ giới & thiết bị thi công toàn quốc",
  },
  {
    cta: {
      href: "/equipment",
      label: "Thuê thiết bị ngay",
    },
    description:
      "Kết nối nhanh nhà cung cấp, hỗ trợ báo giá và điều phối thiết bị phù hợp cho từng hạng mục thi công.",
    eyebrow: "Tối ưu tiến độ công trình",
    id: "project-support",
    imageSrc: "/banners/banner.png",
    // secondaryCta: {
    //   href: "/partner",
    //   label: "Trở thành đối tác",
    // },
    title: "Thuê thiết bị nhanh, vận hành hiệu quả cho mọi dự án",
  },
];

export const HOME_PROMO_BANNERS: HomePromoBanner[] = [
  {
    id: "compactor",
    imageSrc: "/banners/banner_child.png",
    title: "Máy đầm nền",
  },
  {
    id: "steel-processing",
    imageSrc: "/banners/banner_child1.png",
    title: "Máy gia công sắt",
  },
];
