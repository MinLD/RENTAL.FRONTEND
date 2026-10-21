import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT_FEED_GRID_CLASS_NAME } from "@/config/product-images";

export function ProductGridSkeleton() {
  return (
    <div aria-label="Đang tải sản phẩm" role="status">
      <span className="sr-only">Đang tải sản phẩm...</span>
      <div className={PRODUCT_FEED_GRID_CLASS_NAME}>
        {Array.from({ length: 10 }, (_, index) => (
          <div className="overflow-hidden rounded border border-border bg-background" key={index}>
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-5 p-3.5">
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="ml-auto h-6 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <div aria-label="Đang tải sản phẩm" role="status" className="divide-y divide-border rounded border border-border bg-background">
      <span className="sr-only">Đang tải sản phẩm...</span>
      {Array.from({ length: 5 }, (_, index) => (
        <div className="flex gap-3 p-3 sm:gap-5 sm:p-4" key={index}>
          <Skeleton className="aspect-square w-24 shrink-0 rounded sm:aspect-[4/3] sm:w-48" />
          <div className="flex flex-1 flex-col gap-3 py-1">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="hidden h-3 w-4/5 sm:block" />
            <Skeleton className="mt-auto h-5 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductBrowseSkeleton() {
  return (
    <div aria-busy="true" className="flex-1 bg-background py-5 sm:py-6">
      <Container>
        <Skeleton className="mb-4 h-4 w-44" />
        <div className="mb-4 flex gap-2 py-2.5">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="mb-4 space-y-3 py-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Skeleton className="h-4 w-14 shrink-0" />
            {Array.from({ length: 5 }, (_, index) => <Skeleton className="h-8 w-24 shrink-0 rounded-full" key={index} />)}
          </div>
          <div className="flex gap-3 overflow-hidden py-2">
            {Array.from({ length: 8 }, (_, index) => (
              <div className="flex w-24 shrink-0 flex-col items-center gap-2" key={index}>
                <Skeleton className="size-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
        <ProductGridSkeleton />
      </Container>
    </div>
  );
}
