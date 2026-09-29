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
      className="grid gap-3 lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,1fr)]"
    >
      <Carousel
        className="overflow-hidden rounded border border-border bg-navy shadow-sm"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="h-[260px] sm:h-[300px] lg:h-[310px]">
          {slides.map((slide) => (
            <CarouselItem className="h-full" key={slide.id}>
              <article className="relative flex h-full overflow-hidden rounded bg-navy">
                <Image
                  alt=""
                  aria-hidden="true"
                  className="object-cover"
                  fill
                  priority={slide.id === slides[0]?.id}
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  src={slide.imageSrc}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(90deg,rgba(0,0,0,0.58),rgba(0,0,0,0.12))]" />
                <div className="absolute bottom-0 right-0 hidden h-28 w-64 opacity-25 sm:block">
                  <div className="absolute bottom-0 left-0 h-20 w-16 rounded-t bg-white/30" />
                  <div className="absolute bottom-0 left-20 h-28 w-20 rounded-t bg-white/20" />
                  <div className="absolute bottom-0 left-48 h-16 w-14 rounded-t bg-white/25" />
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-3 hidden sm:inline-flex" />
        <CarouselNext className="right-3 hidden sm:inline-flex" />
      </Carousel>

      <div className="hidden md:grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {promotions.map((promotion) => (
          <Link
            aria-label={promotion.title}
            className="group relative min-h-[145px] overflow-hidden rounded border border-border bg-background shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            href="/equipment"
            key={promotion.id}
          >
            <Image
              alt={promotion.title}
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
              src={promotion.imageSrc}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
