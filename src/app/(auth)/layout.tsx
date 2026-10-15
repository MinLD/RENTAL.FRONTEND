import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import styles from "./auth-layout.module.css";

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
        <Link aria-label="DPRENTAL - Trang chủ" className={styles.brand} href="/">
          <span className={styles.logo}>
            DP<span>RENTAL</span>
          </span>
          <span className={styles.logoCaption}>Sàn thiết bị công trường</span>
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
        © 2026 DPRENTAL. All rights reserved.
      </footer>
    </div>
  );
}
