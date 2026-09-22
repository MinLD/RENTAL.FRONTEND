export type HomeHeroAction = {
  href: string;
  label: string;
};

export type HomeHeroSlide = {
  cta: HomeHeroAction;
  id: string;
  imageSrc: string;
  secondaryCta?: HomeHeroAction;
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

    id: "construction-equipment",
    imageSrc: "/banners/banner.png",
  },
  {
    cta: {
      href: "/equipment",
      label: "Thuê thiết bị ngay",
    },

    id: "project-support",
    imageSrc: "/banners/banner.png",
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
