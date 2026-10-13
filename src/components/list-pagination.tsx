import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/utils/cn";

export type ListPaginationProps = {
  page: number;
  totalPages: number;
  getPageHref: (page: number) => string;
  pageSizeControl?: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function ListPagination({
  page,
  totalPages,
  getPageHref,
  pageSizeControl,
  className,
  disabled = false,
}: ListPaginationProps) {
  const lastPage = Math.max(1, totalPages);
  return (
    <div className={cn("flex items-center justify-end gap-3 pt-4", className)}>
      {pageSizeControl}
      <Pagination aria-label="Phân trang sản phẩm" className="w-auto">
        <PaginationContent className="gap-2">
          <PaginationItem>
            {page > 1 && !disabled ? (
              <PaginationButton asChild className="size-8 p-0" size="sm">
                <Link aria-label="Trang trước" href={getPageHref(page - 1)} prefetch={false}>
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </Link>
              </PaginationButton>
            ) : (
              <PaginationButton aria-label="Trang trước" className="size-8 p-0" disabled size="sm">
                <ChevronLeft aria-hidden="true" className="size-4" />
              </PaginationButton>
            )}
          </PaginationItem>
          <PaginationItem>
            <span aria-current="page" className="min-w-24 text-center text-sm font-medium text-muted-foreground">
              Trang {page} / {lastPage}
            </span>
          </PaginationItem>
          <PaginationItem>
            {page < lastPage && !disabled ? (
              <PaginationButton asChild className="size-8 p-0" size="sm">
                <Link aria-label="Trang sau" href={getPageHref(page + 1)} prefetch={false}>
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              </PaginationButton>
            ) : (
              <PaginationButton aria-label="Trang sau" className="size-8 p-0" disabled size="sm">
                <ChevronRight aria-hidden="true" className="size-4" />
              </PaginationButton>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
