"use client";

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRODUCT_BROWSE_PATH } from "@/config/product-browse";

import {
  deserializePublicArea,
  parsePublicArea,
  PUBLIC_AREA_COOKIE_NAME,
  PUBLIC_AREA_STORAGE_KEY,
  serializePublicArea,
  type PublicAreaSelection,
} from "@/lib/locations/public-area";

type PublicAreaStore = {
  area: PublicAreaSelection | null;
  isReady: boolean;
  isApplyingArea: boolean;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  selectArea: (area: PublicAreaSelection) => void;
  clearArea: () => void;
};

const PublicAreaContext = createContext<PublicAreaStore | null>(null);

function persistArea(area: PublicAreaSelection) {
  const serialized = serializePublicArea(area);
  // Product browsing uses this preference; the homepage remains unfiltered.
  document.cookie = `${PUBLIC_AREA_COOKIE_NAME}=${serialized}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  try {
    localStorage.setItem(PUBLIC_AREA_STORAGE_KEY, serialized);
  } catch {
    // The cookie and in-memory selection still work when storage is unavailable.
  }
}

export function PublicAreaProvider({ initialArea, children }: {
  initialArea: PublicAreaSelection | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [area, setArea] = useState(initialArea);
  const [isReady, setIsReady] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isApplyingArea, startTransition] = useTransition();
  const initialValue = initialArea ? serializePublicArea(initialArea) : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const linkedArea = pathname === PRODUCT_BROWSE_PATH && searchParams.has("provinceCode")
        ? parsePublicArea({
            provinceCode: searchParams.get("provinceCode") ?? "",
            wardCode: searchParams.get("wardCode") ?? "",
          })
        : null;
      let storedArea: PublicAreaSelection | null = null;
      try {
        storedArea = deserializePublicArea(localStorage.getItem(PUBLIC_AREA_STORAGE_KEY));
      } catch {
        // Fall back to the server cookie.
      }
      const cookieValue = document.cookie.split(";").map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${PUBLIC_AREA_COOKIE_NAME}=`))
        ?.slice(PUBLIC_AREA_COOKIE_NAME.length + 1);
      const restored = linkedArea ?? storedArea ?? deserializePublicArea(cookieValue);
      setArea(restored);
      setIsReady(true);
      if (restored) persistArea(restored);
      if (pathname === PRODUCT_BROWSE_PATH && !linkedArea && storedArea && serializePublicArea(storedArea) !== initialValue) {
        startTransition(() => router.refresh());
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialValue, pathname, router, searchParams]);

  function selectArea(next: PublicAreaSelection) {
    const validated = parsePublicArea(next);
    if (!validated) return;
    persistArea(validated);
    setArea(validated);
    if (pathname === PRODUCT_BROWSE_PATH) {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(validated)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      const href = params.size ? `${PRODUCT_BROWSE_PATH}?${params}` : PRODUCT_BROWSE_PATH;
      startTransition(() => {
        if (href === `${pathname}${window.location.search}`) router.refresh();
        else router.replace(href, { scroll: false });
      });
    }
  }

  function clearArea() {
    document.cookie = `${PUBLIC_AREA_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    try {
      localStorage.removeItem(PUBLIC_AREA_STORAGE_KEY);
    } catch {
      // Clear the cookie and current selection even if storage is unavailable.
    }
    setArea(null);
    setIsPickerOpen(false);
  }

  return (
    <PublicAreaContext.Provider value={{
      area, isReady, isApplyingArea, selectArea, clearArea, isPickerOpen,
      openPicker: () => setIsPickerOpen(true),
      closePicker: () => setIsPickerOpen(false),
    }}>
      {children}
    </PublicAreaContext.Provider>
  );
}

export function usePublicArea() {
  const context = useContext(PublicAreaContext);
  if (!context) throw new Error("usePublicArea requires PublicAreaProvider.");
  return context;
}
