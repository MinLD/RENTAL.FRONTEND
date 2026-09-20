import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <section className="w-full max-w-xl  px-6 py-10 text-center  sm:px-10">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Không tìm thấy trang
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
          Trang bạn đang truy cập không tồn tại, đã được di chuyển hoặc đường
          dẫn chưa chính xác.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
