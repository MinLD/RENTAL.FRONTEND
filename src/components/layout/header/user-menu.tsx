"use client";

import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  ACCOUNT_PROFILE_UPDATED_EVENT,
  type AccountProfileUpdatedEventDetail,
} from "@/components/account/account-profile-events";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { logout } from "@/services/auth-service";
import type { AuthUser } from "@/types/auth";
import {
  getAuthUserDisplayName,
  getAuthUserRoleLabel,
} from "@/utils/auth-user";

type UserMenuProps = Readonly<{
  user: AuthUser;
}>;

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [optimisticAvatar, setOptimisticAvatar] = useState<{
    url: string;
    userId: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optimisticAvatarUrl =
    optimisticAvatar?.userId === user.id ? optimisticAvatar.url : "";
  const avatarUrl = optimisticAvatarUrl || user.avatarUrl;
  const displayName = getAuthUserDisplayName(user);
  const roleLabel = getAuthUserRoleLabel(user);

  useEffect(() => {
    function handleProfileUpdated(event: Event) {
      const detail = (event as CustomEvent<AccountProfileUpdatedEventDetail>)
        .detail;

      if (!detail.avatarUrl || detail.userId !== user.id) {
        return;
      }

      setOptimisticAvatar({
        url: detail.avatarUrl,
        userId: detail.userId,
      });
    }

    window.addEventListener(
      ACCOUNT_PROFILE_UPDATED_EVENT,
      handleProfileUpdated,
    );

    return () => {
      window.removeEventListener(
        ACCOUNT_PROFILE_UPDATED_EVENT,
        handleProfileUpdated,
      );
    };
  }, [user.id]);

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
        className="flex h-10 w-full min-w-0 cursor-pointer items-center gap-2 rounded border border-border bg-background px-2 text-left transition-colors hover:border-primary"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <AvatarWithSkeleton
          alt={displayName}
          className="size-8 bg-foreground text-background"
          fallback={getUserInitials(displayName)}
          fallbackClassName="bg-foreground text-xs font-bold text-background"
          src={avatarUrl}
        />
        <span className="hidden min-w-0 flex-1 leading-tight lg:block">
          <span
            className="block truncate text-sm font-semibold text-foreground"
            title={displayName}
          >
            {displayName}
          </span>
          <span
            className="block truncate text-xs text-muted-foreground"
            title={roleLabel}
          >
            {roleLabel}
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
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
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

function getUserInitials(name?: string) {
  if (!name) {
    return "DP";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
