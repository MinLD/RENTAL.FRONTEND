"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function SiteHeader({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    const root = document.documentElement;
    const previousHeight = root.style.getPropertyValue("--site-header-height");
    const updateHeight = () => {
      root.style.setProperty(
        "--site-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      if (previousHeight)
        root.style.setProperty("--site-header-height", previousHeight);
      else root.style.removeProperty("--site-header-height");
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-background" ref={ref}>
      {children}
    </header>
  );
}
