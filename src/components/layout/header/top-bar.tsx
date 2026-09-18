import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Truck, Users } from "lucide-react";

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
            <svg
              aria-hidden="true"
              className="size-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="m4 7 8 6 8-6M5 19h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <span className="truncate">hotro@vinarental.vn</span>
          </a>
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
            <Users size="20" />
            Trở thành đối tác
          </Link>
        </div>
      </Container>
    </div>
  );
}
