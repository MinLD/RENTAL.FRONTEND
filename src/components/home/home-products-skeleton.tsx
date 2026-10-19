import { Skeleton } from "@/components/ui/skeleton";
import { HOME_LATEST_PRODUCTS_GRID_CLASS_NAME } from "@/config/homepage";

export function HomeLatestProductsSkeleton() {
  return (
    <div aria-label="Đang tải thiết bị mới nhất" role="status">
      <span className="sr-only">Đang tải thiết bị mới nhất...</span>
      <div aria-hidden="true" className={HOME_LATEST_PRODUCTS_GRID_CLASS_NAME}>
        {Array.from({ length: 10 }, (_, index) => (
          <div className="overflow-hidden rounded border border-border" key={index}>
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

export function HomeCategoryProductsSkeleton({ name }: { name?: string }) {
  return (
    <section aria-label={name ? `Đang tải ${name}` : "Đang tải sản phẩm theo danh mục"} className="mt-8 sm:mt-10">
      {name ? <h2 className="mb-4 border-l-3 border-primary pl-2.5 text-xs font-bold uppercase sm:text-sm">{name}</h2> : <Skeleton className="mb-4 h-5 w-48" />}
      <Skeleton className="mb-4 h-8 w-64 max-w-full" />
      <HomeProductsSkeleton />
    </section>
  );
}

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
