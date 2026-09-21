"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { MAIN_NAVIGATION } from "@/config/navigation";

const MOBILE_SECONDARY_LINKS = [
  {
    label: "Tra cứu đơn hàng",
    href: "/orders/lookup",
  },
  {
    label: "Trở thành đối tác",
    href: "/partner",
  },
  {
    label: "Đăng ký",
    href: "/register",
  },
] as const;

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label="Mở menu"
        className="inline-flex size-9 items-center justify-center rounded border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Menu size={20} />
      </button>

      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 transition ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          aria-label="Đóng menu"
          className={`absolute inset-0 bg-foreground/50 transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
          type="button"
        />

        <aside
          aria-label="Menu di động"
          aria-modal="true"
          className={`absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-background shadow-xl transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          id={panelId}
          role="dialog"
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link
              aria-label="DPRENTAL - Trang chủ"
              className="leading-none"
              href="/"
              onClick={() => setIsOpen(false)}
            >
              <span className="block text-lg font-bold tracking-tight text-foreground">
                DPR<span className="text-primary">ENTAL</span>
              </span>
              <span className="mt-1 block text-[8px] font-medium uppercase tracking-wide text-muted-foreground">
                Sàn thiết bị công trường
              </span>
            </Link>

            <button
              aria-label="Đóng menu"
              className="inline-flex size-9 items-center justify-center rounded border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <div className="border-b border-border px-4 py-3">
            <button
              className="flex h-10 w-full items-center justify-between rounded bg-primary px-3 text-sm font-semibold text-primary-foreground"
              type="button"
            >
              <span>DANH MỤC THIẾT BỊ</span>
              <span aria-hidden="true">▾</span>
            </button>
          </div>

          <nav aria-label="Điều hướng di động" className="flex-1 px-4 py-3">
            <ul className="space-y-1">
              {MAIN_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <Link
                    aria-current={item.isActive ? "page" : undefined}
                    className={`flex rounded px-3 py-2 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary ${
                      item.isActive ? "bg-primary/10 text-primary" : ""
                    }`}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-border pt-4">
              <ul className="space-y-1">
                {MOBILE_SECONDARY_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="flex rounded px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="border-t border-border p-4">
            <Link
              className="inline-flex h-10 w-full items-center justify-center rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              href="/login"
              onClick={() => setIsOpen(false)}
            >
              Đăng nhập
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
