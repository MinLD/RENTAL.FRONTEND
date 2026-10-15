import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải chi tiết thiết bị"
      className="flex-1 bg-background py-5 sm:py-6"
      role="status"
    >
      <Container>
        <Skeleton className="mb-6 h-4 w-72 max-w-full" />
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
          <div>
            <Skeleton className="aspect-[3/2] w-full rounded-lg" />
            <div className="my-3 flex gap-2 overflow-hidden">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton className="aspect-[16/9] w-32 shrink-0" key={index} />
              ))}
            </div>
            <Skeleton className="mt-7 h-8 w-4/5" />
            <Skeleton className="mt-3 h-4 w-3/5" />
            <Skeleton className="mt-3 h-16 w-full" />
          </div>
          <div className="space-y-5 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="lg:col-start-1">
            <div className="flex gap-3">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
            <Skeleton className="mt-5 h-40 w-full" />
          </div>
        </div>
      </Container>
    </div>
  );
}
