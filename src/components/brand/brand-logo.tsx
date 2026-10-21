import { cn } from "@/utils/cn";

type BrandLogoProps = {
  className?: string;
  caption?: boolean;
  compact?: boolean;
};

/** Shared DPU Rental wordmark used across storefront, auth, and dashboard. */
export function BrandLogo({
  className,
  caption = true,
  compact = false,
}: BrandLogoProps) {
  if (compact) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-grid size-8 shrink-0 place-items-center rounded-md bg-navy text-[10px] font-extrabold tracking-tight text-white",
          className,
        )}
      >
        <span>DPU</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="text-lg font-extrabold tracking-tight text-foreground">
        DPU<span className="text-primary"> RENTAL</span>
      </span>
      {caption ? (
        <span className="mt-1 block text-[8px] font-medium uppercase tracking-wide text-muted-foreground">
          Sàn thiết bị công trường
        </span>
      ) : null}
    </span>
  );
}
