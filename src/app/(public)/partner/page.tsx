import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PartnerRegistrationView } from "@/components/partner/partner-registration-view";

export const metadata: Metadata = {
  title: "Đăng ký đối tác | DPRENTAL",
};

export default function PartnerPage() {
  return (
    <div className="flex flex-1 flex-col bg-background py-8 sm:py-10">
      <Container>
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-xs text-muted-foreground"
        >
          <Link className="transition-colors hover:text-primary" href="/">
            Trang chủ
          </Link>
          <span aria-hidden="true" className="mx-1.5">
            /
          </span>
          <span aria-current="page">Đối tác</span>
        </nav>

        <PartnerRegistrationView />
      </Container>
    </div>
  );
}
