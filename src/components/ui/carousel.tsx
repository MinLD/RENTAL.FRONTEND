"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import type {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType,
} from "embla-carousel";

import { cn } from "@/utils/cn";

type CarouselApi = EmblaCarouselType | undefined;

type CarouselContextValue = {
  api: CarouselApi;
  canScrollNext: boolean;
  canScrollPrev: boolean;
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  orientation: "horizontal" | "vertical";
  scrollNext: () => void;
  scrollPrev: () => void;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

export type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  opts?: EmblaOptionsType;
  orientation?: "horizontal" | "vertical";
  plugins?: EmblaPluginType[];
  setApi?: (api: CarouselApi) => void;
};

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      children,
      className,
      opts,
      orientation = "horizontal",
      plugins,
      setApi,
      ...props
    },
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((nextApi: EmblaCarouselType) => {
      setCanScrollPrev(nextApi.canScrollPrev());
      setCanScrollNext(nextApi.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollNext, scrollPrev],
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      queueMicrotask(() => onSelect(api));
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api.off("select", onSelect);
        api.off("reInit", onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          api,
          canScrollNext,
          canScrollPrev,
          carouselRef,
          orientation,
          scrollNext,
          scrollPrev,
        }}
      >
        <div
          aria-roledescription="carousel"
          className={cn("relative", className)}
          onKeyDownCapture={handleKeyDown}
          ref={ref}
          role="region"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div className="overflow-hidden" ref={carouselRef}>
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

export const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      ref={ref}
      role="group"
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

type CarouselButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  CarouselButtonProps
>(({ className, ...props }, ref) => {
  const { api, canScrollPrev, scrollPrev } = useCarousel();

  return (
    <button
      aria-label="Slide trước"
      className={cn(
        "absolute left-4 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/25 hover:bg-black text-white shadow-sm backdrop-blur transition  disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      // Embla measures scroll limits after mount; don't lock the SSR trigger
      // using limits that have not been measured yet.
      disabled={api !== undefined && !canScrollPrev}
      onClick={scrollPrev}
      ref={ref}
      type="button"
      {...props}
    >
      <ArrowLeft aria-hidden="true" size={18} />
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

export const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  CarouselButtonProps
>(({ className, ...props }, ref) => {
  const { api, canScrollNext, scrollNext } = useCarousel();

  return (
    <button
      aria-label="Slide tiếp theo"
      className={cn(
        "absolute right-4 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/25 text-white shadow-sm backdrop-blur transition hover:bg-black disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      disabled={api !== undefined && !canScrollNext}
      onClick={scrollNext}
      ref={ref}
      type="button"
      {...props}
    >
      <ArrowRight aria-hidden="true" size={18} />
    </button>
  );
});
CarouselNext.displayName = "CarouselNext";
