"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import { usePublicArea } from "@/providers/public-area-provider";

export function ProductResetFiltersButton({
  className,
  size,
  variant = "secondary",
}: Pick<ButtonProps, "className" | "size" | "variant">) {
  const { isPending, resetFilters } = useProductBrowseNavigation();
  const { isApplyingArea } = usePublicArea();
  return (
    <Button
      className={className}
      disabled={isPending || isApplyingArea}
      onClick={resetFilters}
      size={size}
      type="button"
      variant={variant}
    >
      Xóa bộ lọc
    </Button>
  );
}
