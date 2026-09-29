import Link from "next/link";

import { Container } from "@/components/layout/container";
import { BuildingComplex, Mail, Truck } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-navy text-navy-foreground">
      <Container className="flex h-8 items-center justify-between gap-4 text-xs">
        <div className="flex min-w-0 items-center gap-5">
          <a className="flex shrink-0 items-center gap-1.5" href="tel:19006828">
            <svg
              aria-hidden="true"
              className="size-3.5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 4h3l1.5 4-2 1.5a15 15 0 0 0 7 7l1.5-2L20 16v3a1 1 0 0 1-1 1C10.7 20 4 13.3 4 5a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <span>
              <span className="text-primary">Hotline đặt máy:</span>{" "}
              <strong className="font-semibold">1900 6828</strong>{" "}
              <span className="text-primary">(24/7)</span>
            </span>
          </a>

          <a
            className="hidden min-w-0 items-center gap-1.5 sm:flex"
            href="mailto:hotro@vinarental.vn"
          >
            <Mail size="20" />
            <span className="truncate">hotro@vinarental.vn</span>
          </a>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <Link
            aria-label="Tra cứu đơn hàng"
            className="inline-flex size-7 items-center justify-center rounded text-navy-foreground transition-colors hover:bg-surface/10 hover:text-primary"
            href="/orders/lookup"
            title="Tra cứu đơn hàng"
          >
            <Truck size={17} />
          </Link>
          <Link
            aria-label="Đăng ký tổ chức"
            className="inline-flex size-7 items-center justify-center rounded text-navy-foreground transition-colors hover:bg-surface/10 hover:text-primary"
            href="/partner"
            title="Đăng ký tổ chức"
          >
            <BuildingComplex size={17} />
          </Link>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
            href="/orders/lookup"
          >
            <Truck size="20" />
            Tra cứu đơn hàng
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
            href="/partner"
          >
            <BuildingComplex size="20" />
            Đăng ký tổ chức
          </Link>
        </div>
      </Container>
    </div>
  );
}
