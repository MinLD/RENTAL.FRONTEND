import { Skeleton } from "@/components/ui/skeleton";

export function HomeProductsSkeleton() {
  return (
    <div aria-label="Đang tải sản phẩm" role="status">
      <span className="sr-only">Đang tải sản phẩm...</span>
      <div aria-hidden="true" className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="w-4/5 shrink-0 overflow-hidden rounded border border-border sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]" key={index}>
            <Skeleton className="aspect-[16/10] rounded-none" />
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
