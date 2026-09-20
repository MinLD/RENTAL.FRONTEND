import Link from "next/link";

export function AuthLinks() {
  return (
    <div className="flex w-full items-center justify-end gap-2">
      <Link
        className="px-2 py-2 text-xs font-medium text-foreground transition-colors hover:text-primary"
        href="/register"
      >
        Đăng ký
      </Link>
      <Link
        className="inline-flex h-8 items-center rounded bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        href="/login"
      >
        Đăng nhập
      </Link>
    </div>
  );
}
