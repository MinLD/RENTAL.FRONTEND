"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogBrowseHref } from "@/config/catalog-navigation";
import { useCatalogNavigation } from "@/hooks/use-catalog-navigation";
import type { CatalogNavigationInitialData } from "@/types/catalog-navigation";

function SectionError({ retry }: { retry: () => void }) {
  return (
    <div className="space-y-2 py-3" role="alert">
      <p className="text-xs text-muted-foreground">
        Không thể tải dữ liệu lúc này.
      </p>
      <Button onClick={retry} size="sm" type="button" variant="secondary">
        Thử lại
      </Button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div aria-label="Đang tải dữ liệu" className="space-y-3 py-2" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton className="h-6 w-full" key={index} />
      ))}
    </div>
  );
}

export function EquipmentCatalogPanel({
  initialData,
  isOpen,
  onNavigate,
  mobile = false,
}: {
  initialData: CatalogNavigationInitialData;
  isOpen: boolean;
  onNavigate: () => void;
  mobile?: boolean;
}) {
  const {
    categories,
    category,
    equipmentTypes,
    selectCategory,
    hoverCategory,
    cancelHover,
  } = useCatalogNavigation(initialData, isOpen);

  return (
    <div
      className={
        mobile
          ? "flex flex-col gap-5 p-4"
          : "grid w-[540px] max-w-[calc(100vw-3rem)] grid-cols-2 gap-5 rounded-lg border border-border bg-background p-5 shadow-xl"
      }
    >
      <section
        aria-label="Danh mục thiết bị"
        className={
          mobile
            ? "border-b border-border pb-4"
            : "min-w-0 border-r border-border pr-4"
        }
      >
        <h3 className="mb-3 text-xs font-semibold uppercase">
          Danh mục thiết bị
        </h3>
        {categories.isPending ? (
          <ListSkeleton />
        ) : categories.isError && !categories.data ? (
          <SectionError retry={() => void categories.refetch()} />
        ) : !categories.data?.data.length ? (
          <p className="py-3 text-xs text-muted-foreground">
            Chưa có danh mục thiết bị.
          </p>
        ) : (
          <ul
            className={
              mobile
                ? "flex max-h-40 flex-wrap gap-1 overflow-y-auto"
                : "max-h-72 space-y-1 overflow-y-auto"
            }
          >
            {categories.data.data.map((item) => (
              <li key={item.id}>
                <button
                  aria-pressed={category?.id === item.id}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded px-2 py-2.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary ${category?.id === item.id ? "bg-primary/10 font-semibold text-primary" : "hover:bg-primary/5 hover:text-primary"}`}
                  onClick={() => selectCategory(item.id)}
                  onFocus={() => selectCategory(item.id)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") hoverCategory(item.id);
                  }}
                  onPointerLeave={cancelHover}
                  type="button"
                >
                  <span className="min-w-0 flex-1">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Loại thiết bị" className="flex min-w-0 flex-col">
        <h3 className="mb-3 text-xs font-semibold uppercase">Loại thiết bị</h3>
        {!category ? (
          <p className="py-3 text-xs text-muted-foreground">
            Chọn danh mục để xem loại thiết bị.
          </p>
        ) : (
          <div
            aria-busy={equipmentTypes.isFetching}
            className="flex min-h-48 flex-1 flex-col"
          >
            {equipmentTypes.isPending ? (
              <ListSkeleton />
            ) : equipmentTypes.isError && !equipmentTypes.data ? (
              <SectionError retry={() => void equipmentTypes.refetch()} />
            ) : !equipmentTypes.data?.data.length ? (
              <p className="py-3 text-xs text-muted-foreground">
                Danh mục này chưa có loại thiết bị.
              </p>
            ) : (
              <ul className="space-y-1">
                {equipmentTypes.data.data.map((item) => (
                  <li key={item.id}>
                    <Link
                      className="block rounded px-2 py-2 text-xs hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                      href={catalogBrowseHref({
                        categoryId: category.id,
                        equipmentTypeId: item.id,
                      })}
                      onClick={onNavigate}
                      prefetch={false}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
