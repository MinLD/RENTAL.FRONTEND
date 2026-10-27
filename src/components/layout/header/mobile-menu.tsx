"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { MAIN_NAVIGATION, isMainNavigationActive } from "@/config/navigation";
import { HomeLink } from "@/components/layout/home-link";
import { logout } from "@/services/auth-service";
import type { AuthUser } from "@/types/auth";
import { BrandLogo } from "@/components/brand/brand-logo";

type MobileMenuProps = Readonly<{
  user?: AuthUser | null;
}>;

export function MobileMenu({ user }: MobileMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      toast.success("Đăng xuất thành công.");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể đăng xuất. Vui lòng thử lại.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="md:hidden">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label="Mở menu"
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
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
          className={`absolute inset-0 cursor-pointer bg-foreground/50 transition-opacity ${
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
            <HomeLink
              aria-label="DPU Rental - Trang chủ"
              className=""
              onClick={() => setIsOpen(false)}
            >
              <BrandLogo />
            </HomeLink>

            <button
              aria-label="Đóng menu"
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <nav aria-label="Điều hướng di động" className="flex-1 px-4 py-3">
            <ul className="space-y-1">
              {MAIN_NAVIGATION.map((item) => {
                const isActive = isMainNavigationActive(pathname, item.href);
                const linkProps = {
                  "aria-current": isActive ? "page" as const : undefined,
                  className: `flex rounded px-3 py-2 text-sm font-semibold transition-colors hover:bg-hover-accent hover:text-hover-accent-foreground ${
                    isActive ? "bg-hover-accent text-hover-accent-foreground font-bold" : "text-muted-foreground"
                  }`,
                  onClick: () => setIsOpen(false),
                };
                return (
                  <li key={item.href}>
                    {item.href === "/" ? (
                      <HomeLink {...linkProps}>{item.label}</HomeLink>
                    ) : (
                      <Link {...linkProps} href={item.href}>{item.label}</Link>
                    )}
                  </li>
                );
              })}
            </ul>

          </nav>

          <div className="border-t border-border p-4">
            {user ? (
              <button
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoggingOut}
                onClick={handleLogout}
                type="button"
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            ) : (
              <Link
                className="inline-flex h-10 w-full items-center justify-center rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                href="/login"
                onClick={() => setIsOpen(false)}
              >
                Đăng ký / Đăng nhập
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
