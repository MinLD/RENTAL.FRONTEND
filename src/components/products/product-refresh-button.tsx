"use client";

import { Button } from "@/components/ui/button";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";

export function ProductRefreshButton() {
  const { isPending, refresh } = useProductBrowseNavigation();
  return (
    <Button
      disabled={isPending}
      onClick={refresh}
      type="button"
      variant="secondary"
    >
      {isPending ? "Đang tải..." : "Thử lại"}
    </Button>
  );
}
