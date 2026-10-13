import Link from "next/link";

import { Container } from "@/components/layout/container";
import { BuildingComplex, Mail, Truck } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-navy text-navy-foreground">
      <Container className="flex h-8 items-center justify-between gap-4 text-xs">
        <div className="flex min-w-0 items-center gap-5"></div>

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
