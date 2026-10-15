import Link from "next/link";
import Image from "next/image";

import type { HomeHeroSlide, HomePromoBanner } from "@/config/homepage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type HomeHeroSectionProps = {
  promotions: HomePromoBanner[];
  slides: HomeHeroSlide[];
};

export function HomeHeroSection({ promotions, slides }: HomeHeroSectionProps) {
  return (
    <section
      aria-label="Nội dung nổi bật"
      className="grid items-start gap-3 lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,1fr)]"
    >
      <Carousel
        className="min-w-0 overflow-hidden rounded border border-border bg-background shadow-sm"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <Link
                aria-label={slide.cta.label}
                className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                href={slide.cta.href}
              >
                <Image
                  alt={slide.title}
                  className="h-auto w-full object-contain"
                  priority={slide.id === slides[0]?.id}
                  sizes="(min-width: 1280px) 816px, (min-width: 1024px) 68vw, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)"
                  src={slide.imageSrc}
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious aria-label="Banner trước" className="left-3 hidden sm:inline-flex" />
        <CarouselNext aria-label="Banner tiếp theo" className="right-3 hidden sm:inline-flex" />
      </Carousel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {promotions.map((promotion) => (
          <Link
            aria-label={promotion.title}
            className="block overflow-hidden rounded border border-border bg-background shadow-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="/products"
            key={promotion.id}
          >
            <Image
              alt={promotion.title}
              className="h-auto w-full object-contain"
              sizes="(min-width: 1280px) 389px, (min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
              src={promotion.imageSrc}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
