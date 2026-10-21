import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <div aria-label="Đang tải sản phẩm" role="status">
      <span className="sr-only">Đang tải sản phẩm...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="overflow-hidden rounded border border-border bg-background" key={index}>
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-4 p-3.5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <div className="space-y-3 py-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="ml-auto h-5 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductBrowseSkeleton() {
  return (
    <div aria-busy="true" className="flex-1 bg-background py-5 sm:py-6">
      <Container>
        <Skeleton className="mb-4 h-4 w-44" />
        <Skeleton className="mb-4 h-6 w-52" />
        <div className="mb-4 flex gap-2 rounded border border-border p-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-40" />
        </div>
        <ProductGridSkeleton />
      </Container>
    </div>
  );
}
