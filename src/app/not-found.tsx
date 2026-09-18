import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-sm font-semibold uppercase text-primary">404</p>
      <h1 className="mt-3 text-2xl font-bold text-foreground">
        Không tìm thấy trang
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Trang bạn đang truy cập không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        className="mt-6 inline-flex h-10 items-center justify-center rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        href="/"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
