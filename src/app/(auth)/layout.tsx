import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import styles from "./auth-layout.module.css";
import { BrandLogo } from "@/components/brand/brand-logo";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

const AUTH_BACKGROUND_IMAGE = "/images/auth-preview-bg.avif";

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.root}>
      <div
        aria-hidden="true"
        className={styles.backgroundImage}
        style={{ backgroundImage: `url(${AUTH_BACKGROUND_IMAGE})` }}
      />

      <header className={styles.header}>
        <Link aria-label="DPU Rental - Trang chủ" className={styles.brand} href="/">
          <BrandLogo />
        </Link>

        <Link className={styles.backLink} href="/">
          <ArrowLeft aria-hidden="true" size={16} />
          Về trang chủ
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.formPanel}>{children}</div>
      </main>

      <footer className={styles.copyright}>
        © 2026 DP UNITY. All rights reserved.
      </footer>
    </div>
  );
}
