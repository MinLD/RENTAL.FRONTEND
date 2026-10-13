import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { Container } from "@/components/layout/container";

import {
  FOOTER_LEGAL_LINKS,
  FOOTER_PARTNER_LINKS,
  FOOTER_SUPPORT_LINKS,
} from "./footer.data";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/15 bg-navy text-navy-foreground">
      <Container>
        <div className="grid gap-8 py-8 md:grid-cols-2 md:gap-x-12 lg:grid-cols-[1.2fr_1fr_0.9fr] lg:gap-x-16 lg:py-10">
          <section
            aria-labelledby="footer-brand-heading"
            className="min-w-0 md:col-span-2 lg:col-span-1"
          >
            <h2 id="footer-brand-heading">
              <Link
                className="inline-block text-2xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                href="/"
              >
                DP<span className="text-primary">RENTAL</span>
              </Link>
            </h2>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy-foreground/50">
              Sàn thiết bị công trường
            </p>
            <p className="mt-4 max-w-md text-[13px] leading-6 text-navy-foreground/70">
              Sàn cho thuê thiết bị kết nối người thuê và nhà cung cấp, giúp bạn
              tìm và lựa chọn thiết bị phù hợp với nhu cầu.
            </p>
            <div className="mt-5 space-y-1.5 text-[11px] leading-5 text-navy-foreground/55">
              <p className="font-medium text-navy-foreground/80">
                Công ty Cổ Phần Thiết Bị Công Trường DPRENTAL
              </p>
              <p>Mã số thuế: 0317892348 do Sở KH&amp;ĐT TP.HCM cấp</p>
              <p>Giấy phép sàn TMĐT: Số 4829/GP-BCT Cục TMĐT cấp</p>
            </div>
          </section>

          <nav aria-labelledby="footer-support-heading" className="min-w-0">
            <h2
              className="text-xs font-semibold uppercase tracking-wider"
              id="footer-support-heading"
            >
              Chính sách &amp; hỗ trợ
            </h2>
            <ul className="mt-5 space-y-3 text-[13px] leading-5 text-navy-foreground/70">
              {FOOTER_SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  {link.available === false ? (
                    <span
                      aria-disabled="true"
                      title="Nội dung đang được cập nhật"
                    >
                      {link.label}
                    </span>
                  ) : (
                    <Link
                      className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-7">
            <nav aria-labelledby="footer-partner-heading">
              <h2
                className="text-xs font-semibold uppercase tracking-wider"
                id="footer-partner-heading"
              >
                Dành cho đối tác
              </h2>
              <ul className="mt-5 space-y-3 text-[13px] leading-5 text-navy-foreground/70">
                {FOOTER_PARTNER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="inline-flex items-center gap-2 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                      href={link.href}
                    >
                      {link.label}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section aria-labelledby="footer-contact-heading">
              <h2
                className="text-xs font-semibold uppercase tracking-wider"
                id="footer-contact-heading"
              >
                Liên hệ hỗ trợ
              </h2>
              <a
                className="group mt-4 flex min-w-0 items-center gap-3 rounded-lg border border-border/15 bg-surface/5 p-3.5 transition-colors hover:border-primary/50 hover:bg-surface/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                href="mailto:hotro@dprental.vn"
              >
                <span className="grid size-10 shrink-0 place-items-center">
                  <Mail aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-navy-foreground/55">
                    Email hỗ trợ
                  </span>
                  <span className="mt-1 block break-all text-[13px] font-medium transition-colors group-hover:text-primary">
                    hotro@dprental.vn
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-navy-foreground/40 transition-colors group-hover:text-primary"
                />
              </a>
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/15 py-5 text-[11px] leading-5 text-navy-foreground/55 lg:flex-row lg:items-center lg:justify-between">
          <p>© {currentYear} DPRENTAL Corp. Giữ toàn quyền.</p>
          <nav aria-label="Liên kết pháp lý">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {FOOTER_LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  {link.available === false ? (
                    <span
                      aria-disabled="true"
                      title="Nội dung đang được cập nhật"
                    >
                      {link.label}
                    </span>
                  ) : (
                    <Link
                      className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
