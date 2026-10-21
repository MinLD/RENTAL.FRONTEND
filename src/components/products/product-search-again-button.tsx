"use client";

import { Button } from "@/components/ui/button";

export function ProductSearchAgainButton() {
  return (
    <Button
      className="rounded-full px-6"
      onClick={() => {
        const input = document.querySelector<HTMLInputElement>("[data-equipment-search-input]");
        input?.scrollIntoView({ block: "center", behavior: "smooth" });
        input?.focus();
        input?.select();
      }}
      type="button"
    >
      Tìm từ khóa khác
    </Button>
  );
}
