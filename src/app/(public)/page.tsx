import { HomeCategorySection } from "@/components/home/home-category-section";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { Container } from "@/components/layout/container";
import {
  HOME_HERO_SLIDES,
  HOME_PROMO_BANNERS,
} from "@/config/homepage";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-background py-6">
      <Container>
        <HomeHeroSection
          promotions={HOME_PROMO_BANNERS}
          slides={HOME_HERO_SLIDES}
        />
        <HomeCategorySection />
      </Container>
    </div>
  );
}
