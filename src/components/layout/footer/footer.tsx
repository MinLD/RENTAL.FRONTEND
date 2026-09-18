import Link from "next/link";

import { Container } from "@/components/layout/container";

import {
  FOOTER_LEGAL_LINKS,
  FOOTER_PARTNER_LINKS,
  FOOTER_SUPPORT_LINKS,
} from "./footer.data";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy text-navy-foreground">
      <Container>
        <div className="h-1 bg-primary" />

        <div className="grid grid-cols-1 gap-8 pb-12 pt-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:pb-24">
          <section aria-labelledby="footer-brand-heading" className="lg:pr-8">
            <h2 className="flex items-center gap-2" id="footer-brand-heading">
              <span className="text-base font-bold tracking-tight">
                VINAR<span className="text-primary">ENTAL</span>
              </span>
              <span className="rounded border border-border/20 bg-surface/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-navy-foreground/70">
                Sàn giao dịch
              </span>
            </h2>
            <p className="mt-3 max-w-sm text-xs leading-5 text-navy-foreground/60">
              Hạ tầng số kết nối, thẩm định chất lượng và điều phối máy móc thi
              công xây dựng chuyên dụng trên toàn lãnh thổ Việt Nam.
            </p>
            <div className="mt-4 space-y-1 text-xs leading-5 text-navy-foreground/60">
              <p>
                <span className="font-semibold text-navy-foreground">
                  Đơn vị chủ quản:
                </span>{" "}
                Công ty Cổ Phần Thiết Bị Công Trường VinaRental
              </p>
              <p>
                <span className="font-semibold text-navy-foreground">
                  Mã số thuế:
                </span>{" "}
                0317892348 do Sở KH&amp;ĐT TP.HCM cấp
              </p>
              <p>
                <span className="font-semibold text-navy-foreground">
                  Giấy phép sàn TMĐT:
                </span>{" "}
                Số 4829/GP-BCT Cục TMĐT cấp
              </p>
            </div>
          </section>

          <nav aria-labelledby="footer-support-heading" className="lg:px-3">
            <h2
              className="border-b border-border/20 pb-2 text-xs font-semibold uppercase tracking-wide"
              id="footer-support-heading"
            >
              Chính sách &amp; hỗ trợ khách thuê
            </h2>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-navy-foreground/60">
              {FOOTER_SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    className="inline-flex gap-1 transition-colors hover:text-primary"
                    href={link.href}
                  >
                    <span aria-hidden="true">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-2 border-t border-border/20 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
                Dành cho đối tác
              </h3>
              <ul className="mt-1 space-y-1 text-xs leading-5 text-navy-foreground/60">
                {FOOTER_PARTNER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="inline-flex gap-1 transition-colors hover:text-primary"
                      href={link.href}
                    >
                      <span aria-hidden="true">›</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <section
            aria-labelledby="footer-contact-heading"
            className="md:col-span-2 lg:col-span-1 lg:pl-3"
          >
            <h2
              className="border-b border-border/20 pb-2 text-xs font-semibold uppercase tracking-wide"
              id="footer-contact-heading"
            >
              Tổng đài đặt máy &amp; cứu hộ
            </h2>
            <div className="mt-2 space-y-2">
              <div className="rounded border border-border/20 bg-surface/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-navy-foreground/50">
                  Tổng đài đặt thuê thiết bị
                </p>
                <a
                  className="mt-1 block text-xl font-bold tracking-wide text-primary transition-opacity hover:opacity-80"
                  href="tel:19006828"
                >
                  1900 6828
                </a>
                <p className="mt-1 text-xs leading-5 text-navy-foreground/50">
                  Hỗ trợ 24/7 (kể cả Thứ 7, Chủ Nhật &amp; Ngày Lễ)
                </p>
              </div>

              <div className="rounded border border-border/20 bg-surface/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-navy-foreground/50">
                  Kỹ thuật &amp; cứu hộ máy gấp
                </p>
                <a
                  className="mt-1 block text-base font-bold tracking-wide transition-colors hover:text-primary"
                  href="tel:0908123456"
                >
                  0908 123 456
                </a>
              </div>
            </div>
            <p className="mt-3 text-xs text-navy-foreground/60">
              Email tiếp nhận hồ sơ:{" "}
              <a
                className="text-navy-foreground transition-colors hover:text-primary"
                href="mailto:hotro@vinarental.vn"
              >
                hotro@vinarental.vn
              </a>
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/20 py-4 text-xs text-navy-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} VinaRental Corp. Bản quyền thuộc Sàn Giao Dịch Thiết
            Bị Công Trường VinaRental. Giữ toàn quyền.
          </p>
          <nav aria-label="Liên kết pháp lý">
            <ul className="flex flex-wrap items-center gap-y-2">
              {FOOTER_LEGAL_LINKS.map((link, index) => (
                <li className="flex items-center" key={link.href}>
                  {index > 0 ? (
                    <span aria-hidden="true" className="mx-3 text-navy-foreground/30">
                      •
                    </span>
                  ) : null}
                  <Link
                    className="transition-colors hover:text-primary"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
