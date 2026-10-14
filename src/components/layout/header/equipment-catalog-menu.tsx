"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CatalogNavigationInitialData } from "@/types/catalog-navigation";
import { EquipmentCatalogPanel } from "./equipment-catalog-panel";

export function EquipmentCatalogMenu({
  initialData,
  mobile = false,
}: {
  initialData: CatalogNavigationInitialData;
  mobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    function closeWhenHidden() {
      if (mobile === media.matches) setIsOpen(false);
    }
    media.addEventListener("change", closeWhenHidden);
    return () => media.removeEventListener("change", closeWhenHidden);
  }, [mobile]);

  const panel = (
    <EquipmentCatalogPanel
      initialData={initialData}
      isOpen={isOpen}
      mobile={mobile}
      onNavigate={() => setIsOpen(false)}
    />
  );

  if (mobile) {
    return (
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Mở danh mục thiết bị"
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded border border-primary bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
            type="button"
          >
            Tất cả <ChevronDown aria-hidden="true" size={14} />
          </button>
        </SheetTrigger>
        <SheetContent
          className="w-full gap-0 overflow-y-auto sm:max-w-lg"
          side="left"
        >
          <SheetHeader className="border-b border-border pr-10">
            <SheetTitle>Danh mục thiết bị</SheetTitle>
            <SheetDescription>
              Chọn danh mục và loại thiết bị để tìm sản phẩm.
            </SheetDescription>
          </SheetHeader>
          {panel}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <NavigationMenu
      aria-label="Danh mục thiết bị"
      className="h-full shrink-0"
      delayDuration={180}
      onValueChange={(value) => setIsOpen(value === "catalog")}
      value={isOpen ? "catalog" : ""}
    >
      <NavigationMenuList>
        <NavigationMenuItem value="catalog">
          <NavigationMenuTrigger className="h-full bg-primary px-3 text-xs font-semibold text-primary-foreground lg:px-5">
            <Menu aria-hidden="true" className="size-4" />
            DANH MỤC THIẾT BỊ
            <ChevronDown
              aria-hidden="true"
              className="size-3 transition-transform group-data-[state=open]:rotate-180"
            />
          </NavigationMenuTrigger>
          <NavigationMenuContent>{panel}</NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
