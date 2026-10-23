import type { StaticImageData } from "next/image";

import constructionBanner from "../../public/banners/banner-01-thue-thiet-bi-cong-truong.png";
import equipmentSelectionBanner from "../../public/banners/banner-02-da-dang-thiet-bi.png";
import costOptimizationBanner from "../../public/banners/banner-03-toi-uu-chi-phi.png";
import genuineEquipmentBanner from "../../public/banners/banner-04-thiet-bi-chinh-hang.png";
import compactorBanner from "../../public/banners/childs/child1.png";
import weldingAndCuttingBanner from "../../public/banners/childs/child2.png";

export const HOME_BRANDS_PAGE_SIZE = 12;

export const HOME_PRODUCTS_PAGE_SIZE = 8;
export const HOME_PRODUCTS_STALE_TIME = 5 * 60 * 1000;
export const HOME_PRODUCT_IMAGE_SIZES =
  "(min-width: 1280px) 292px, (min-width: 1024px) calc(25vw - 28px), (min-width: 640px) calc(33.33vw - 24px), calc(80vw - 28px)";

export const HOME_PRODUCTS_FEED_PARAMS = {
  pageSize: 20,
} as const;

export const HOME_PRODUCTS_TABS = [
  { value: "created_desc", label: "Mới nhất" },
  { value: "recommended", label: "Dành cho bạn" },
] as const;

export type HomeProductsSort = (typeof HOME_PRODUCTS_TABS)[number]["value"];
export type HomeHeroAction = {
  href: string;
  label: string;
};

export type HomeHeroSlide = {
  cta: HomeHeroAction;
  id: string;
  imageSrc: StaticImageData;
  title: string;
  secondaryCta?: HomeHeroAction;
};

export type HomePromoBanner = {
  id: string;
  imageSrc: StaticImageData;
  title: string;
};

export const HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    cta: {
      href: "/search",
      label: "Xem thiết bị công trường",
    },

    id: "construction-equipment",
    imageSrc: constructionBanner,
    title: "Thuê thiết bị công trường – Giải pháp linh hoạt cho mọi công trình",
  },
  {
    cta: {
      href: "/search",
      label: "Khám phá các thiết bị cho thuê",
    },

    id: "equipment-selection",
    imageSrc: equipmentSelectionBanner,
    title: "Đa dạng thiết bị – Đáp ứng mọi nhu cầu",
  },
  {
    cta: {
      href: "/search",
      label: "Tìm thiết bị phù hợp",
    },
    id: "cost-optimization",
    imageSrc: costOptimizationBanner,
    title: "Tối ưu chi phí – Hiệu quả công trình",
  },
  {
    cta: {
      href: "/search",
      label: "Xem thiết bị chính hãng",
    },
    id: "genuine-equipment",
    imageSrc: genuineEquipmentBanner,
    title: "Thiết bị chính hãng – Vận hành bền bỉ",
  },
];

export const HOME_PROMO_BANNERS: HomePromoBanner[] = [
  {
    id: "compactor",
    imageSrc: compactorBanner,
    title: "Máy đầm nền",
  },
  {
    id: "welding-and-cutting",
    imageSrc: weldingAndCuttingBanner,
    title: "Máy hàn và cắt sắt",
  },
];
