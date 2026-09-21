"use client";

import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { logout } from "@/services/auth-service";
import type { AuthUser } from "@/types/auth";

type UserMenuProps = Readonly<{
  user: AuthUser;
}>;

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      toast.success("Đăng xuất thành công.");
      router.refresh();
      setIsOpen(false);
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
    <div className="relative w-full" ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        className="flex h-10 w-full min-w-0 items-center gap-2 rounded border border-border bg-background px-2 text-left transition-colors hover:border-primary"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
          DP
        </span>
        <span className="hidden min-w-0 flex-1 leading-tight lg:block">
          <span
            className="block truncate text-sm font-semibold text-foreground"
            title={user.name}
          >
            {user.name}
          </span>
          <span
            className="block truncate text-xs text-muted-foreground"
            title={user.roleLabel}
          >
            {user.roleLabel}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded border border-border bg-background py-2 shadow-lg">
          <Link
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            href="/account"
            onClick={() => setIsOpen(false)}
          >
            <UserRound size={16} />
            Tài khoản của tôi
          </Link>
          <button
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
