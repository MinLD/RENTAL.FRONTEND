import { Skeleton } from "@/components/ui/skeleton";

export function HomeBrandSkeleton() {
  return (
    <div aria-label="Đang tải thương hiệu" role="status">
      <span className="sr-only">Đang tải thương hiệu...</span>
      <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton
            className={`h-28 ${index >= 4 ? "hidden lg:block" : index >= 2 ? "hidden sm:block" : ""}`}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
